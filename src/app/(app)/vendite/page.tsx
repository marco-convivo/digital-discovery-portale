import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PIPELINE_COLUMNS, columnForStato, isFermo, GIORNI_FERMO } from "@/lib/stati";
import { LeadCard } from "@/components/internal/lead-card";
import { ClienteNuovoDrawer } from "@/components/internal/cliente-nuovo-drawer";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/status-pill";
import type { ClientWithOwner } from "@/lib/types";

const DOT: Record<Tone, string> = {
  paid: "bg-paid-dot",
  info: "bg-info-dot",
  wait: "bg-wait-dot",
  fail: "bg-fail-dot",
  draft: "bg-draft-dot",
};

// Landing CRM (v0.4): la board Pipeline.
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ fermi?: string }>;
}) {
  const { fermi } = await searchParams;
  const soloFermi = fermi === "1";
  const supabase = await createClient();

  const [{ data }, { data: logData }] = await Promise.all([
    supabase
      .from("clients")
      .select("*, owner:profiles!owner_id(id, full_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("client_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const allClients = (data ?? []) as unknown as ClientWithOwner[];

  // Ultimo movimento per cliente = created_at dell'ultima riga di activity_log.
  const ultimoMap = new Map<string, string>();
  for (const l of (logData ?? []) as { client_id: string | null; created_at: string }[]) {
    if (l.client_id && !ultimoMap.has(l.client_id)) ultimoMap.set(l.client_id, l.created_at);
  }
  const ultimoMovimento = (c: ClientWithOwner) =>
    ultimoMap.get(c.id) ?? c.created_at;

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
              href={soloFermi ? "/vendite" : "/vendite?fermi=1"}
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
