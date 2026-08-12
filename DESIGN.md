# Design

Sistema visivo di Digital Discovery **v0.5**. Fonte dei token: `src/app/globals.css`
(`@theme`, Tailwind v4). Un solo sistema, due facce (CRM + portale). Modalità:
**Operate** (CRM strumento di lavoro), **Read/Operate** (portale cliente).

## Tesi

Ogni superficie risponde a due domande: **«a che punto siamo»** (stato) e
**«cosa faccio adesso»** (azione). Da qui la grammatica:

- **La lista di lavoro è il pattern primario**: tabella densa, ordinata/raggruppata
  per urgenza, **un solo gesto per riga**, sul **linguaggio di stato** condiviso
  (pallino + etichetta + pill). Mai griglie di card identiche.
- **Due eccezioni** dove serve lo spazio: **board** (Pipeline) e **master-detail**
  (Clienti, Catalogo).
- **Il denaro ha una forma sola**: il **blocco scuro** (money block) ricorre su
  Oggi, Cassa, scheda cliente, portale.
- **Card = sintesi e denaro**, non elenco di entità. `CardAction` = l'unica azione
  dell'header (12/600, a destra).

## Visual Theme

Chiaro, arioso, caldo-neutro. Sfondo salvia, superfici bianche, bordo che conta
più dell'ombra (ombre quasi assenti; l'unica vera è quella del drawer). Primario
charcoal per le azioni forti; accenti violetto e menta con parsimonia. Un solo
tema (light). Zero-motion: solo transizioni ≤120ms su colore/bordo, rispetto di
`prefers-reduced-motion`.

## Color Palette (token in `globals.css`)

- Sfondo `--color-bg` #e9ece6 (salvia) · canvas `--color-bg-2` #dfe3da · rail
  `--color-sidebar` #e4e8de. Superfici `--color-card` #fff · `--color-card-2`
  #f4f6f1 · `--color-panel` #f5f7f2.
- Testo `--color-text` #16171a · `--color-text-2` #4a4e46 (AA su bianco) ·
  `--color-text-3` #5b5f5a · `--color-faint` #9aa094 (solo placeholder/icone inerti).
- Azione `--color-ink` #16171a su `--color-on-ink` #fff.
- Accenti: `--color-link` #4b3bbd (link) · violetto `--color-violet` #a28ef9 /
  soft #ece8fe / on #2c1d63 · menta `--color-mint` #a8e6c4 / on #0f2e1e
  (**positivo solo su fondo scuro**).
- Bordi: `--color-line` #e2e6dd · `-strong` #cfd5c8 · `-field` #dfe3da · `-soft`
  #f1f3ee.
- **Linguaggio di stato** (coppie bg/tx/dot): paid (verde) · info (violetto) ·
  wait (ambra #c99700) · fail (rosso #d64535) · draft (neutro). Mappe in
  `lib/stati` (client v2, payment, quote, contract) + `TONE_DOT`/`TONE_CHIP` in
  `ui/status-pill`.

## Typography

Famiglia unica **Fustat** (300–800), `--font-sans`. Gerarchia solo per peso/
dimensione, nessun accoppiamento. Titoli extrabold `tracking-[-0.02em]`. Importi/
rate/date in `tabular-nums` (`.tnum`).

## Radii (v0.5 — un valore per densità)

- **CRM**: superficie `--radius-crm` **14** · controllo `--radius-btn`/`-field`/
  `-badge` **10** · `--radius-pill` 999. Cornice esterna `--radius-frame` 16.
- **Portale**: superficie `--radius-card` **20** · controllo `--radius-md` **12**
  · pill 999 (stessa scala, più morbida).

## Layout

- **Contenitore unico**: `.dd-container` riempie fino a **1720px** con gutter 24;
  griglia a 12 colonne (`grid-cols-12` + `col-span-*` o `.dd-grid`) che collassa a
  6 sotto 1280 e a 1 sotto 900. Niente più `max-w-*` diversi per pagina.
- **Shell CRM (1a)**: **rail a icone 76px** (Oggi · Pipeline · Clienti · Cassa ·
  Catalogo · Team), tab bar in basso su mobile con sheet "Altro".
- **Portale**: rail voci a sinistra su desktop, tab bar in basso su mobile.

## Componenti chiave (`src/components/ui`)

- **Card** (`radius` crm/portale, `dark`) + `CardHeader`/`CardTitle`/`CardAction`.
- **StatusPill** (elemento firma) + `TONE_DOT`/`TONE_CHIP`.
- **Button** (primary/secondary/ghost/dashed/outline), **Input** (`labelRight`),
  **Drawer** (520px, scrim 34%), **MoneyBlock**, **PreflightList**.

## IA (v0.5)

- **Rail 6 voci**. **Cassa** unifica Pagamenti + Insoluti + Scadenze (viste:
  Calendario di cassa · Insoluti · Piani). Preventivi/Contratti/Scadenze non sono
  voci di nav: vivono nella **scheda cliente** e in Cassa.
- **Oggi** = hub operativo (Da chiudere · Cassa del mese · Pipeline-segnale ·
  Movimenti). **Pipeline** = overview per fase con totale € per colonna. **Coda di
  lavoro** (`/vendite/lavoro`) = la vista densa "cosa fare".

## Backlog UI

- Ricerca globale ⌘K reale su Oggi.
- Calendario di cassa (Cassa) e riordino drag del catalogo con persistenza.
- Migrazione delle vecchie schermate v0.4 alla griglia 12/1720 e alla card unica,
  sezione per sezione.
