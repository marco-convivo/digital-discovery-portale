-- =============================================================================
-- 0011 · Gestione utenti staff (auto-provisioning) + catalogo admin-only
-- Modello:
--   · admin        → tutto, incluso creare/eliminare servizi a catalogo e
--                    gestire lo staff (attiva/disattiva, cambio ruolo).
--   · commerciale  → pipeline vendite + preventivi. Catalogo in sola lettura.
-- Onboarding: chi entra con Google @convivostudio.it ottiene un profilo
-- 'commerciale' INATTIVO ("in attesa"); l'admin lo abilita da Gestione utenti.
-- =============================================================================

-- ---- Auto-provisioning staff al primo login ---------------------------------
-- Trigger su auth.users: solo le mail del dominio interno creano un profilo
-- (inattivo). Le mail non del dominio (clienti-portale via magic link, ecc.)
-- sono ignorate: nessun profilo, restano fuori dall'area staff.
create or replace function public.handle_new_staff_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email ilike '%@convivostudio.it' then
    insert into public.profiles (id, email, full_name, role, active)
    values (
      new.id,
      new.email,
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      ),
      'commerciale',
      false
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_staff_user on auth.users;
create trigger trg_handle_new_staff_user
  after insert on auth.users
  for each row execute function public.handle_new_staff_user();

-- ---- Catalogo: scrittura riservata all'admin --------------------------------
-- (la lettura resta com'era: staff + servizi attivi in vetrina pubblica.)
drop policy if exists service_catalog_write on public.service_catalog;
create policy service_catalog_write on public.service_catalog
  for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists portfolio_write on public.portfolio_items;
create policy portfolio_write on public.portfolio_items
  for all using (private.is_admin()) with check (private.is_admin());

-- Storage bucket `catalogo`: scrittura diretta solo admin (gli upload passano
-- comunque via service-role, che bypassa la RLS; questa è difesa in profondità).
drop policy if exists "catalogo staff write" on storage.objects;
create policy "catalogo admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'catalogo' and private.is_admin())
  with check (bucket_id = 'catalogo' and private.is_admin());
