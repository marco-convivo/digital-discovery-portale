-- =============================================================================
-- 0010 · Seed catalogo vetrina (contenuti/prezzi INVENTATI plausibili).
-- Marco rifinisce testi/prezzi e carica le immagini dall'editor interno.
-- Le `chiave` combaciano con CatalogService.key in src/lib/catalog.ts.
-- =============================================================================

insert into public.service_catalog
  (chiave, titolo, sottotitolo, descrizione, attivita_incluse, condizioni, attivita_escluse, prezzo_base, ordine)
values
  ('social', 'Gestione Social', 'La tua presenza quotidiana su Facebook e Instagram',
   'Curiamo la tua presenza sui social con un piano editoriale mensile, contenuti originali e interazione con la community, così parli ai tuoi clienti ogni giorno senza pensarci.',
   array['Piano editoriale mensile','Creazione grafiche e copy dei post','Pubblicazione e programmazione','Risposta a commenti e messaggi','Report mensile dei risultati'],
   array['Numero di uscite concordato in fase di attivazione','Accesso agli account social o creazione ex-novo','Materiale fotografico fornito dal cliente o shooting a parte'],
   array['Advertising a pagamento (servizio Pubblicità)','Shooting fotografico professionale','Gestione recensioni Google'],
   349, 1),

  ('google', 'Google Presence', 'Farti trovare su Google e Maps',
   'Ottimizziamo la tua scheda Google Business Profile per farti trovare da chi cerca la tua attività su Google e Maps, con informazioni sempre aggiornate e foto curate.',
   array['Creazione o rivendicazione della scheda','Ottimizzazione informazioni e categorie','Caricamento foto e orari','Impostazione messaggi e recensioni'],
   array['Accesso o creazione account Google Business','Verifica della scheda a cura di Google (tempi variabili)'],
   array['Gestione continuativa delle recensioni','Campagne Google Ads a pagamento'],
   290, 2),

  ('sito', 'Sito Web', 'Il tuo sito, veloce e fatto per convertire',
   'Progettiamo e sviluppiamo il tuo sito web: design su misura, ottimizzato per mobile e per la velocità, pensato per trasformare le visite in contatti.',
   array['Design su misura del brand','Sviluppo responsive (mobile-first)','Ottimizzazione SEO di base','Modulo contatti e integrazioni','Messa online e formazione all''uso'],
   array['Contenuti (testi, immagini) forniti dal cliente o preventivati a parte','Dominio e hosting a carico del cliente o inclusi su richiesta'],
   array['Gestione contenuti continuativa','E-commerce (servizio dedicato)','Copywriting professionale'],
   1200, 3),

  ('ecommerce', 'E-commerce', 'Vendi online, davvero',
   'Costruiamo il tuo negozio online: catalogo prodotti, pagamenti sicuri e spedizioni, con un pannello semplice per gestire ordini e magazzino in autonomia.',
   array['Design e sviluppo del negozio','Configurazione catalogo e categorie','Pagamenti e spedizioni','Formazione alla gestione ordini','Ottimizzazione SEO di base'],
   array['Schede prodotto e foto fornite dal cliente','Account per pagamenti e corrieri a carico del cliente'],
   array['Caricamento massivo del catalogo (a preventivo)','Gestione ordini continuativa','Campagne pubblicitarie'],
   2900, 4),

  ('ads', 'Pubblicità', 'Campagne che portano contatti misurabili',
   'Pianifichiamo e gestiamo le tue campagne pubblicitarie su Meta e Google: targeting, creatività e ottimizzazione continua per un ritorno misurabile sull''investimento.',
   array['Strategia e definizione del target','Creazione delle inserzioni','Gestione e ottimizzazione continua','Report mensile con metriche chiave'],
   array['Budget pubblicitario NON incluso nel canone di gestione','Durata concordata in fase di attivazione','Accesso agli account pubblicitari'],
   array['Il budget speso in advertising (fatturato a parte dalle piattaforme)','Produzione video professionale'],
   150, 5),

  ('brand', 'Brand Identity', 'Un''identità visiva che ti fa riconoscere',
   'Diamo forma alla tua identità: logo, palette, tipografia e linee guida, per un''immagine coerente e riconoscibile su ogni canale.',
   array['Logo e varianti','Palette colori e tipografia','Mini brand guidelines','File pronti per stampa e web'],
   array['Numero di proposte e revisioni concordato','Eventuali font a licenza a carico del cliente'],
   array['Naming e payoff','Materiali stampati (biglietti, brochure) a preventivo','Sito web'],
   1500, 6),

  ('shooting', 'Shooting Foto', 'Immagini professionali della tua attività',
   'Servizio fotografico professionale per raccontare la tua attività: ambienti, prodotti e persone, con scatti pronti all''uso per social, sito e advertising.',
   array['Mezza giornata di shooting','Selezione e post-produzione degli scatti','Consegna in alta e bassa risoluzione','Diritti d''uso per i tuoi canali'],
   array['Location e disponibilità a cura del cliente','Numero di scatti finali concordato'],
   array['Video','Noleggio location o modelli','Servizi in più giornate (a preventivo)'],
   450, 7),

  ('video', 'Video Reel', 'Video brevi che catturano l''attenzione',
   'Produciamo reel e video brevi verticali, pensati per social e advertising: ritmo, montaggio e sottotitoli per fermare lo scroll.',
   array['Riprese in loco','Montaggio con musica e sottotitoli','Formati verticali per social','Revisione inclusa'],
   array['Numero di reel concordato in fase di attivazione','Disponibilità della location e dei soggetti'],
   array['Shooting fotografico','Animazioni 3D o motion grafico avanzato','Speakeraggio professionale'],
   250, 8),

  ('whatsapp', 'WhatsApp Business', 'Parla coi clienti dove sono già',
   'Configuriamo WhatsApp Business per la tua attività: profilo, risposte rapide, messaggi automatici e catalogo, per gestire richieste e ordini in un canale diretto.',
   array['Setup profilo aziendale','Messaggi di benvenuto e risposte rapide','Etichette e organizzazione chat','Mini catalogo prodotti'],
   array['Numero dedicato a carico del cliente','Verifica dell''account a cura di Meta'],
   array['Gestione continuativa delle conversazioni','Integrazioni CRM avanzate','Campagne di messaggistica massiva'],
   190, 9);

-- Portfolio (2 lavori per servizio; dati inventati plausibili, immagini a null).
insert into public.portfolio_items (service_id, titolo, cliente, settore, descrizione, risultato, link_url, ordine)
select s.id, v.titolo, v.cliente, v.settore, v.descrizione, v.risultato, v.link_url, v.ordine
from public.service_catalog s
join (values
  ('social','Piano editoriale mensile','Boutique Mimosa','Moda','Contenuti curati e community management quotidiano','+58% interazioni in 4 mesi','https://instagram.com', 1),
  ('social','Rilancio profilo Instagram','Caffè Aurora','Ristorazione','Restyling feed e stories ricorrenti','+1.200 follower organici', null, 2),
  ('google','Scheda Google ottimizzata','Studio Dentistico Bianchi','Salute','Profilo completo con foto e orari','Primo risultato locale per "dentista"', null, 1),
  ('google','Recensioni e visibilità','Officina Rossi','Automotive','Setup scheda e raccolta recensioni','Da 3 a 87 recensioni', null, 2),
  ('sito','Sito vetrina','Villa Le Ortensie','Hospitality','Sito responsive con richiesta prenotazioni','+34% richieste dal sito','https://example.com', 1),
  ('sito','Sito one-page','Personal Trainer Neri','Fitness','Landing per acquisizione contatti','Costo per contatto dimezzato', null, 2),
  ('ecommerce','Negozio online','Sapori del Borgo','Food','Shop con pagamenti e spedizioni','120 ordini nel primo mese','https://example.com', 1),
  ('ecommerce','Migrazione e-commerce','Atelier Luce','Arredo','Passaggio a piattaforma più veloce','-40% tempo di caricamento', null, 2),
  ('ads','Campagna lead generation','Immobiliare Costa','Real estate','Meta Ads con targeting locale','48 lead qualificati/mese', null, 1),
  ('ads','Advertising e-commerce','Sapori del Borgo','Food','Campagne vendita su Meta e Google','ROAS 4,2x', null, 2),
  ('brand','Identità visiva','Caffè Aurora','Ristorazione','Logo, palette e brand guidelines','Riconoscibilità di marca', null, 1),
  ('brand','Restyling logo','Officina Rossi','Automotive','Modernizzazione del marchio storico', null, null, 2),
  ('shooting','Shooting prodotti','Boutique Mimosa','Moda','Set fotografico collezione stagionale','80 scatti per e-commerce', null, 1),
  ('shooting','Shooting ambienti','Villa Le Ortensie','Hospitality','Servizio location e camere', null, null, 2),
  ('video','Reel promozionale','Caffè Aurora','Ristorazione','Serie di 4 reel per lancio menu','2 reel oltre 50k views', null, 1),
  ('video','Video prodotto','Atelier Luce','Arredo','Reel di presentazione collezione', null, null, 2),
  ('whatsapp','Setup WhatsApp Business','Studio Dentistico Bianchi','Salute','Automazioni e risposte rapide','Prenotazioni gestite in chat', null, 1),
  ('whatsapp','Catalogo su WhatsApp','Sapori del Borgo','Food','Mini catalogo e ordini diretti', null, null, 2)
) as v(chiave, titolo, cliente, settore, descrizione, risultato, link_url, ordine)
  on v.chiave = s.chiave;
