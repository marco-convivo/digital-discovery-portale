repo: marco-convivo/digital-discovery-portale
branch: main

## Last sync
date: 2026-08-01T11:40:36Z

### Updated in this project
- Diagnosi in 9 punti del design system v0.3 (token, componenti ui/, mockup docs/).
- Tre fondazioni v0.4 proposte (1a Estratto conto · 1b Superficie denaro · 1c Registro).
- Direzione scelta: 2a (superficie denaro + righe rata asciutte).
- Portale ridisegnato: home e piano pagamenti a 390 e 1180 (turno 3).
- CRM ridisegnato in densità di lavoro: pipeline e scheda cliente a 1440 (turno 4).
- Menu CRM ridotto a 5 voci; Pagamenti come calendario di cassa e Insoluti come lista di lavoro (turno 5).
- Catalogo: lista servizi gestibile + editor/creazione servizio con anteprima vetrina (turno 6).

## Screen map
| Screen | Repo files |
| --- | --- |
| 3a Home portale | docs/portale-home.html · src/components/portale/* · src/lib/servizi.ts |
| 3b Piano pagamenti | docs/piano-pagamenti.html · src/components/internal/piano-pagamenti.tsx · src/lib/stati.ts |
| 4a Pipeline | docs/pipeline-board.html · src/lib/stati.ts (PIPELINE_COLUMNS) |
| 4b Scheda cliente | src/components/internal/cliente-scheda.tsx · anagrafica-editor.tsx · piani-pagamento.tsx |
| 5a Pagamenti · 5b Insoluti | src/components/internal/insoluti-list.tsx · impostazioni-insoluti.tsx · src/lib/insoluti/* |
| 6a Catalogo · 6b Nuovo servizio | src/components/internal/catalogo-editor.tsx · src/lib/catalog.ts · src/components/catalogo/service-card.tsx · supabase/migrations/20260711120000_service_catalog.sql |
| Fondazione / token | src/app/globals.css · src/components/ui/{button,card,status-pill,input,empty-state,logo}.tsx |

## Note
- Stack: Next.js 16 App Router + Tailwind v4 + Supabase (SSR) + Vercel.
- Spec autorevole: docs/digital-discovery-build-spec.md.
- Vincoli tenuti: Fustat, sfondo salvia, brand Digital Discovery (non Convivo), zero motion, mobile-first sul portale.
- Da consegnare ancora: component sheet completo, mappa modifiche file per file per Claude Code.
