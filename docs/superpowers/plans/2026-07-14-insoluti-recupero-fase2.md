# Gestione insoluti & recupero credito — Fase 2 · Piano

> **For agentic workers:** eseguibile inline. Nessuna migration (decisioni: stato invariato, bonifico manuale). Verifica con `npx tsc --noEmit` + `npx eslint` + curl.

**Goal:** Completare il recupero credito: conferma mandato SEPA via email, gestione dei ritorni tardivi (dispute), e due azioni sugli insoluti ("richiedi nuovo mandato", "ritenta SEPA").

**Decisioni:** stato cliente invariato (`pagamento_attivo` subito; il fallimento lo prende l'insoluto); bonifico resta manuale. → nessun cambio di schema.

**Nota comandi:** prefissare con `cd /Users/marcopalombini/Progetti/digital-discovery-portale &&`.

---

### Task 1: Email conferma mandato SEPA

**Files:** Create `src/lib/pagamenti/mandato.ts`; Modify `src/lib/stripe/activate.ts` (in `handleSetupSucceeded`)

- [ ] `inviaConfermaMandato({ email, ragioneSociale, rataLorda, rateNum, descriptor })` — best-effort, usa `emailBrand` + `sendEmail`. Contenuto: importo mensile che verrà addebitato (LORDO), n. rate, descrittore in estratto conto, promemoria di avvisare la banca.
- [ ] In `handleSetupSucceeded`, dopo aver messo `pagamento_attivo` e recuperato email/metodo: se `metodo === "sdd"` → calcola `rataLorda = conIva(rata)`, legge `statement_descriptor` da `getAppSettingsAdmin()`, chiama `inviaConfermaMandato`. Solo ramo ricorrente (il mandato ricorrente è quello che conta).
- [ ] `npx tsc --noEmit`. Commit `feat(insoluti): email conferma mandato SEPA`.

### Task 2: Ritorni tardivi (dispute) → riapri insoluto

**Files:** Modify `src/lib/stripe/activate.ts` (nuovo `handleChargeDispute`), `src/app/api/webhooks/stripe/route.ts`

- [ ] `handleChargeDispute(dispute)`: `stripe.charges.retrieve(dispute.charge)` → se `charge.invoice` trova rata per `stripe_invoice_id`; altrimenti se `charge.payment_intent` con `metadata.payment_id` (recupero) usa quella rata. Se trovata e non già insoluta: `stato='failed'`, `recovery_stato='da_recuperare'`, `failure_reason='Addebito stornato/contestato dopo l\\'incasso.'`, `failed_at=now`, `attempts+=1` → `inviaAlertInsoluto`.
- [ ] Route: `case "charge.dispute.created": await handleChargeDispute(...)`.
- [ ] Marco: aggiungere l'evento `charge.dispute.created` al webhook Stripe.
- [ ] `npx tsc --noEmit`. Commit `feat(insoluti): ritorni tardivi (dispute) riaprono l'insoluto`.

### Task 3: Azioni "richiedi nuovo mandato" + "ritenta SEPA"

**Files:** Modify `src/lib/insoluti/actions.ts`, `src/components/internal/insoluti-list.tsx`

- [ ] `azioneNuovoMandato(paymentId)`: risale a `payments.contract_id → contracts.quote_id → quotes.public_token`; costruisce `${SITE}/paga/<token>`; invia email brandizzata ("Aggiorna il metodo di pagamento") al cliente; `recovery_stato='nuovo_mandato'`. Se manca token/email → ritorna il link da inviare a mano.
- [ ] `azioneRitentaSepa(paymentId)`: legge `stripe_invoice_id`; `getStripe().invoices.pay(invoiceId)` (ritenta sul mandato). Errori Stripe gestiti (già pagata / non aperta). L'esito lo scrivono i webhook `invoice.paid`/`payment_failed`. Ritorna ok/errore con messaggio.
- [ ] UI `insoluti-list.tsx`: due pulsanti in più — "Ritenta SEPA" e "Richiedi nuovo mandato" (con conferma). Messaggi di esito inline.
- [ ] `npx tsc --noEmit` + `eslint`. Commit `feat(insoluti): azioni nuovo mandato + ritenta SEPA`.

### Task 4: Verifica + push

- [ ] `npx tsc --noEmit`, `eslint`, curl `/recupero/rec_demotest01` (200). Push.
- [ ] Promemoria Marco: aggiungere evento webhook `charge.dispute.created`.
