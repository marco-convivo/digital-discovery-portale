-- =============================================================================
-- 0024 · Mandati SEPA (SDD B2B) — raccolti da /paga, gestiti su Banca Sella
-- Stripe non gestisce più il SEPA (blocchi Radel/rischio su account nuovo). Il
-- SEPA torna interamente su Banca Sella SBS: qui raccogliamo mandato + IBAN e
-- creiamo un piano rate manuale; gli addebiti li invia Marco.
-- =============================================================================

create table if not exists public.sepa_mandates (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  contract_id  uuid references public.contracts(id) on delete set null,
  quote_id     uuid references public.quotes(id) on delete set null,
  riferimento  text not null,          -- UMR (mandate reference) per Sella
  intestatario text not null,
  iban         text not null,
  bic          text,
  indirizzo    text,
  email        text,
  creditor_id  text not null,
  accettato_at timestamptz not null default now(),
  stato        text not null default 'registrato',
  created_at   timestamptz not null default now()
);

alter table public.sepa_mandates enable row level security;

create policy "sepa_mandates staff all" on public.sepa_mandates
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());
