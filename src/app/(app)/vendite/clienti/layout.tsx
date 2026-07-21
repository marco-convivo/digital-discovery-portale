import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClientiList, type ClienteItem } from "@/components/internal/clienti-list";
import type { ClientStato } from "@/lib/types";

// "Acquisito" = pratica dal contratto firmato in poi.
const ACQUISITI: ClientStato[] = [
  "contratto_firmato",
  "pagamento_setup",
  "pagamento_attivo",
  "cliente_attivo",
];

interface Row {
  id: string;
  ragione_sociale: string;
  p_iva: string | null;
  referente: string | null;
  email: string | null;
  telefono: string | null;
  stato: ClienteItem["stato"];
  owner: { full_name: string | null } | null;
}

// Master-detail: la lista clienti resta fissa a sinistra (30%), la scheda del
// cliente selezionato appare a destra (70%). Su mobile la lista lascia il posto
// alla scheda quando se ne apre una.
export default async function ClientiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(
      "id, ragione_sociale, p_iva, referente, email, telefono, stato, owner:profiles!owner_id(full_name)",
    )
    .in("stato", ACQUISITI)
    .order("ragione_sociale", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];

  const { data: insData } = await supabase
    .from("payments")
    .select("id, client_id, failed_at")
    .eq("stato", "failed")
    .in("recovery_stato", [
      "da_recuperare",
      "link_inviato",
      "nuovo_mandato",
      "bonifico_in_verifica",
    ])
    .order("failed_at", { ascending: false, nullsFirst: false });
  const insolutiMap = new Map<string, { count: number; paymentId: string }>();
  for (const p of (insData ?? []) as { id: string; client_id: string }[]) {
    const cur = insolutiMap.get(p.client_id);
    if (cur) cur.count += 1;
    else insolutiMap.set(p.client_id, { count: 1, paymentId: p.id });
  }

  const clienti: ClienteItem[] = rows.map((r) => ({
    id: r.id,
    ragione_sociale: r.ragione_sociale,
    p_iva: r.p_iva,
    referente: r.referente,
    email: r.email,
    telefono: r.telefono,
    stato: r.stato,
    owner_name: r.owner?.full_name ?? null,
    insolutoCount: insolutiMap.get(r.id)?.count ?? 0,
    insolutoPaymentId: insolutiMap.get(r.id)?.paymentId ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            Clienti
          </h1>
          <p className="mt-0.5 text-sm text-text-2">
            I clienti acquisiti — contratto firmato. Seleziona per aprire la
            scheda a destra.
          </p>
        </div>
        <Link
          href="/vendite/clienti/nuovo"
          className="inline-flex flex-none rounded-pill bg-ink px-4 py-2 text-[13.5px] font-semibold text-on-ink transition-opacity hover:opacity-90"
        >
          + Cliente esistente
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,30%)_1fr] lg:items-start">
        <div className="lg:sticky lg:top-6">
          <ClientiList clienti={clienti} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
