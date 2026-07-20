-- =============================================================================
-- 0019 · Bucket Storage `fatture` (PDF fatture caricati a mano dallo staff)
-- Fatturazione manuale (FatturaHello): lo staff carica il PDF, il cliente lo
-- scarica dal portale. Upload via service-role; path random non guessabile.
-- Stesso schema del bucket `contratti`.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('fatture', 'fatture', true)
on conflict (id) do nothing;

create policy "fatture public read" on storage.objects
  for select using (bucket_id = 'fatture');

create policy "fatture staff write" on storage.objects
  for all to authenticated
  using (bucket_id = 'fatture' and private.is_staff())
  with check (bucket_id = 'fatture' and private.is_staff());
