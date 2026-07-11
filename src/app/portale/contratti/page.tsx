import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { dataIt } from "@/lib/format";

const TONE: Record<string, Tone> = {
  inviato: "info",
  firmato: "paid",
  annullato: "fail",
};

interface ContractRow {
  id: string;
  stato: string;
  signed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
}

export default async function PortaleContratti() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("id, stato, signed_at, signed_pdf_url, created_at")
    .order("created_at", { ascending: false });
  const contratti = (data ?? []) as unknown as ContractRow[];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Contratti
      </h1>
      <Card>
        {contratti.length === 0 ? (
          <p className="text-sm text-text-3">Nessun contratto.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {contratti.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <div className="font-semibold text-text">
                    Contratto{" "}
                    {c.signed_at ? `· firmato il ${dataIt(c.signed_at)}` : ""}
                  </div>
                  <div className="text-[12.5px] text-text-3">
                    Creato {dataIt(c.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={TONE[c.stato] ?? "draft"}>
                    {c.stato}
                  </StatusPill>
                  {c.signed_pdf_url && (
                    <a
                      href={c.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold text-violet hover:underline"
                    >
                      Apri contratto
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
