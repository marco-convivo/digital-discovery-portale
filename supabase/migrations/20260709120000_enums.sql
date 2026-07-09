-- =============================================================================
-- 0001 · ENUM — la macchina a stati (spec §4) + tipi di dominio
-- I 4 enum di stato sono il contratto della pipeline: NON riordinare/rinominare
-- i valori a cuor leggero (il codice e i webhook ci si appoggiano).
-- =============================================================================

-- Stati della pratica/cliente (percorso felice + rami)
create type public.client_stato as enum (
  'lead',
  'preventivo_inviato',
  'preventivo_visto',
  'preventivo_accettato',
  'contratto_inviato',
  'contratto_firmato',
  'pagamento_setup',
  'pagamento_attivo',
  'cliente_attivo',
  'rifiutato',
  'cessato'
);

create type public.quote_stato as enum (
  'bozza',
  'inviato',
  'visto',
  'accettato',
  'rifiutato',
  'scaduto'
);

create type public.contract_stato as enum (
  'inviato',
  'firmato',
  'annullato'
);

create type public.payment_stato as enum (
  'scheduled',
  'pending',
  'paid',
  'failed'
);

-- Tipi di dominio (non-stato) usati dalle tabelle
create type public.profile_role as enum ('admin', 'commerciale');
create type public.quote_tipo   as enum ('ricorrente', 'una_tantum', 'acconto');
create type public.payment_metodo as enum ('sdd', 'carta', 'bonifico');
