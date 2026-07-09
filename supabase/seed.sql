-- Seed per sviluppo locale (`supabase db reset`). Clienti demo sulle 6 colonne
-- della board. owner_id = primo profilo admin se esiste, altrimenti null.
-- Idempotente: non reinserisce se "Panificio Aurora" è già presente.
insert into public.clients (ragione_sociale, referente, email, telefono, stato, owner_id)
select v.ragione_sociale, v.referente, v.email, v.telefono, v.stato::public.client_stato,
       (select id from public.profiles where role = 'admin' order by created_at limit 1)
from (values
  ('Panificio Aurora',         'Sara Neri',     'sara@panificioaurora.it', '+39 011 111111', 'lead'),
  ('Autofficina Verdi',        'Luca Verdi',    'info@autoverdi.it',       '+39 011 222222', 'preventivo_inviato'),
  ('Ristorante Da Luigi',      'Luigi Bianchi', 'luigi@daluigi.it',        '+39 011 333333', 'preventivo_visto'),
  ('Studio Dentistico Sorriso','Elena Fabbri',  'staff@sorriso.it',        '+39 011 444444', 'preventivo_accettato'),
  ('Immobiliare Sole',         'Marco Sole',    'info@immsole.it',         '+39 011 555555', 'contratto_inviato'),
  ('Palestra FitZone',         'Giada Rizzo',   'ciao@fitzone.it',         '+39 011 666666', 'contratto_firmato'),
  ('Boutique Mimosa',          'Chiara Galli',  'shop@mimosa.it',          '+39 011 777777', 'pagamento_setup'),
  ('Bar Centrale',             'Anna Costa',    'anna@barcentrale.it',     '+39 011 888888', 'pagamento_attivo'),
  ('Hotel Belvedere',          'Paolo Greco',   'info@belvedere.it',       '+39 011 999999', 'cliente_attivo'),
  ('Ferramenta Rossi',         'Gino Rossi',    'gino@ferramentarossi.it', '+39 011 121212', 'rifiutato'),
  ('Cartoleria Punto',         'Rita Moro',     'rita@cartoleriapunto.it', '+39 011 131313', 'cessato')
) as v(ragione_sociale, referente, email, telefono, stato)
where not exists (select 1 from public.clients where ragione_sociale = 'Panificio Aurora');
