"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Il cliente dichiara di aver saldato l'insoluto con bonifico. Verifica che la
 * rata appartenga al cliente loggato, poi segna "bonifico_in_verifica" (via
 * service role: la RLS non consente scritture su payments al cliente).
 */
export async function dichiaraBonifico(
  paymentId: string,
): Promise<ActionResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const { data: client } = await sb
    .from("clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const clientId = (client as { id: string } | null)?.id;
  if (!clientId) return { ok: false, error: "Cliente non trovato." };

  const db = createAdminClient();
  const { data: pay } = await db
    .from("payments")
    .select("id")
    .eq("id", paymentId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!pay) return { ok: false, error: "Rata non trovata." };

  const { error } = await db
    .from("payments")
    .update({ recovery_stato: "bonifico_in_verifica" })
    .eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portale");
  return { ok: true };
}
