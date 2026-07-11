# Catalogo servizi — Vetrina virtuale · Design

Data: 2026-07-11
Stato: approvato (design), in attesa di piano di implementazione.

## Obiettivo

Trasformare il catalogo servizi (oggi statico in `src/lib/catalog.ts`) in una
**vetrina virtuale** ricca ed esplorabile, con contenuti editabili dall'interno,
prezzo "a partire da", immagini e un portfolio di lavori per ciascun servizio.
La vetrina è consultabile sia dallo staff sia dal cliente/prospect (portale +
pagina pubblica condivisibile).

## Decisioni chiave (confermate)

1. **Modello ibrido.** La *struttura tecnica* dei servizi resta in
   `src/lib/catalog.ts` (chiave, opzioni canali/durata, mappatura ai campi
   DocuSeal, flag `ricorrente`/`unaTantum`). Questa mappatura è ciò che genera i
   contratti: non va spostata in UN'interfaccia editabile per non rischiare di
   rompere la generazione contratti. Il DB tiene solo i *contenuti di vetrina*
   (descrizioni, prezzo base, immagini, portfolio), agganciati per `chiave`.
2. **Doppio accesso alla vetrina:** pagina pubblica condivisibile (senza login) +
   versione dentro il portale cliente autenticato. Una sola vetrina, componenti
   condivisi, due punti di innesto.
3. **Prezzi sempre visibili** (vetrina pubblica, portale e interno).
4. **Portfolio con referenza reale:** immagine + titolo + nome cliente reale +
   link, con settore e risultato/metrica opzionali. (I dati di seed sono
   inventati ma plausibili; vanno tenuti aggiornati e sostituiti da Marco.)
5. **Due fasi, una spec.** Fase A: catalogo su DB + vetrina + portfolio + editor
   interno. Fase B: aggancio dei prezzi all'editor preventivo.

## Modello dati

Due tabelle nuove. La struttura tecnica NON viene duplicata: si legge da
`catalog.ts` e si fa join per `chiave`. Il suffisso prezzo ("/mese" vs "una
tantum") si deriva dal flag `ricorrente` del codice, non si memorizza.

### `public.service_catalog`
| colonna | tipo | note |
|---|---|---|
| `id` | uuid pk default gen_random_uuid() | |
| `chiave` | text unique not null | = `CatalogService.key` in `catalog.ts` |
| `titolo` | text not null | titolo di vetrina (default = label del codice) |
| `sottotitolo` | text | tagline breve |
| `descrizione` | text | intro estesa |
| `attivita_incluse` | text[] not null default '{}' | "attività svolte" |
| `condizioni` | text[] not null default '{}' | "condizioni di sviluppo" |
| `attivita_escluse` | text[] not null default '{}' | "attività escluse" |
| `prezzo_base` | numeric(12,2) | "a partire da €X" |
| `immagine_url` | text | anteprima; null → placeholder in UI |
| `ordine` | integer not null default 0 | ordinamento in vetrina |
| `attivo` | boolean not null default true | se false, nascosto ai non-staff |
| `updated_at` | timestamptz not null default now() | |

### `public.portfolio_items`
| colonna | tipo | note |
|---|---|---|
| `id` | uuid pk default gen_random_uuid() | |
| `service_id` | uuid not null references service_catalog(id) on delete cascade | |
| `titolo` | text not null | |
| `cliente` | text | nome cliente reale |
| `settore` | text | opzionale (es. "Ristorazione") |
| `descrizione` | text | |
| `risultato` | text | metrica opzionale (es. "+40% prenotazioni") |
| `immagine_url` | text | |
| `link_url` | text | sito/social del lavoro |
| `ordine` | integer not null default 0 | |
| `created_at` | timestamptz not null default now() | |

Indici: `service_catalog(ordine)`, `portfolio_items(service_id)`,
`portfolio_items(service_id, ordine)`.

## RLS

Coerente con il pattern esistente (`private.is_staff()`).

- `service_catalog`:
  - SELECT: `private.is_staff() OR attivo = true` (la pagina pubblica gira
    server-side con client anon: deve poter leggere i servizi attivi).
  - INSERT/UPDATE/DELETE: `private.is_staff()`.
- `portfolio_items`:
  - SELECT: consentita a tutti (contenuto di marketing, nessun dato sensibile).
  - INSERT/UPDATE/DELETE: `private.is_staff()`.

## Immagini / Storage

- Bucket Supabase Storage **`catalogo`**, pubblico (sola lettura pubblica).
- Upload (anteprima servizio + immagini portfolio) tramite **server action con
  service-role**: evita di dover gestire policy RLS sullo storage.
- `immagine_url` nullo → placeholder pulito in UI (nessuna immagine rotta).

## Pagine e navigazione

### Interno (staff)
- `/vendite/catalogo` — nuova voce in `src/components/internal/sidebar.tsx`
  (icona dedicata). Griglia dei servizi (anche quelli non attivi, con badge).
- `/vendite/catalogo/[chiave]` — editor del singolo servizio:
  - campi contenuto (attività/condizioni/escluse come elenchi multilinea),
    prezzo, `ordine`, toggle `attivo`, upload anteprima;
  - gestore **portfolio** inline: aggiungi / modifica / elimina lavoro, con
    upload immagine.
  - Salvataggi via server actions con service-role.

### Pubblico (no login)
- `/catalogo` — indice vetrina (solo servizi `attivo=true`).
- `/catalogo/[chiave]` — dettaglio servizio + galleria portfolio.

### Portale (cliente autenticato)
- La stessa vetrina montata dentro la shell del portale, riusando i componenti
  condivisi (`CatalogoVetrina`, `ServizioDettaglio`). Due punti di innesto, una
  sola implementazione.

## UX vetrina (build con skill impeccable)

Applicare il register "product" e le regole anti-slop già in uso nel progetto.

- **Indice**: tessere editoriali (immagine, titolo, sottotitolo, badge
  ricorrente/una tantum, "a partire da €X"). Evitare la griglia di card
  identiche; variare ritmo. Token del design system v0.3.
- **Dettaglio servizio**: hero con immagine + titolo + prezzo; descrizione; tre
  blocchi chiari — *Cosa facciamo* (attivita_incluse) / *Come lavoriamo*
  (condizioni) / *Cosa non è incluso* (attivita_escluse); CTA "Richiedi
  preventivo" (per la pagina pubblica: contatto via mailto/link; nel portale può
  puntare al flusso interno). Sotto, **galleria portfolio** (immagine, titolo,
  cliente, settore, risultato, link).
- Placeholder coerente quando manca l'immagine.

## Fase B — aggancio prezzi → preventivo

Riuso della tabella esistente `public.quote_items`
(`descrizione`, `quantita`, `prezzo_unitario`): nessuna tabella nuova.

- Nell'editor preventivo (`src/components/internal/create-quote-form.tsx`),
  selezionando i servizi si generano righe `quote_items` precompilate col
  `prezzo_base` del catalogo (modificabili).
- Aggiungere campo **sconto** e calcolo **totale** (→ `quotes.importo_totale`).
- **Piano rate**: `rate_num` / `rata_mensile` come oggi.
- La selezione servizi (`quotes.ordine`) resta la fonte per contratto/DocuSeal;
  `quote_items` diventa il dettaglio economico.

## Seed & migration

Migration nuove (nell'ordine, coerenti con `supabase/migrations/`):
1. Tabelle `service_catalog` + `portfolio_items` + indici + RLS.
2. Creazione bucket storage `catalogo` (pubblico).
3. **Seed** dei 9 servizi esistenti (chiavi da `catalog.ts`) con
   descrizioni/prezzi plausibili inventati e 2-3 lavori di portfolio ciascuno.
   Immagini: `immagine_url` a null (placeholder in UI); Marco le carica/sostituisce
   dall'editor.

## Non incluso (YAGNI, per ora)

- Creazione di servizi *tecnicamente nuovi* dalla UI (richiede anche un nuovo
  campo checkbox nel template DocuSeal → operazione coordinata, rara).
- Categorie/tag di servizi, ricerca/filtri avanzati nella vetrina.
- Versionamento dei contenuti / bozze.

## Ordine di build

1. **Fase A** — migration+seed → tabelle/RLS/storage → editor interno → vetrina
   pubblica + portale (con impeccable). Dati seed visibili subito.
2. **Fase B** — aggancio prezzi nell'editor preventivo (`quote_items`, sconto,
   totale, rate).
