import Link from "next/link";
import { euro } from "@/lib/format";
import type { HomeFocus } from "@/lib/home/queries";

/** I tre "focus" numerici in cima alla Home: azionabili, non statistiche. */
export function FocusTiles({ focus }: { focus: HomeFocus }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr]">
      <div className="rounded-[22px] bg-gradient-to-br from-[#8f79f5] via-[#7c8cf7] to-[#7cc0f8] p-5 text-white">
        <div className="flex items-center gap-2 text-[12.5px] font-bold text-white/90">
          <span className="size-[7px] rounded-full bg-white" />
          Da recuperare
        </div>
        <div className="tnum mt-3 text-[34px] font-extrabold leading-none tracking-[-0.035em]">
          {euro(focus.daRecuperare)}
        </div>
        <div className="mt-3.5 flex items-center justify-between">
          <span className="rounded-pill bg-white/25 px-2.5 py-1 text-[11.5px] font-bold">
            {focus.insolutiCount}{" "}
            {focus.insolutiCount === 1 ? "insoluto aperto" : "insoluti aperti"}
          </span>
          <Link
            href="/vendite/insoluti"
            className="rounded-pill bg-white px-3.5 py-1.5 text-[12px] font-extrabold text-[#3b2d80] transition-opacity hover:opacity-90"
          >
            Recupera →
          </Link>
        </div>
      </div>

      <FlatTile
        dot="bg-info-dot"
        label="Task di oggi"
        value={String(focus.taskCount)}
        foot="cose da gestire"
      />
      <FlatTile
        dot="bg-wait-dot"
        label="Scadenze vicine"
        value={String(focus.scadenzeVicine)}
        foot="entro 7 giorni · da rinnovare"
      />
    </div>
  );
}

function FlatTile({
  dot,
  label,
  value,
  foot,
}: {
  dot: string;
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <div className="rounded-[22px] border border-line bg-card p-5">
      <div className="flex items-center gap-2 text-[12.5px] font-bold text-text-3">
        <span className={`size-[7px] rounded-full ${dot}`} />
        {label}
      </div>
      <div className="tnum mt-3 text-[34px] font-extrabold leading-none tracking-[-0.035em] text-text">
        {value}
      </div>
      <div className="mt-3.5 text-[12.5px] font-semibold text-text-2">{foot}</div>
    </div>
  );
}
