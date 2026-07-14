# Gestione insoluti & recupero credito — Fase 1 · Piano

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development o executing-plans. Step con checkbox `- [ ]`.

**Goal:** Rilevare in modo affidabile gli addebiti SEPA falliti, avvisare (email + CRM) e permettere allo staff di recuperare il credito con un link di pagamento carta (maggiorazione + IVA), tenendo il mandato SEPA per le rate future.

**Architecture:** Arricchiamo `payments` (invoice→rata stabile, motivo, stato recupero) e aggiungiamo `app_settings`. I webhook Stripe diventano robusti e idempotenti. Una vista `/vendite/insoluti` con azioni pilota il recupero via Stripe Checkout (importi LORDI ×1,22). Email via Resend REST (best-effort, degrada se manca la chiave).

**Tech Stack:** Next.js 16 App Router, Supabase (service-role nei webhook, RLS altrove), Stripe (subscriptions + Checkout), Resend REST. Niente suite di test → verifica con `npx tsc --noEmit`, `npx eslint`, browser preview e query DB.

**Nota comandi:** ogni comando shell va prefissato con `cd /Users/marcopalombini/Progetti/digital-discovery-portale &&` (la cwd può resettarsi).

---

### Task 1: Migration — schema insoluti + app_settings

**Files:**
- Create: `supabase/migrations/20260714130000_insoluti_recupero.sql`
- Applicare via MCP `apply_migration` (project `fnjwsnmngaihrjsacgov`), poi rigenerare `src/lib/database.types.ts`.

- [ ] **Step 1: DDL**

```sql
-- Sotto-stato del recupero credito su una rata failed.
create type public.recovery_stato as enum
  ('nessuno','da_recuperare','link_inviato','recuperato','nuovo_mandato','annullato');

alter table public.payments
  add column stripe_invoice_id   text,
  add column failure_code        text,
  add column failure_reason      text,
  add column failed_at           timestamptz,
  add column attempts            integer not null default 0,
  add column recovery_stato      public.recovery_stato not null default 'nessuno',
  add column recovery_checkout_id text,
  add column recovery_url        text,
  add column maggiorazione       numeric(12,2);

create index idx_payments_invoice on public.payments (stripe_invoice_id);
create index idx_payments_recovery on public.payments (recovery_stato)
  where recovery_stato <> 'nessuno';

-- Impostazioni applicative (riga singola). Lettura staff, scrittura admin.
create table public.app_settings (
  id                   boolean primary key default true,   -- forza riga unica
  maggiorazione_insoluto numeric(12,2) not null default 5.00,
  iban_bonifico        text,
  causale_bonifico     text default 'Saldo insoluto pratica Digital Discovery',
  statement_descriptor text default 'DIGITAL DISCOVERY',
  updated_at           timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);
insert into public.app_settings (id) values (true) on conflict do nothing;

alter table public.app_settings enable row level security;
create policy app_settings_select on public.app_settings for select
  using (private.is_staff());
create policy app_settings_write on public.app_settings for all
  using (private.is_admin()) with check (private.is_admin());
```

- [ ] **Step 2:** applicare la migration via MCP (`name: insoluti_recupero`).
- [ ] **Step 3:** rigenerare i tipi: MCP `generate_typescript_types` → sovrascrivere `src/lib/database.types.ts`. Verifica: `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `feat(insoluti): schema recupero + app_settings`.

---

### Task 2: Mappa reason code SEPA → italiano

**Files:** Create `src/lib/stripe/insoluti-reason.ts`

- [ ] **Step 1:**

```ts
// Reason code SEPA (R-transaction) → messaggio in italiano.
const REASONS: Record<string, string> = {
  AC04: "Conto chiuso.",
  AC06: "Conto bloccato.",
  AC01: "Numero di conto errato.",
  AM04: "Fondi insufficienti sul conto.",
  AM05: "Addebito duplicato.",
  BE05: "Creditore non riconosciuto dalla banca del cliente.",
  MD01: "Nessun mandato valido / mandato non riconosciuto dalla banca.",
  MD06: "Addebito contestato/stornato dal cliente.",
  MD07: "Cliente deceduto.",
  MS02: "Rifiuto del debitore (cliente).",
  MS03: "Rifiuto della banca (motivo non specificato).",
  SL01: "Rifiuto per servizi specifici della banca del cliente.",
};

// Estrae il codice dal charge/last_payment_error e ritorna {code, reason}.
export function motivoInsoluto(code: string | null | undefined): {
  code: string | null;
  reason: string;
} {
  const c = (code ?? "").toUpperCase().trim() || null;
  const reason = (c && REASONS[c]) || "Addebito non riuscito.";
  return { code: c, reason };
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → OK. **Commit** `feat(insoluti): mappa reason code SEPA`.

---

### Task 3: Helper email Resend (best-effort)

**Files:** Create `src/lib/email/send.ts`

- [ ] **Step 1:**

```ts
import "server-only";

// Invio email via Resend REST. Best-effort: se manca RESEND_API_KEY non lancia
// (il sistema resta usabile, gli alert restano visibili nel CRM).
const FROM = process.env.EMAIL_FROM ?? "Digital Discovery <noreply@digital-discovery.it>";

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, ...input }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2:** Marco aggiunge `RESEND_API_KEY` (e opz. `EMAIL_FROM`) su Vercel + `.env.local`. `npx tsc --noEmit`. **Commit** `feat(email): helper invio Resend`.

---

### Task 4: Alert insoluto (email admin + owner)

**Files:** Create `src/lib/insoluti/alert.ts`

- [ ] **Step 1:**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { euro } from "@/lib/format";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";
const ADMIN = "marco@convivostudio.it";

// Avvisa admin + owner del cliente di un insoluto. Best-effort.
export async function inviaAlertInsoluto(paymentId: string): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: p } = await db
      .from("payments")
      .select(
        "numero_rata, importo, failure_reason, client:clients!payments_client_id_fkey(id, ragione_sociale, owner_id)",
      )
      .eq("id", paymentId)
      .maybeSingle();
    if (!p || !p.client) return;
    const cli = p.client as unknown as {
      ragione_sociale: string;
      owner_id: string | null;
    };

    const dest = new Set<string>([ADMIN]);
    if (cli.owner_id) {
      const { data: owner } = await db
        .from("profiles")
        .select("email")
        .eq("id", cli.owner_id)
        .maybeSingle();
      const oe = (owner as { email: string | null } | null)?.email;
      if (oe) dest.add(oe);
    }

    const link = `${SITE}/vendite/insoluti?p=${paymentId}`;
    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1e1e22">
        <h2 style="margin:0 0 8px">Addebito non riuscito</h2>
        <p style="margin:0 0 12px;color:#55555e">
          <b>${cli.ragione_sociale}</b> — rata ${p.numero_rata ?? "—"} · ${euro(Number(p.importo ?? 0))}<br>
          Motivo: ${p.failure_reason ?? "Addebito non riuscito."}
        </p>
        <a href="${link}" style="display:inline-block;background:#222;color:#fff;
          text-decoration:none;border-radius:999px;padding:10px 20px;font-weight:700">
          Gestisci l'insoluto</a>
      </div>`;

    await sendEmail({
      to: [...dest],
      subject: `Insoluto: ${cli.ragione_sociale} — rata ${p.numero_rata ?? ""}`,
      html,
    });
  } catch {
    // best-effort
  }
}
```

- [ ] **Step 2:** `npx tsc --noEmit`. **Commit** `feat(insoluti): alert email admin/owner`.

---

### Task 5: Webhook robusti (aggancio invoice→rata + insoluto)

**Files:** Modify `src/lib/stripe/activate.ts`, `src/app/api/webhooks/stripe/route.ts`

Regola aggancio: alla comparsa di un invoice per una subscription, se nessuna rata
ha quel `stripe_invoice_id`, lo si assegna alla **prima rata senza invoice** (ordine
`numero_rata`). Poi si matcha sempre per `stripe_invoice_id`. Così i retry dello
stesso invoice colpiscono la stessa rata.

- [ ] **Step 1:** aggiungere helper in `activate.ts`:

```ts
import { motivoInsoluto } from "@/lib/stripe/insoluti-reason";
import { inviaAlertInsoluto } from "@/lib/insoluti/alert";

// Trova (o aggancia) la rata di un invoice di subscription.
async function rataPerInvoice(
  db: ReturnType<typeof createAdminClient>,
  subId: string,
  invoiceId: string,
): Promise<{ id: string } | null> {
  // già agganciata?
  const { data: byInv } = await db
    .from("payments")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();
  if (byInv) return byInv as { id: string };
  // prima rata senza invoice della subscription
  const { data: libera } = await db
    .from("payments")
    .select("id")
    .eq("subscription_id", subId)
    .is("stripe_invoice_id", null)
    .order("numero_rata", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!libera) return null;
  await db
    .from("payments")
    .update({ stripe_invoice_id: invoiceId })
    .eq("id", (libera as { id: string }).id);
  return libera as { id: string };
}
```

- [ ] **Step 2:** sostituire `handleInvoicePaid`:

```ts
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId || !invoice.id) return;
  const db = createAdminClient();
  const rata = await rataPerInvoice(db, subId, invoice.id);
  if (!rata) return;
  await db
    .from("payments")
    .update({
      stato: "paid",
      paid_at: new Date().toISOString(),
      recovery_stato: "nessuno", // se era in recupero, si chiude
      failure_code: null,
      failure_reason: null,
    })
    .eq("id", rata.id);
}
```

- [ ] **Step 3:** sostituire `handleInvoiceFailed` (recupera reason dal charge):

```ts
export async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId || !invoice.id) return;
  const db = createAdminClient();
  const rata = await rataPerInvoice(db, subId, invoice.id);
  if (!rata) return;

  // reason: da last_finalization_error o dal charge collegato
  let code: string | null = null;
  const anyInv = invoice as unknown as {
    last_finalization_error?: { code?: string } | null;
    charge?: string | null;
  };
  if (anyInv.charge) {
    try {
      const ch = await getStripe().charges.retrieve(anyInv.charge);
      code = ch.failure_code ?? (ch.outcome?.reason ?? null);
    } catch {}
  }
  code = code ?? anyInv.last_finalization_error?.code ?? null;
  const { code: c, reason } = motivoInsoluto(code);

  // attempts += 1 (leggo il valore corrente)
  const { data: cur } = await db
    .from("payments")
    .select("attempts")
    .eq("id", rata.id)
    .maybeSingle();
  const attempts = ((cur as { attempts: number } | null)?.attempts ?? 0) + 1;

  await db
    .from("payments")
    .update({
      stato: "failed",
      failure_code: c,
      failure_reason: reason,
      failed_at: new Date().toISOString(),
      attempts,
      recovery_stato: "da_recuperare",
    })
    .eq("id", rata.id);

  await inviaAlertInsoluto(rata.id);
}
```

- [ ] **Step 4:** nuovo handler recupero carta + route. In `activate.ts`:

```ts
// checkout.session.completed: recupero carta andato a buon fine.
export async function handleRecoveryPaid(session: Stripe.Checkout.Session): Promise<void> {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId || session.payment_status !== "paid") return;
  const db = createAdminClient();
  await db
    .from("payments")
    .update({
      stato: "paid",
      paid_at: new Date().toISOString(),
      recovery_stato: "recuperato",
    })
    .eq("id", paymentId);
}
```

In `route.ts` aggiungere il case:

```ts
case "checkout.session.completed":
  await handleRecoveryPaid(event.data.object as Stripe.Checkout.Session);
  break;
```

(import `handleRecoveryPaid` dall'activate.)

- [ ] **Step 5:** `npx tsc --noEmit`. Marco aggiunge l'evento `checkout.session.completed` al webhook Stripe (Workbench). **Commit** `feat(insoluti): webhook robusti invoice→rata + recupero`.

---

### Task 6: Impostazioni app (lettura + editor admin)

**Files:** Create `src/lib/settings/app-settings.ts`; edit su vista Insoluti (Task 9) per l'editor admin.

- [ ] **Step 1:** reader + setter:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AppSettings {
  maggiorazione_insoluto: number;
  iban_bonifico: string | null;
  causale_bonifico: string | null;
  statement_descriptor: string | null;
}

export async function getAppSettings(): Promise<AppSettings> {
  const sb = await createClient();
  const { data } = await sb
    .from("app_settings")
    .select("maggiorazione_insoluto, iban_bonifico, causale_bonifico, statement_descriptor")
    .eq("id", true)
    .maybeSingle();
  return (
    (data as AppSettings | null) ?? {
      maggiorazione_insoluto: 5,
      iban_bonifico: null,
      causale_bonifico: null,
      statement_descriptor: "DIGITAL DISCOVERY",
    }
  );
}
```

- [ ] **Step 2:** server action `updateAppSettings` (admin-only, pattern `assertAdmin` come in `staff/actions.ts`) in `src/lib/settings/actions.ts`, che aggiorna la riga `id=true` e `revalidatePath("/vendite/insoluti")`.
- [ ] **Step 3:** `npx tsc --noEmit`. **Commit** `feat(settings): impostazioni app (maggiorazione, bonifico)`.

---

### Task 7: Creazione link di recupero (Stripe Checkout, LORDO IVA)

**Files:** Create `src/lib/stripe/recupero.ts`

- [ ] **Step 1:**

```ts
import "server-only";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettings } from "@/lib/settings/app-settings";
import { ALIQUOTA_IVA } from "@/lib/format";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

// Crea una Checkout Session carta per (rata + maggiorazione) × 1,22.
// Ritorna l'URL. Salva snapshot maggiorazione + checkout id/url sulla rata.
export async function creaLinkRecupero(
  paymentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const db = createAdminClient();
  const { data: p } = await db
    .from("payments")
    .select("id, importo, numero_rata, client:clients!payments_client_id_fkey(ragione_sociale, email, stripe_customer_id:id)")
    .eq("id", paymentId)
    .maybeSingle();
  if (!p) return { ok: false, error: "Rata non trovata." };
  const cli = (p as unknown as { client: { ragione_sociale: string; email: string | null } }).client;

  const { maggiorazione_insoluto } = await getAppSettings();
  const nettoRata = Number((p as { importo: number | null }).importo ?? 0);
  const magg = Number(maggiorazione_insoluto ?? 0);
  const lordoCents = Math.round((nettoRata + magg) * (1 + ALIQUOTA_IVA) * 100);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: cli.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Saldo insoluto rata ${(p as { numero_rata: number | null }).numero_rata ?? ""} — ${cli.ragione_sociale}`,
          },
          unit_amount: lordoCents,
        },
        quantity: 1,
      },
    ],
    metadata: { payment_id: paymentId },
    success_url: `${SITE}/recupero/ok`,
    cancel_url: `${SITE}/recupero/annullato`,
  });

  if (!session.url) return { ok: false, error: "Stripe non ha restituito l'URL." };
  await db
    .from("payments")
    .update({
      recovery_checkout_id: session.id,
      recovery_url: session.url,
      maggiorazione: magg,
      recovery_stato: "link_inviato",
    })
    .eq("id", paymentId);
  return { ok: true, url: session.url };
}
```

(Nota: la select `stripe_customer_id:id` è un placeholder — usare l'email cliente; il customer non serve per una Checkout one-off.)
Correzione: rimuovere l'alias errato, selezionare `client:clients!payments_client_id_fkey(ragione_sociale, email)`.

- [ ] **Step 2:** pagine esito `src/app/recupero/ok/page.tsx` e `src/app/recupero/annullato/page.tsx` (semplici conferme pubbliche) + aggiungerle a `PUBLIC_PATHS` in `src/lib/supabase/middleware.ts`.
- [ ] **Step 3:** `npx tsc --noEmit`. **Commit** `feat(insoluti): link di recupero Stripe Checkout (IVA inclusa)`.

---

### Task 8: Query + azioni insoluti

**Files:** Create `src/lib/insoluti/queries.ts`, `src/lib/insoluti/actions.ts`

- [ ] **Step 1:** `queries.ts` — `listInsoluti()` (rate `stato=failed` con `recovery_stato in (da_recuperare, link_inviato, nuovo_mandato)`, join cliente/contratto, ordinate per `failed_at desc`) e `countInsolutiAperti()` (per il badge). Server client (RLS).

- [ ] **Step 2:** `actions.ts` (`assertStaff`):
  - `azioneGeneraLink(paymentId)` → chiama `creaLinkRecupero`, ritorna url; `revalidatePath`.
  - `azioneInviaLinkEmail(paymentId)` → genera (o riusa) link e invia email al cliente con `sendEmail` (testo pronto); `recovery_stato='link_inviato'`.
  - `azioneSegnaPagato(paymentId)` → `stato='paid', paid_at=now(), recovery_stato='recuperato'` (per bonifico).
  - `azioneAnnulla(paymentId)` → `recovery_stato='annullato'`.
  Tutte con scope `owns_client` implicito via RLS (lo staff scrive solo i propri; admin ovunque).

- [ ] **Step 3:** `npx tsc --noEmit`. **Commit** `feat(insoluti): query + azioni recupero`.

---

### Task 9: Vista `/vendite/insoluti`

**Files:** Create `src/app/(app)/vendite/insoluti/page.tsx`, `src/components/internal/insoluti-list.tsx` (client, azioni)

- [ ] **Step 1:** page server: `listInsoluti()` + `getAppSettings()`; header con titolo e (se admin) editor maggiorazione/bonifico; passa `?p=<id>` per evidenziare la riga; rende `<InsolutiList>`.
- [ ] **Step 2:** `insoluti-list.tsx`: per ogni insoluto card con cliente, contratto, rata, importo, **motivo**, data, tentativi, `StatusPill` (tone `fail`/`wait`). Azioni (useTransition): **Genera/Copia link**, **Invia link via email**, **Segna pagato (bonifico)** con conferma, **Annulla**. Mostra IBAN+causale bonifico (da settings). Voce "Spese di insoluto €X" nel dettaglio importo.
- [ ] **Step 3:** verifica browser (preview): la pagina carica, azioni non rompono. `npx tsc --noEmit` + `eslint`. **Commit** `feat(insoluti): vista /vendite/insoluti`.

---

### Task 10: Sidebar "Insoluti" + badge; header Pagamenti

**Files:** Modify `src/components/internal/sidebar.tsx`, `src/app/(app)/layout.tsx` (per passare il conteggio) o fetch nel Sidebar via server wrapper.

- [ ] **Step 1:** aggiungere voce `Insoluti` (icona `AlertIcon`, `ready:true`, NON adminOnly) tra Pagamenti e Scadenze. Badge col conteggio `countInsolutiAperti()`: poiché la Sidebar è client, calcolare il conteggio in `layout.tsx` (server) e passarlo come prop `insolutiCount` → badge rosso se >0.
- [ ] **Step 2:** su `/vendite/pagamenti`, se `countInsolutiAperti()>0`, banner in cima con link a Insoluti.
- [ ] **Step 3:** verifica browser + `tsc`/`eslint`. **Commit** `feat(insoluti): voce sidebar + badge`.

---

### Task 11: Avviso SEPA in `/paga` (prevenzione)

**Files:** Create `src/components/pay/sepa-avviso.tsx`; Modify `src/components/pay/payment-setup.tsx`, `src/lib/stripe/setup.ts` (passare `statementDescriptor` dai settings)

- [ ] **Step 1:** `ensurePaymentContext` legge `getAppSettings()` e aggiunge `statementDescriptor` al `PaymentContext`.
- [ ] **Step 2:** `SepaAvviso` (presentazionale): box in evidenza — "Comunica alla tua banca di autorizzare l'addebito SEPA di Digital Discovery (apparirà come «\<descriptor\>»). Se non preavvisata, molte banche rifiutano il primo addebito. L'addebito SEPA si conferma in 2–5 giorni."
- [ ] **Step 3:** in `payment-setup.tsx`, intercettare il metodo selezionato nel `PaymentElement` via `onChange={(e)=>setMetodo(e.value.type)}`; mostrare `<SepaAvviso>` quando `metodo === "sepa_debit"`.
- [ ] **Step 4:** verifica browser (selezionando SEPA compare l'avviso) + `tsc`/`eslint`. **Commit** `feat(pagamenti): avviso prevenzione SEPA in /paga`.

---

### Task 12: Verifica end-to-end + push

- [ ] **Step 1:** `npx tsc --noEmit` e `npx eslint` su tutti i file toccati → puliti.
- [ ] **Step 2:** verifica in preview: `/vendite/insoluti` (con una rata forzata a `failed`/`da_recuperare` via SQL di test), genera link (Checkout Stripe test si apre), segna pagato, badge sidebar aggiornato, avviso SEPA in `/paga`.
- [ ] **Step 3:** ripulire eventuali dati di test. **Push** su `main` (auto-deploy Vercel).
- [ ] **Step 4:** promemoria a Marco: aggiungere env `RESEND_API_KEY` (+ opz. `EMAIL_FROM`), evento webhook `checkout.session.completed`, e impostare da UI la maggiorazione + IBAN bonifico.

---

## Self-review (coverage spec Fase 1)

- Avviso SEPA prevenzione → Task 11. ✓
- Rilevazione robusta invoice→rata + motivo → Task 5 (+ Task 2). ✓
- Alert email admin/owner + sezione/badge → Task 4, 9, 10. ✓
- Vista Insoluti + azioni (link carta, segna pagato bonifico, annulla) → Task 8, 9. ✓
- Maggiorazione configurabile admin → Task 1, 6, 9. ✓
- IVA ×1,22 verso Stripe → Task 7 (`creaLinkRecupero`). ✓
- Idempotenza/robustezza webhook → Task 5. ✓

Fuori Fase 1 (→ Fase 2): email conferma mandato, ritorni tardivi (dispute/refund),
"richiedi nuovo mandato"/ritenta SEPA, bonifico strutturato, ritocco stato SEPA.
