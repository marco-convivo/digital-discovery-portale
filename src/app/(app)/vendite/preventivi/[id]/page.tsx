import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateQuoteForm } from "@/components/internal/create-quote-form";
import { getPrezziBase } from "@/lib/catalogo/queries";
import type { OrdineSelezione } from "@/lib/catalog";

const EDITABILI = ["bozza", "inviato", "visto"];

interface QuoteRow {
  id: string;
  client_id: string;
  numero: string | null;
  stato: string;
  tipo: "ricorrente" | "una_tantum" | "acconto";
  rate_num: number | null;
  valido_fino: string | null;
  ordine: OrdineSelezione | null;
  prezzi: Record<string, number> | null;
  sconto: number | null;
}

export default async function ModificaPreventivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select(
      "id, client_id, numero, stato, tipo, rate_num, valido_fino, ordine, prezzi, sconto",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const q = data as unknown as QuoteRow;
  const prezziBase = await getPrezziBase();
  const editabile = EDITABILI.includes(q.stato);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/vendite/clienti/${q.client_id}`}
        className="text-[13px] font-semibold text-text-2 hover:text-text"
      >
        ← Scheda cliente
      </Link>
      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Modifica preventivo {q.numero ?? ""}
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Puoi modificarlo finché non viene accettato. Il link pubblico resta lo
          stesso.
        </p>
      </header>

      {editabile ? (
        <Card>
          <CardHeader>
            <CardTitle>Preventivo</CardTitle>
          </CardHeader>
          <CreateQuoteForm
            clientId={q.client_id}
            prezziBase={prezziBase}
            initial={{
              quoteId: q.id,
              ordine: q.ordine ?? {},
              prezzi: q.prezzi ?? {},
              sconto: Number(q.sconto ?? 0),
              tipo: q.tipo,
              rateNum: q.rate_num,
              validoFino: q.valido_fino,
            }}
          />
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="font-bold text-text">Non più modificabile</p>
          <p className="mt-1 text-sm text-text-2">
            Questo preventivo è già stato accettato o chiuso. Per cambiarlo,
            creane uno nuovo dalla scheda cliente.
          </p>
          <Link
            href={`/vendite/clienti/${q.client_id}`}
            className="mt-4 inline-flex rounded-pill bg-ink px-4 py-2 text-[13.5px] font-semibold text-on-ink hover:opacity-90"
          >
            Vai alla scheda cliente
          </Link>
        </Card>
      )}
    </div>
  );
}
