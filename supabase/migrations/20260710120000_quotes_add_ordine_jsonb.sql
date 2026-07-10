-- =============================================================================
-- 0007 · Selezione servizi strutturata sul preventivo/ordine.
-- L'editor scrive la selezione dal catalogo (src/lib/catalog.ts); serve per
-- auto-compilare le checkbox servizi del contratto DocuSeal.
-- Forma: { "<service_key>": { selected, channels[], tipo, durata, quantita } }
-- =============================================================================
alter table public.quotes add column ordine jsonb;
