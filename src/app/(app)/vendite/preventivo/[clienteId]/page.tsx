import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrezziBase, getServiziExtra } from "@/lib/catalogo/queries";
import { PreventivoEditor } from "@/components/internal/preventivo-editor";

// 7b Nuovo preventivo — pagina intera (fuori dal master-detail Clienti).
export default async function NuovoPreventivoPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, ragione_sociale, referente, email")
    .eq("id", clienteId)
    .maybeSingle();
  if (!client) notFound();
  const c = client as {
    id: string;
    ragione_sociale: string;
    referente: string | null;
    email: string | null;
  };

  const [prezziBase, serviziExtra] = await Promise.all([
    getPrezziBase(),
    getServiziExtra(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <nav className="flex items-center gap-1.5 text-[13px] font-semibold text-text-3">
          <Link href="/vendite" className="hover:text-text-2">
            Pipeline
          </Link>
          <span>/</span>
          <Link href={`/vendite/clienti/${c.id}`} className="hover:text-text-2">
            {c.ragione_sociale}
          </Link>
          <span>/</span>
          <span className="text-text-2">Nuovo preventivo</span>
        </nav>
        <div className="mt-2 flex items-baseline gap-3">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            Nuovo preventivo
          </h1>
          <span className="text-[13px] font-semibold text-text-3">
            Bozza · numero assegnato solo all&apos;invio
          </span>
        </div>
      </header>

      <PreventivoEditor
        clientId={c.id}
        clientNome={c.ragione_sociale}
        clientReferente={c.referente}
        clientEmail={c.email}
        prezziBase={prezziBase}
        serviziExtra={serviziExtra}
      />
    </div>
  );
}
