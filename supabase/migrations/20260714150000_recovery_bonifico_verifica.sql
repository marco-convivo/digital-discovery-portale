-- =============================================================================
-- 0014 · Stato "bonifico in verifica"
-- Il cliente, dalla sua dashboard, dichiara di aver pagato l'insoluto con
-- bonifico: la rata resta aperta ma segnalata allo staff, che la verifica e la
-- segna pagata.
-- =============================================================================

alter type public.recovery_stato add value if not exists 'bonifico_in_verifica';
