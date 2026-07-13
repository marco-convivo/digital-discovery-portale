import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { type RataRow } from "@/components/internal/piano-pagamenti";
import { PianiPagamento } from "@/components/internal/piani-pagamento";
import { dataIt } from "@/lib/format";

interface Contract {
  id: string;
  signed_at: string | null;
}

export default async function PortalePagamenti() {
  const supabase = await createClient();
  const [{ data: payData }, { data: contrData }] = await Promise.all([
    supabase
      .from("payments")
      .select("numero_rata, importo, scadenza, stato, contract_id")
      .order("numero_rata", { ascending: true }),
    supabase.from("contracts").select("id, signed_at"),
  ]);

  const contratti = (contrData ?? []) as unknown as Contract[];
  const pays = (payData ?? []) as unknown as (RataRow & {
    contract_id: string | null;
  })[];

  const NONE = "__none__";
  const groups = Array.from(
    pays.reduce((map, p) => {
      const k = p.contract_id ?? NONE;
      const arr = map.get(k) ?? [];
      arr.push({
        numero_rata: p.numero_rata,
        importo: p.importo,
        scadenza: p.scadenza,
        stato: p.stato,
      });
      map.set(k, arr);
      return map;
    }, new Map<string, RataRow[]>()),
  ).map(([k, rate]) => {
    const contract = k === NONE ? null : contratti.find((c) => c.id === k) ?? null;
    const label = contract?.signed_at
      ? `Contratto firmato il ${dataIt(contract.signed_at)}`
      : "Piano";
    return { key: k, label, rate };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Piano pagamenti
      </h1>
      <Card>
        <PianiPagamento groups={groups} />
      </Card>
      <p className="mt-3 text-[12.5px] text-text-3">
        Importi indicati al netto (imponibile); l&apos;addebito avviene IVA
        inclusa (22%).
      </p>
    </div>
  );
}
