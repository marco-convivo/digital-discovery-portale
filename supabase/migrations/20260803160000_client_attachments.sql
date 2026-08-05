-- =============================================================================
-- 0026 · Allegati interni della scheda cliente (Visura + liberi) — solo staff.
-- Documenti riservati al team (non visibili al cliente). Bucket PRIVATO: i file
-- si aprono via signed URL generato dal service-role. PDF, path non guessabile.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('allegati', 'allegati', false)
on conflict (id) do nothing;

create policy "allegati staff read" on storage.objects
  for select to authenticated
  using (bucket_id = 'allegati' and private.is_staff());

create policy "allegati staff write" on storage.objects
  for all to authenticated
  using (bucket_id = 'allegati' and private.is_staff())
  with check (bucket_id = 'allegati' and private.is_staff());

create table if not exists public.client_attachments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  nome text not null,
  tipo text not null default 'libero' check (tipo in ('visura', 'libero')),
  storage_path text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists client_attachments_client_id_idx
  on public.client_attachments (client_id);

alter table public.client_attachments enable row level security;

-- Solo staff: nessun accesso lato cliente (documenti interni).
create policy "attachments staff read" on public.client_attachments
  for select using (private.is_staff());
create policy "attachments staff insert" on public.client_attachments
  for insert with check (private.is_staff());
create policy "attachments staff update" on public.client_attachments
  for update using (private.is_staff()) with check (private.is_staff());
create policy "attachments staff delete" on public.client_attachments
  for delete using (private.is_staff());
