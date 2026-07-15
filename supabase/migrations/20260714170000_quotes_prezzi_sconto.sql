-- =============================================================================
-- 0016 · Preventivi modificabili
-- Salviamo lo stato del builder (prezzi mensili per servizio + sconto) sul
-- preventivo, così è ricostruibile e MODIFICABILE finché non è accettato.
-- (I quote_items restano per la visualizzazione pubblica.)
-- =============================================================================

alter table public.quotes
  add column prezzi jsonb,
  add column sconto numeric(12, 2) not null default 0;
