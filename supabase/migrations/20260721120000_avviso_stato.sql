-- =============================================================================
-- 0020 · Stato avvisi Home ("Da gestire")
-- Gli avvisi del box "Da gestire" sono calcolati dai dati: non c'è un oggetto
-- notifica da chiudere. Questa tabella registra le chiusure manuali dello staff:
--   · ignorato  → non ricompare più
--   · rimandato → nascosto fino a snooze_until (poi ricompare)
-- `chiave` = identificatore stabile dell'avviso (es. qt:<quoteId>,
-- sca:<clientId>:<servizio>:<scadenzaIso>). Upsert su chiave.
-- =============================================================================

create table if not exists public.avviso_stato (
  id           uuid primary key default gen_random_uuid(),
  chiave       text not null unique,
  stato        text not null check (stato in ('ignorato', 'rimandato')),
  snooze_until timestamptz,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.avviso_stato enable row level security;

-- Solo staff: lettura e scrittura (gli avvisi sono interni alla pipeline).
create policy "avviso_stato staff all" on public.avviso_stato
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());
