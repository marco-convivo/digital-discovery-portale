import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettingsAdmin } from "@/lib/settings/app-settings";
import type { Database } from "@/lib/database.types";

type RecoveryStato = Database["public"]["Enums"]["recovery_stato"];

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

const APERTI: RecoveryStato[] = [
  "da_recuperare",
  "link_inviato",
  "nuovo_mandato",
  "bonifico_in_verifica",
];

export interface InsolutoCliente {
  id: string;
  numero_rata: number | null;
  importo: number | null;
  recovery_stato: RecoveryStato;
  recovery_token: string | null;
  failure_reason: string | null;
}

export interface InsolutiClienteData {
  insoluti: InsolutoCliente[];
  maggiorazione: number;
  iban: string | null;
  causale: string | null;
}

/**
 * Insoluti aperti del cliente loggato (per la dashboard). Usa la service role
 * ma è sempre filtrata per il clientId autenticato (risolto in getPortalClient).
 * Garantisce un recovery_token per il link di pagamento carta.
 */
export async function getInsolutiCliente(
  clientId: string,
): Promise<InsolutiClienteData> {
  const db = createAdminClient();
  const { data } = await db
    .from("payments")
    .select("id, numero_rata, importo, recovery_stato, recovery_token")
    .eq("client_id", clientId)
    .eq("stato", "failed")
    .in("recovery_stato", APERTI)
    .order("numero_rata", { ascending: true });

  const rows = (data ?? []) as InsolutoCliente[];

  // Garantisce il token per la pagina di pagamento carta (senza toccare lo stato).
  for (const r of rows) {
    if (!r.recovery_token) {
      const token = `rec_${crypto.randomUUID().replace(/-/g, "")}`;
      await db
        .from("payments")
        .update({
          recovery_token: token,
          recovery_url: `${SITE}/recupero/${token}`,
        })
        .eq("id", r.id);
      r.recovery_token = token;
    }
  }

  const s = await getAppSettingsAdmin();
  return {
    insoluti: rows,
    maggiorazione: Number(s.maggiorazione_insoluto ?? 0),
    iban: s.iban_bonifico,
    causale: s.causale_bonifico,
  };
}
