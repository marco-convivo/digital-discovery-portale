import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClientiList, type ClienteItem } from "@/components/internal/clienti-list";
import { ClienteNuovoDrawer } from "@/components/internal/cliente-nuovo-drawer";

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
    // La lista è una colonna di navigazione attaccata al rail; la scheda occupa
    // il resto. Edge-to-edge (annulla il padding del main), colonne scrollabili.
    <div className="-m-4 flex flex-col sm:-m-6 lg:-m-8 lg:h-[100dvh] lg:flex-row">
      <aside className="flex-none border-b border-line bg-bg lg:w-[304px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h1 className="text-[17px] font-extrabold tracking-[-0.02em] text-text">
              Clienti
            </h1>
            <ClienteNuovoDrawer label="Nuovo" />
          </div>
          <Link
            href="/vendite/clienti/nuovo"
            className="mb-3 inline-block text-[12.5px] font-semibold text-link hover:underline"
          >
            + Cliente già attivo (esistente)
          </Link>
          <ClientiList clienti={clienti} />
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:overflow-y-auto lg:p-8">
        {children}
      </div>
    </div>
  );
}
