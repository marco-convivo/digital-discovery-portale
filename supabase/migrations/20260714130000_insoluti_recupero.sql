-- =============================================================================
-- 0012 · Insoluti & recupero credito (SEPA) — Fase 1
-- Arricchisce `payments` per agganciare l'invoice Stripe alla rata, salvare il
-- motivo dell'insoluto e tracciare il recupero. Aggiunge `app_settings`
-- (maggiorazione insoluto, dati bonifico, descrittore) editabile dall'admin.
-- =============================================================================

-- Sotto-stato del recupero credito su una rata failed.
create type public.recovery_stato as enum
  ('nessuno', 'da_recuperare', 'link_inviato', 'recuperato', 'nuovo_mandato', 'annullato');

alter table public.payments
  add column stripe_invoice_id    text,
  add column failure_code         text,
  add column failure_reason       text,
  add column failed_at            timestamptz,
  add column attempts             integer not null default 0,
  add column recovery_stato       public.recovery_stato not null default 'nessuno',
  add column recovery_checkout_id text,
  add column recovery_url         text,
  add column maggiorazione        numeric(12, 2);

create index idx_payments_invoice on public.payments (stripe_invoice_id);
create index idx_payments_recovery on public.payments (recovery_stato)
  where recovery_stato <> 'nessuno';

-- Impostazioni applicative (riga singola forzata da id boolean = true).
-- Lettura staff, scrittura admin.
create table public.app_settings (
  id                     boolean primary key default true,
  maggiorazione_insoluto numeric(12, 2) not null default 5.00,
  iban_bonifico          text,
  causale_bonifico       text default 'Saldo insoluto pratica Digital Discovery',
  statement_descriptor   text default 'DIGITAL DISCOVERY',
  updated_at             timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);
insert into public.app_settings (id) values (true) on conflict do nothing;

alter table public.app_settings enable row level security;
create policy app_settings_select on public.app_settings
  for select using (private.is_staff());
create policy app_settings_write on public.app_settings
  for all using (private.is_admin()) with check (private.is_admin());
