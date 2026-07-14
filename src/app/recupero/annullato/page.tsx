import { Logo } from "@/components/ui/logo";

export default function RecuperoAnnullatoPage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="w-full rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-lg font-extrabold text-text">Pagamento non completato</h1>
        <p className="mt-2 text-sm text-text-2">
          Nessun addebito è stato effettuato. Puoi riprovare dal link che ti
          abbiamo inviato, oppure contattarci per saldare con bonifico.
        </p>
      </div>
    </main>
  );
}
