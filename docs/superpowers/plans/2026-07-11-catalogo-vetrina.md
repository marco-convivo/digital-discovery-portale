# Catalogo Vetrina — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare il catalogo servizi statico in una vetrina virtuale DB-backed (contenuti, prezzo, immagini, portfolio), gestibile dall'interno e consultabile dallo staff e dal cliente (pagina pubblica + portale).

**Architecture:** Modello **ibrido** — la struttura tecnica dei servizi resta in `src/lib/catalog.ts` (chiave, opzioni, mappatura DocuSeal, `ricorrente`/`unaTantum`); due tabelle nuove (`service_catalog`, `portfolio_items`) tengono i contenuti di vetrina, agganciate per `chiave`. Letture interne via server client (RLS `private.is_staff()`); letture pubbliche via `createAdminClient()` con filtro `attivo=true` esplicito (stesso pattern di `src/lib/quotes/public.ts`). Immagini su bucket Storage pubblico `catalogo`, upload via server action con service-role.

**Tech Stack:** Next.js 16 (App Router, TS, server actions), Tailwind v4, Supabase (Postgres + RLS + Storage), skill impeccable per la rifinitura visiva.

**Testing approach:** Il repo **non ha una suite di test** (vedi `CLAUDE.md`). La verifica di ogni task è: `npx tsc --noEmit` (typecheck, autorevole), `npm run lint`, verifiche DB via Supabase MCP (`execute_sql`), e verifica browser via preview tools per la UI. NON introdurre un framework di test. Le migration si applicano via MCP `apply_migration` (o `supabase db push`).

**Vincolo operativo:** NON eseguire `npm run build` né `rm -rf .next` mentre il dev server gira (corrompe la cache Turbopack). Usare `npx tsc --noEmit` per il typecheck.

---

## File Structure

**Migration (nuove):**
- `supabase/migrations/20260711120000_service_catalog.sql` — tabelle + indici + RLS
- `supabase/migrations/20260711120100_catalogo_storage_bucket.sql` — bucket Storage pubblico
- `supabase/migrations/20260711120200_seed_service_catalog.sql` — seed 9 servizi + portfolio

**Dati/logica (`src/lib/catalogo/`):**
- `types.ts` — tipi `ServiceCatalogRow`, `PortfolioItemRow`, `VetrinaServizio`
- `queries.ts` — letture (vetrina pubblica via admin, dettaglio, lista interna)
- `actions.ts` — server actions: upsert contenuto servizio, CRUD portfolio, upload immagine

**Componenti vetrina condivisi (`src/components/catalogo/`):**
- `placeholder.tsx` — placeholder immagine mancante
- `prezzo.tsx` — "a partire da €X" (+ suffisso da `ricorrente`)
- `servizio-card.tsx` — tessera indice
- `vetrina.tsx` — griglia indice (`CatalogoVetrina`)
- `servizio-dettaglio.tsx` — dettaglio servizio
- `portfolio-gallery.tsx` — galleria lavori

**Editor interno:**
- `src/app/(app)/vendite/catalogo/page.tsx` — griglia gestione
- `src/app/(app)/vendite/catalogo/[chiave]/page.tsx` — pagina editor (server)
- `src/components/internal/catalogo-editor.tsx` — form contenuti (client)
- `src/components/internal/portfolio-manager.tsx` — gestione portfolio (client)
- `src/components/internal/sidebar.tsx` — **modifica**: voce "Catalogo"

**Pubblico:**
- `src/app/catalogo/page.tsx` — indice vetrina
- `src/app/catalogo/[chiave]/page.tsx` — dettaglio

**Portale:**
- `src/app/portale/catalogo/page.tsx` — indice (shell portale)
- `src/app/portale/catalogo/[chiave]/page.tsx` — dettaglio
- `src/app/portale/layout.tsx` — **modifica**: link "Catalogo"

**Fase B (aggancio preventivo):**
- `src/lib/catalogo/queries.ts` — **modifica**: `getPrezziBase()`
- `src/components/internal/create-quote-form.tsx` — **modifica**: prezzi per riga, sconto, totale
- `src/app/(app)/vendite/clienti/[id]/actions.ts` — **modifica**: `createQuote` scrive `quote_items` con prezzi + sconto

---

# FASE A — Catalogo + Vetrina + Portfolio

## Task 1: Migration tabelle + RLS

**Files:**
- Create: `supabase/migrations/20260711120000_service_catalog.sql`

- [ ] **Step 1: Scrivi la migration**

```sql
-- =============================================================================
-- 0008 · Catalogo vetrina (service_catalog + portfolio_items)
-- Modello ibrido: la struttura tecnica dei servizi resta in src/lib/catalog.ts;
-- qui vivono SOLO i contenuti di vetrina, agganciati per `chiave`.
-- =============================================================================

create table public.service_catalog (
  id               uuid primary key default gen_random_uuid(),
  chiave           text not null unique,          -- = CatalogService.key (codice)
  titolo           text not null,
  sottotitolo      text,
  descrizione      text,
  attivita_incluse text[] not null default '{}',  -- "attività svolte"
  condizioni       text[] not null default '{}',  -- "condizioni di sviluppo"
  attivita_escluse text[] not null default '{}',  -- "attività escluse"
  prezzo_base      numeric(12, 2),                -- "a partire da €X"
  immagine_url     text,
  ordine           integer not null default 0,
  attivo           boolean not null default true,
  updated_at       timestamptz not null default now()
);

create table public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.service_catalog (id) on delete cascade,
  titolo       text not null,
  cliente      text,
  settore      text,
  descrizione  text,
  risultato    text,
  immagine_url text,
  link_url     text,
  ordine       integer not null default 0,
  created_at   timestamptz not null default now()
);

create index idx_service_catalog_ordine on public.service_catalog (ordine);
create index idx_portfolio_service on public.portfolio_items (service_id, ordine);

-- ---- RLS --------------------------------------------------------------------
-- Gli helper security-definer sono nello schema `private` (migration 0006).
alter table public.service_catalog enable row level security;
alter table public.portfolio_items enable row level security;

-- service_catalog: staff legge tutto; anon/altri leggono solo i servizi attivi.
-- (La pagina pubblica gira via service-role, che bypassa la RLS; questa policy
--  è comunque la difesa in profondità per eventuali letture con sessione.)
create policy service_catalog_select on public.service_catalog
  for select using (private.is_staff() or attivo = true);
create policy service_catalog_write on public.service_catalog
  for all using (private.is_staff()) with check (private.is_staff());

-- portfolio_items: contenuto di marketing, lettura libera; scrittura solo staff.
create policy portfolio_select on public.portfolio_items
  for select using (true);
create policy portfolio_write on public.portfolio_items
  for all using (private.is_staff()) with check (private.is_staff());
```

- [ ] **Step 2: Applica la migration**

Applica via Supabase MCP `apply_migration` (name: `service_catalog`, query = contenuto del file), oppure `supabase db push`.

- [ ] **Step 3: Verifica**

Via MCP `execute_sql`:
```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('service_catalog','portfolio_items');
```
Expected: 2 righe.
```sql
select polname from pg_policies where tablename in ('service_catalog','portfolio_items');
```
Expected: 4 policy (`service_catalog_select`, `service_catalog_write`, `portfolio_select`, `portfolio_write`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260711120000_service_catalog.sql
git commit -m "feat(catalogo): migration tabelle service_catalog + portfolio_items + RLS"
```

---

## Task 2: Migration bucket Storage

**Files:**
- Create: `supabase/migrations/20260711120100_catalogo_storage_bucket.sql`

- [ ] **Step 1: Scrivi la migration**

```sql
-- =============================================================================
-- 0009 · Bucket Storage `catalogo` (pubblico in lettura)
-- Le immagini della vetrina (anteprime servizi + portfolio) sono contenuto
-- pubblico. Gli upload passano dalla server action con service-role (bypassa
-- la RLS storage); qui basta il bucket pubblico + lettura pubblica.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do nothing;

-- Lettura pubblica degli oggetti del bucket.
create policy "catalogo public read" on storage.objects
  for select using (bucket_id = 'catalogo');

-- Scrittura/gestione solo staff (gli upload via service-role la bypassano
-- comunque; questa copre eventuali upload con sessione).
create policy "catalogo staff write" on storage.objects
  for all to authenticated
  using (bucket_id = 'catalogo' and private.is_staff())
  with check (bucket_id = 'catalogo' and private.is_staff());
```

- [ ] **Step 2: Applica** via MCP `apply_migration` (name: `catalogo_storage_bucket`).

- [ ] **Step 3: Verifica** via `execute_sql`:
```sql
select id, public from storage.buckets where id = 'catalogo';
```
Expected: 1 riga, `public = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260711120100_catalogo_storage_bucket.sql
git commit -m "feat(catalogo): bucket storage pubblico catalogo"
```

---

## Task 3: Migration seed 9 servizi + portfolio

**Files:**
- Create: `supabase/migrations/20260711120200_seed_service_catalog.sql`

Le `chiave` DEVONO combaciare con `CatalogService.key` in `src/lib/catalog.ts`:
`social, google, sito, ecommerce, ads, brand, shooting, video, whatsapp`.
`immagine_url` a null (placeholder in UI); Marco caricherà le immagini dall'editor.

- [ ] **Step 1: Scrivi la migration**

```sql
-- =============================================================================
-- 0010 · Seed catalogo vetrina (contenuti/prezzi INVENTATI plausibili).
-- Marco rifinisce testi/prezzi e carica le immagini dall'editor interno.
-- =============================================================================

insert into public.service_catalog
  (chiave, titolo, sottotitolo, descrizione, attivita_incluse, condizioni, attivita_escluse, prezzo_base, ordine)
values
  ('social', 'Gestione Social', 'La tua presenza quotidiana su Facebook e Instagram',
   'Curiamo la tua presenza sui social con un piano editoriale mensile, contenuti originali e interazione con la community, così parli ai tuoi clienti ogni giorno senza pensarci.',
   array['Piano editoriale mensile','Creazione grafiche e copy dei post','Pubblicazione e programmazione','Risposta a commenti e messaggi','Report mensile dei risultati'],
   array['Numero di uscite concordato in fase di attivazione','Accesso agli account social o creazione ex-novo','Materiale fotografico fornito dal cliente o shooting a parte'],
   array['Advertising a pagamento (servizio Pubblicità)','Shooting fotografico professionale','Gestione recensioni Google'],
   349, 1),

  ('google', 'Google Presence', 'Farti trovare su Google e Maps',
   'Ottimizziamo la tua scheda Google Business Profile per farti trovare da chi cerca la tua attività su Google e Maps, con informazioni sempre aggiornate e foto curate.',
   array['Creazione o rivendicazione della scheda','Ottimizzazione informazioni e categorie','Caricamento foto e orari','Impostazione messaggi e recensioni'],
   array['Accesso o creazione account Google Business','Verifica della scheda a cura di Google (tempi variabili)'],
   array['Gestione continuativa delle recensioni','Campagne Google Ads a pagamento'],
   290, 2),

  ('sito', 'Sito Web', 'Il tuo sito, veloce e fatto per convertire',
   'Progettiamo e sviluppiamo il tuo sito web: design su misura, ottimizzato per mobile e per la velocità, pensato per trasformare le visite in contatti.',
   array['Design su misura del brand','Sviluppo responsive (mobile-first)','Ottimizzazione SEO di base','Modulo contatti e integrazioni','Messa online e formazione all''uso'],
   array['Contenuti (testi, immagini) forniti dal cliente o preventivati a parte','Dominio e hosting a carico del cliente o inclusi su richiesta'],
   array['Gestione contenuti continuativa','E-commerce (servizio dedicato)','Copywriting professionale'],
   1200, 3),

  ('ecommerce', 'E-commerce', 'Vendi online, davvero',
   'Costruiamo il tuo negozio online: catalogo prodotti, pagamenti sicuri e spedizioni, con un pannello semplice per gestire ordini e magazzino in autonomia.',
   array['Design e sviluppo del negozio','Configurazione catalogo e categorie','Pagamenti e spedizioni','Formazione alla gestione ordini','Ottimizzazione SEO di base'],
   array['Schede prodotto e foto fornite dal cliente','Account per pagamenti e corrieri a carico del cliente'],
   array['Caricamento massivo del catalogo (a preventivo)','Gestione ordini continuativa','Campagne pubblicitarie'],
   2900, 4),

  ('ads', 'Pubblicità', 'Campagne che portano contatti misurabili',
   'Pianifichiamo e gestiamo le tue campagne pubblicitarie su Meta e Google: targeting, creatività e ottimizzazione continua per un ritorno misurabile sull''investimento.',
   array['Strategia e definizione del target','Creazione delle inserzioni','Gestione e ottimizzazione continua','Report mensile con metriche chiave'],
   array['Budget pubblicitario NON incluso nel canone di gestione','Durata concordata in fase di attivazione','Accesso agli account pubblicitari'],
   array['Il budget speso in advertising (fatturato a parte dalle piattaforme)','Produzione video professionale'],
   150, 5),

  ('brand', 'Brand Identity', 'Un''identità visiva che ti fa riconoscere',
   'Diamo forma alla tua identità: logo, palette, tipografia e linee guida, per un''immagine coerente e riconoscibile su ogni canale.',
   array['Logo e varianti','Palette colori e tipografia','Mini brand guidelines','File pronti per stampa e web'],
   array['Numero di proposte e revisioni concordato','Eventuali font a licenza a carico del cliente'],
   array['Naming e payoff','Materiali stampati (biglietti, brochure) a preventivo','Sito web'],
   1500, 6),

  ('shooting', 'Shooting Foto', 'Immagini professionali della tua attività',
   'Servizio fotografico professionale per raccontare la tua attività: ambienti, prodotti e persone, con scatti pronti all''uso per social, sito e advertising.',
   array['Mezza giornata di shooting','Selezione e post-produzione degli scatti','Consegna in alta e bassa risoluzione','Diritti d''uso per i tuoi canali'],
   array['Location e disponibilità a cura del cliente','Numero di scatti finali concordato'],
   array['Video','Noleggio location o modelli','Servizi in più giornate (a preventivo)'],
   450, 7),

  ('video', 'Video Reel', 'Video brevi che catturano l''attenzione',
   'Produciamo reel e video brevi verticali, pensati per social e advertising: ritmo, montaggio e sottotitoli per fermare lo scroll.',
   array['Riprese in loco','Montaggio con musica e sottotitoli','Formati verticali per social','Revisione inclusa'],
   array['Numero di reel concordato in fase di attivazione','Disponibilità della location e dei soggetti'],
   array['Shooting fotografico','Animazioni 3D o motion grafico avanzato','Speakeraggio professionale'],
   250, 8),

  ('whatsapp', 'WhatsApp Business', 'Parla coi clienti dove sono già',
   'Configuriamo WhatsApp Business per la tua attività: profilo, risposte rapide, messaggi automatici e catalogo, per gestire richieste e ordini in un canale diretto.',
   array['Setup profilo aziendale','Messaggi di benvenuto e risposte rapide','Etichette e organizzazione chat','Mini catalogo prodotti'],
   array['Numero dedicato a carico del cliente','Verifica dell''account a cura di Meta'],
   array['Gestione continuativa delle conversazioni','Integrazioni CRM avanzate','Campagne di messaggistica massiva'],
   190, 9);

-- Portfolio (2 lavori per servizio; dati inventati plausibili, immagini a null).
insert into public.portfolio_items (service_id, titolo, cliente, settore, descrizione, risultato, link_url, ordine)
select s.id, v.titolo, v.cliente, v.settore, v.descrizione, v.risultato, v.link_url, v.ordine
from public.service_catalog s
join (values
  ('social','Piano editoriale mensile','Boutique Mimosa','Moda','Contenuti curati e community management quotidiano','+58% interazioni in 4 mesi','https://instagram.com', 1),
  ('social','Rilancio profilo Instagram','Caffè Aurora','Ristorazione','Restyling feed e stories ricorrenti','+1.200 follower organici', null, 2),
  ('google','Scheda Google ottimizzata','Studio Dentistico Bianchi','Salute','Profilo completo con foto e orari','Primo risultato locale per "dentista"', null, 1),
  ('google','Recensioni e visibilità','Officina Rossi','Automotive','Setup scheda e raccolta recensioni','Da 3 a 87 recensioni', null, 2),
  ('sito','Sito vetrina','Villa Le Ortensie','Hospitality','Sito responsive con richiesta prenotazioni','+34% richieste dal sito','https://example.com', 1),
  ('sito','Sito one-page','Personal Trainer Neri','Fitness','Landing per acquisizione contatti','Costo per contatto dimezzato', null, 2),
  ('ecommerce','Negozio online','Sapori del Borgo','Food','Shop con pagamenti e spedizioni','120 ordini nel primo mese','https://example.com', 1),
  ('ecommerce','Migrazione e-commerce','Atelier Luce','Arredo','Passaggio a piattaforma più veloce','-40% tempo di caricamento', null, 2),
  ('ads','Campagna lead generation','Immobiliare Costa','Real estate','Meta Ads con targeting locale','48 lead qualificati/mese', null, 1),
  ('ads','Advertising e-commerce','Sapori del Borgo','Food','Campagne vendita su Meta e Google','ROAS 4,2x', null, 2),
  ('brand','Identità visiva','Caffè Aurora','Ristorazione','Logo, palette e brand guidelines','Riconoscibilità di marca', null, 1),
  ('brand','Restyling logo','Officina Rossi','Automotive','Modernizzazione del marchio storico', null, null, 2),
  ('shooting','Shooting prodotti','Boutique Mimosa','Moda','Set fotografico collezione stagionale','80 scatti per e-commerce', null, 1),
  ('shooting','Shooting ambienti','Villa Le Ortensie','Hospitality','Servizio location e camere', null, null, 2),
  ('video','Reel promozionale','Caffè Aurora','Ristorazione','Serie di 4 reel per lancio menu','2 reel oltre 50k views', null, 1),
  ('video','Video prodotto','Atelier Luce','Arredo','Reel di presentazione collezione', null, null, 2),
  ('whatsapp','Setup WhatsApp Business','Studio Dentistico Bianchi','Salute','Automazioni e risposte rapide','Prenotazioni gestite in chat', null, 1),
  ('whatsapp','Catalogo su WhatsApp','Sapori del Borgo','Food','Mini catalogo e ordini diretti', null, null, 2)
) as v(chiave, titolo, cliente, settore, descrizione, risultato, link_url, ordine)
  on v.chiave = s.chiave;
```

- [ ] **Step 2: Applica** via MCP `apply_migration` (name: `seed_service_catalog`).

- [ ] **Step 3: Verifica** via `execute_sql`:
```sql
select (select count(*) from public.service_catalog) as servizi,
       (select count(*) from public.portfolio_items) as lavori;
```
Expected: `servizi = 9`, `lavori = 18`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260711120200_seed_service_catalog.sql
git commit -m "feat(catalogo): seed 9 servizi + portfolio (dati demo)"
```

---

## Task 4: Rigenera i tipi DB

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Rigenera** i tipi TypeScript dal DB via MCP `generate_typescript_types` e sovrascrivi `src/lib/database.types.ts` con l'output. (In alternativa `supabase gen types typescript`.)

- [ ] **Step 2: Verifica** che il file contenga `service_catalog` e `portfolio_items`:

Run: `grep -c "service_catalog\|portfolio_items" src/lib/database.types.ts`
Expected: > 0.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "chore(catalogo): rigenera database.types con nuove tabelle"
```

---

## Task 5: Tipi di dominio del catalogo

**Files:**
- Create: `src/lib/catalogo/types.ts`

- [ ] **Step 1: Scrivi il file**

```ts
import type { CatalogService } from "@/lib/catalog";

// Riga di contenuto (DB).
export interface ServiceCatalogRow {
  id: string;
  chiave: string;
  titolo: string;
  sottotitolo: string | null;
  descrizione: string | null;
  attivita_incluse: string[];
  condizioni: string[];
  attivita_escluse: string[];
  prezzo_base: number | null;
  immagine_url: string | null;
  ordine: number;
  attivo: boolean;
  updated_at: string;
}

export interface PortfolioItemRow {
  id: string;
  service_id: string;
  titolo: string;
  cliente: string | null;
  settore: string | null;
  descrizione: string | null;
  risultato: string | null;
  immagine_url: string | null;
  link_url: string | null;
  ordine: number;
}

// Vista di vetrina: contenuto DB + struttura tecnica dal codice (per chiave).
export interface VetrinaServizio {
  row: ServiceCatalogRow;
  service: CatalogService | null; // da CATALOG (ricorrente/unaTantum/opzioni)
  portfolio: PortfolioItemRow[];
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/lib/catalogo/types.ts
git commit -m "feat(catalogo): tipi di dominio vetrina"
```

---

## Task 6: Query di lettura

**Files:**
- Create: `src/lib/catalogo/queries.ts`

Letture pubbliche via `createAdminClient()` (service-role) con filtro `attivo=true` esplicito — stesso pattern di `src/lib/quotes/public.ts`. Letture interne (staff) via server client (RLS).

- [ ] **Step 1: Scrivi il file**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CATALOG } from "@/lib/catalog";
import type {
  ServiceCatalogRow,
  PortfolioItemRow,
  VetrinaServizio,
} from "@/lib/catalogo/types";

const SERVICE_COLS =
  "id, chiave, titolo, sottotitolo, descrizione, attivita_incluse, condizioni, attivita_escluse, prezzo_base, immagine_url, ordine, attivo, updated_at";
const PORTFOLIO_COLS =
  "id, service_id, titolo, cliente, settore, descrizione, risultato, immagine_url, link_url, ordine";

function svc(chiave: string) {
  return CATALOG.find((c) => c.key === chiave) ?? null;
}

/** Indice vetrina PUBBLICO: solo servizi attivi, ordinati. */
export async function getVetrinaPubblica(): Promise<VetrinaServizio[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("service_catalog")
    .select(SERVICE_COLS)
    .eq("attivo", true)
    .order("ordine", { ascending: true });
  const rows = (data ?? []) as unknown as ServiceCatalogRow[];
  return rows.map((row) => ({ row, service: svc(row.chiave), portfolio: [] }));
}

/** Dettaglio vetrina PUBBLICO per chiave (solo se attivo), con portfolio. */
export async function getServizioPubblico(
  chiave: string,
): Promise<VetrinaServizio | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("service_catalog")
    .select(SERVICE_COLS)
    .eq("chiave", chiave)
    .eq("attivo", true)
    .maybeSingle();
  const row = data as unknown as ServiceCatalogRow | null;
  if (!row) return null;
  const { data: pf } = await db
    .from("portfolio_items")
    .select(PORTFOLIO_COLS)
    .eq("service_id", row.id)
    .order("ordine", { ascending: true });
  return {
    row,
    service: svc(row.chiave),
    portfolio: (pf ?? []) as unknown as PortfolioItemRow[],
  };
}

/** Lista INTERNA (staff): tutti i servizi, anche non attivi. */
export async function listServiziInterni(): Promise<ServiceCatalogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select(SERVICE_COLS)
    .order("ordine", { ascending: true });
  return (data ?? []) as unknown as ServiceCatalogRow[];
}

/** Dettaglio INTERNO (staff) per chiave, con portfolio (anche se non attivo). */
export async function getServizioInterno(
  chiave: string,
): Promise<VetrinaServizio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select(SERVICE_COLS)
    .eq("chiave", chiave)
    .maybeSingle();
  const row = data as unknown as ServiceCatalogRow | null;
  if (!row) return null;
  const { data: pf } = await supabase
    .from("portfolio_items")
    .select(PORTFOLIO_COLS)
    .eq("service_id", row.id)
    .order("ordine", { ascending: true });
  return {
    row,
    service: svc(row.chiave),
    portfolio: (pf ?? []) as unknown as PortfolioItemRow[],
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore (se il typed client dà "GenericStringError" sui select concatenati, i cast `as unknown as` sono già presenti).

- [ ] **Step 3: Commit**

```bash
git add src/lib/catalogo/queries.ts
git commit -m "feat(catalogo): query lettura vetrina (pubblica/interna)"
```

---

## Task 7: Server actions (contenuti + portfolio + upload)

**Files:**
- Create: `src/lib/catalogo/actions.ts`

Le scritture usano il server client (RLS `is_staff()`); l'upload immagini usa `createAdminClient().storage` (service-role) sul bucket pubblico `catalogo`. Ogni action verifica staff prima di scrivere.

- [ ] **Step 1: Scrivi il file**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertStaff(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Sessione scaduta.";
  const { data } = await supabase
    .from("profiles")
    .select("id, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !(data as { active: boolean }).active)
    return "Accesso non abilitato.";
  return null;
}

const toList = (s: string) =>
  s
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

export interface ServizioContenuto {
  titolo: string;
  sottotitolo: string;
  descrizione: string;
  attivita_incluse: string; // multilinea → text[]
  condizioni: string;
  attivita_escluse: string;
  prezzo_base: number | null;
  ordine: number;
  attivo: boolean;
}

/** Aggiorna i contenuti di un servizio (per chiave). */
export async function updateServizio(
  chiave: string,
  input: ServizioContenuto,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  if (!input.titolo.trim()) return { ok: false, error: "Il titolo è obbligatorio." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_catalog")
    .update({
      titolo: input.titolo.trim(),
      sottotitolo: input.sottotitolo.trim() || null,
      descrizione: input.descrizione.trim() || null,
      attivita_incluse: toList(input.attivita_incluse),
      condizioni: toList(input.condizioni),
      attivita_escluse: toList(input.attivita_escluse),
      prezzo_base: input.prezzo_base,
      ordine: input.ordine,
      attivo: input.attivo,
      updated_at: new Date().toISOString(),
    })
    .eq("chiave", chiave);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendite/catalogo/${chiave}`);
  revalidatePath("/vendite/catalogo");
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${chiave}`);
  return { ok: true };
}

export interface PortfolioInput {
  id?: string;
  service_id: string;
  titolo: string;
  cliente: string;
  settore: string;
  descrizione: string;
  risultato: string;
  link_url: string;
  immagine_url: string | null;
  ordine: number;
}

/** Crea o aggiorna un lavoro di portfolio. */
export async function savePortfolioItem(
  input: PortfolioInput,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  if (!input.titolo.trim()) return { ok: false, error: "Il titolo è obbligatorio." };
  const supabase = await createClient();
  const payload = {
    service_id: input.service_id,
    titolo: input.titolo.trim(),
    cliente: input.cliente.trim() || null,
    settore: input.settore.trim() || null,
    descrizione: input.descrizione.trim() || null,
    risultato: input.risultato.trim() || null,
    link_url: input.link_url.trim() || null,
    immagine_url: input.immagine_url,
    ordine: input.ordine,
  };
  const { error } = input.id
    ? await supabase.from("portfolio_items").update(payload).eq("id", input.id)
    : await supabase.from("portfolio_items").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/catalogo");
  return { ok: true };
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/catalogo");
  return { ok: true };
}

/** Upload immagine sul bucket pubblico `catalogo`; ritorna l'URL pubblico. */
export async function uploadImmagine(
  form: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const file = form.get("file");
  const prefix = String(form.get("prefix") ?? "servizio");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Nessun file." };
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "Serve un'immagine." };
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "Immagine troppo grande (max 5MB)." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const rand = crypto.randomUUID();
  const path = `${prefix}/${rand}.${ext}`;
  const db = createAdminClient();
  const { error } = await db.storage
    .from("catalogo")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { ok: false, error: error.message };
  const { data } = db.storage.from("catalogo").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/** Aggiorna l'immagine di anteprima di un servizio. */
export async function setImmagineServizio(
  chiave: string,
  url: string,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_catalog")
    .update({ immagine_url: url, updated_at: new Date().toISOString() })
    .eq("chiave", chiave);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendite/catalogo/${chiave}`);
  revalidatePath(`/catalogo/${chiave}`);
  return { ok: true };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/lib/catalogo/actions.ts
git commit -m "feat(catalogo): server actions contenuti/portfolio/upload immagini"
```

---

## Task 8: Componenti base vetrina (placeholder + prezzo)

**Files:**
- Create: `src/components/catalogo/placeholder.tsx`
- Create: `src/components/catalogo/prezzo.tsx`

- [ ] **Step 1: `placeholder.tsx`**

```tsx
// Placeholder pulito quando manca l'immagine di un servizio/lavoro.
export function ImgPlaceholder({ label }: { label?: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-card-2 text-text-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        className="size-8 opacity-60" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L4 21" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
```

- [ ] **Step 2: `prezzo.tsx`**

```tsx
import { euro } from "@/lib/format";
import type { CatalogService } from "@/lib/catalog";

// "a partire da €X" con suffisso derivato dalla struttura tecnica del servizio.
export function Prezzo({
  prezzo,
  service,
  size = "md",
}: {
  prezzo: number | null;
  service: CatalogService | null;
  size?: "sm" | "md";
}) {
  if (prezzo == null) return null;
  const suffisso = service?.ricorrente
    ? "/mese"
    : service?.unaTantum
      ? "una tantum"
      : null;
  return (
    <div className={size === "sm" ? "text-[13px]" : "text-[15px]"}>
      <span className="text-text-3">a partire da </span>
      <span className="font-extrabold text-text">{euro(prezzo)}</span>
      {suffisso && <span className="text-text-3"> {suffisso}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` → nessun errore.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalogo/placeholder.tsx src/components/catalogo/prezzo.tsx
git commit -m "feat(catalogo): componenti base placeholder + prezzo"
```

---

## Task 9: Componenti vetrina (card, griglia, dettaglio, portfolio)

**Files:**
- Create: `src/components/catalogo/servizio-card.tsx`
- Create: `src/components/catalogo/vetrina.tsx`
- Create: `src/components/catalogo/portfolio-gallery.tsx`
- Create: `src/components/catalogo/servizio-dettaglio.tsx`

Componenti server-agnostici (nessun hook): ricevono dati e un `basePath` per i link (`/catalogo` pubblico o `/portale/catalogo`). La rifinitura visiva impeccable è nel Task 14.

- [ ] **Step 1: `servizio-card.tsx`**

```tsx
import Link from "next/link";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { Prezzo } from "@/components/catalogo/prezzo";
import type { VetrinaServizio } from "@/lib/catalogo/types";

export function ServizioCard({
  v,
  basePath,
}: {
  v: VetrinaServizio;
  basePath: string;
}) {
  const { row, service } = v;
  const badge = service?.ricorrente
    ? "Ricorrente"
    : service?.unaTantum
      ? "Una tantum"
      : "Progetto";
  return (
    <Link
      href={`${basePath}/${row.chiave}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line/60 bg-card shadow-card transition-colors hover:border-violet"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {row.immagine_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.immagine_url}
            alt={row.titolo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ImgPlaceholder label={row.titolo} />
        )}
        <span className="absolute left-3 top-3 rounded-pill bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-text-2 backdrop-blur">
          {badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="text-[17px] font-bold tracking-[-0.01em] text-text">
          {row.titolo}
        </h3>
        {row.sottotitolo && (
          <p className="text-[13.5px] leading-snug text-text-2">
            {row.sottotitolo}
          </p>
        )}
        <div className="mt-auto pt-3">
          <Prezzo prezzo={row.prezzo_base} service={service} size="sm" />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: `vetrina.tsx`**

```tsx
import { ServizioCard } from "@/components/catalogo/servizio-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { VetrinaServizio } from "@/lib/catalogo/types";

export function CatalogoVetrina({
  servizi,
  basePath,
}: {
  servizi: VetrinaServizio[];
  basePath: string;
}) {
  if (servizi.length === 0) {
    return (
      <EmptyState
        title="Catalogo in aggiornamento"
        hint="I servizi saranno disponibili a breve."
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {servizi.map((v) => (
        <ServizioCard key={v.row.id} v={v} basePath={basePath} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `portfolio-gallery.tsx`**

```tsx
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import type { PortfolioItemRow } from "@/lib/catalogo/types";

export function PortfolioGallery({ items }: { items: PortfolioItemRow[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-extrabold tracking-[-0.01em] text-text">
        Lavori realizzati
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((it) => (
          <article
            key={it.id}
            className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card"
          >
            <div className="aspect-[16/9]">
              {it.immagine_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.immagine_url} alt={it.titolo}
                  className="h-full w-full object-cover" />
              ) : (
                <ImgPlaceholder label={it.titolo} />
              )}
            </div>
            <div className="flex flex-col gap-1.5 p-5">
              <div className="flex items-center gap-2 text-[12px] text-text-3">
                {it.cliente && <span className="font-semibold text-text-2">{it.cliente}</span>}
                {it.settore && <span>· {it.settore}</span>}
              </div>
              <h3 className="text-[15px] font-bold text-text">{it.titolo}</h3>
              {it.descrizione && (
                <p className="text-[13.5px] leading-relaxed text-text-2">
                  {it.descrizione}
                </p>
              )}
              {it.risultato && (
                <p className="mt-1 inline-flex w-fit rounded-pill bg-mint-soft px-2.5 py-1 text-[12.5px] font-semibold text-text">
                  {it.risultato}
                </p>
              )}
              {it.link_url && (
                <a href={it.link_url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 text-[13px] font-semibold text-violet hover:underline">
                  Vedi il lavoro →
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `servizio-dettaglio.tsx`**

```tsx
import Link from "next/link";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { Prezzo } from "@/components/catalogo/prezzo";
import { PortfolioGallery } from "@/components/catalogo/portfolio-gallery";
import type { VetrinaServizio } from "@/lib/catalogo/types";

function Blocco({ titolo, voci, tono }: { titolo: string; voci: string[]; tono?: "escluse" }) {
  if (voci.length === 0) return null;
  return (
    <div className="rounded-card border border-line/60 bg-card p-5 shadow-card">
      <h3 className="mb-3 text-[15px] font-bold text-text">{titolo}</h3>
      <ul className="flex flex-col gap-2 text-[14px] text-text-2">
        {voci.map((v, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={tono === "escluse" ? "text-text-3" : "text-violet"}>
              {tono === "escluse" ? "–" : "✓"}
            </span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServizioDettaglio({
  v,
  basePath,
  ctaHref,
}: {
  v: VetrinaServizio;
  basePath: string;
  ctaHref: string;
}) {
  const { row, service, portfolio } = v;
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={basePath} className="text-[13px] font-semibold text-text-2 hover:text-text">
        ← Catalogo
      </Link>

      <div className="mt-4 overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
        <div className="aspect-[21/9]">
          {row.immagine_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.immagine_url} alt={row.titolo} className="h-full w-full object-cover" />
          ) : (
            <ImgPlaceholder label={row.titolo} />
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            {row.titolo}
          </h1>
          {row.sottotitolo && (
            <p className="mt-1 text-[15px] text-text-2">{row.sottotitolo}</p>
          )}
          {row.descrizione && (
            <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-text-2">
              {row.descrizione}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <Prezzo prezzo={row.prezzo_base} service={service} />
            <Link
              href={ctaHref}
              className="rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
            >
              Richiedi preventivo
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Blocco titolo="Cosa facciamo" voci={row.attivita_incluse} />
        <Blocco titolo="Come lavoriamo" voci={row.condizioni} />
        <Blocco titolo="Cosa non è incluso" voci={row.attivita_escluse} tono="escluse" />
      </div>

      <PortfolioGallery items={portfolio} />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit` → nessun errore.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalogo/
git commit -m "feat(catalogo): componenti vetrina (card, griglia, dettaglio, portfolio)"
```

---

## Task 10: Pagine pubbliche `/catalogo`

**Files:**
- Create: `src/app/catalogo/page.tsx`
- Create: `src/app/catalogo/[chiave]/page.tsx`

CTA pubblica → `mailto` verso Digital Discovery (nessun form nuovo, YAGNI).

- [ ] **Step 1: `src/app/catalogo/page.tsx`**

```tsx
import { getVetrinaPubblica } from "@/lib/catalogo/queries";
import { CatalogoVetrina } from "@/components/catalogo/vetrina";

export const metadata = {
  title: "Catalogo servizi · Digital Discovery",
  description: "La tua presenza digitale, gestita da noi.",
};

export default async function CatalogoPubblicoPage() {
  const servizi = await getVetrinaPubblica();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-[11px] bg-ink text-base font-extrabold text-on-ink">
          D
        </div>
        <div className="font-bold">Digital Discovery</div>
      </div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-text">
          I nostri servizi
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-2">
          Tutto ciò che serve alla tua presenza digitale, con un unico referente
          e risultati misurabili. Esplora attività, condizioni e lavori realizzati.
        </p>
      </header>
      <CatalogoVetrina servizi={servizi} basePath="/catalogo" />
      <footer className="mt-12 text-center text-[12px] text-text-3">
        Digital Discovery S.r.l.
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: `src/app/catalogo/[chiave]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getServizioPubblico } from "@/lib/catalogo/queries";
import { ServizioDettaglio } from "@/components/catalogo/servizio-dettaglio";

const MAILTO =
  "mailto:info@digitaldiscovery.it?subject=Richiesta%20preventivo";

export default async function ServizioPubblicoPage({
  params,
}: {
  params: Promise<{ chiave: string }>;
}) {
  const { chiave } = await params;
  const v = await getServizioPubblico(chiave);
  if (!v) notFound();
  return (
    <main className="px-6 py-12">
      <ServizioDettaglio v={v} basePath="/catalogo" ctaHref={MAILTO} />
    </main>
  );
}
```

- [ ] **Step 3: Verifica browser** — avvia il dev server (preview_start), naviga a `/catalogo` e `/catalogo/social`. Controlla: griglia servizi visibile, badge, prezzo "a partire da €349/mese" su social, dettaglio con 3 blocchi + portfolio. `preview_console_logs` senza errori.

- [ ] **Step 4: Commit**

```bash
git add src/app/catalogo/
git commit -m "feat(catalogo): pagine pubbliche vetrina indice + dettaglio"
```

---

## Task 11: Pagine portale (riuso componenti)

**Files:**
- Create: `src/app/portale/catalogo/page.tsx`
- Create: `src/app/portale/catalogo/[chiave]/page.tsx`
- Modify: `src/app/portale/layout.tsx` (aggiungi link "Catalogo")

- [ ] **Step 1: Leggi** `src/app/portale/layout.tsx` per capire la struttura della nav del portale, poi aggiungi una voce/link "Catalogo" verso `/portale/catalogo` seguendo il pattern esistente.

- [ ] **Step 2: `src/app/portale/catalogo/page.tsx`**

```tsx
import { getVetrinaPubblica } from "@/lib/catalogo/queries";
import { CatalogoVetrina } from "@/components/catalogo/vetrina";

export default async function PortaleCatalogoPage() {
  const servizi = await getVetrinaPubblica();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Catalogo servizi
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Esplora i nostri servizi, le condizioni e i lavori realizzati.
        </p>
      </header>
      <CatalogoVetrina servizi={servizi} basePath="/portale/catalogo" />
    </div>
  );
}
```

- [ ] **Step 3: `src/app/portale/catalogo/[chiave]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getServizioPubblico } from "@/lib/catalogo/queries";
import { ServizioDettaglio } from "@/components/catalogo/servizio-dettaglio";

export default async function PortaleServizioPage({
  params,
}: {
  params: Promise<{ chiave: string }>;
}) {
  const { chiave } = await params;
  const v = await getServizioPubblico(chiave);
  if (!v) notFound();
  return (
    <ServizioDettaglio
      v={v}
      basePath="/portale/catalogo"
      ctaHref="mailto:info@digitaldiscovery.it?subject=Richiesta%20preventivo"
    />
  );
}
```

- [ ] **Step 4: Verifica browser** — naviga a `/portale/catalogo` dentro la shell del portale (serve sessione cliente magic link). Link "Catalogo" presente in nav.

- [ ] **Step 5: Commit**

```bash
git add src/app/portale/catalogo/ src/app/portale/layout.tsx
git commit -m "feat(catalogo): vetrina dentro il portale cliente"
```

---

## Task 12: Editor interno — griglia gestione + voce sidebar

**Files:**
- Create: `src/app/(app)/vendite/catalogo/page.tsx`
- Modify: `src/components/internal/sidebar.tsx`

- [ ] **Step 1: Aggiungi la voce sidebar** in `src/components/internal/sidebar.tsx`, nell'array `NAV`, dopo "Scadenze":

```tsx
  { href: "/vendite/catalogo", label: "Catalogo", icon: GridIcon, ready: true },
```

E aggiungi l'icona in fondo al file (accanto alle altre):

```tsx
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
```

- [ ] **Step 2: `src/app/(app)/vendite/catalogo/page.tsx`**

```tsx
import Link from "next/link";
import { listServiziInterni } from "@/lib/catalogo/queries";
import { CATALOG } from "@/lib/catalog";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Prezzo } from "@/components/catalogo/prezzo";

export default async function CatalogoAdminPage() {
  const servizi = await listServiziInterni();
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Catalogo servizi
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Gestisci contenuti, prezzo, immagine e portfolio di ciascun servizio.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {servizi.map((row) => {
          const service = CATALOG.find((c) => c.key === row.chiave) ?? null;
          return (
            <Link key={row.id} href={`/vendite/catalogo/${row.chiave}`}>
              <Card className="flex items-center justify-between gap-3 transition-colors hover:border-violet">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text">{row.titolo}</span>
                    {!row.attivo && <StatusPill tone="draft">nascosto</StatusPill>}
                  </div>
                  <div className="mt-0.5">
                    <Prezzo prezzo={row.prezzo_base} service={service} size="sm" />
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-violet">Modifica →</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

> Nota: se `Card` non accetta `className`, usa un `<div>` con le stesse classi del componente Card. Verifica leggendo `src/components/ui/card.tsx`.

- [ ] **Step 3: Verifica browser** — `/vendite/catalogo` mostra 9 servizi con prezzo; voce "Catalogo" attiva in sidebar.

- [ ] **Step 4: Typecheck + Commit**

Run: `npx tsc --noEmit`
```bash
git add "src/app/(app)/vendite/catalogo/page.tsx" src/components/internal/sidebar.tsx
git commit -m "feat(catalogo): pagina gestione catalogo + voce sidebar"
```

---

## Task 13: Editor interno — form servizio + gestione portfolio

**Files:**
- Create: `src/app/(app)/vendite/catalogo/[chiave]/page.tsx`
- Create: `src/components/internal/catalogo-editor.tsx`
- Create: `src/components/internal/portfolio-manager.tsx`

- [ ] **Step 1: `src/app/(app)/vendite/catalogo/[chiave]/page.tsx`** (server, carica dati e monta i due client component)

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServizioInterno } from "@/lib/catalogo/queries";
import { CatalogoEditor } from "@/components/internal/catalogo-editor";
import { PortfolioManager } from "@/components/internal/portfolio-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CatalogoEditPage({
  params,
}: {
  params: Promise<{ chiave: string }>;
}) {
  const { chiave } = await params;
  const v = await getServizioInterno(chiave);
  if (!v) notFound();
  const { row, portfolio } = v;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/vendite/catalogo" className="text-[13px] font-semibold text-text-2 hover:text-text">
        ← Catalogo
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        {row.titolo}
      </h1>
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader><CardTitle>Contenuti e prezzo</CardTitle></CardHeader>
          <CatalogoEditor
            chiave={chiave}
            immagineUrl={row.immagine_url}
            initial={{
              titolo: row.titolo,
              sottotitolo: row.sottotitolo ?? "",
              descrizione: row.descrizione ?? "",
              attivita_incluse: row.attivita_incluse.join("\n"),
              condizioni: row.condizioni.join("\n"),
              attivita_escluse: row.attivita_escluse.join("\n"),
              prezzo_base: row.prezzo_base,
              ordine: row.ordine,
              attivo: row.attivo,
            }}
          />
        </Card>
        <Card>
          <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
          <PortfolioManager serviceId={row.id} initial={portfolio} />
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/internal/catalogo-editor.tsx`** (form contenuti + upload anteprima)

```tsx
"use client";

import { useState, useRef, useTransition } from "react";
import {
  updateServizio,
  uploadImmagine,
  setImmagineServizio,
  type ServizioContenuto,
} from "@/lib/catalogo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";

function Area({ label, value, onChange, hint }: {
  label: string; value: string; hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-text-2">{label}</span>
      {hint && <span className="mb-1 block text-[12px] text-text-3">{hint}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-sm border border-line bg-card px-3 py-2 text-[14px] text-text outline-none focus:border-violet"
      />
    </label>
  );
}

export function CatalogoEditor({
  chiave,
  immagineUrl,
  initial,
}: {
  chiave: string;
  immagineUrl: string | null;
  initial: ServizioContenuto;
}) {
  const [d, setD] = useState<ServizioContenuto>(initial);
  const [img, setImg] = useState<string | null>(immagineUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ServizioContenuto>(k: K, v: ServizioContenuto[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  function save() {
    setError(null); setSaved(false);
    start(async () => {
      const res = await updateServizio(chiave, d);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("prefix", `servizio/${chiave}`);
      const up = await uploadImmagine(fd);
      if (!up.ok) { setError(up.error); return; }
      const res = await setImmagineServizio(chiave, up.url);
      if (res.ok) setImg(up.url);
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-32 flex-none overflow-hidden rounded-sm border border-line">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImgPlaceholder />
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={pending}>
            Cambia immagine
          </Button>
          <p className="mt-1 text-[12px] text-text-3">JPG/PNG, max 5MB.</p>
        </div>
      </div>

      <Input label="Titolo" value={d.titolo} onChange={(e) => set("titolo", e.target.value)} />
      <Input label="Sottotitolo" value={d.sottotitolo} onChange={(e) => set("sottotitolo", e.target.value)} />
      <Area label="Descrizione" value={d.descrizione} onChange={(v) => set("descrizione", v)} />
      <Area label="Cosa facciamo" hint="Una voce per riga" value={d.attivita_incluse} onChange={(v) => set("attivita_incluse", v)} />
      <Area label="Come lavoriamo (condizioni)" hint="Una voce per riga" value={d.condizioni} onChange={(v) => set("condizioni", v)} />
      <Area label="Cosa non è incluso" hint="Una voce per riga" value={d.attivita_escluse} onChange={(v) => set("attivita_escluse", v)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Prezzo base (€)" type="number" value={d.prezzo_base ?? ""}
          onChange={(e) => set("prezzo_base", e.target.value === "" ? null : Number(e.target.value))} />
        <Input label="Ordine" type="number" value={d.ordine}
          onChange={(e) => set("ordine", Number(e.target.value))} />
      </div>
      <label className="flex items-center gap-2 text-[14px] text-text-2">
        <input type="checkbox" checked={d.attivo} onChange={(e) => set("attivo", e.target.checked)} />
        Visibile nella vetrina
      </label>

      {error && <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">{error}</p>}
      {saved && <p className="rounded-sm bg-mint-soft px-3 py-2 text-[13px] text-text">Salvato.</p>}
      <div>
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </div>
  );
}
```

> Verifica che `Input` accetti la prop `type` (leggi `src/components/ui/input.tsx`); se non la inoltra, aggiungi `type?: string` inoltrandola all'`<input>`.

- [ ] **Step 3: `src/components/internal/portfolio-manager.tsx`** (lista + form add/edit/delete + upload)

```tsx
"use client";

import { useState, useRef, useTransition } from "react";
import {
  savePortfolioItem,
  deletePortfolioItem,
  uploadImmagine,
  type PortfolioInput,
} from "@/lib/catalogo/actions";
import type { PortfolioItemRow } from "@/lib/catalogo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const empty = (serviceId: string, ordine: number): PortfolioInput => ({
  service_id: serviceId, titolo: "", cliente: "", settore: "",
  descrizione: "", risultato: "", link_url: "", immagine_url: null, ordine,
});

export function PortfolioManager({
  serviceId,
  initial,
}: {
  serviceId: string;
  initial: PortfolioItemRow[];
}) {
  const [items, setItems] = useState<PortfolioItemRow[]>(initial);
  const [draft, setDraft] = useState<PortfolioInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PortfolioInput>(k: K, v: PortfolioInput[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  function edit(it: PortfolioItemRow) {
    setError(null);
    setDraft({
      id: it.id, service_id: serviceId, titolo: it.titolo,
      cliente: it.cliente ?? "", settore: it.settore ?? "",
      descrizione: it.descrizione ?? "", risultato: it.risultato ?? "",
      link_url: it.link_url ?? "", immagine_url: it.immagine_url, ordine: it.ordine,
    });
  }

  function reload() {
    // Ricarica soft: dopo il salvataggio la revalidatePath aggiorna il server;
    // qui aggiorniamo lo stato locale in modo ottimistico via window.location.
    window.location.reload();
  }

  function save() {
    if (!draft) return;
    setError(null);
    start(async () => {
      const res = await savePortfolioItem(draft);
      if (res.ok) { setDraft(null); reload(); }
      else setError(res.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deletePortfolioItem(id);
      if (res.ok) setItems((l) => l.filter((x) => x.id !== id));
      else setError(res.error);
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("prefix", `portfolio/${serviceId}`);
      const up = await uploadImmagine(fd);
      if (up.ok) set("immagine_url", up.url);
      else setError(up.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-text">{it.titolo}</div>
              <div className="truncate text-[12.5px] text-text-3">
                {[it.cliente, it.settore].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <div className="flex flex-none gap-2">
              <button onClick={() => edit(it)} className="text-[13px] font-semibold text-violet hover:underline">Modifica</button>
              <button onClick={() => remove(it.id)} disabled={pending} className="text-[13px] font-semibold text-fail-tx hover:underline">Elimina</button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-[13px] text-text-3">Nessun lavoro ancora.</li>}
      </ul>

      {draft ? (
        <div className="flex flex-col gap-2.5 rounded-md border border-line p-4">
          <Input label="Titolo" value={draft.titolo} onChange={(e) => set("titolo", e.target.value)} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Cliente" value={draft.cliente} onChange={(e) => set("cliente", e.target.value)} />
            <Input label="Settore" value={draft.settore} onChange={(e) => set("settore", e.target.value)} />
          </div>
          <Input label="Descrizione" value={draft.descrizione} onChange={(e) => set("descrizione", e.target.value)} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Risultato" value={draft.risultato} onChange={(e) => set("risultato", e.target.value)} />
            <Input label="Link" value={draft.link_url} onChange={(e) => set("link_url", e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={pending}>
              {draft.immagine_url ? "Cambia immagine" : "Aggiungi immagine"}
            </Button>
            {draft.immagine_url && <span className="text-[12px] text-text-3">immagine caricata</span>}
          </div>
          {error && <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={pending}>{pending ? "Salvataggio…" : "Salva lavoro"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={pending}>Annulla</Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setDraft(empty(serviceId, items.length + 1))}>
            + Aggiungi lavoro
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck** — `npx tsc --noEmit` → nessun errore.

- [ ] **Step 5: Verifica browser** — su `/vendite/catalogo/social`: modifica un testo → Salva → messaggio "Salvato"; naviga a `/catalogo/social` e verifica il testo aggiornato. Aggiungi un lavoro di portfolio con upload immagine e verifica che compaia in `/catalogo/social`. Toggla "Visibile" off e verifica che sparisca da `/catalogo`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/vendite/catalogo/[chiave]/page.tsx" src/components/internal/catalogo-editor.tsx src/components/internal/portfolio-manager.tsx
git commit -m "feat(catalogo): editor interno servizio + gestione portfolio con upload"
```

---

## Task 14: Rifinitura visiva vetrina (impeccable)

**Files:**
- Modify: `src/components/catalogo/*` e le pagine `/catalogo` (secondo necessità)

- [ ] **Step 1: Invoca lo skill `impeccable`** con comando `polish` sulla vetrina (`/catalogo` e dettaglio). Applica register "product", token v0.3, regole anti-slop (niente griglia di card identiche → varia ritmo/scala; contrasto testo ≥4.5:1; motion con `prefers-reduced-motion`).

- [ ] **Step 2: Verifica** responsive (mobile/tablet/desktop via preview_resize) e dark/light. Screenshot di prova all'utente.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style(catalogo): rifinitura visiva vetrina (impeccable)"
```

---

## Fase A — Self-check finale

- [ ] `npx tsc --noEmit` pulito
- [ ] `npm run lint` pulito
- [ ] `/catalogo`, `/catalogo/[chiave]`, `/portale/catalogo`, `/vendite/catalogo`, `/vendite/catalogo/[chiave]` funzionano
- [ ] Upload immagini servizio e portfolio funzionano (URL pubblico raggiungibile)
- [ ] Toggle `attivo` nasconde il servizio in pubblico ma non nell'interno
- [ ] Aggiorna memoria progetto (`digital-discovery-portale.md`) con la sezione Catalogo

---

# FASE B — Aggancio prezzi → preventivo

## Task B1: Prezzi base nel preventivo

**Files:**
- Modify: `src/lib/catalogo/queries.ts` (aggiungi `getPrezziBase`)
- Modify: `src/components/internal/create-quote-form.tsx`
- Modify: `src/app/(app)/vendite/clienti/[id]/actions.ts` (`createQuote`)

- [ ] **Step 1:** In `src/lib/catalogo/queries.ts` aggiungi una lettura mappa chiave→prezzo_base (server client):

```ts
/** Mappa chiave→prezzo_base per precompilare l'editor preventivo. */
export async function getPrezziBase(): Promise<Record<string, number | null>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select("chiave, prezzo_base");
  const out: Record<string, number | null> = {};
  for (const r of (data ?? []) as unknown as { chiave: string; prezzo_base: number | null }[]) {
    out[r.chiave] = r.prezzo_base;
  }
  return out;
}
```

- [ ] **Step 2:** In `create-quote-form.tsx`: quando un servizio viene selezionato, mostra un campo **prezzo per servizio** precompilato con `prezzoBase[chiave]` (passato come prop dalla pagina che rende il form). Somma i prezzi dei servizi selezionati; aggiungi un campo **sconto** (€) e mostra il **totale = somma − sconto**. Per i ricorrenti il totale rappresenta la rata; mantieni i campi `rate_num`/`rata_mensile` esistenti. Leggi prima il file per innestarti nel form senza rompere il flusso `ordine` esistente.

- [ ] **Step 3:** In `actions.ts` `createQuote`: estendi `CreateQuoteInput` con `prezziServizi: Record<string, number>` e `sconto: number`. Scrivi le righe `quote_items` con `prezzo_unitario` = prezzo per servizio (non più `0`), e calcola `importo_totale` da somma − sconto (aggiungi una riga sconto negativa o memorizza lo sconto separatamente in `quotes` se serve; per ora sottrai dal totale e aggiungi una `quote_items` "Sconto" con prezzo negativo).

- [ ] **Step 4: Typecheck + verifica browser** — crea un preventivo selezionando servizi: i prezzi si precompilano dal catalogo, lo sconto abbassa il totale, e la pagina pubblica `/preventivo/[token]` mostra le righe con i prezzi corretti (non più €0).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(catalogo): aggancio prezzi base al preventivo (righe + sconto + totale)"
```

---

## Self-Review del piano (già eseguita)

- **Copertura spec:** modello dati (Task 1), storage (Task 2), seed (Task 3), tipi (4-5), query pubblica/interna (6), actions+upload (7), componenti vetrina (8-9), pagine pubbliche (10), portale (11), editor interno (12-13), rifinitura (14), Fase B prezzi (B1). ✓
- **Prezzi sempre visibili:** `Prezzo` reso in card, dettaglio, admin. ✓
- **Portfolio referenza reale:** campi cliente/settore/risultato/link in tabella, componente e editor. ✓
- **Placeholder:** nessun TBD; codice completo in ogni step.
- **Consistenza tipi:** `ServizioContenuto`, `PortfolioInput`, `VetrinaServizio` usati coerentemente tra actions/queries/componenti.
- **Note di verifica lasciate esplicite** dove un componente UI condiviso (`Card`, `Input`) va controllato prima di assumere props.
