import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type RecoveryStato = Database["public"]["Enums"]["recovery_stato"];

export interface InsolutoRow {
  id: string;
  numero_rata: number | null;
  importo: number | null;
  scadenza: string | null;
  failure_code: string | null;
  failure_reason: string | null;
  failed_at: string | null;
  attempts: number;
  recovery_stato: RecoveryStato;
  recovery_url: string | null;
  maggiorazione: number | null;
  contract_id: string | null;
  client: { id: string; ragione_sociale: string } | null;
}

// Gli insoluti "aperti" da lavorare: falliti e non ancora recuperati/annullati.
const APERTI: RecoveryStato[] = ["da_recuperare", "link_inviato", "nuovo_mandato"];

const COLS =
  "id, numero_rata, importo, scadenza, failure_code, failure_reason, failed_at, attempts, recovery_stato, recovery_url, maggiorazione, contract_id, client:clients!payments_client_id_fkey(id, ragione_sociale)";

/** Elenco insoluti aperti (RLS: staff vede i propri secondo owns_client). */
export async function listInsoluti(): Promise<InsolutoRow[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("payments")
    .select(COLS)
    .eq("stato", "failed")
    .in("recovery_stato", APERTI)
    .order("failed_at", { ascending: false, nullsFirst: false });
  return (data ?? []) as unknown as InsolutoRow[];
}

/** Conteggio insoluti aperti (per il badge in sidebar). */
export async function countInsolutiAperti(): Promise<number> {
  const sb = await createClient();
  const { count } = await sb
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("stato", "failed")
    .in("recovery_stato", APERTI);
  return count ?? 0;
}
