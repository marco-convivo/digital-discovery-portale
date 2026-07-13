import { StatusPill } from "@/components/ui/status-pill";

// Ritorno da Stripe dopo confirmSetup. Lo stato reale (mandato/incasso) lo
// conferma il webhook: qui diamo solo il feedback all'utente.
export default async function PagaOkPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_status?: string }>;
}) {
  const { redirect_status } = await searchParams;
  const ok = redirect_status !== "failed";

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="w-full rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <StatusPill tone={ok ? "wait" : "fail"}>
            {ok ? "In attivazione" : "Non riuscito"}
          </StatusPill>
        </div>
        <h1 className="text-lg font-extrabold text-text">
          {ok ? "Grazie, ci siamo quasi" : "Qualcosa è andato storto"}
        </h1>
        <p className="mt-2 text-sm text-text-2">
          {ok
            ? "Stiamo attivando il pagamento. Per l'addebito SEPA la conferma della banca può richiedere qualche giorno. Ti abbiamo inviato un'email per accedere al tuo portale, dove trovi rate, servizi e contratti."
            : "Il metodo di pagamento non è stato confermato. Riprova dal link che ti abbiamo inviato."}
        </p>
        {ok && (
          <a
            href="/accedi"
            className="mt-5 inline-block rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
          >
            Accedi al tuo portale
          </a>
        )}
      </div>
    </main>
  );
}
