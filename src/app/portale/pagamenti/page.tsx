import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PianoPagamenti, type RataRow } from "@/components/internal/piano-pagamenti";

export default async function PortalePagamenti() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("numero_rata, importo, scadenza, stato")
    .order("numero_rata", { ascending: true });
  const rate = (data ?? []) as unknown as RataRow[];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Piano pagamenti
      </h1>
      <Card>
        <PianoPagamenti rate={rate} />
      </Card>
    </div>
  );
}
