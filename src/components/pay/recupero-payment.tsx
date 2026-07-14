"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { euro, conIva } from "@/lib/format";
import type { RecoveryContext } from "@/lib/stripe/recupero";

export function RecuperoPayment(props: RecoveryContext) {
  const stripePromise = useMemo(
    () => loadStripe(props.publishableKey),
    [props.publishableKey],
  );

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <Logo />
        <div className="leading-tight">
          <div className="font-bold">Digital Discovery</div>
          <div className="text-[12px] text-text-3">Saldo rata</div>
        </div>
      </div>

      <div className="rounded-card border border-line/60 bg-card p-6 shadow-card">
        <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
          {props.ragioneSociale}
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Saldo della rata {props.numeroRata ?? "—"} rimasta in sospeso.
        </p>

        {props.giaPagato ? (
          <div className="mt-5 rounded-md bg-mint-soft p-5 text-center">
            <div className="mb-1 text-3xl">✓</div>
            <p className="font-bold text-on-mint">Rata già saldata</p>
            <p className="mt-1 text-sm text-text-2">
              Non serve fare altro: risulta pagata.
            </p>
          </div>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-card-2 p-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-text-3">
                  Rata
                </dt>
                <dd className="text-[15px] font-bold text-text tnum">
                  {euro(props.netto - props.maggiorazione)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-text-3">
                  Spese di insoluto
                </dt>
                <dd className="text-[15px] font-bold text-text tnum">
                  {euro(props.maggiorazione)}
                </dd>
              </div>
              <div className="col-span-2 border-t border-line pt-2">
                <dt className="text-[11px] uppercase tracking-wide text-text-3">
                  Totale da saldare
                </dt>
                <dd className="text-[17px] font-extrabold text-text tnum">
                  {euro(conIva(props.netto))}
                  <span className="ml-1 text-[12px] font-medium text-text-3">
                    IVA inclusa
                  </span>
                </dd>
              </div>
            </dl>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: props.clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    colorPrimary: "#222222",
                    colorBackground: "#ffffff",
                    colorText: "#1e1e22",
                    borderRadius: "12px",
                    fontFamily: "Fustat, system-ui, sans-serif",
                  },
                },
              }}
            >
              <PayForm />
            </Elements>

            <p className="mt-4 text-[12px] leading-relaxed text-text-3">
              Pagamento sicuro con carta gestito da Stripe. Digital Discovery non
              conserva i dati della carta.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function PayForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${location.origin}/recupero/ok` },
    });
    if (error) {
      setError(error.message ?? "Errore durante il pagamento.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5">
      <PaymentElement />
      {error && (
        <p className="mt-3 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!stripe || pending} className="mt-5 w-full">
        {pending ? "Pagamento…" : "Salda ora"}
      </Button>
    </form>
  );
}
