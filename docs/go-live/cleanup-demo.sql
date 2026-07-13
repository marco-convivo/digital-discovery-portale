-- =============================================================================
-- Pulizia dati DEMO prima del go-live (Fase 2 del runbook).
-- Mantiene: schema, catalogo (service_catalog + portfolio_items), profili staff.
-- Rimuove: tutti i dati transazionali di test (clienti e tutto ciò che ne dipende).
--
-- ⚠️ ESEGUIRE SOLO al cut-over, quando i test sono finiti. Irreversibile.
--    Consigliato fare prima un backup/snapshot (Supabase → Database → Backups).
-- =============================================================================

-- `clients` è la radice: tutte le tabelle transazionali hanno client_id con
-- ON DELETE CASCADE, quindi TRUNCATE ... CASCADE ripulisce a catena
-- (quotes, quote_items, contracts, payments, payment_setups, invoices, services,
--  activity_log). Catalogo e profiles NON referenziano clients → restano intatti.

truncate table public.clients cascade;

-- Verifica (devono essere tutti 0 tranne service_catalog/portfolio_items/profiles):
-- select
--   (select count(*) from public.clients)         as clients,
--   (select count(*) from public.quotes)           as quotes,
--   (select count(*) from public.contracts)        as contracts,
--   (select count(*) from public.payments)         as payments,
--   (select count(*) from public.activity_log)     as activity_log,
--   (select count(*) from public.service_catalog)  as catalogo,   -- resta 9
--   (select count(*) from public.profiles)         as staff;      -- resta invariato

-- Nota: eventuali utenti di test in auth.users (es. l'email cliente usata per il
-- portale) NON vengono toccati da qui; se vuoi rimuoverli, fallo da
-- Supabase → Authentication → Users.
