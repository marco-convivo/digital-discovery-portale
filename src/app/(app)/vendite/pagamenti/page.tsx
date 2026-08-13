import Link from "next/link";
import { getCassaMese } from "@/lib/oggi/queries";
import { getCalendarioCassa } from "@/lib/cassa/queries";
import { countInsolutiAperti } from "@/lib/insoluti/queries";
import { CassaShell } from "@/components/internal/cassa-shell";
import { CassaDelMese } from "@/components/internal/oggi/moduli";
import { CalendarioBuckets } from "@/components/internal/calendario-buckets";

// Cassa · Calendario: le rate attese per finestra temporale + il denaro del mese.
export default async function CalendarioCassaPage() {
  const [cassa, buckets, insolutiCount] = await Promise.all([
    getCassaMese(),
    getCalendarioCassa(),
    countInsolutiAperti(),
  ]);

  return (
    <CassaShell active="calendario" insolutiCount={insolutiCount}>
      {insolutiCount > 0 && (
        <Link
          href="/vendite/insoluti"
          className="mb-4 flex items-center gap-2.5 rounded-crm border border-fail-dot bg-fail-bg px-4 py-3 text-[13.5px] font-semibold text-fail-tx"
        >
          <span className="size-1.5 rounded-full bg-fail-dot" />
          {insolutiCount}{" "}
          {insolutiCount === 1 ? "addebito da recuperare" : "addebiti da recuperare"} — vai agli insoluti →
        </Link>
      )}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <CalendarioBuckets buckets={buckets} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <CassaDelMese cassa={cassa} />
        </div>
      </div>
    </CassaShell>
  );
}
