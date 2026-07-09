-- =============================================================================
-- 0002 · TABELLE (spec §3)
-- Regole non ovvie:
--  · staff in profiles (→ auth.users); il cliente-portale NON è in profiles:
--    è agganciato alla sua riga clients via clients.auth_user_id.
--  · un cliente ha MOLTI contratti, ognuno col proprio piano: per questo
--    payments e services hanno contract_id, non solo client_id.
-- =============================================================================

-- Utenti interni (staff). id = auth.users.id
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  role       public.profile_role not null default 'commerciale',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Anagrafica (prospect → cliente). La colonna stato è la macchina a stati.
create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  ragione_sociale text not null,
  p_iva          text,
  codice_fiscale text,
  codice_sdi     text,
  pec            text,
  indirizzo      text,
  referente      text,
  email          text,
  telefono       text,
  stato          public.client_stato not null default 'lead',
  owner_id       uuid references public.profiles (id) on delete set null,
  -- collega il login del cliente-portale alla sua anagrafica (valorizzata in onboarding)
  auth_user_id   uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Preventivi
create table public.quotes (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  numero         text,
  tipo           public.quote_tipo not null,
  importo_totale numeric(12, 2),
  rate_num       integer,
  rata_mensile   numeric(12, 2),
  valido_fino    date,
  stato          public.quote_stato not null default 'bozza',
  -- token per la pagina pubblica del preventivo (Fase 2)
  public_token   uuid not null default gen_random_uuid() unique,
  viewed_at      timestamptz,
  accepted_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table public.quote_items (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references public.quotes (id) on delete cascade,
  descrizione     text not null,
  quantita        numeric(12, 2) not null default 1,
  prezzo_unitario numeric(12, 2) not null default 0
);

-- Ponte DocuSeal
create table public.contracts (
  id                    uuid primary key default gen_random_uuid(),
  quote_id              uuid references public.quotes (id) on delete set null,
  client_id             uuid not null references public.clients (id) on delete cascade,
  docuseal_submission_id text,
  stato                 public.contract_stato not null default 'inviato',
  signed_at             timestamptz,
  signed_pdf_url        text,
  created_at            timestamptz not null default now()
);

-- Ponte Stripe (un setup per contratto)
create table public.payment_setups (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.clients (id) on delete cascade,
  contract_id            uuid references public.contracts (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  metodo                 public.payment_metodo,
  stato                  text,
  created_at             timestamptz not null default now()
);

-- Le rate = il piano pagamenti che il cliente vede. Puntano al CONTRATTO.
create table public.payments (
  id                       uuid primary key default gen_random_uuid(),
  client_id                uuid not null references public.clients (id) on delete cascade,
  contract_id              uuid references public.contracts (id) on delete cascade,
  subscription_id          text,
  numero_rata              integer,
  importo                  numeric(12, 2),
  scadenza                 date,
  stato                    public.payment_stato not null default 'scheduled',
  stripe_payment_intent_id text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now()
);

-- Fatture (manuali per ora: Marco collega il PDF FatturaHello in pdf_url)
create table public.invoices (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  numero     text,
  data       date,
  importo    numeric(12, 2),
  pdf_url    text,
  stato      text,
  created_at timestamptz not null default now()
);

-- Servizi attivi (per contratto)
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  contract_id      uuid references public.contracts (id) on delete cascade,
  nome             text not null,
  stato            text,
  data_attivazione date,
  created_at       timestamptz not null default now()
);

-- Audit / storico della board. Popolato da trigger (0003), non a mano nel codice.
create table public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.clients (id) on delete cascade,
  actor_id   uuid references auth.users (id) on delete set null,
  azione     text not null,
  da_stato   public.client_stato,
  a_stato    public.client_stato,
  created_at timestamptz not null default now()
);

-- Indici sulle foreign key / colonne filtrate più spesso
create index idx_clients_owner      on public.clients (owner_id);
create index idx_clients_stato      on public.clients (stato);
create index idx_clients_auth_user  on public.clients (auth_user_id);
create index idx_quotes_client      on public.quotes (client_id);
create index idx_quote_items_quote  on public.quote_items (quote_id);
create index idx_contracts_client   on public.contracts (client_id);
create index idx_payment_setups_client on public.payment_setups (client_id);
create index idx_payments_client    on public.payments (client_id);
create index idx_payments_contract  on public.payments (contract_id);
create index idx_invoices_client    on public.invoices (client_id);
create index idx_services_client    on public.services (client_id);
create index idx_activity_client    on public.activity_log (client_id);
