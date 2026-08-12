// Transizioni della macchina a stati cliente — UNICA porta di scrittura.
//
// Prima clients.stato veniva scritto direttamente in 13 punti sparsi, con
// guardie diverse e senza actor. Ora ogni transizione passa dalla funzione SQL
// `public.transizione_cliente` (migration 0027), che applica la matrice delle
// transizioni valide, è atomica (SELECT … FOR UPDATE) e registra l'actor in
// activity_log. Una transizione non prevista è un no-op (changed=false), mai
// un errore: i webhook devono restare idempotenti.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type EventoCliente =
  | "preventivo_inviato"
  | "preventivo_chiuso"
  | "contratto_firmato"
  | "primo_incasso"
  | "perso"
  | "riaperto"
  | "cessato";

/** Chi ha causato la transizione (finisce in activity_log.actor_tipo). */
export type ActorTransizione =
  | "staff"
  | "cliente"
  | "webhook:stripe"
  | "webhook:docuseal"
  | `job:${string}`;

export interface EsitoTransizione {
  da: Database["public"]["Enums"]["client_stato"];
  a: Database["public"]["Enums"]["client_stato"];
  /** false = transizione non prevista dallo stato corrente (no-op). */
  changed: boolean;
}

export async function transizioneCliente(
  db: SupabaseClient<Database>,
  clientId: string,
  evento: EventoCliente,
  actor: ActorTransizione,
): Promise<EsitoTransizione> {
  const { data, error } = await db.rpc("transizione_cliente", {
    p_client: clientId,
    p_evento: evento,
    p_actor: actor,
  });
  if (error) throw new Error(`transizione_cliente(${evento}): ${error.message}`);
  return data as unknown as EsitoTransizione;
}
