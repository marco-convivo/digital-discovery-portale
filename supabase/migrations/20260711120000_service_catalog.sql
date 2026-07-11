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
