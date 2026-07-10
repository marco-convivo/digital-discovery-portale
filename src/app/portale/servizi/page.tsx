import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { dataIt } from "@/lib/format";

interface ServiceRow {
  id: string;
  nome: string;
  stato: string | null;
  data_attivazione: string | null;
}

export default async function PortaleServizi() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, nome, stato, data_attivazione")
    .order("created_at", { ascending: false });
  const servizi = (data ?? []) as unknown as ServiceRow[];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Servizi
      </h1>
      <Card>
        {servizi.length === 0 ? (
          <p className="text-sm text-text-3">Nessun servizio attivo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {servizi.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <div className="font-semibold text-text">{s.nome}</div>
                  {s.data_attivazione && (
                    <div className="text-[12.5px] text-text-3">
                      Attivo dal {dataIt(s.data_attivazione)}
                    </div>
                  )}
                </div>
                <StatusPill tone="paid">{s.stato ?? "attivo"}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
