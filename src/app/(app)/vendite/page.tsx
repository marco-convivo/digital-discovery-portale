import { createClient } from "@/lib/supabase/server";
import { PIPELINE_COLUMNS, columnForStato } from "@/lib/stati";
import { LeadCard } from "@/components/internal/lead-card";
import { AddLeadDialog } from "@/components/internal/add-lead-dialog";
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

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*, owner:profiles!owner_id(id, full_name)")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as unknown as ClientWithOwner[];
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
        <AddLeadDialog />
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
                  <LeadCard key={c.id} client={c} />
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
