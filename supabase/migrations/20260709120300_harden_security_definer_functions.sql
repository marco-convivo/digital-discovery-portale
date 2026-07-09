-- =============================================================================
-- 0004 · Hardening — togli l'esposizione RPC delle funzioni security-definer.
-- Gli advisor Supabase segnalano che una funzione SECURITY DEFINER in schema
-- public è chiamabile via /rest/v1/rpc da anon/authenticated. Non ci serve:
-- queste funzioni le usa solo la RLS. Verificato che revocando EXECUTE le policy
-- continuano a chiamarle (la funzione gira come owner). Risultato: 0 lint.
-- =============================================================================
revoke execute on function public.is_staff() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.owns_client(uuid) from public, anon, authenticated;
revoke execute on function public.is_client_member(uuid) from public, anon, authenticated;
revoke execute on function public.log_client_stato() from public, anon, authenticated;
