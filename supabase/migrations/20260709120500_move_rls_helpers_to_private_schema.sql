-- =============================================================================
-- 0006 · Hardening definitivo: helper RLS in schema `private` (non esposto da
-- PostgREST) -> niente più warning "SECURITY DEFINER eseguibile via RPC",
-- RLS invariata. Ricrea gli helper in private e riaggancia tutte le policy.
-- Dopo questa migration l'advisor security è pulito (resta solo il warning
-- "leaked password protection", non pertinente: auth solo via Google OAuth).
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active);
$$;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active);
$$;
create or replace function private.owns_client(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_admin() or exists (select 1 from public.clients c where c.id = cid and c.owner_id = auth.uid());
$$;
create or replace function private.is_client_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clients c where c.id = cid and c.auth_user_id = auth.uid());
$$;

revoke execute on function private.is_staff(), private.is_admin(),
  private.owns_client(uuid), private.is_client_member(uuid) from public;
grant execute on function private.is_staff(), private.is_admin(),
  private.owns_client(uuid), private.is_client_member(uuid) to authenticated;

drop policy profiles_select on public.profiles;
drop policy profiles_insert on public.profiles;
drop policy profiles_update on public.profiles;
drop policy profiles_delete on public.profiles;
drop policy clients_select on public.clients;
drop policy clients_insert on public.clients;
drop policy clients_update on public.clients;
drop policy clients_delete on public.clients;
drop policy quotes_select on public.quotes;
drop policy quotes_write on public.quotes;
drop policy contracts_select on public.contracts;
drop policy contracts_write on public.contracts;
drop policy payment_setups_select on public.payment_setups;
drop policy payment_setups_write on public.payment_setups;
drop policy payments_select on public.payments;
drop policy payments_write on public.payments;
drop policy invoices_select on public.invoices;
drop policy invoices_write on public.invoices;
drop policy services_select on public.services;
drop policy services_write on public.services;
drop policy quote_items_select on public.quote_items;
drop policy quote_items_write on public.quote_items;
drop policy activity_log_select on public.activity_log;

drop function if exists public.is_staff();
drop function if exists public.is_admin();
drop function if exists public.owns_client(uuid);
drop function if exists public.is_client_member(uuid);

create policy profiles_select on public.profiles for select using (private.is_staff() or id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (private.is_admin());
create policy profiles_update on public.profiles for update using (private.is_admin() or id = auth.uid()) with check (private.is_admin() or id = auth.uid());
create policy profiles_delete on public.profiles for delete using (private.is_admin());

create policy clients_select on public.clients for select using (private.is_staff() or auth_user_id = auth.uid());
create policy clients_insert on public.clients for insert with check (private.is_staff());
create policy clients_update on public.clients for update using (private.owns_client(id) or auth_user_id = auth.uid()) with check (private.owns_client(id) or auth_user_id = auth.uid());
create policy clients_delete on public.clients for delete using (private.is_admin());

create policy quotes_select on public.quotes for select using (private.is_staff() or private.is_client_member(client_id));
create policy quotes_write on public.quotes for all using (private.owns_client(client_id)) with check (private.owns_client(client_id));
create policy contracts_select on public.contracts for select using (private.is_staff() or private.is_client_member(client_id));
create policy contracts_write on public.contracts for all using (private.owns_client(client_id)) with check (private.owns_client(client_id));
create policy payment_setups_select on public.payment_setups for select using (private.is_staff() or private.is_client_member(client_id));
create policy payment_setups_write on public.payment_setups for all using (private.owns_client(client_id)) with check (private.owns_client(client_id));
create policy payments_select on public.payments for select using (private.is_staff() or private.is_client_member(client_id));
create policy payments_write on public.payments for all using (private.owns_client(client_id)) with check (private.owns_client(client_id));
create policy invoices_select on public.invoices for select using (private.is_staff() or private.is_client_member(client_id));
create policy invoices_write on public.invoices for all using (private.owns_client(client_id)) with check (private.owns_client(client_id));
create policy services_select on public.services for select using (private.is_staff() or private.is_client_member(client_id));
create policy services_write on public.services for all using (private.owns_client(client_id)) with check (private.owns_client(client_id));

create policy quote_items_select on public.quote_items for select using (
  private.is_staff() or private.is_client_member((select q.client_id from public.quotes q where q.id = quote_id))
);
create policy quote_items_write on public.quote_items for all
  using (private.owns_client((select q.client_id from public.quotes q where q.id = quote_id)))
  with check (private.owns_client((select q.client_id from public.quotes q where q.id = quote_id)));

create policy activity_log_select on public.activity_log for select using (private.is_staff());
