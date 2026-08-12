import { ClienteNuovoDrawer } from "@/components/internal/cliente-nuovo-drawer";
import {
  getCassaMese,
  getPipelineSegnale,
  getCodaLavoro,
  getMovimentiRecenti,
} from "@/lib/oggi/queries";
import {
  DaChiudere,
  CassaDelMese,
  PipelineSegnaleModulo,
  MovimentiRecenti,
} from "@/components/internal/oggi/moduli";

// Landing CRM v0.5 (1a): "Oggi" — ciò che è fermo, il denaro del mese, la
// pipeline ridotta a segnale, i movimenti recenti. La board sta in /pipeline.
export default async function OggiPage() {
  const [cassa, pipeline, coda, movimenti] = await Promise.all([
    getCassaMese(),
    getPipelineSegnale(),
    getCodaLavoro(),
    getMovimentiRecenti(6),
  ]);

  const oggi = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const nCose = coda.length;

  return (
    <div className="mx-auto max-w-[1720px]">
      <header className="mb-5 flex flex-wrap items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            Oggi
          </h1>
          <p className="mt-0.5 text-sm capitalize text-text-2">
            {oggi}
            <span className="lowercase">
              {" · "}
              {nCose === 0
                ? "niente di fermo"
                : `${nCose} ${nCose === 1 ? "cosa" : "cose"} da chiudere`}
            </span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-btn border border-line-field bg-card px-3 py-2 text-faint sm:flex">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="text-[13.5px]">Cerca cliente, preventivo, rata</span>
          </div>
          <ClienteNuovoDrawer />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-5">
          <DaChiudere items={coda} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <CassaDelMese cassa={cassa} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <PipelineSegnaleModulo seg={pipeline} />
        </div>
        <div className="col-span-12">
          <MovimentiRecenti movimenti={movimenti} />
        </div>
      </div>
    </div>
  );
}
