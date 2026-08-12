-- =============================================================================
-- 0027 · MACCHINA A STATI v2 (riprogettazione, fase A)
--
-- clients.stato passa da 11 a 6 valori: lo stato del cliente è SOLO commerciale
-- (lead → in_trattativa → in_attivazione → attivo | perso | cessato).
-- Il dettaglio operativo vive sulle entità figlie (quotes.stato, contracts.stato,
-- payments.stato). Inoltre:
--   · activity_log.actor_tipo: chi ha causato la transizione (staff/cliente/webhook/job)
--   · public.transizione_cliente(): UNICA porta di scrittura di clients.stato
--   · quote_events: timeline eventi per preventivo (viste, accettazioni, anteprime)
--   · payment_setups.stato: da text libero a enum
--   · contract_stato: nuovo valore 'completato' (fine piano ≠ cessazione)
-- =============================================================================

-- ---- 1. Nuovo enum client_stato con backfill --------------------------------

create type public.client_stato_v2 as enum (
  'lead',
  'in_trattativa',
  'in_attivazione',
  'attivo',
  'perso',
  'cessato'
);

create or replace function public._map_stato_v2(s text)
returns public.client_stato_v2 language sql immutable as $$
  select case s
    when 'lead'                 then 'lead'
    when 'preventivo_inviato'   then 'in_trattativa'
    when 'preventivo_visto'     then 'in_trattativa'
    when 'preventivo_accettato' then 'in_trattativa'
    when 'contratto_inviato'    then 'in_trattativa'
    when 'contratto_firmato'    then 'in_attivazione'
    when 'pagamento_setup'      then 'in_attivazione'
    when 'pagamento_attivo'     then 'attivo'
    when 'cliente_attivo'       then 'attivo'
    when 'rifiutato'            then 'perso'
    when 'cessato'              then 'cessato'
  end::public.client_stato_v2
$$;

alter table public.clients alter column stato drop default;
alter table public.clients
  alter column stato type public.client_stato_v2
  using public._map_stato_v2(stato::text);
alter table public.clients alter column stato set default 'lead';

alter table public.activity_log
  alter column da_stato type public.client_stato_v2
  using public._map_stato_v2(da_stato::text);
alter table public.activity_log
  alter column a_stato type public.client_stato_v2
  using public._map_stato_v2(a_stato::text);

drop type public.client_stato;
alter type public.client_stato_v2 rename to client_stato;
drop function public._map_stato_v2(text);

-- ---- 2. Actor esplicito sulle transizioni ------------------------------------
-- Prima le transizioni via service-role avevano actor_id NULL e l'audit non
-- distingueva un webhook da un'azione anonima.

alter table public.activity_log add column if not exists actor_tipo text;

create or replace function public.log_client_stato()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor text := nullif(current_setting('app.actor_tipo', true), '');
begin
  if (tg_op = 'INSERT') then
    insert into public.activity_log (client_id, actor_id, azione, da_stato, a_stato, actor_tipo)
    values (new.id, auth.uid(), 'creato', null, new.stato, v_actor);
  elsif (tg_op = 'UPDATE' and new.stato is distinct from old.stato) then
    insert into public.activity_log (client_id, actor_id, azione, da_stato, a_stato, actor_tipo)
    values (new.id, auth.uid(), 'cambio_stato', old.stato, new.stato, v_actor);
  end if;
  return new;
end;
$$;

-- ---- 3. transizione_cliente(): l'unica porta di scrittura --------------------
-- Applica la matrice delle transizioni valide; una transizione non prevista è
-- un no-op esplicito (changed=false), mai un errore che rompe un webhook.
-- Chiamabile da staff (RLS a monte) e dal service role (webhook/job).

create or replace function public.transizione_cliente(
  p_client uuid,
  p_evento text,
  p_actor  text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_da public.client_stato;
  v_a  public.client_stato;
begin
  if auth.role() <> 'service_role' and not private.is_staff() then
    raise exception 'transizione_cliente: non autorizzato';
  end if;

  select stato into v_da from public.clients where id = p_client for update;
  if v_da is null then
    raise exception 'transizione_cliente: cliente % non trovato', p_client;
  end if;

  v_a := case p_evento
    when 'preventivo_inviato' then
      case when v_da in ('lead', 'in_trattativa', 'perso') then 'in_trattativa'::public.client_stato end
    when 'preventivo_chiuso' then
      case when v_da = 'in_trattativa' then 'perso'::public.client_stato end
    when 'contratto_firmato' then
      case when v_da in ('lead', 'in_trattativa', 'in_attivazione') then 'in_attivazione'::public.client_stato end
    when 'primo_incasso' then
      case when v_da in ('lead', 'in_trattativa', 'in_attivazione') then 'attivo'::public.client_stato end
    when 'perso' then
      case when v_da in ('lead', 'in_trattativa', 'in_attivazione') then 'perso'::public.client_stato end
    when 'riaperto' then
      case when v_da = 'perso' then 'in_trattativa'::public.client_stato
           when v_da = 'cessato' then 'attivo'::public.client_stato end
    when 'cessato' then
      case when v_da in ('attivo', 'in_attivazione') then 'cessato'::public.client_stato end
  end;

  if v_a is null or v_a = v_da then
    return jsonb_build_object('da', v_da, 'a', v_da, 'changed', false);
  end if;

  -- actor per il trigger di log (GUC locale alla transazione)
  perform set_config('app.actor_tipo', coalesce(p_actor, ''), true);
  update public.clients set stato = v_a where id = p_client;
  perform set_config('app.actor_tipo', '', true);

  return jsonb_build_object('da', v_da, 'a', v_a, 'changed', true);
end;
$$;

revoke all on function public.transizione_cliente(uuid, text, text) from public;
grant execute on function public.transizione_cliente(uuid, text, text)
  to authenticated, service_role;

-- ---- 4. quote_events: timeline per preventivo --------------------------------
-- inviato · vista_cliente · accettato · rifiutato · scaduto · anteprima_staff

create table public.quote_events (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.quotes (id) on delete cascade,
  evento     text not null,
  actor_tipo text,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index idx_quote_events_quote on public.quote_events (quote_id);

alter table public.quote_events enable row level security;
-- Lo staff legge; le scritture arrivano solo dal service role (route/action server).
create policy quote_events_select on public.quote_events for select
  using (private.is_staff());

-- ---- 5. payment_setups.stato: enum al posto del text libero ------------------

create type public.payment_setup_stato as enum (
  'pending',
  'attivo',
  'manuale',
  'annullato'
);

alter table public.payment_setups
  alter column stato type public.payment_setup_stato
  using (
    case
      when stato is null       then null
      when stato = 'active'    then 'attivo'
      when stato = 'attivo'    then 'attivo'
      when stato = 'manuale'   then 'manuale'
      when stato = 'annullato' then 'annullato'
      else 'pending'
    end
  )::public.payment_setup_stato;

-- ---- 6. contract_stato: fine piano ≠ cessazione ------------------------------
-- 'completato' = tutte le rate incassate (il cliente resta attivo).

alter type public.contract_stato add value if not exists 'completato';
