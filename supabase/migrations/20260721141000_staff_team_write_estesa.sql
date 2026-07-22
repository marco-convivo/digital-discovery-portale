-- =============================================================================
-- 0022 · Team-write esteso (contratti, fatture, rate, servizi, payment_setups)
-- Stessa logica di 0021: erano owner-only (owns_client), quindi un commerciale
-- non titolare non riusciva a salvare (es. "Segna pagato" su una rata di un
-- cliente non suo). Ora scrive qualsiasi staff attivo. I flussi automatici
-- (webhook Stripe/DocuSeal, /paga anon, onboarding) usano il service role e
-- bypassano comunque la RLS.
-- =============================================================================

alter policy contracts_write on public.contracts
  using (private.is_staff()) with check (private.is_staff());

alter policy invoices_write on public.invoices
  using (private.is_staff()) with check (private.is_staff());

alter policy payment_setups_write on public.payment_setups
  using (private.is_staff()) with check (private.is_staff());

alter policy payments_write on public.payments
  using (private.is_staff()) with check (private.is_staff());

alter policy services_write on public.services
  using (private.is_staff()) with check (private.is_staff());
