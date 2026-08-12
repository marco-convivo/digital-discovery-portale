-- =============================================================================
-- 0028 · Hardening grant funzioni macchina a stati (advisor post-0027)
--
-- Le default privileges di Supabase concedono EXECUTE ad anon/authenticated
-- sulle funzioni nuove: la revoke "from public" della 0027 non rimuoveva il
-- grant esplicito ad anon. Il guard interno di transizione_cliente è comunque
-- fail-closed (anon → 'non autorizzato'), ma l'ACL deve dire la stessa cosa.
-- =============================================================================

-- transizione_cliente: mai chiamabile da anonimi.
revoke execute on function public.transizione_cliente(uuid, text, text) from anon;

-- Le funzioni trigger non sono endpoint RPC: nessuno deve poterle chiamare
-- direttamente (i trigger scattano comunque, indipendentemente dai grant).
revoke all on function public.guard_client_stato() from public, anon, authenticated;
revoke all on function public.log_client_stato() from public, anon, authenticated;
