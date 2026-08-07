"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inviaAccessoPortale } from "@/lib/portale/welcome";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Stati "pre-attivi": alla prima rata incassata il cliente diventa attivo.
const PRE_ATTIVI = [
  "lead",
  "preventivo_inviato",
  "preventivo_visto",
  "preventivo_accettato",
  "contratto_inviato",
  "contratto_firmato",
  "pagamento_setup",
  "pagamento_attivo",
];

async function assertStaff(): Promise<string | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return "Sessione scaduta.";
  const { data } = await sb
    .from("profiles")
    .select("active")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !(data as { active: boolean }).active)
    return "Accesso non abilitato.";
  return null;
}

/** Segna una rata come pagata (riconciliazione manuale, es. addebito Sella). */
export async function segnaRataPagata(
  paymentId: string,
  pagataIl?: string | null,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const paidAt = pagataIl
    ? new Date(pagataIl + "T12:00:00Z").toISOString()
    : new Date().toISOString();
  const sb = await createClient();
  const { data: pay, error } = await sb
    .from("payments")
    .update({ stato: "paid", paid_at: paidAt })
    .eq("id", paymentId)
    .select("client_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  // Prima rata incassata → attiva il cliente (se ancora pre-attivo) e mandagli
  // l'accesso al portale. Copre bonifico/SDD manuali dove non c'è webhook.
  const clientId = (pay as { client_id: string } | null)?.client_id ?? null;
  if (clientId) {
    const { data: cli } = await sb
      .from("clients")
      .select("stato, email")
      .eq("id", clientId)
      .maybeSingle();
    const c = cli as { stato: string; email: string | null } | null;
    if (c && PRE_ATTIVI.includes(c.stato)) {
      const { data: upd } = await sb
        .from("clients")
        .update({ stato: "cliente_attivo" })
        .eq("id", clientId)
        .not("stato", "in", "(cliente_attivo,cessato,rifiutato)")
        .select("id");
      if (upd && upd.length > 0 && c.email) {
        try {
          await inviaAccessoPortale(c.email);
        } catch {
          // best-effort: l'attivazione è comunque avvenuta
        }
      }
    }
    revalidatePath(`/vendite/clienti/${clientId}`);
  }

  revalidatePath("/vendite/pagamenti");
  return { ok: true };
}

/** Annulla il pagamento manuale di una rata (torna programmata). */
export async function annullaRataPagata(
  paymentId: string,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const sb = await createClient();
  const { error } = await sb
    .from("payments")
    .update({ stato: "scheduled", paid_at: null })
    .eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/pagamenti");
  return { ok: true };
}
