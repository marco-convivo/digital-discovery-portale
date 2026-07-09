# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Documentazione e comunicazione in italiano. I valori degli enum e i nomi di colonna vanno usati **verbatim** (sono la macchina a stati).

## Stato del repo

Greenfield. Al momento esistono solo:
- `digital-discovery-build-spec.md` — **specifica autorevole**. Leggila per prima: definisce modello dati, macchina a stati, integrazioni e ordine di build.
- 7 mockup HTML autoconclusivi (`portale-home.html`, `piano-pagamenti.html`, `pipeline-board.html`, `preventivo-pubblico.html`, `firma.html`, `pagamento-setup.html`, `onboarding.html`) — riferimento visivo/design system. I token CSS sono nel `:root` di ciascuno.

Non c'è ancora scaffold Next.js, `package.json`, né migration. Lo stack **deciso** (non ancora installato) è **Next.js (App Router, TS, Tailwind) + Supabase + Vercel**. Finché non si esegue `create-next-app`, i comandi build/lint/test non esistono — vanno aggiunti qui quando lo scaffold è in piedi (attesi: `npm run dev`, `next build`, `next lint`).

## Che cosa si costruisce

Un prodotto a **due facce sullo stesso database Postgres (Supabase)**:
- **CRM vendite interno** (staff) — pipeline kanban, anagrafiche, preventivi.
- **Portale cliente** — accetta preventivo → firma contratto → imposta pagamento → consulta rate/fatture/servizi/contratti.

Il collante è **un'unica macchina a stati per pratica**, fatta avanzare da **webhook**, non da click manuali. Lo staff guarda la board mentre il sistema avanza da solo man mano che il cliente agisce.

## Architettura — punti non ovvi (leggere prima di toccare lo schema)

- **Due popolazioni di utenti distinte.** Lo staff sta in `profiles` (collegato a `auth.users`, `role` = `admin` | `commerciale`). Il **cliente esterno NON sta in profiles**: il suo login è agganciato alla riga `clients` tramite la colonna **`clients.auth_user_id`** (nullable, valorizzata in onboarding). `is_staff()`/`is_admin()` si basano sulla presenza in `profiles`.

- **Multi-contratto per cliente.** Un cliente ha **molti** contratti, ognuno col proprio piano pagamenti indipendente. Per questo `payments` **e** `services` hanno **`contract_id`** (non solo `client_id`). Le rate puntano al contratto/subscription, non solo al cliente. Non collassare mai su `client_id`.

- **La macchina a stati vive in `clients.stato`** (enum, §4 della spec). Ogni transizione è idealmente conseguenza di un webhook. Un **trigger** su cambio di `clients.stato` scrive automaticamente una riga in `activity_log` (`actor_id = auth.uid()`, `da_stato`, `a_stato`): lo storico della board non si scrive a mano nel codice.

- **RLS su tutte le tabelle**, costruita su due helper SQL **security-definer**: `is_staff()` e `is_admin()`. Policy:
  - `admin`: accesso completo.
  - `commerciale`: **default team-read** — legge tutti i clienti, modifica solo i propri (`owner_id = auth.uid()`). Se serve più stretto ("vede solo i propri"), si cambia la condizione di SELECT. (Punto ancora da confermare, §9 spec.)
  - `cliente`: solo le righe dove `auth_user_id = auth.uid()`; per le tabelle figlie, `client_id in (select id from clients where auth_user_id = auth.uid())`. **Mai** accesso alle tabelle interne di pipeline.

- **Enum = contratto della macchina a stati.** Non rinominare/riordinare i valori a cuor leggero:
  - `client_stato`: lead, preventivo_inviato, preventivo_visto, preventivo_accettato, contratto_inviato, contratto_firmato, pagamento_setup, pagamento_attivo, cliente_attivo, rifiutato, cessato
  - `quote_stato`: bozza, inviato, visto, accettato, rifiutato, scaduto
  - `contract_stato`: inviato, firmato, annullato
  - `payment_stato`: scheduled, pending, paid, failed

- **Webhook server-side.** Le integrazioni (DocuSeal `form.completed`, Stripe `invoice.paid`/`payment_failed`/`setup_intent.succeeded`/`customer.subscription.deleted`) arrivano su route handler Next.js **con verifica firma**, e sono ciò che fa avanzare `clients.stato`. Fatturazione manuale per ora (`invoices.pdf_url` da FatturaHello).

- **Migration versionate.** Lo schema va introdotto come migration Supabase in tre parti nell'ordine: (a) enum → (b) tabelle → (c) RLS (helper + policy) + trigger. Non applicare DDL ad-hoc fuori dalle migration.

## Design system (v0.3)

Material 3 brandizzato, "EduWay flavor". I token sono già nei mockup — **estrarli in `globals.css`**, non reinventarli. Font **Fustat** (Google Fonts, variabile 300–800), cifre in `tabular-nums`.

Token chiave (dal `:root` dei mockup):
```
--ink:#222222 (primario azione, charcoal)   --on-ink:#fff
--bg:#e9ece6 (pagina, salvia)   --card:#fff   --card-2:#f4f6f2   --line:#e1e4dd
--violet:#a28ef9 / --violet-soft:#ece8fe (accento)
--mint:#a4f5a6 / --mint-soft:#dcf7dd (positivo/accento)
stati: paid(verde) · info(violetto) · wait(ambra) · fail(rosso) · draft(neutro)  — ognuno bg/tx/dot
raggi: --r-card:24px --r-md:16px --r-sm:12px --r-pill:999px
```

**Elemento firma del design**: il linguaggio di stato (pallino colorato + etichetta + pill tenue) è **identico** su rate, contratti e pipeline — "trasparenza resa interfaccia". Il componente StatusPill va condiviso tra CRM e portale.

## Convenzioni

- Digital Discovery S.r.l. è **entità e brand distinti** da Convivo/Syllex (Fustat qui, non DM Sans). Team Vercel e org Supabase dedicati e separati per billing.
- Tutte le chiavi (Supabase service role, Stripe, DocuSeal) come **env var**, mai nel repo; webhook sempre con verifica firma.
- Account/API key/upgrade piani li crea **Marco a mano** — non creare account né inserire credenziali.

## Ordine di build (dalla spec §8)

1. **Fondazione** *(fase corrente)*: scaffold Next.js + token → schema Supabase (enum/tabelle/RLS/trigger) come migration → auth staff (Google OAuth) → CRM minimo (aggiungi lead, board pipeline su `clients`/`activity_log`, anagrafica). **Niente Stripe/DocuSeal in questa fase.**
2. Contratto + pagamento (pagina pubblica preventivo → DocuSeal embedded → Stripe SDD/subscription → automazione transizioni).
3. Portale cliente (auth cliente + Home + Piano pagamenti multi-contratto + Fatture/Servizi/Contratti).
4. Estensioni (fatturazione SdI via API, customer care).
