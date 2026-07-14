import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ClienteEsistenteForm } from "@/components/internal/cliente-esistente-form";

export default function NuovoClienteEsistentePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/vendite/clienti"
        className="text-[13px] font-semibold text-text-2 hover:text-text"
      >
        ← Clienti
      </Link>
      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Aggiungi cliente esistente
        </h1>
        <p className="mt-0.5 max-w-[62ch] text-sm text-text-2">
          Per i clienti già attivi con contratto siglato e SDD gestito
          esternamente (es. Banca Sella): li inserisci qui, dai loro l&apos;accesso
          al portale e segni le rate pagate a mano. Al rinnovo passeranno al
          flusso nuovo.
        </p>
      </header>
      <Card>
        <ClienteEsistenteForm />
      </Card>
    </div>
  );
}
