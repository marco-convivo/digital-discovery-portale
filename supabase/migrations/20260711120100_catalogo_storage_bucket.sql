-- =============================================================================
-- 0009 · Bucket Storage `catalogo` (pubblico in lettura)
-- Le immagini della vetrina (anteprime servizi + portfolio) sono contenuto
-- pubblico. Gli upload passano dalla server action con service-role (bypassa
-- la RLS storage); qui basta il bucket pubblico + lettura pubblica.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do nothing;

-- Lettura pubblica degli oggetti del bucket.
create policy "catalogo public read" on storage.objects
  for select using (bucket_id = 'catalogo');

-- Scrittura/gestione solo staff (gli upload via service-role la bypassano
-- comunque; questa copre eventuali upload con sessione).
create policy "catalogo staff write" on storage.objects
  for all to authenticated
  using (bucket_id = 'catalogo' and private.is_staff())
  with check (bucket_id = 'catalogo' and private.is_staff());
