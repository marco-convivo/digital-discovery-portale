-- =============================================================================
-- 0015 · Bucket Storage `contratti` (per i PDF firmati caricati a mano)
-- Usato nell'onboarding manuale dei clienti esistenti (contratti già siglati
-- fuori piattaforma). Upload via service-role; path random non guessabile.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('contratti', 'contratti', true)
on conflict (id) do nothing;

create policy "contratti public read" on storage.objects
  for select using (bucket_id = 'contratti');

create policy "contratti staff write" on storage.objects
  for all to authenticated
  using (bucket_id = 'contratti' and private.is_staff())
  with check (bucket_id = 'contratti' and private.is_staff());
