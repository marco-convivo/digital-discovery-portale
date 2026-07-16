-- 0017 · Servizi aggiuntivi (addon) a testo libero sul preventivo/contratto.
alter table public.quotes
  add column addons jsonb not null default '[]'::jsonb;
