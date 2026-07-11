import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PianoPagamenti, type RataRow } from "@/components/internal/piano-pagamenti";
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
  const gruppi = Array.from(
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
  ).map(([k, rate]) => ({
    key: k,
    contract: k === NONE ? null : contratti.find((c) => c.id === k) ?? null,
    rate,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Piano pagamenti
      </h1>

      {gruppi.length === 0 ? (
        <Card>
          <PianoPagamenti rate={[]} />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {gruppi.map((g) => (
            <Card key={g.key}>
              {gruppi.length > 1 && (
                <div className="mb-3 text-[13px] font-semibold text-text-2">
                  {g.contract?.signed_at
                    ? `Contratto firmato il ${dataIt(g.contract.signed_at)}`
                    : "Piano"}
                </div>
              )}
              <PianoPagamenti rate={g.rate} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
