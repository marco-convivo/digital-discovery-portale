import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { euro, dataIt } from "@/lib/format";

interface InvoiceRow {
  id: string;
  numero: string | null;
  data: string | null;
  importo: number | null;
  pdf_url: string | null;
}

export default async function PortaleFatture() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, numero, data, importo, pdf_url")
    .order("data", { ascending: false });
  const fatture = (data ?? []) as unknown as InvoiceRow[];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Fatture
      </h1>
      <Card>
        {fatture.length === 0 ? (
          <p className="text-sm text-text-3">Nessuna fattura disponibile.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {fatture.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <div className="font-semibold text-text">{f.numero ?? "—"}</div>
                  <div className="text-[12.5px] text-text-3">{dataIt(f.data)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-text">{euro(f.importo)}</span>
                  {f.pdf_url && (
                    <a
                      href={f.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold text-violet hover:underline"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
