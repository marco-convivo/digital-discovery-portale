import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PIPELINE_COLUMNS, columnForStato, isFermo, GIORNI_FERMO } from "@/lib/stati";
import { LeadCard } from "@/components/internal/lead-card";
import { ClienteNuovoDrawer } from "@/components/internal/cliente-nuovo-drawer";
import { euro } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TONE_DOT as DOT } from "@/components/ui/status-pill";
import type { ClientWithOwner } from "@/lib/types";

// Board Pipeline (v0.5: non è più la landing — quella è "Oggi").
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ fermi?: string }>;
}) {
  const { fermi } = await searchParams;
  const soloFermi = fermi === "1";
  const supabase = await createClient();

  const [{ data }, { data: logData }, { data: quoteData }] = await Promise.all([
    supabase
      .from("clients")
      .select("*, owner:profiles!owner_id(id, full_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("client_id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("client_id, importo_totale, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const allClients = (data ?? []) as unknown as ClientWithOwner[];

  const ultimoMap = new Map<string, string>();
  for (const l of (logData ?? []) as { client_id: string | null; created_at: string }[]) {
    if (l.client_id && !ultimoMap.has(l.client_id)) ultimoMap.set(l.client_id, l.created_at);
  }
  const ultimoMovimento = (c: ClientWithOwner) =>
    ultimoMap.get(c.id) ?? c.created_at;

  // Valore della trattativa = importo dell'ultimo preventivo del cliente.
  const valoreMap = new Map<string, number>();
  for (const q of (quoteData ?? []) as {
    client_id: string;
    importo_totale: number | null;
  }[]) {
    if (!valoreMap.has(q.client_id))
      valoreMap.set(q.client_id, Number(q.importo_totale ?? 0));
  }

  const fermiCount = allClients.filter((c) =>
    isFermo(c.stato, ultimoMovimento(c)),
  ).length;

  const clients = soloFermi
    ? allClients.filter((c) => isFermo(c.stato, ultimoMovimento(c)))
    : allClients;
  const byColumn = (key: string) =>
    clients.filter((c) => columnForStato(c.stato) === key);

  return (
    <div className="flex h-full flex-col">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            Pipeline
          </h1>
          <p className="mt-0.5 text-sm text-text-2">
            Le trattative in corso, per fase.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          {(fermiCount > 0 || soloFermi) && (
            <Link
              href={soloFermi ? "/vendite/pipeline" : "/vendite/pipeline?fermi=1"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-btn border px-3 py-2 text-[13px] font-semibold transition-colors",
                soloFermi
                  ? "border-wait-dot bg-wait-bg text-wait-tx"
                  : "border-line-strong text-text-2 hover:text-text",
              )}
            >
              <span className="size-1.5 rounded-full bg-wait-dot" />
              {soloFermi
                ? "Mostra tutte"
                : `Ferme da ${GIORNI_FERMO}+ giorni (${fermiCount})`}
            </Link>
          )}
          <ClienteNuovoDrawer />
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
        {PIPELINE_COLUMNS.map((col) => {
          const items = byColumn(col.key);
          const totale = items.reduce((s, c) => s + (valoreMap.get(c.id) ?? 0), 0);
          return (
            <section key={col.key} className="flex w-[280px] flex-none flex-col">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("size-2 rounded-full", DOT[col.tone])} />
                <span className="text-[14px] font-bold text-text">
                  {col.label}
                </span>
                <span className="text-[13px] font-semibold text-text-3">
                  {items.length}
                </span>
                {totale > 0 && (
                  <span className="tnum ml-auto text-[12.5px] font-semibold text-text-2">
                    {euro(totale)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {items.map((c) => (
                  <LeadCard key={c.id} client={c} ultimoMovimento={ultimoMovimento(c)} />
                ))}
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-text-3">
                    Nessuna trattativa
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
