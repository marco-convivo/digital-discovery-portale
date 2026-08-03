-- 6a Catalogo: separa i due concetti oggi confusi nel flag `attivo`.
--   · in_vetrina — il servizio è visibile ai clienti nella vetrina/portale.
--   · vendibile  — il servizio può essere inserito in un preventivo.
-- `attivo` resta come colonna legacy (allineata a in_vetrina) finché tutto il
-- codice non usa i nuovi flag.

alter table public.service_catalog
  add column if not exists in_vetrina boolean not null default true,
  add column if not exists vendibile boolean not null default true;

-- Backfill dal vecchio flag: ciò che era attivo era mostrato e vendibile.
update public.service_catalog set in_vetrina = attivo, vendibile = attivo;
