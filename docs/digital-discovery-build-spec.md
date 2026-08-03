# Digital Discovery — Portale · Specifica di build

> Documento di consegna per lo sviluppo (da usare come contesto in Claude Code).
> Progetto: **Digital Discovery S.r.l.** — entità e brand distinti da Convivo/Syllex.
> Stack: **Next.js 16 (App Router, TS, `src/`) + Tailwind v4 + Supabase (SSR) + Vercel**.
> Ultimo aggiornamento: **agosto 2026** — allineato al design system **v0.4**.
> Stato: Fasi 1–3 in TEST; restyling v0.4 (nav 5 voci, 7a/7b, 6a/6b, 3a/3b/4a/4b) applicato.

---

## 1. Cosa stiamo costruendo

Un prodotto con **due facce** sullo stesso database:

- **Lato interno (CRM vendite)** — tu e i collaboratori aggiungete prospect, inviate preventivi, seguite le trattative lungo una pipeline. Board kanban + anagrafiche.
- **Lato cliente (portale)** — il cliente (titolare MPI) accetta il preventivo, firma il contratto online, imposta il pagamento, e poi consulta piano pagamenti, fatture, servizi attivi e contratti.

Il collante è una **macchina a stati** unica per pratica, guidata da webhook: il sistema avanza da solo man mano che il cliente agisce, tu guardi la board.

Modello di ricavo servito: pagamento **ricorrente** a rata mensile su 12 mesi (prevalente), oppure **una tantum**/acconto.

---

## 2. Decisioni tecniche (già prese)

**Pagamenti — carta su Stripe, SEPA manuale su Banca Sella.**
- **Carta → Stripe.** Subscription/PaymentIntent, addebiti tracciati e gestiti dai webhook. Prima fattura on-session (conferma 3DS nel browser).
- **SEPA (addebito bancario) → Banca Sella, non Stripe.** Stripe SEPA è stato abbandonato: sul nuovo account Radar bloccava gli addebiti SDD (`unknown_risk_level`/"blocked"). Il cliente compila e accetta un **mandato SDD B2B** nel portale (tabella `sepa_mandates`); Marco esegue gli addebiti su Banca Sella (SBS, file tracciato XML) e **segna le rate pagate a mano**.
- Il chooser pubblico `/paga/[token]` offre **Carta** (`/carta`, Stripe) o **Addebito bancario SEPA** (`/sepa`, mandato Sella).
- IBAN = dato del mandato SDD: conservato con RLS staff-only, mai in URL/log.
- Attivazione: al **primo incasso** (carta) o alla **registrazione del mandato** (SEPA) il cliente passa direttamente a `cliente_attivo` ("Automatico al 1° pagamento").

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
- **quotes** — preventivi. `id`, `client_id`, `numero`, `tipo` (`ricorrente`|`una_tantum`|`acconto`), `importo_totale`, `rate_num`, `rata_mensile`, `sconto`, **`motivo_sconto`** (testo, finisce sul documento cliente), **`data_prima_rata`** (onorata dai piani manuali/SDD; indicativa su Stripe), `valido_fino`, `stato` (`bozza`|`inviato`|`visto`|`accettato`|`rifiutato`|`scaduto`), `ordine`/`prezzi`/`addons` (jsonb, selezione servizi), `public_token`, `viewed_at`, `accepted_at`.
- **quote_items** — righe (proiezione denormalizzata di `ordine`/`prezzi`/`addons`). `id`, `quote_id`, `descrizione`, `quantita`, `prezzo_unitario`.
- **contracts** — ponte DocuSeal. `id`, `quote_id`, `client_id`, `docuseal_submission_id`, `stato` (`inviato`|`firmato`|`annullato`), `signed_at`, `signed_pdf_url`.
- **payment_setups** — ponte Stripe/SDD. `id`, `client_id`, `contract_id`, `stripe_customer_id`, `stripe_subscription_id`, `metodo` (`sdd`|`carta`|`bonifico`), `stato` (incl. `manuale` per SDD Sella).
- **sepa_mandates** — mandati SDD B2B (Banca Sella, fuori Stripe). `id`, `client_id`, `contract_id`, `quote_id`, `riferimento` (`MND-…`), `intestatario`, `iban`, `bic`, `creditor_id`, `stato`, `accettato_at`. IBAN protetto da RLS staff-only.
- **payments** — le rate (= il piano pagamenti che il cliente vede). `id`, `client_id`, **`contract_id`**, `subscription_id`, `numero_rata`, `importo` (netto), `scadenza`, `stato` (`scheduled`|`pending`|`paid`|`failed`), `stripe_payment_intent_id`, `paid_at`, + campi insoluti/recupero (`recovery_stato`, `maggiorazione`, `failure_*`, `recovery_token`/`url`). **Generazione unica** via `src/lib/preventivi/genera-rate.ts` (anteprima 7b + SEPA + Stripe + onboarding manuale).
- **invoices** — fatture (manuali per ora). `id`, `client_id`, `payment_id`, `numero`, `data`, `importo`, `pdf_url`, `stato`. Upload PDF + email al cliente.
- **services** — servizi attivi. `id`, `client_id`, `contract_id`, `nome`, `stato`, `data_attivazione`.
- **service_catalog** — catalogo servizi. Contenuti (`titolo`, `sottotitolo`, `descrizione`, `attivita_incluse`/`condizioni`/`attivita_escluse` text[]), `prezzo_base`, `ricorrente`, `durata_mesi`, `ordine`, `immagine_url`, e i due flag distinti **`in_vetrina`** (visibile ai clienti) e **`vendibile`** (inseribile nei preventivi). `attivo` resta come colonna legacy allineata a `in_vetrina`.
- **portfolio_items** — lavori collegati a un servizio del catalogo.
- **activity_log** — audit + cronologia scheda. `id`, `client_id`, `actor_id`, `azione`, `da_stato`, `a_stato`, `created_at` (scritto da trigger sul cambio di `clients.stato`).

**RLS (Row Level Security)** — helper security-definer in schema `private`.
- `admin` → vede/modifica tutto. La **cancellazione clienti resta admin**.
- `commerciale` → **team-read + team-write**: legge e modifica tutti i clienti/preventivi/contratti/rate/fatture/servizi (`private.is_staff()`, migration 0021/0022). Nota storica: prima era owner-only, ma un operatore non titolare salvava "a vuoto" (RLS scartava la riga senza errore) → risolto.
- **cliente esterno** → solo i propri dati (`clients.auth_user_id = auth.uid()`; tabelle figlie via `client_id`), mai le tabelle interne della pipeline.

---

## 4. Macchina a stati (per pratica/cliente)

Percorso felice e trigger che fanno avanzare ogni transizione:

- `lead` → prospect aggiunto (interno).
- `preventivo_inviato` → generato il preventivo, link a pagina pubblica con `public_token`.
- `preventivo_visto` → il cliente apre la pagina (`viewed_at`).
- `preventivo_accettato` → click "Accetto" → **crea submission DocuSeal**.
- `contratto_inviato` → modulo di firma embedded; il cliente compila dati societari e firma.
- `contratto_firmato` → webhook DocuSeal `form.completed` → salva PDF, avanza.
- `pagamento_setup` → il cliente sceglie il metodo su `/paga/[token]`: **carta** (Stripe) o **SEPA** (mandato Banca Sella).
- `cliente_attivo` → **direttamente al 1° pagamento** ("Automatico al 1° pagamento"): al primo `invoice.paid` (carta) o alla registrazione del mandato SEPA il cliente diventa subito attivo, senza sostare su `pagamento_attivo`. Portale sbloccato + email di accesso. (Gli stati `pagamento_attivo` restano nell'enum ma non sono più una tappa obbligata.)

Rami: `preventivo` `rifiutato` / `scaduto` (validità per-preventivo con grace di 7 giorni recuperabile); `contratto` `annullato`; rata `failed` (webhook Stripe `invoice.payment_failed`, o segnata a mano per SDD Sella) → **Insoluti**: recupero con link/nuovo mandato/bonifico + maggiorazione; `cessato` (fine ciclo o disdetta).

**Principio**: le transizioni sono guidate da webhook (carta/DocuSeal) o dall'azione del cliente (mandato SEPA); Marco esita a mano solo gli addebiti SDD Sella.

---

## 5. Integrazioni & webhook

- **DocuSeal**: `form.completed` → `contracts.stato = firmato`, salva `signed_pdf_url`, avanza pratica a `pagamento_setup`.
- **Stripe (solo carta)** — eventi chiave: `setup_intent.succeeded` / primo `invoice.paid` → `cliente_attivo` + subscription; `invoice.paid` → `payments.stato = paid`; `invoice.payment_failed` → `payments.stato = failed` + flusso Insoluti; `customer.subscription.deleted` → `cessato`. Addebito **lordo** (netto ×1.22).
- **SEPA (Banca Sella, no webhook)** — il mandato B2B si registra dal portale (`sepa_mandates` + piano rate `scheduled`), avvisa staff con IBAN/UMR per Sella; gli addebiti li invia Marco e segna le rate `paid` a mano.
- **DocuSeal**: `form.completed` → contratto firmato (vedi sopra).
- **Fatture**: manuale (upload PDF FatturaHello in `invoices` + email al cliente). Futuro: API provider SdI su `invoice.paid`.

Tutti i webhook vanno su route API server-side (Next.js route handlers) con verifica della firma del webhook.

---

## 6. Design system (v0.4)

Font **Fustat**, sfondo **salvia**, brand **Digital Discovery** (non Convivo). Riferimento: `design_handoff_v04/`. I token vivono in `src/app/globals.css` (`@theme` → utility Tailwind v4). Principali:

```
--color-ink:#16171a  --color-on-ink:#fff       /* azione forte, blocchi scuri */
--color-bg:#e9ece6  --color-bg-2:#dfe3da        /* pagina salvia */
--color-card:#fff  --color-card-2:#f4f6f1  --color-panel:#f5f7f2
--color-line:#e2e6dd  --color-line-strong:#cfd5c8  --color-line-field:#dfe3da
--color-link:#4b3bbd                            /* link */
--color-mint:#a8e6c4  --color-on-mint:#0f2e1e   /* positivo / WhatsApp */
--color-violet-soft:#ece8fe / info-tx:#2c1d63   /* ricorrente, abbonamenti */
/* stati: paid · info · wait(ambra #c99700) · fail(#d64535) · draft */
--radius-crm:12  --radius-frame:16  --radius-btn:10  --radius-field:9  --radius-badge:8
--radius-card:24 (portale)          /* densità doppia: CRM 12/16, portale 24/16 */
```

- **Zero-motion**: solo transizioni ≤120ms su colore/bordo; rispetto di `prefers-reduced-motion`.
- **Componenti `src/components/ui/`**: `button` (primary/secondary/ghost/dashed/outline), `card` (`radius` crm/portale, variante `dark`), `input` (`labelRight`), **`drawer`** (pannello laterale 520px, scrim 34%, focus-trap), **`money-block`** (blocco denaro scuro), **`preflight-list`** (checklist "Prima di inviare"), `status-pill` (5 casi, max 2 per schermata).
- **Elemento firma**: il **linguaggio di stato** (pallino + etichetta + pill tenue) identico su rate, contratti e pipeline.
- **Navigazione CRM = 5 voci**: Pipeline (landing), Clienti, Pagamenti, Insoluti, Catalogo (+Utenti, admin). Rimosse Home operativa, Preventivi e Contratti (assorbite nella scheda cliente). Portale mobile: **tab bar in basso** (Home/Pagamenti/Servizi/Assistenza + Altro).

---

## 7. Schermate (v0.4, realizzate)

**Interno (CRM).**
- **Pipeline** (`/vendite`, landing) — 6 colonne (5 fasi + Persi); il **tempo come segnale**: bordo ambra e footer "Ferma da N giorni" sulle trattative aperte ferme da 14+ giorni (da `activity_log`), con filtro `?fermi=1` (4a).
- **7a Nuovo cliente** — **drawer 520px** sopra Pipeline/Clienti: nome + contatto minimi, controllo duplicati inline sul telefono, fatturazione rimandata, pannello scuro "cosa succede"; footer Crea cliente / Crea e fai un preventivo / Annulla.
- **7b Nuovo preventivo** (`/vendite/preventivo/[clienteId]`) — **pagina intera 1fr/400px**: "Cosa comprende" (servizi + voci libere + sconto con motivo inline), "Come si paga" (formula, n. rate, prima rata, chip scadenze dallo stesso `genera-rate`), "Validità"; a destra **blocco denaro scuro** (una-tantum e ricorrente separati, listino/sconto menta/IVA, primo incasso), checklist "Prima di inviare", "Quando premi Invia".
- **Clienti** — master-detail 30/70 (lista completa lead+clienti a sinistra, scheda a destra). **Scheda cliente (4b)**: barra "Cronologia" (log attività), anagrafica, piano pagamenti + contratti, preventivi + fatture.
- **Catalogo (6a/6b)** — lista con miniatura, due badge di stato (**in vetrina** / **vendibile**) e gruppo "Nascosti dalla vetrina"; editor con **liste di voci** riordinabili (⋮⋮ + tastiera) e **anteprima vetrina** affiancata.
- **Pagamenti**, **Insoluti**, **Utenti**.

**Portale cliente.**
- **Home (3a)** — eroe "prossimo addebito", servizi, ultimi lavori, **blocco assistenza scuro** con WhatsApp in menta.
- **Piano pagamenti (3b)** — fino a 6 rate visibili, le più vecchie collassate; banner insoluto + riga fallita evidenziata.
- Fatture, Servizi, Contratti, Catalogo, Lavori, Assistenza. Mobile-first con tab bar in basso.

**Flusso pubblico.** Preventivo (`/preventivo/[token]`, stampabile in PDF) → firma DocuSeal → `/paga/[token]` (Carta Stripe / SEPA mandato Sella).

---

## 8. Ordine di build consigliato (per Claude Code)

**Fase 1 — Fondazione. ✅ (in TEST)**
Repo + Supabase (org dedicata) → schema come migration + RLS + enum → auth staff (Google OAuth) → CRM minimo (pipeline, anagrafiche).

**Fase 2 — Contratto + pagamento. ✅ (in TEST)**
Preventivo pubblico → DocuSeal embedded + webhook → pagamento: **carta su Stripe** (subscription/PI + webhook) e **SEPA mandato Banca Sella** (manuale) → automazione transizioni.

**Fase 3 — Portale cliente. ✅ (in TEST)**
Auth cliente + Home + Piano pagamenti multi-contratto + Fatture (upload PDF + email) + Servizi + Contratti + Catalogo/Lavori + Assistenza.

**Restyling v0.4 — ✅ applicato.**
Design foundation (token + ui/), nav 5 voci, 7a/7b, generatore rate condiviso, `motivo_sconto`/`data_prima_rata`, 3b piano portale, 6b editor a liste, 4b cronologia scheda, 4a "ferma da X giorni", 6a `in_vetrina`/`vendibile`, 3a blocco assistenza + tab bar portale.

**Fase 4 — Estensioni (prossime).**
Automazione fatture (provider SdI via API); riordino drag&drop catalogo con persistenza; rifiniture densità portale.

**Sicurezza**: chiavi (Supabase service role, Stripe, DocuSeal) come env var su Vercel/Supabase; webhook con verifica firma; nessuna credenziale nel repo; IBAN mandati con RLS staff-only.

---

## 9. Punti aperti / decisi

**Decisi.**
- Policy RLS commerciali → **team-read + team-write** (cancellazione clienti solo admin).
- Colonna "Persi" nella pipeline → **sì**.
- Attivazione → **automatica al 1° pagamento** (`cliente_attivo`).
- SEPA → **Banca Sella manuale**, non Stripe (Stripe solo carta).

**Aperti.**
- **`NEXT_PUBLIC_ASSISTENZA_WHATSAPP`**: numero WhatsApp per il blocco assistenza del portale (finché vuoto, mostra il fallback "Scrivici"). Da impostare in `.env.local` + Vercel.
- Riordino drag&drop del catalogo con persistenza dell'`ordine` (per ora si imposta dall'editor).
- Automazione fatture SdI via API provider.
- `docs/` contiene ancora i mockup v0.3; il riferimento visivo corrente è `design_handoff_v04/`.
