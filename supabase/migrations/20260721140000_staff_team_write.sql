-- =============================================================================
-- 0021 · Team-write per lo staff
-- Prima le scritture su clienti/preventivi erano owner-only (owns_client =
-- admin OR owner_id = auth.uid()): un commerciale non titolare salvava "a vuoto"
-- (RLS scartava la riga, nessun errore → modifica non salvata). Il team è
-- piccolo e fidato: qualsiasi staff attivo può modificare clienti e preventivi.
-- La cancellazione clienti resta admin-only (clients_delete invariata).
-- =============================================================================

alter policy clients_update on public.clients
  using (private.is_staff() or auth_user_id = auth.uid())
  with check (private.is_staff() or auth_user_id = auth.uid());

alter policy quotes_write on public.quotes
  using (private.is_staff())
  with check (private.is_staff());

alter policy quote_items_write on public.quote_items
  using (private.is_staff())
  with check (private.is_staff());
