import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
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

export default async function ClientiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(
      "id, ragione_sociale, p_iva, referente, email, telefono, stato, owner:profiles!owner_id(full_name)",
    )
    .in("stato", ACQUISITI)
    .order("ragione_sociale", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];
  const clienti: ClienteItem[] = rows.map((r) => ({
    id: r.id,
    ragione_sociale: r.ragione_sociale,
    p_iva: r.p_iva,
    referente: r.referente,
    email: r.email,
    telefono: r.telefono,
    stato: r.stato,
    owner_name: r.owner?.full_name ?? null,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Clienti
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          I clienti acquisiti — contratto firmato. Cerca e apri la scheda
          completa.
        </p>
      </header>

      <Card>
        <ClientiList clienti={clienti} />
      </Card>
    </div>
  );
}
