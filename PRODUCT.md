# Product

## Register

product

## Users

Due popolazioni distinte sullo stesso prodotto:
- **Staff vendite** (Marco + collaboratori): usano il CRM interno ogni giorno per aggiungere prospect, creare preventivi sul catalogo servizi, seguire la pipeline, generare contratti e piani pagamento. Contesto: desktop, uso intensivo, vogliono capire "a colpo d'occhio" a che punto è ogni pratica.
- **Clienti (titolari di micro/piccole imprese)**: accedono al portale con magic link per accettare preventivi, firmare il contratto, impostare il pagamento e poi consultare rate, fatture, servizi e contratti. Contesto: poco tempo, poca dimestichezza col software; devono capire tutto senza sforzo.

## Product Purpose

Prodotto a due facce sullo stesso database: **CRM vendite interno** + **portale cliente**. Il collante è un'unica macchina a stati per pratica (lead → preventivo → contratto firmato → pagamento attivo), che avanza da sola man mano che il cliente agisce. Successo = lo staff segue le trattative con chiarezza e i clienti completano firma+pagamento senza attrito, con piena trasparenza su cosa hanno acquistato e cosa devono pagare.

## Brand Personality

**Calmo, affidabile, trasparente.** Voce professionale ma umana, vicina alle MPI. L'interfaccia deve rassicurare (soldi e contratti in gioco): niente sorprese, ogni stato è esplicito. "Trasparenza resa interfaccia" — il linguaggio di stato (pallino + etichetta + pill) è identico ovunque, così il cliente e lo staff leggono la stessa realtà. Distinto e riconoscibile (Fustat, palette salvia/charcoal con accenti violetto/menta), senza urlare.

## Anti-references

- **Gestionale/enterprise freddo**: tabelle grigie dense, look burocratico da software anni 2000.
- **SaaS generico / AI-slop**: griglie di card identiche, gradienti decorativi, mini-eyebrow maiuscoli, dashboard clonata con hero-metric.
- **Troppo giocoso**: eccesso di colori/illustrazioni, tono infantile.
- **Troppo minimale/anonimo**: così scarno da perdere identità.

Il bersaglio è lo stretto sentiero tra questi: caldo ma professionale, riconoscibile ma sobrio, pulito ma non sterile.

## Design Principles

1. **Trasparenza resa interfaccia** — ogni pratica/rata/contratto mostra sempre il suo stato con lo stesso linguaggio visivo; mai far indovinare al cliente dove si trova.
2. **A colpo d'occhio** — lo staff deve capire una pratica (e un cliente le sue rate) senza aprire link o PDF; le informazioni utili vengono in superficie.
3. **Rassicurare, non impressionare** — si maneggiano contratti e pagamenti: chiarezza e prevedibilità prima dell'effetto.
4. **Un solo sistema, due facce** — CRM e portale condividono componenti e linguaggio; coerenza sopra la personalizzazione per-schermata.
5. **Identità senza rumore** — la personalità sta nei token (salvia, Fustat, pill di stato) e nella cura, non in decorazioni aggiunte.

## Accessibility & Inclusion

Clientela MPI eterogenea per età e dimestichezza: testo leggibile e ad alto contrasto (body ≥ 4.5:1, mai grigio chiaro su salvia), target touch ampi, stati mai affidati al solo colore (pallino + etichetta testuale). Rispetto di `prefers-reduced-motion`. Italiano come lingua unica per ora.
