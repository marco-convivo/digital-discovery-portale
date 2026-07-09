import { StatusPill } from "@/components/ui/status-pill";
import { STATO_META } from "@/lib/stati";
import type { ClientWithOwner } from "@/lib/types";

function initials(name: string | null): string {
  if (!name) return "—";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function eta(created_at: string): string {
  const days = Math.floor(
    (Date.now() - new Date(created_at).getTime()) / 86_400_000,
  );
  if (days <= 0) return "oggi";
  if (days === 1) return "ieri";
  return `${days} giorni fa`;
}

export function LeadCard({ client }: { client: ClientWithOwner }) {
  const meta = STATO_META[client.stato];
  const sub = client.referente ?? client.email;

  return (
    <article className="rounded-md border border-line bg-card p-3.5 shadow-card transition-shadow hover:shadow-md">
      <div className="text-[14px] font-bold text-text">
        {client.ragione_sociale}
      </div>
      {sub && <div className="mt-0.5 text-[12.5px] text-text-2">{sub}</div>}

      <div className="mt-3 flex items-center justify-between">
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        <span
          className="grid size-6 place-items-center rounded-[7px] bg-card-2 text-[10.5px] font-bold text-text-2"
          title={client.owner?.full_name ?? "Non assegnato"}
        >
          {initials(client.owner?.full_name ?? null)}
        </span>
      </div>

      <div className="mt-2.5 text-[11.5px] text-text-3">
        Aggiunto · {eta(client.created_at)}
      </div>
    </article>
  );
}
