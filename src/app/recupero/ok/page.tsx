import { Logo } from "@/components/ui/logo";

export default function RecuperoOkPage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="w-full rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <div className="mb-2 text-4xl">✓</div>
        <h1 className="text-lg font-extrabold text-text">Pagamento ricevuto</h1>
        <p className="mt-2 text-sm text-text-2">
          Grazie: la rata risulta saldata. Non devi fare altro. Trovi tutto nel tuo
          portale.
        </p>
      </div>
    </main>
  );
}
