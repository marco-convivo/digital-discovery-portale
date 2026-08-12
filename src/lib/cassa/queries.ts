import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type PaymentStato = Database["public"]["Enums"]["payment_stato"];

export interface CassaRata {
  id: string;
  clientId: string;
  ragioneSociale: string;
  numeroRata: number | null;
  importo: number | null;
  scadenza: string | null;
  stato: PaymentStato;
}

export interface CassaBucket {
  key: string;
  label: string;
  items: CassaRata[];
  totale: number;
  ritardo?: boolean;
}

function addGiorni(iso: string, g: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + g);
  return d.toISOString().slice(0, 10);
}

/**
 * Calendario di cassa: le rate attese (scheduled/pending) raggruppate per
 * finestra temporale rispetto a oggi. Gli insoluti (failed) hanno la loro vista.
 */
export async function getCalendarioCassa(): Promise<CassaBucket[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("payments")
    .select(
      "id, numero_rata, importo, scadenza, stato, client:clients!payments_client_id_fkey(id, ragione_sociale)",
    )
    .in("stato", ["scheduled", "pending"])
    .order("scadenza", { ascending: true });

  const rate = ((data ?? []) as unknown as {
    id: string;
    numero_rata: number | null;
    importo: number | null;
    scadenza: string | null;
    stato: PaymentStato;
    client: { id: string; ragione_sociale: string } | null;
  }[])
    .filter((r) => r.client)
    .map((r) => ({
      id: r.id,
      clientId: r.client!.id,
      ragioneSociale: r.client!.ragione_sociale,
      numeroRata: r.numero_rata,
      importo: r.importo,
      scadenza: r.scadenza,
      stato: r.stato,
    }));

  const oggi = new Date().toISOString().slice(0, 10);
  const w1 = addGiorni(oggi, 7);
  const w2 = addGiorni(oggi, 21);

  const def: { key: string; label: string; ritardo?: boolean; test: (s: string) => boolean }[] = [
    { key: "ritardo", label: "In ritardo", ritardo: true, test: (s) => s < oggi },
    { key: "settimana", label: "Questa settimana", test: (s) => s >= oggi && s < w1 },
    { key: "due", label: "Prossime 2 settimane", test: (s) => s >= w1 && s < w2 },
    { key: "oltre", label: "Più avanti", test: (s) => s >= w2 },
  ];

  return def
    .map((b) => {
      const items = rate.filter((r) => (r.scadenza ? b.test(r.scadenza) : b.key === "oltre"));
      return {
        key: b.key,
        label: b.label,
        ritardo: b.ritardo,
        items,
        totale: items.reduce((s, r) => s + Number(r.importo ?? 0), 0),
      };
    })
    .filter((b) => b.items.length > 0);
}
