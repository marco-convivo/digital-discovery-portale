-- =============================================================================
-- 0013 · Token per la pagina di recupero brandizzata
-- Il link di recupero punta a una NOSTRA pagina (/recupero/<token>) con i campi
-- carta Stripe incorporati, non al Checkout generico. Il token è la capability.
-- =============================================================================

alter table public.payments
  add column recovery_token text unique;

create index idx_payments_recovery_token on public.payments (recovery_token);
