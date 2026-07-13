# Go-Live Runbook — Digital Discovery

Decisioni prese:
- **Hosting**: Vercel (Pro). **DB**: stesso progetto Supabase `fnjwsnmngaihrjsacgov` (Pro), pulendo i dati demo.
- **Email/SMTP**: Resend.
- **Dominio**: `<DOMINIO>` (da sostituire ovunque qui sotto).
- **Firma**: DocuSeal prod (già disponibile). **Pagamenti**: Stripe Live (da attivare).

Legenda: **[M]** = azione manuale di Marco · **[C]** = la faccio io (Claude) via tool.

Il codice è già production-ready: nessun URL hardcoded (redirect e magic link usano
l'origin corrente), webhook con verifica firma, tutto guidato da env var.

---

## Ordine (perché il deploy viene prima)

Stripe live richiede un **webhook su URL pubblico**; i magic link richiedono
**dominio + Supabase Site URL**. Quindi: **① deploy + dominio → ② Supabase (redirect
+ SMTP + OAuth) → ③ Stripe live (chiavi + prodotto + webhook) → ④ DocuSeal live**.
Chiavi/prodotti/template live si possono creare in parallelo; gli endpoint/URL si
cablano dopo il deploy.

---

## Fase 0 — Preparazione (in parallelo)

- [M] **Attiva Stripe Live** (Dashboard Stripe → attiva account: dati azienda, IBAN).
  Blocca solo la parte pagamenti; tutto il resto procede.
- [M] **Push del codice** su GitHub `main` (o autorizza Claude a fare `git push origin main`).
- [C] Script di **pulizia dati demo** pronto in `docs/go-live/cleanup-demo.sql` (si esegue al cut-over).

---

## Fase 1 — Deploy Vercel + dominio

- [M] Vercel → **New Project** → importa `marco-convivo/digital-discovery-portale` → preset **Next.js** (build/output di default).
- [M] Imposta le **env var di produzione** (vedi checklist in fondo). All'inizio bastano
  Supabase + DocuSeal prod; le chiavi Stripe live si aggiungono in Fase 3.
- [M] **Deploy** → ottieni l'URL `*.vercel.app` (verifica che l'app carichi).
- [M] Vercel → **Settings → Domains** → aggiungi `<DOMINIO>`; imposta i record DNS
  (A/CNAME) indicati, dal registrar del dominio.
- ✅ Verifica: `https://<DOMINIO>` carica la vetrina pubblica `/catalogo`.

---

## Fase 2 — Supabase (produzione sullo stesso progetto)

- [M] **Upgrade a Pro** (progetto `fnjwsnmngaihrjsacgov`).
- [C/M] **Pulizia dati demo**: eseguo `cleanup-demo.sql` (mantiene schema, catalogo,
  profili staff) — **solo quando dai l'ok** (dopo che hai finito i test).
- [M] **Auth → URL Configuration**:
  - **Site URL** = `https://<DOMINIO>`
  - **Redirect URLs** (Add): `https://<DOMINIO>/auth/callback`, `https://<DOMINIO>/auth/callback?next=/portale`
    (aggiungi anche l'URL `*.vercel.app` equivalente se vuoi testare da lì).
- [M] **Google OAuth (login staff)**: in Google Cloud Console (client OAuth) il redirect è
  `https://fnjwsnmngaihrjsacgov.supabase.co/auth/v1/callback` (dovrebbe già esserci).
  Verifica solo che sia presente; il provider Google in Supabase resta invariato.
- [M] **SMTP con Resend**:
  1. Resend → aggiungi e **verifica il dominio** (record DNS SPF/DKIM forniti da Resend).
  2. Crea una **API key** Resend.
  3. Supabase → **Auth → SMTP Settings** (Enable Custom SMTP):
     - Host `smtp.resend.com` · Port `465` · User `resend` · Password = **API key Resend**
     - Sender email `noreply@<DOMINIO>` · Sender name `Digital Discovery`
  4. (Consigliato) personalizza il **template email** del Magic Link (Auth → Email Templates).
- ✅ Verifica: richiedi un magic link su `/accedi` con un'email reale → arriva e apre `/portale`.

---

## Fase 3 — Stripe Live (dopo l'attivazione)

- [M] In modalità **Live**: copia `sk_live_…` e `pk_live_…`.
- [M] Crea il **Prodotto** live riusabile (prezzo dinamico per preventivo) → `prod_…` live.
- [M] **Developers → Webhooks → Add endpoint**:
  - URL: `https://<DOMINIO>/api/webhooks/stripe`
  - Eventi: `setup_intent.succeeded`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
  - Copia il **Signing secret** `whsec_…` (live).
- [M] Aggiorna le env var Vercel (Production) e **redeploy**:
  - `STRIPE_SECRET_KEY=sk_live_…`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`
  - `STRIPE_WEBHOOK_SECRET=whsec_…` (live)
  - `STRIPE_PRODUCT_ID=prod_…` (live)
- ✅ Verifica: su un preventivo di prova, imposta un mandato **SEPA reale** (o carta) con
  importo minimo → in Stripe vedi il SetupIntent/subscription; nel portale la pratica
  avanza a `pagamento_attivo` e compaiono le rate. Poi elimina la pratica di test.

---

## Fase 4 — DocuSeal Live

- [M] Fornisci a Claude il **`DOCUSEAL_API_TOKEN` di produzione**.
- [C] **Ricreo il template** (Modulo d'Ordine) sull'account prod via API → ottengo il
  nuovo `DOCUSEAL_TEMPLATE_ID` (come fatto in test).
- [M] Env var Vercel (Production):
  - `DOCUSEAL_API_TOKEN=…` (prod)
  - `DOCUSEAL_TEMPLATE_ID=…` (prod)
  - `DOCUSEAL_BASE_URL=https://api.docuseal.com`
  - (opzionale) webhook DocuSeal → `https://<DOMINIO>/api/webhooks/docuseal` + `DOCUSEAL_WEBHOOK_SECRET`
- ✅ Verifica: firma un contratto di prova → PDF firmato + audit trail generati.

---

## Fase 5 — Verifica end-to-end e pulizia finale

- [M] Flusso reale completo: lead → preventivo → accetta → **firma** → **pagamento** →
  accesso **portale** (magic link).
- [C/M] Elimina le pratiche di test create durante la verifica live.
- [M] Controlli finali: HTTPS ok, email che partono, webhook `200` in Stripe/DocuSeal.

---

## Checklist ENV VAR di produzione (Vercel → Settings → Environment Variables)

| Variabile | Valore prod | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fnjwsnmngaihrjsacgov.supabase.co` | stesso progetto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | **solo server**, mai al browser |
| `STRIPE_SECRET_KEY` | `sk_live_…` | Fase 3 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` | Fase 3 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (live) | Fase 3 |
| `STRIPE_PRODUCT_ID` | `prod_…` (live) | Fase 3 |
| `DOCUSEAL_API_TOKEN` | token prod | Fase 4 |
| `DOCUSEAL_BASE_URL` | `https://api.docuseal.com` | invariato |
| `DOCUSEAL_TEMPLATE_ID` | id template prod | Fase 4 |
| `DOCUSEAL_WEBHOOK_SECRET` | opzionale | se abiliti il webhook DocuSeal |

Nota: le chiavi `NEXT_PUBLIC_*` sono esposte al browser (è corretto: sono pubbliche).
Le altre restano server-side.
