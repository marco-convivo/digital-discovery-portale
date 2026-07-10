import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPortalClient } from "@/lib/portale/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { euro, dataIt } from "@/lib/format";

export default async function PortaleHome() {
  const client = await getPortalClient();
  if (!client) redirect("/accedi");
  const supabase = await createClient();

  const { data: prossima } = await supabase
    .from("payments")
    .select("numero_rata, importo, scadenza")
    .in("stato", ["scheduled", "pending"])
    .order("scadenza", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { count: rateTotali } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true });
  const { count: ratePagate } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("stato", "paid");
  const { count: serviziAttivi } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true });

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
        Ciao
      </p>
      <h1 className="mt-0.5 mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        {client.ragione_sociale}
      </h1>

      <div className="rounded-card bg-ink p-6 text-on-ink shadow-card">
        <p className="text-[13px] font-medium text-on-ink/70">Prossima rata</p>
        {prossima ? (
          <>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tnum text-4xl font-extrabold">
                {euro(prossima.importo)}
              </span>
              <span className="text-sm text-on-ink/70">
                rata {prossima.numero_rata}
              </span>
            </div>
            <p className="mt-1 text-sm text-on-ink/70">
              in scadenza il {dataIt(prossima.scadenza)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-lg font-bold">Nessuna rata in programma</p>
        )}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Summary
          href="/portale/pagamenti"
          title="Piano pagamenti"
          value={`${ratePagate ?? 0}/${rateTotali ?? 0}`}
          sub="rate pagate"
        />
        <Summary
          href="/portale/servizi"
          title="Servizi"
          value={String(serviziAttivi ?? 0)}
          sub="attivi"
        />
        <Summary
          href="/portale/contratti"
          title="Contratti"
          value="→"
          sub="vedi documenti"
        />
      </div>
    </div>
  );
}

function Summary({
  href,
  title,
  value,
  sub,
}: {
  href: string;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <div className="tnum text-2xl font-extrabold text-text">{value}</div>
        <div className="text-[12.5px] text-text-3">{sub}</div>
      </Card>
    </Link>
  );
}
