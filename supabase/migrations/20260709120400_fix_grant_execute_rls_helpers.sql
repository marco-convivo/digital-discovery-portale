-- =============================================================================
-- 0005 · FIX del 0004 — le funzioni chiamate nelle policy RLS DEVONO essere
-- eseguibili dal ruolo `authenticated`, altrimenti la valutazione della policy
-- fallisce con "permission denied for function" e ogni SELECT/UPDATE va in
-- errore (sintomo: l'app vede l'utente come non-staff).
--
-- Il 0004 le aveva revocate a tutti (per togliere l'esposizione RPC): giusto per
-- anon (nessun accesso anon in FASE 1) e per il trigger log_client_stato (non
-- richiede EXECUTE al chiamante), SBAGLIATO per i 4 helper usati nelle policy.
--
-- Nota advisor: questo lascia 4 WARN "authenticated può eseguire una SECURITY
-- DEFINER in public". Rischio basso (rivelano solo lo stato del chiamante).
-- Hardening definitivo previsto: spostare gli helper in uno schema `private`
-- non esposto da PostgREST.
-- =============================================================================
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_client(uuid) to authenticated;
grant execute on function public.is_client_member(uuid) to authenticated;
