import { getCodaLavoro, getCassaMese } from "@/lib/oggi/queries";
import { CodaLavoro } from "@/components/internal/oggi/coda-lavoro";
import { CassaDelMese } from "@/components/internal/oggi/moduli";

// Coda di lavoro (1b) — tutte le pratiche ordinate per urgenza, con la cassa
// del mese di fianco. È la vista estesa del "Da chiudere" della home.
export default async function LavoroPage() {
  const [coda, cassa] = await Promise.all([getCodaLavoro(), getCassaMese()]);

  return (
    <div className="mx-auto max-w-[1720px]">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Lavoro
        </h1>
        <span className="text-sm text-text-2">
          {coda.length} {coda.length === 1 ? "pratica" : "pratiche"} · ordinate per urgenza
        </span>
      </header>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <CodaLavoro items={coda} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <CassaDelMese cassa={cassa} />
        </div>
      </div>
    </div>
  );
}
