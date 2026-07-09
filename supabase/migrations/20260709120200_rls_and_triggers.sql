-- =============================================================================
-- 0003 · RLS + trigger di storico
-- Modello di accesso (deciso):
--  · admin        → tutto.
--  · commerciale  → LEGGE tutti i clienti (team-read), MODIFICA solo i propri
--                   (clients.owner_id = auth.uid()); idem per le righe figlie,
--                   ancorate al proprietario del cliente-padre.
--  · cliente      → solo le proprie righe (clients.auth_user_id = auth.uid());
--                   MAI le tabelle interne di pipeline. In pratica il cliente
--                   scrive pochissimo: quasi tutte le scritture arrivano dai
--                   webhook server-side con la service role (che bypassa la RLS).
-- =============================================================================

-- ---- Helper security-definer (leggono il ruolo da profiles) -----------------
-- security definer + search_path fisso: girano come owner, saltano la RLS di
-- profiles (evita la ricorsione "policy che interroga profiles").

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.active
  );
$$;

-- Ambito di SCRITTURA staff su un cliente: admin ovunque, commerciale sui propri.
create or replace function public.owns_client(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.clients c
    where c.id = cid and c.owner_id = auth.uid()
  );
$$;

-- Ambito cliente-portale: la riga clients appartiene all'utente esterno loggato.
create or replace function public.is_client_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clients c
    where c.id = cid and c.auth_user_id = auth.uid()
  );
$$;

-- ---- Abilita RLS ovunque ----------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.clients        enable row level security;
alter table public.quotes         enable row level security;
alter table public.quote_items    enable row level security;
alter table public.contracts      enable row level security;
alter table public.payment_setups enable row level security;
alter table public.payments       enable row level security;
alter table public.invoices       enable row level security;
alter table public.services       enable row level security;
alter table public.activity_log   enable row level security;

-- ---- profiles ---------------------------------------------------------------
create policy profiles_select on public.profiles for select
  using (public.is_staff() or id = auth.uid());
create policy profiles_insert on public.profiles for insert
  with check (public.is_admin());
create policy profiles_update on public.profiles for update
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());
create policy profiles_delete on public.profiles for delete
  using (public.is_admin());

-- ---- clients ----------------------------------------------------------------
-- SELECT: staff vede tutti (team-read); cliente vede solo la propria riga.
create policy clients_select on public.clients for select
  using (public.is_staff() or auth_user_id = auth.uid());
-- INSERT: solo staff (owner_id = auth.uid() va impostato lato app / default).
create policy clients_insert on public.clients for insert
  with check (public.is_staff());
-- UPDATE: admin ovunque, commerciale sui propri, cliente sulla propria riga.
create policy clients_update on public.clients for update
  using (public.owns_client(id) or auth_user_id = auth.uid())
  with check (public.owns_client(id) or auth_user_id = auth.uid());
-- DELETE: solo admin.
create policy clients_delete on public.clients for delete
  using (public.is_admin());

-- ---- Tabelle figlie ancorate a client_id ------------------------------------
-- Pattern identico per quotes, contracts, payment_setups, payments, invoices,
-- services: staff legge tutto o cliente-membro; scrittura solo staff-proprietario.

create policy quotes_select on public.quotes for select
  using (public.is_staff() or public.is_client_member(client_id));
create policy quotes_write on public.quotes for all
  using (public.owns_client(client_id))
  with check (public.owns_client(client_id));

create policy contracts_select on public.contracts for select
  using (public.is_staff() or public.is_client_member(client_id));
create policy contracts_write on public.contracts for all
  using (public.owns_client(client_id))
  with check (public.owns_client(client_id));

create policy payment_setups_select on public.payment_setups for select
  using (public.is_staff() or public.is_client_member(client_id));
create policy payment_setups_write on public.payment_setups for all
  using (public.owns_client(client_id))
  with check (public.owns_client(client_id));

create policy payments_select on public.payments for select
  using (public.is_staff() or public.is_client_member(client_id));
create policy payments_write on public.payments for all
  using (public.owns_client(client_id))
  with check (public.owns_client(client_id));

create policy invoices_select on public.invoices for select
  using (public.is_staff() or public.is_client_member(client_id));
create policy invoices_write on public.invoices for all
  using (public.owns_client(client_id))
  with check (public.owns_client(client_id));

create policy services_select on public.services for select
  using (public.is_staff() or public.is_client_member(client_id));
create policy services_write on public.services for all
  using (public.owns_client(client_id))
  with check (public.owns_client(client_id));

-- ---- quote_items (ancorate al cliente tramite il preventivo-padre) ----------
create policy quote_items_select on public.quote_items for select
  using (
    public.is_staff()
    or public.is_client_member((select q.client_id from public.quotes q where q.id = quote_id))
  );
create policy quote_items_write on public.quote_items for all
  using (public.owns_client((select q.client_id from public.quotes q where q.id = quote_id)))
  with check (public.owns_client((select q.client_id from public.quotes q where q.id = quote_id)));

-- ---- activity_log (audit interno: solo staff legge; scrive il trigger) ------
create policy activity_log_select on public.activity_log for select
  using (public.is_staff());
-- Nessuna policy di insert/update/delete per gli utenti: le righe le scrive il
-- trigger (security definer, bypassa la RLS). Immutabile dal lato applicativo.

-- ---- Trigger: storia della macchina a stati ---------------------------------
-- A ogni INSERT/cambio di clients.stato, scrive una riga in activity_log.
-- security definer: può inserire pur senza policy di insert per l'utente.
create or replace function public.log_client_stato()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.activity_log (client_id, actor_id, azione, da_stato, a_stato)
    values (new.id, auth.uid(), 'creato', null, new.stato);
  elsif (tg_op = 'UPDATE' and new.stato is distinct from old.stato) then
    insert into public.activity_log (client_id, actor_id, azione, da_stato, a_stato)
    values (new.id, auth.uid(), 'cambio_stato', old.stato, new.stato);
  end if;
  return new;
end;
$$;

create trigger trg_log_client_insert
  after insert on public.clients
  for each row execute function public.log_client_stato();

create trigger trg_log_client_stato
  after update of stato on public.clients
  for each row execute function public.log_client_stato();
