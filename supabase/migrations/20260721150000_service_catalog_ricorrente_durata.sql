-- =============================================================================
-- 0023 · service_catalog: tipo (ricorrente) + durata
-- Per usare i servizi del catalogo nel costruttore preventivo servono il tipo
-- (ricorrente/una tantum) e la durata di default. I servizi non-core diventano
-- "aggiungi al preventivo" (pre-compilano un addon).
-- =============================================================================

alter table public.service_catalog
  add column if not exists ricorrente  boolean not null default false,
  add column if not exists durata_mesi integer not null default 12;

-- Coerenza coi servizi core ricorrenti (usati come fisso nel builder).
update public.service_catalog set ricorrente = true where chiave in ('social', 'ads');
