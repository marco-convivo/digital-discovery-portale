import { createClient } from "@/lib/supabase/server";
import { CassaShell } from "@/components/internal/cassa-shell";
import {
  ScadenzeList,
  type ScadenzaItem,
} from "@/components/internal/scadenze-list";
import { countInsolutiAperti } from "@/lib/insoluti/queries";
import { scadenzeServizi, giorniAllaScadenza } from "@/lib/servizi";
import type { OrdineSelezione } from "@/lib/catalog";

interface Row {
  id: string;
  signed_at: string | null;
  quote: { ordine: OrdineSelezione | null } | null;
  client: { id: string; ragione_sociale: string } | null;
}

export default async function ScadenzePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: avvisiData }, insolutiCount, { data: prof }] =
    await Promise.all([
      supabase
        .from("contracts")
        .select(
          "id, signed_at, quote:quotes!contracts_quote_id_fkey(ordine), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
        )
        .in("stato", ["firmato", "completato"]),
      supabase.from("avviso_stato").select("chiave").eq("stato", "ignorato"),
      countInsolutiAperti(),
      user
        ? supabase.from("profiles").select("role, active").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const p = prof as { role: string; active: boolean } | null;
  const isAdmin = !!p && p.active && p.role === "admin";
  const ignorati = new Set(
    ((avvisiData ?? []) as { chiave: string }[]).map((a) => a.chiave),
  );

  const items: ScadenzaItem[] = [];
  for (const c of (data ?? []) as unknown as Row[]) {
    if (!c.client || !c.signed_at) continue;
    const cid = c.id;
    const servizi = scadenzeServizi(c.quote?.ordine ?? null, c.signed_at).filter(
      (s) => !s.unaTantum && s.scadenzaIso,
    );
    for (const s of servizi) {
      items.push({
        chiave: `svc:${cid}:${s.label}`,
        tipo: "servizio",
        clienteId: c.client.id,
        cliente: c.client.ragione_sociale,
        titolo: s.label,
        scadenzaIso: s.scadenzaIso!,
        giorni: giorniAllaScadenza(s.scadenzaIso!),
      });
    }
    if (servizi.length > 0) {
      const maxSc = servizi.reduce(
        (m, s) => (s.scadenzaIso! > m ? s.scadenzaIso! : m),
        servizi[0].scadenzaIso!,
      );
      items.push({
        chiave: `ctr:${cid}`,
        tipo: "contratto",
        clienteId: c.client.id,
        cliente: c.client.ragione_sociale,
        titolo: "Fine contratto",
        scadenzaIso: maxSc,
        giorni: giorniAllaScadenza(maxSc),
      });
    }
  }

  const visibili = items
    .filter((i) => !ignorati.has(i.chiave))
    .sort((a, b) => a.giorni - b.giorni);
  const urgenti = visibili.filter((i) => i.giorni <= 60).length;

  return (
    <CassaShell active="scadenze" insolutiCount={insolutiCount}>
      <div className="max-w-3xl">
        <p className="mb-4 text-sm text-text-2">
          Scadenze dei servizi ricorrenti e dei contratti, ordinate per urgenza —{" "}
          {urgenti} entro 60 giorni. Clicca per i dettagli e le azioni.
        </p>
        <ScadenzeList items={visibili} isAdmin={isAdmin} />
      </div>
    </CassaShell>
  );
}
