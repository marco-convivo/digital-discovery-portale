-- 7b Nuovo preventivo: due campi minimi sul preventivo.
--
--  · motivo_sconto  — testo libero, motivazione dello sconto applicato; finisce
--    sul documento che il cliente firma. NULL = nessuna nota.
--  · data_prima_rata — data della prima rata scelta in fase di preventivo.
--    Onorata dai piani ad addebito MANUALE (SDD/Sella) e dall'onboarding
--    manuale; per le subscription Stripe la prima fattura resta immediata
--    (il ciclo lo decide Stripe), quindi lì è puramente indicativa. NULL = oggi.

alter table public.quotes
  add column if not exists motivo_sconto text,
  add column if not exists data_prima_rata date;
