# Design

Sistema visivo di Digital Discovery (v0.3, "EduWay flavor" su motore Material 3). Fonte dei token: `src/app/globals.css` (`@theme`, Tailwind v4). Questo file descrive lo stato attuale ed è il riferimento per le rifiniture.

## Visual Theme

Chiaro, arioso, caldo-neutro. Sfondo salvia, superfici bianche con raggi generosi e ombra morbida; primario charcoal per le azioni forti; accenti violetto e menta usati con parsimonia. Il tono è calmo e affidabile: molta aria, poca decorazione, gerarchia affidata a peso tipografico e colore di stato. Un solo tema (light); il dark non è previsto ora.

## Color Palette

Neutri
- `--color-bg` #e9ece6 (salvia, sfondo pagina)
- `--color-card` #ffffff · `--color-card-2` #f4f6f2 (superfici)
- `--color-line` #e1e4dd (bordi)
- Testo: `--color-text` #1e1e22 · `--color-text-2` #55555e · `--color-text-3` #8a8a93

Primario / accenti
- `--color-ink` #222222 (azione primaria, charcoal) su `--color-on-ink` #fff
- `--color-violet` #a28ef9 / `--color-violet-soft` #ece8fe / on #2c1d63 (accento, focus ring, link)
- `--color-mint` #a4f5a6 / `--color-mint-soft` #dcf7dd / on #14532d (positivo)

Stati (pallino + pill, coppie bg/tx/dot) — il "linguaggio di stato"
- paid (verde) · info (violetto) · wait (ambra) · fail (rosso) · draft (neutro)

Nota contrasto: `--color-text-3` è chiaro; usarlo solo per meta piccola su bianco, mai per body lungo o su salvia.

## Typography

- Famiglia unica: **Fustat** (Google Fonts, variabile 300–800), `--font-sans`. Nessun accoppiamento di font: gerarchia solo per peso/dimensione.
- Cifre in `tabular-nums` (classe `.tnum`) per importi, rate, date allineate.
- Titoli: extrabold, `tracking-[-0.02em]`. Testo forte su elementi charcoal.

## Components (esistenti)

- **Button** (`ui/button`): pill, font-bold; varianti `primary` (ink), `ghost` (card-2), `outline`; taglie sm/md; focus ring violetto 3px.
- **Card** (`ui/card`): superficie bianca, `rounded-card` (24px), `shadow-card`, bordo tenue. `CardHeader`/`CardTitle`.
- **StatusPill** (`ui/status-pill`): elemento firma — pallino + etichetta + pill tenue, 5 tone. Mappe stato→tone in `lib/stati` (client_stato, payment_stato) e per quote/contract inline.
- **Input** (`ui/input`): bordo line, `rounded-md`, focus ring violetto, label opzionale.
- Liste dominio: `ClientiList`, `DocumentiList` (card strutturate preventivi/contratti), `EntityList`, `PianiPagamento` (piani collassabili).
- Shell: `Sidebar` (CRM, "Vendite") e `PortaleSidebar` (portale) — larghezza 250px, nav a pill, footer utente con sign-out.

## Layout

- Raggi: `--radius-card` 24 · `--radius-md` 16 · `--radius-sm` 12 · `--radius-pill` 999.
- Ombra: `--shadow-card` (morbida, doppia).
- Shell interna: sidebar fissa 250px + main con padding 6–8. Contenuto centrato: liste `max-w-3xl`, scheda cliente `max-w-6xl` (2 colonne 1/3 + 2/3).
- Board pipeline: colonne orizzontali scrollabili, card trattativa.
- Griglie responsive senza breakpoint dove possibile; mobile ancora da rifinire.

## Da rifinire (backlog UI)

- Coerenza spaziature/gerarchia tra le schermate nuove (liste staff) e le più curate (Home portale, board).
- Empty states con più personalità (oggi minimali).
- Responsive/mobile (shell sidebar fissa non ancora adattata).
- Micro-interazioni e motion (quasi assenti; `prefers-reduced-motion` da prevedere).
- Densità delle liste dominio: evitare la deriva "griglia di card identiche".
