# Gestione insoluti & recupero credito — Design

**Data:** 2026-07-14
**Contesto:** Portale Digital Discovery (Next.js 16 + Supabase + Stripe). Il flusso
pagamenti è live (carta testata; SEPA non ancora testato per tempi tecnici di
attivazione mandato). Obiettivo: **mitigare il rischio di insolvenza** sugli
addebiti SEPA (SDD), sia prevenendo i rifiuti sia gestendo il recupero credito.

## Problema

L'addebito SEPA su Stripe è **asincrono**: si conferma in 2–5 giorni e può
**tornare indietro (insoluto) anche settimane dopo** un esito "pagato". Il primo
addebito su un mandato nuovo è il più rischioso: se il cliente non preavvisa la
banca, la banca spesso rifiuta.

Oggi il sistema:
- mette il cliente a `pagamento_attivo` **subito** dopo il setup, ma il primo
  addebito può fallire giorni dopo;
- il webhook `invoice.payment_failed` marca "la prossima rata schedulata" come
  `failed` (non l'invoice specifico → si disallinea con i retry di Stripe);
- non salva **motivo**, **data**, **commissione**; non manda **alert**; non ha
  procedura di **recupero**.

## Fatti tecnici Stripe (verificati)

- Addebito **fallito** ≈ **€3,50**; **disputa** ≈ **€15,00**; dispute SEPA
  **definitive, senza appello**. (Da confermare sul pricing dell'account →
  rendere la maggiorazione **configurabile**.)
- Retry automatici (Smart Retries) esistono ma se il mandato è bloccato
  rifalliscono: preferiamo **pilotare noi** il recupero.

## Decisioni (confermate con l'utente)

1. **Recupero di default:** link di pagamento immediato (**carta** = incasso
   istantaneo; **bonifico** = riconciliazione manuale). Il **mandato SEPA resta**
   per le rate future; a insoluti **ripetuti** si sale a "nuovo mandato".
2. **Maggiorazione insoluto:** **sì**, importo **fisso configurabile** dall'admin,
   voce separata ("Spese di insoluto"). Copre la commissione Stripe + gestione.
3. **Alert:** **email all'admin (marco@)** + **email all'operatore owner** (se
   presente) + **sezione "Insoluti" nel CRM con badge contatore**.
4. **Metodi recupero:** **carta** (auto) **+ bonifico** (manuale).
5. **IVA — REGOLA FERMA:** tutti gli importi inviati a Stripe sono **LORDI**
   (netto × 1,22, `conIva`), esattamente come nel pagamento iniziale. Vale per la
   rata insoluta **e** per la maggiorazione. In DB restano netti.

## Approccio scelto

Guidiamo **noi** il recupero (controllo + branding + procedura su misura),
usando Stripe solo per incassare (Checkout hosted per la carta). Scartata la
dunning nativa di Stripe (email generiche in inglese, niente maggiorazione,
niente link-carta-immediato).

---

## Architettura

### A. Prevenzione SEPA (pagina `/paga`)

- Quando il cliente seleziona **SEPA** nel PaymentElement, mostrare un avviso in
  evidenza (componente `SepaAvviso`): invita a **comunicare alla banca** di
  autorizzare l'addebito (che apparirà come `<statement descriptor>`), spiega i
  tempi SEPA (2–5 gg) e che il primo addebito è il più delicato.
- Il descrittore/creditor info è **configurabile** (settings/env) — mostrato nel
  testo. `SepaAvviso` è puramente presentazionale.
- **Email conferma mandato** dopo setup SEPA riuscito (Fase 2): importo,
  ricorrenza, data primo addebito stimata, promemoria banca. Best-effort via
  Resend, non blocca il flusso (come `inviaAccessoPortale`).

### B. Rilevazione robusta dell'insoluto

**Schema — nuove colonne su `public.payments`:**
- `stripe_invoice_id text` — l'invoice Stripe della rata (aggancio stabile).
- `failure_code text` — reason code SEPA grezzo (es. `AC04`, `MD01`).
- `failure_reason text` — motivo tradotto in italiano.
- `failed_at timestamptz`.
- `attempts int not null default 0`.
- `recovery_stato public.recovery_stato not null default 'nessuno'`.
- `recovery_checkout_id text`, `recovery_url text`.
- `maggiorazione numeric(12,2)` — netta, applicata al recupero (snapshot).

**Nuovo enum `public.recovery_stato`:**
`nessuno | da_recuperare | link_inviato | recuperato | nuovo_mandato | annullato`.
`payment_stato` resta com'è; per un insoluto: `stato = 'failed'` +
`recovery_stato` traccia il sotto-avanzamento. Recupero riuscito → la rata torna
`stato = 'paid'`, `recovery_stato = 'recuperato'`.

**Aggancio invoice→rata (fix del disallineamento):** alla prima comparsa di un
invoice per una subscription, si assegna il `stripe_invoice_id` alla **prima rata
senza invoice** (per numero_rata); dopodiché si matcha sempre per
`stripe_invoice_id`. Così i **retry dello stesso invoice** mappano sulla stessa
rata e non avanzano il puntatore.

**Webhook — handler in `src/lib/stripe/activate.ts` (o nuovo `insoluti.ts`):**
- `invoice.paid`: marca **paid** la rata di quell'invoice (idempotente; se era
  `failed`/in recupero, la ripulisce → gestisce retry andato a buon fine).
- `invoice.payment_failed`: marca **failed** la rata di quell'invoice, salva
  `failure_code/reason` (da `charge`/`last_finalization_error`), `failed_at`,
  `attempts += 1`, `recovery_stato = 'da_recuperare'`; **scatena alert**.
- `charge.refunded` / `charge.dispute.created` (**ritorni tardivi**, Fase 2):
  trova la rata per invoice/charge → torna `failed` + `da_recuperare` + alert.
- `checkout.session.completed` / `payment_intent.succeeded` con
  `metadata.payment_id`: recupero carta riuscito → rata `paid`,
  `recovery_stato = 'recuperato'`.

**Reason code → italiano:** `src/lib/stripe/insoluti-reason.ts` mappa i codici
SEPA più comuni (AC04 conto chiuso, AM04 fondi insufficienti, MD01 mandato non
valido/assente, MS02 rifiuto del debitore, …) a messaggi chiari + un fallback.

**Nota macchina a stati:** valutare di **non** anticipare `pagamento_attivo` per
SEPA finché il primo invoice non è `paid` — oppure introdurre uno stato/flag di
"in verifica". Da decidere in fase di piano (impatto sulla board): Fase 1 lascia
il comportamento attuale ma con alert robusto; l'eventuale ritocco di stato è
annotato come rischio.

### C. Alert

`src/lib/insoluti/alert.ts` → `inviaAlertInsoluto(paymentId)`:
- Email via **Resend** a **marco@** e all'**owner** del cliente (join
  `clients.owner_id → profiles.email`), con cliente, contratto, rata n., importo,
  motivo, e **link diretto** a `/vendite/insoluti?p=<id>`.
- Best-effort (try/catch), non fa fallire il webhook.
- In-CRM: **badge contatore** insoluti aperti nella sidebar (voce "Insoluti") e
  in cima a Pagamenti.

### D. Vista "Insoluti" + azioni (`/vendite/insoluti`)

- Server component: elenca le rate con `stato = 'failed'` e `recovery_stato IN
  ('da_recuperare','link_inviato','nuovo_mandato')`, con cliente, contratto, rata,
  importo, **motivo**, data, tentativi, stato recupero. Deep-link `?p=<id>`.
- Voce **"Insoluti"** in sidebar (visibile a tutto lo staff) con **badge**.
- Azioni (server actions, `assertStaff` con scope `owns_client`):
  1. **Genera link di recupero (carta):** crea una **Stripe Checkout Session**
     (mode `payment`, `card`) per **(rata + maggiorazione) × 1,22**, con
     `metadata.payment_id`. Salva `recovery_checkout_id/url`, `maggiorazione`,
     `recovery_stato = 'link_inviato'`. Mostra il link e/o **invialo via email**
     (testo pronto). Riconciliazione automatica via webhook.
  2. **Paga con bonifico:** mostra IBAN + causale predefiniti; **"segna pagato"**
     manuale → rata `paid`, `recovery_stato = 'recuperato'`.
  3. **Richiedi nuovo mandato:** invia al cliente il link `/paga/<token>` per
     rifare SEPA; `recovery_stato = 'nuovo_mandato'` (per insoluti ripetuti).
  4. **Annulla/rinuncia:** `recovery_stato = 'annullato'`.
- **Maggiorazione:** letta da impostazione admin (vedi E); mostrata come voce
  separata; **netta** in DB, **lorda** verso Stripe.

### E. Impostazione maggiorazione (admin)

- Tabella `public.app_settings` (key/value) o riga singola; campo
  `maggiorazione_insoluto numeric` (netto). Modificabile dall'**admin** (in
  `/vendite/utenti` o una sezione Impostazioni). RLS: lettura staff, scrittura
  admin. Default es. €5,00.

### F. Regola IVA (trasversale)

Ogni importo verso Stripe = **netto × (1 + 0,22)** via `conIva` (`ALIQUOTA_IVA`).
La Checkout Session di recupero riceve `unit_amount = round((rata + maggiorazione)
× 1,22 × 100)`. In UI mostriamo netto + "IVA inclusa" com'è già lo standard.

---

## Fasatura

**Fase 1 (nucleo, ~90% del valore):**
- A: avviso SEPA in `/paga` + copy tempistiche.
- B: colonne + enum + aggancio invoice→rata + handler `invoice.paid/failed`
  robusti + reason mapping.
- C: alert email (marco + owner) + sezione Insoluti con badge.
- D: vista Insoluti + azione **link di recupero carta** (con maggiorazione, IVA
  inclusa) + **segna pagato** manuale (copre il bonifico).
- E: impostazione maggiorazione (admin).

**Fase 2 (rifinitura):**
- Email conferma mandato dopo setup SEPA.
- Ritorni tardivi: `charge.refunded` / `charge.dispute.created`.
- Azioni "richiedi nuovo mandato" / "ritenta SEPA".
- Bonifico strutturato (istruzioni + eventuale `customer_balance`).
- Eventuale ritocco macchina a stati (SEPA `in verifica` fino al primo `paid`).

## Componenti e file (previsti)

- Migration: `..._insoluti_recupero.sql` (enum `recovery_stato`, colonne
  `payments`, `app_settings` + RLS).
- `src/lib/stripe/insoluti-reason.ts` — mappa reason code → IT.
- `src/lib/stripe/activate.ts` — handler webhook robusti + aggancio invoice.
- `src/lib/stripe/recupero.ts` — crea Checkout Session di recupero (lordo IVA).
- `src/lib/insoluti/alert.ts` — email alert (Resend).
- `src/lib/insoluti/queries.ts` — elenco + conteggio badge.
- `src/lib/insoluti/actions.ts` — genera link / invia email / segna pagato /
  nuovo mandato / annulla.
- `src/app/(app)/vendite/insoluti/page.tsx` + componenti in
  `src/components/internal/`.
- `src/components/pay/sepa-avviso.tsx` — avviso prevenzione in `/paga`.
- Sidebar: voce "Insoluti" + badge.
- `src/app/api/webhooks/stripe/route.ts` — nuovi eventi instradati.

## Rischi / note

- **Aggancio invoice→rata**: attenzione al primo invoice della subscription (SEPA
  paga il primo async). Testare con più rate e con retry.
- **Idempotenza webhook**: tutti gli handler devono essere idempotenti (Stripe
  ritenta).
- **Anticipo `pagamento_attivo`** su SEPA: rischio residuo noto (Fase 2).
- **Maggiorazione**: default prudente; verificare la reale commissione sul pricing
  dell'account.
