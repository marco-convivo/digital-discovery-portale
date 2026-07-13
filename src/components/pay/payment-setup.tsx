"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Logo } from "@/components/ui/logo";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import type { PaymentContext } from "@/lib/stripe/setup";

type Props = PaymentContext & { token: string };

function euro(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function PaymentSetup(props: Props) {
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
          <div className="text-[12px] text-text-3">Attiva il pagamento</div>
        </div>
      </div>

      <div className="rounded-card border border-line/60 bg-card p-6 shadow-card">
        <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
          {props.ragioneSociale}
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Preventivo {props.quote.numero ?? "—"}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-3 rounded-md bg-card-2 p-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-text-3">Rata</dt>
            <dd className="text-[15px] font-bold text-text">
              {euro(props.quote.rata_mensile)}
              <span className="text-[12px] font-medium text-text-3">/mese</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-text-3">Durata</dt>
            <dd className="text-[15px] font-bold text-text">
              {props.quote.rate_num ?? "—"} mesi
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-text-3">Totale</dt>
            <dd className="text-[15px] font-bold text-text">
              {euro(props.quote.importo_totale)}
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
          <SetupForm token={props.token} />
        </Elements>

        <p className="mt-4 text-[12px] leading-relaxed text-text-3">
          L&apos;IBAN è gestito direttamente da Stripe: Digital Discovery non lo
          vede né lo conserva. Il mandato è revocabile in ogni momento.
        </p>
      </div>
    </main>
  );
}

function SetupForm({ token }: { token: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${location.origin}/paga/${token}/ok`,
      },
    });
    // Se non c'è redirect, l'errore è immediato (validazione/carta rifiutata).
    if (error) {
      setError(error.message ?? "Errore durante la conferma.");
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
        {pending ? "Attivazione…" : "Attiva il pagamento"}
      </Button>
    </form>
  );
}
