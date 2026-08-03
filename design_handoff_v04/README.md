# Handoff — Digital Discovery, portale clienti + CRM v0.4

## Overview
Ridisegno completo del prodotto Digital Discovery: il **portale clienti** (mobile-first, ciò che vede l'azienda cliente) e il **CRM interno** (desktop 1440, ciò che usa il team vendite). Il lavoro parte dalla diagnosi del design system v0.3 e definisce v0.4: colore, tipografia, raggi, densità, pattern di creazione.

Obiettivo dell'implementazione: portare v0.4 nel repo `marco-convivo/digital-discovery-portale` (Next.js 16 App Router, Tailwind v4, Supabase SSR, Vercel) **senza rifare l'app** — sono modifiche mirate a token, componenti `ui/` e alle schermate elencate nella mappa file per file in fondo.

## About the design files
`Design System v0.4.dc.html` è un **riferimento di design in HTML**, non codice da copiare. È un documento-canvas: sette turni di lavoro, ciascuno con opzioni identificate da un badge (`1a`, `3b`, `7b`…). Aprilo in un browser e naviga con pan/zoom.

Il compito è **ricreare queste schermate nell'ambiente esistente del repo** — componenti React/Tailwind già presenti, `src/components/ui/*`, token in `globals.css` — non incollare l'HTML. Gli stili nel file sono inline solo perché il documento di design li richiede: in codice diventano classi Tailwind e token.

## Fidelity
**Hi-fi.** Colori, tipografia, spaziature e copy sono definitivi e vanno riprodotti fedelmente. Le uniche cose finte sono: foto (placeholder tratteggiati), dati (nomi e importi di esempio) e le interazioni (il documento è statico — gli stati sono disegnati affiancati, non animati).

Copy in italiano: **usare il testo esatto del mock**. È stato scritto con criterio (niente gergo, niente "gestisci il tuo business"); riscriverlo fa perdere metà del lavoro.

---

## Design tokens

### Colore
| Ruolo | Hex | Uso |
| --- | --- | --- |
| Salvia sfondo app | `#e9ece6` | sfondo pagina CRM e portale |
| Salvia sfondo canvas | `#dfe3da` | sfondo esterno / sezioni |
| Salvia sidebar | `#e4e8de` | colonna nav CRM |
| Superficie | `#ffffff` | card, righe tabella, campi |
| Superficie tenue | `#f4f6f1` / `#f7f9f4` | header tabella, riquadri annidati |
| Superficie pannello | `#f5f7f2` | drawer |
| Bordo forte | `#cfd5c8` | contorno frame / drawer |
| Bordo | `#e2e6dd` | card |
| Bordo campo | `#dfe3da` | input |
| Bordo tenue | `#f1f3ee` | separatore righe |
| Bordo tratteggiato | `#c9cfc2` | slot "aggiungi" |
| Inchiostro | `#16171a` | testo primario, bottone primario, blocco denaro |
| Inchiostro 2 | `#3d4139` | label, nav inattiva |
| Inchiostro 3 | `#4a4e46` | testo secondario (contrasto AA su bianco) |
| Inchiostro 4 | `#5b5f5a` | metadati |
| Inchiostro tenue | `#9aa094` | placeholder, maniglie, icone inerti |
| Su scuro — primario | `#ffffff` | |
| Su scuro — secondario | `#e8ebe4` | |
| Su scuro — terziario | `#b8bdb2` | |
| Su scuro — tenue | `#9aa094` | |
| Bordo su scuro | `#2c2e31` | |
| Menta | `#a8e6c4` su `#0f2e1e` | conferme e positivo **solo su fondo scuro** (WhatsApp, sconto, spunte) |
| Verde stato | `#22c55e` / testo `#1f8a4c` | pallino "attivo/in vetrina", spunta checklist |
| Violetto | `#ece8fe` / testo `#2c1d63` | ricorrente, abbonamenti, link |
| Violetto scuro | `#4b3bbd` / hover `#2c1d63` | link |
| Ambra bg | `#f7e4b8` / `#fdf4dd` · bordo `#f0dfae` | "da firmare", avvisi, duplicati |
| Ambra testo | `#6b4400` / `#7c4a03` | |
| Ambra pallino | `#c99700` | |
| Rosso | `#d64535` | insoluti, badge conteggio |

**Regola**: menta e violetto significano *azione o impegno*, non decorazione. Massimo due badge colorati per schermata; tutto il resto è testo normale.

### Tipografia
Fustat (Google Fonts, `wght@300..800`), fallback `system-ui, sans-serif`.

| Livello | Stile | Uso |
| --- | --- | --- |
| Titolo pagina | `800 24px / -.02em` | H1 CRM |
| Titolo pannello | `800 20px / -.02em` | drawer |
| Importo display | `800 26px / -.02em` | blocco denaro (mai `tabular-nums` sui display) |
| Importo forte | `800 18px` | totale secondario |
| Titolo card | `700 14px` | intestazione card |
| Riga forte | `700 14–15px` | nome cliente / servizio |
| Corpo | `400 13.5px / 1.6` | paragrafi |
| Corpo compatto | `500 13px` | celle tabella |
| Label | `600 12.5px` | etichette campo |
| Header tabella | `600 12px` | |
| Meta | `500 11–12px` | note, unità |
| Eyebrow | `600 12px / .04em / uppercase` | solo su fondo scuro |

La gerarchia è **guidata dal peso**, non dalla dimensione: 13px/700 batte 15px/400. Non introdurre altri gradini.

### Raggi
CRM `16` (frame) · `12` (card) · `10` (bottone, riquadro) · `9` (campo, voce nav) · `8` (pill, bottone piccolo) · `6–7` (badge).
Portale `24` (card) · `16` (interno) — più morbido, coerente col mobile.

### Spaziatura
Scala 2/4/6/8/10/12/14/16/18/20/22/24. Padding card 18px; padding riga tabella `11px 16px`; gap colonne 14–18px; gap sezioni canvas 36px.

### Ombre
Quasi assenti. Unica ombra del sistema: drawer `-24px 0 60px rgba(22,23,26,.18)`. Scrim modale `rgba(22,23,26,.34)`.

### Densità
Due densità sugli stessi componenti:
- **CRM** — 1440px, righe 36–44px, testo 12–14px, raggi 12/8. Velocità di lavoro.
- **Portale** — 390px mobile-first (e 1180 desktop), testo 15–17px, raggi 24/16, tap target ≥44px (tab bar 52px). Respiro e fiducia.

---

## Schermate

Riferimenti = badge nel file di design.

### Turno 7 — Creare qualcosa di nuovo
Regola di sistema: **il contenitore segue il costo dell'errore**.
- dato correggibile in 10 secondi → **pannello laterale** (cliente)
- documento che il cliente firma e che genera rate/contratto → **pagina intera** con riepilogo denaro fisso (preventivo)
- contenuto con un pubblico → **pagina intera con anteprima** (servizio)

**7a Nuovo cliente** — drawer 520px, scrim 34%, sopra la lista Clienti.
- Header: titolo + sottotitolo "Servono solo nome e un contatto…", chiusura ✕ 30×30 su `#eceee8`.
- Campi: Nome attività (focus, bordo `1.5px #16171a`), Referente + Città in griglia 1fr 1fr, Telefono (label secondaria "è anche il WhatsApp per il portale"), Email.
- **Controllo duplicati inline** sotto il telefono, mentre si scrive (non al submit): banner ambra con azione "Apri".
- Blocco "Dati di fatturazione" esplicitamente rimandato → azione "Aggiungi ora".
- Blocco scuro "Cosa succede quando salvi": ✓ crea opportunità in Pipeline (attivo) · ☐ invia accesso al portale (spento, nota "parte da solo alla firma").
- Footer: **Crea cliente** (primario scuro) · **Crea e fai un preventivo** (secondario) · Annulla testuale a destra.

**7b Nuovo preventivo** — pagina intera, griglia `1fr 400px`.
- Header: breadcrumb Pipeline / Cliente / Nuovo preventivo; "Bozza · numero assegnato solo all'invio"; autosave "Salvato 12 secondi fa"; azioni **Vedi come il cliente** + **Invia per la firma**.
- Card cliente compatta con "Cambia cliente".
- **Cosa comprende**: righe voce con Qtà / Prezzo / Sconto / Totale; il totale mostra l'unità ("al mese" / "una tantum"); lo sconto attivo apre una riga **Motivo dello sconto** che finisce sul documento del cliente. Slot "+ Aggiungi dal catalogo" e "Voce libera".
- **Come si paga la parte una tantum**: soluzione unica / a rate; acconto, numero rate, prima rata; anteprima chip delle scadenze generate + chip violetto del ricorrente. Sono le stesse rate che il cliente vedrà in Piano pagamenti (3b).
- **Validità e nota**: data + nota personale al referente.
- Colonna destra fissa: blocco denaro scuro (una tantum e ricorrente **separati** — sono due impegni diversi), listino / sconto in menta / IVA, e **Primo incasso alla firma**; card **Prima di inviare** (checklist di blocchi visibile mentre compili, non errore al clic); card **Quando premi Invia** (portale + WhatsApp → DocuSeal → piano pagamenti + Vinta).

### Turno 6 — Catalogo
**6a Catalogo servizi** — lista trascinabile = ordine della vetrina; miniatura reale; colonna **Stato** che separa due concetti oggi confusi in un flag: *in vetrina* (lo vedono i clienti) e *vendibile* (si può mettere in preventivo, dipende dal collegamento tecnico in `lib/catalog.ts`). Gruppo "Nascosti dalla vetrina" separato.
**6b Nuovo servizio / editor** — form a sinistra, anteprima card di vetrina a destra; contenuti come **elenchi di voci** (non textarea "una voce per riga"): Cosa facciamo / Come lavoriamo / Cosa non è incluso; blocco "Come si vende" (ricorrente vs una tantum, prezzo, durata) con il collegamento tecnico reso esplicito.

### Turno 5 — Denaro
**5a Pagamenti** — calendario di cassa. **5b Insoluti** — lista di lavoro con impostazioni dei solleciti.

### Turno 4 — CRM
**4a Pipeline** — colonne di stato con **il tempo come segnale**: bordo e filtro "ferma da X giorni". **4b Scheda cliente** — consolida preventivi e contratti (le voci di menu separate sono state rimosse); log attività come barra di stato.

### Turno 3 — Portale
**3a Home** (390) — stato del servizio, prossima scadenza, blocco assistenza scuro speculare al blocco denaro con WhatsApp primario in menta e nome della persona. **3b Piano pagamenti** — 6 rate visibili, le più vecchie collassate; stato come pill a destra su mobile; fallimento addebito in banner + riga evidenziata.

### Turni 1–2 — Fondazioni
Superficie denaro, righe rata asciutte, uso disciplinato dei badge.

---

## Interazioni

Il prodotto è **zero-motion per scelta** (vincolo esistente): niente animazioni d'ingresso, niente skeleton animati. Ammesse solo transizioni di stato ≤120ms su colore/bordo per hover e focus.

- **Drawer**: apre da destra, scrim cliccabile per chiudere, ESC chiude, focus trap, focus iniziale sul primo campo. Se ci sono modifiche → conferma prima di chiudere.
- **Duplicati (7a)**: debounce ~400ms sul campo telefono normalizzato E.164; query su clienti esistenti; banner non blocca il salvataggio.
- **Autosave (7b, 6b)**: bozza salvata a ogni blur di campo, indicatore testuale "Salvato N secondi fa". Il numero preventivo si assegna all'invio, non alla creazione.
- **Checklist "Prima di inviare"**: calcolata in tempo reale; "Invia per la firma" resta cliccabile ma apre l'elenco dei blocchi se ce n'è uno rosso; gli avvisi ambra non bloccano.
- **Riordino** (catalogo, voci servizio, righe preventivo): drag sulla maniglia `⋮⋮`, persistenza dell'ordine, alternativa da tastiera obbligatoria (↑/↓ con focus sulla maniglia).
- **Hover**: righe tabella → `#f8faf6`; bottoni secondari → bordo `#cfd5c8`; primario → `#000`.
- **Focus visibile**: outline `2px #16171a`, offset 2px. Non rimuovere mai l'outline.
- **Stati vuoti**: usare `ui/empty-state.tsx`, con una sola azione.

## Stato applicativo (7a/7b)

7a: `{ nome, referente, citta, telefono, email, fatturazione?, creaOpportunita: true, invitaPortale: false }` + `duplicati: Cliente[]` (async) + `dirty`.

7b: `{ clienteId, righe: RigaPreventivo[], sconti, modalitaPagamento: 'unica'|'rate', acconto, numeroRate, dataPrimaRata, validoFino, nota }`. Derivati: `totaleUnaTantum`, `totaleRicorrenteMensile`, `iva`, `primoIncasso = acconto + prima mensilità`, `scadenzeGenerate[]`, `blocchi[]`. Le scadenze mostrate devono venire dalla **stessa funzione** che genera il piano rate reale alla firma — non da un calcolo duplicato nella UI.

---

## Mappa modifiche, file per file

| File | Cosa fare |
| --- | --- |
| `src/app/globals.css` | Sostituire la palette con i token qui sopra; aggiungere i due set di raggi (CRM/portale); rimuovere `tabular-nums` dagli importi display; correggere il contrasto del testo secondario a `#4a4e46`. |
| `src/components/ui/button.tsx` | Varianti: `primary` (scuro), `secondary` (bianco+bordo), `ghost` (testo), `dashed` (slot aggiungi). Raggi 10/8. |
| `src/components/ui/card.tsx` | Bordo `#e2e6dd`, raggio 12 (CRM) / 24 (portale), padding 18. Aggiungere variante `dark` per il blocco denaro. |
| `src/components/ui/status-pill.tsx` | Ridurre ai casi reali: neutro, ricorrente (violetto), attenzione (ambra), errore (rosso), positivo (verde). Max due per schermata — documentarlo. |
| `src/components/ui/input.tsx` | Bordo `#dfe3da`, focus `1.5px #16171a`, label 600/12.5, slot per label secondaria a destra. |
| **nuovo** `src/components/ui/drawer.tsx` | Pannello 520px + scrim, ESC/focus trap, header/body/footer. Base di 7a e dei futuri pannelli. |
| **nuovo** `src/components/ui/money-block.tsx` | Blocco scuro riutilizzato in 7b, 3a, 3b. |
| **nuovo** `src/components/ui/preflight-list.tsx` | Checklist "Prima di inviare". |
| **nuovo** `src/components/internal/cliente-nuovo-drawer.tsx` | 7a. |
| **nuovo** `src/components/internal/preventivo-editor.tsx` | 7b. |
| **nuovo** `src/components/internal/catalogo-picker.tsx` | Selettore "+ Aggiungi dal catalogo" (**non ancora disegnato** — vedi Aperti). |
| `src/components/internal/catalogo-editor.tsx` | 6b: contenuti da textarea a liste di voci ordinabili; anteprima vetrina affiancata; campo collegamento tecnico esplicito. |
| `src/lib/catalog.ts` | Separare `inVetrina` da `vendibile`; esporre il collegamento tecnico come campo, non come chiave implicita. |
| `src/lib/stati.ts` | Pipeline: aggiungere `fermaDaGiorni` derivato e il filtro relativo. |
| `src/lib/preventivi/*` (nuovo) | Generazione scadenze condivisa fra anteprima 7b e piano rate reale. |
| `src/components/internal/piano-pagamenti.tsx` | 6 rate + collasso; pill di stato a destra su mobile; banner fallimento addebito. |
| `src/components/internal/cliente-scheda.tsx` | Assorbire preventivi e contratti; barra log attività. |
| `src/components/portale/*` | Densità portale: raggi 24/16, testo 15–17, tab bar 52px, blocco assistenza scuro con WhatsApp menta. |
| Navigazione CRM | 5 voci: Pipeline, Clienti, Pagamenti, Insoluti, Catalogo (+Team). Rimosse Preventivi e Contratti. |
| `supabase/migrations/*` | Nuova migration: campi `in_vetrina` / `vendibile` separati sul catalogo; motivo sconto sulla riga di preventivo. |
| `docs/digital-discovery-build-spec.md` | Aggiornare: la spec è autorevole, va allineata a v0.4 prima di implementare. |

Vincoli da non violare: Fustat, sfondo salvia, brand **Digital Discovery** (non Convivo), zero motion, portale mobile-first.

## Assets
Nessun asset binario. Il logo è un SVG inline (due glifi, `viewBox="0 0 92.55 96.84"`) già presente nel repo in `ui/logo.tsx`. Le foto dei servizi nei mock sono placeholder tratteggiati: usare le immagini reali dal catalogo Supabase.

## Files
- `Design System v0.4.dc.html` — documento di design, turni 1→7 (il più recente in alto).
- `support.js` — runtime necessario ad aprire il file HTML. Non è codice di prodotto.

## Aperti
- Selettore catalogo di 7b (pannello "+ Aggiungi dal catalogo") — non ancora disegnato.
- Component sheet completo (atomi/molecole nelle due densità) — non ancora prodotto.
