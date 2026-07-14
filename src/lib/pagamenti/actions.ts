"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
  const { error } = await sb
    .from("payments")
    .update({ stato: "paid", paid_at: paidAt })
    .eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
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
