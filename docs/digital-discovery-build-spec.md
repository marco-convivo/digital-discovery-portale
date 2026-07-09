# Digital Discovery — Portale · Specifica di build

> Documento di consegna per lo sviluppo (da usare come contesto in Claude Code).
> Progetto: **Digital Discovery S.r.l.** — entità e brand distinti da Convivo/Syllex.
> Stack: **Next.js + Supabase + Vercel**. Ultimo aggiornamento: luglio 2026.

---

## 1. Cosa stiamo costruendo

Un prodotto con **due facce** sullo stesso database:

- **Lato interno (CRM vendite)** — tu e i collaboratori aggiungete prospect, inviate preventivi, seguite le trattative lungo una pipeline. Board kanban + anagrafiche.
- **Lato cliente (portale)** — il cliente (titolare MPI) accetta il preventivo, firma il contratto online, imposta il pagamento, e poi consulta piano pagamenti, fatture, servizi attivi e contratti.

Il collante è una **macchina a stati** unica per pratica, guidata da webhook: il sistema avanza da solo man mano che il cliente agisce, tu guardi la board.

Modello di ricavo servito: pagamento **ricorrente** a rata mensile su 12 mesi (prevalente), oppure **una tantum**/acconto.

---

## 2. Decisioni tecniche (già prese)

**Pagamenti — Stripe.**
- Addebito ricorrente via **SEPA Direct Debit schema CORE** (non B2B: Stripe non lo supporta; per la clientela MPI il CORE è lo standard).
- Mandato SDD raccolto online + **Stripe Billing/Subscriptions** per le 12 rate.
- Una tantum/acconto: **carta** o **bonifico**.
- Ogni evento (incasso, fallimento, revoca mandato) arriva via **webhook** e aggiorna lo stato.

**Firma — DocuSeal.**
- Piano **Cloud Pro** (~20$/mese, 1 seat + ~0,20$/documento firmato). Signing **embedded** dentro il portale via API.
- I collaboratori **non** sono seat DocuSeal: operano dal portale, che usa una sola API key server-side.
- Webhook `form.completed` → contratto firmato → salvataggio PDF firmato.
- Migrazione futura a self-host su VPS UE possibile senza toccare il codice (cambia l'URL base).

**Fatturazione — manuale (per ora).**
- Le fatture le gestisce Marco su **FatturaHello**. Il portale mostra il PDF di cortesia collegato (campo `pdf_url`).
- Fase futura: provider con API verso SdI → la tabella `invoices` si popola in automatico via webhook Stripe, senza toccare il resto.

**Infrastruttura.**
- **Vercel Pro** (~20$/mese, 1 seat) — obbligatorio: l'Hobby vieta l'uso commerciale. Upgrade al go-live.
- **Supabase Pro** (~25$/mese) — al go-live: rimuove il pausing e aggiunge i backup.
- **GitHub Free** — repository privato, sufficiente.
- Creare **Team Vercel** e **organizzazione Supabase** dedicati a "Digital Discovery" (billing e collaboratori separati da Convivo).
- Costo fisso mensile a regime: ~65$ (Vercel + Supabase + DocuSeal) + commissioni Stripe.

**Da fare a mano da Marco** (io non creo account né inserisco credenziali/pagamenti):
apertura account Stripe / DocuSeal / team Vercel / org Supabase, generazione delle API key, upgrade dei piani. Le chiavi vanno come **secret** (env var), mai nel codice.

---

## 3. Modello dati (Supabase / Postgres)

Un cliente ha **molti contratti** (uno per servizio o rinnovo), ognuno con il proprio piano pagamenti indipendente. Le rate puntano al **contratto/subscription**, non solo al cliente.

- **profiles** — utenti interni. `id` (→ auth.users), `full_name`, `email`, `role` (`admin` | `commerciale`), `active`.
- **clients** — anagrafica (prospect→cliente). `id`, `ragione_sociale`, `p_iva`, `codice_fiscale`, `codice_sdi`/`pec`, `indirizzo`, `referente`, `email`, `telefono`, `stato` (macchina a stati §4), `owner_id` (→ profiles), `created_at`.
- **quotes** — preventivi. `id`, `client_id`, `numero`, `tipo` (`ricorrente`|`una_tantum`|`acconto`), `importo_totale`, `rate_num`, `rata_mensile`, `valido_fino`, `stato` (`bozza`|`inviato`|`visto`|`accettato`|`rifiutato`|`scaduto`), `public_token`, `viewed_at`, `accepted_at`.
- **quote_items** — righe. `id`, `quote_id`, `descrizione`, `quantita`, `prezzo_unitario`.
- **contracts** — ponte DocuSeal. `id`, `quote_id`, `client_id`, `docuseal_submission_id`, `stato` (`inviato`|`firmato`|`annullato`), `signed_at`, `signed_pdf_url`.
- **payment_setups** — ponte Stripe. `id`, `client_id`, `contract_id`, `stripe_customer_id`, `stripe_subscription_id`, `metodo` (`sdd`|`carta`|`bonifico`), `stato`.
- **payments** — le rate (= il piano pagamenti che il cliente vede). `id`, `client_id`, **`contract_id`**, `subscription_id`, `numero_rata`, `importo`, `scadenza`, `stato` (`pending`|`paid`|`failed`|`scheduled`), `stripe_payment_intent_id`, `paid_at`.
- **invoices** — fatture (manuali per ora). `id`, `client_id`, `payment_id`, `numero`, `data`, `importo`, `pdf_url`, `stato`.
- **services** — servizi attivi. `id`, `client_id`, `contract_id`, `nome`, `stato`, `data_attivazione`.
- **activity_log** — audit. `id`, `client_id`, `actor_id`, `azione`, `da_stato`, `a_stato`, `created_at`.

**RLS (Row Level Security)**
- `admin` → vede/modifica tutto.
- `commerciale` → clienti dove `owner_id = auth.uid()` (o "tutti in lettura, modifica solo le proprie" — scelta di policy da confermare).
- **cliente esterno** → solo i propri dati (`client_id` legato alla sessione), mai le tabelle interne della pipeline.

---

## 4. Macchina a stati (per pratica/cliente)

Percorso felice e trigger che fanno avanzare ogni transizione:

- `lead` → prospect aggiunto (interno).
- `preventivo_inviato` → generato il preventivo, link a pagina pubblica con `public_token`.
- `preventivo_visto` → il cliente apre la pagina (`viewed_at`).
- `preventivo_accettato` → click "Accetto" → **crea submission DocuSeal**.
- `contratto_inviato` → modulo di firma embedded; il cliente compila dati societari e firma.
- `contratto_firmato` → webhook DocuSeal `form.completed` → salva PDF, avanza.
- `pagamento_setup` → il cliente inserisce il metodo (mandato SDD / carta / bonifico).
- `pagamento_attivo` → webhook Stripe (mandato attivo / primo incasso) → crea subscription 12 mesi.
- `cliente_attivo` → invito con link per impostare credenziali; portale cliente sbloccato.

Rami: `preventivo_rifiutato` / `scaduto`; `contratto_annullato` / `scaduto`; `pagamento_fallito` (webhook Stripe `invoice.payment_failed`) → dunning con retry → `sospeso`; `cessato` (fine ciclo o disdetta).

**Principio**: ogni transizione è guidata da un webhook, non da un click manuale.

---

## 5. Integrazioni & webhook

- **DocuSeal**: `form.completed` → `contracts.stato = firmato`, salva `signed_pdf_url`, avanza pratica a `pagamento_setup`.
- **Stripe** (eventi chiave): `setup_intent.succeeded` / mandato attivo → `pagamento_attivo` + crea subscription; `invoice.paid` → `payments.stato = paid` (+ notifica per emettere fattura); `invoice.payment_failed` → `payments.stato = failed` + dunning; `customer.subscription.deleted` → `cessato`.
- **Fatture**: per ora manuale (Marco carica/collega il PDF FatturaHello in `invoices`). Futuro: su `invoice.paid` chiamare l'API del provider SdI e popolare `invoices`.

Tutti i webhook vanno su route API server-side (Next.js route handlers) con verifica della firma del webhook.

---

## 6. Design system (v0.3)

Fondazione **Material 3 brandizzata Digital Discovery**, "flavor" ispirato alla reference EduWay. Token principali (CSS variables):

```
--ink:#222222;                 /* primario azione (charcoal) */
--bg:#e9ece6;                  /* pagina: salvia */
--card:#ffffff; --card-2:#f4f6f2; --line:#e1e4dd;
--violet:#a28ef9; --violet-soft:#ece8fe;   /* accento */
--mint:#a4f5a6;   --mint-soft:#dcf7dd;     /* positivo/accento */
/* stati: paid(verde) · info(violetto) · wait(ambra) · fail(rosso) · draft(neutro) */
--r-card:24px; --r-md:16px; --r-sm:12px; --r-pill:999px;
font: 'Fustat' (Google Fonts, variabile 300–800), cifre in tabular-nums
```

- **Tipografia**: Fustat (una sola famiglia, contrasto di peso). Distinta dal DM Sans di Syllex.
- **Colore**: primario charcoal su elementi forti; superfici salvia ariose; accenti violetto+menta; il **colore del logo** (quando disponibile) entra come accento — la dipendenza dal logo è quindi bassa. In alternativa, ri-generabile come seme M3 con `@material/material-color-utilities`.
- **Elemento firma**: il **linguaggio di stato** (pallino + etichetta + pill tenue), identico su rate, contratti e pipeline = "trasparenza resa interfaccia".
- I token sono già incorporati nei file mockup allegati; da estrarre in `globals.css` / design tokens del progetto.

---

## 7. Schermate

**Disegnate** (mockup HTML allegati, con token v0.3):
- Portale cliente — **Home** (`portale-home.html`): eroe "prossima rata", piano pagamenti sintetico, servizi, fatture, contratto, supporto.
- Portale cliente — **Piano pagamenti** (`piano-pagamenti.html`): multi-contratto (banner "nuovo contratto da firmare", selettore contratti, tabella 12 rate con stati e azioni).
- Interno — **Board pipeline** (`pipeline-board.html`): 5 colonne (macchina a stati), card trattativa con assegnatario, conteggi e valore per colonna, filtri per collaboratore.

**Da disegnare** (variazioni sui pattern già stabiliti):
- Portale cliente: Fatture, Servizi, Contratti.
- Interno: dettaglio trattativa (cosa si apre cliccando una card), anagrafica cliente, editor preventivo.
- Flusso: pagina pubblica del preventivo, schermata di firma DocuSeal embedded.
- Trasversali: auth/onboarding, empty state.

---

## 8. Ordine di build consigliato (per Claude Code)

**Fase 1 — Fondazione.**
Repo + progetto Supabase (org dedicata) → schema (§3) come migration + RLS + enum degli stati → auth Supabase (Google OAuth per lo staff) → scaffold Next.js con i design token (§6) → CRM interno minimo: aggiungi lead, board pipeline, anagrafica.

**Fase 2 — Contratto + pagamento.**
Pagina pubblica preventivo (con `public_token`) → accetta → DocuSeal embedded signing + webhook `form.completed` → setup pagamento Stripe (mandato SDD + subscription) + webhook Stripe → automazione delle transizioni di stato.

**Fase 3 — Portale cliente.**
Auth cliente + Home + Piano pagamenti (multi-contratto) + Fatture (manuali) + Servizi + Contratti.

**Fase 4 — Estensioni.**
Automazione fatture (provider SdI via API) + customer care.

**Primi passi concreti in Claude Code**
1. `create-next-app` + configurazione Tailwind/token, Fustat, componenti base (bottoni, card, status pill) dal design system.
2. Progetto Supabase, migration dello schema, policy RLS, seed di prova.
3. Auth staff + layout interno (sidebar "Vendite") + board pipeline collegata a `clients`/`activity_log`.
4. Solo dopo: integrazioni Stripe e DocuSeal (richiedono le API key che genera Marco).

**Sicurezza**: tutte le chiavi (Supabase service role, Stripe, DocuSeal) come env var su Vercel/Supabase; webhook con verifica firma; nessuna credenziale nel repo.

---

## 9. Punti aperti da confermare

- Logo Digital Discovery (per agganciare la palette esatta).
- Policy RLS commerciali: "ognuno vede solo le proprie" o "tutti vedono, modifica solo le proprie".
- Colonna "Persi" nella pipeline (sì/no).
- Rese di dettaglio: eroe "prossima rata", card colorate, dicitura sidebar interna ("Vendite").
