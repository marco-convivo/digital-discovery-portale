"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Ritorna l'id dell'utente corrente SOLO se è admin attivo, altrimenti null.
async function currentAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .maybeSingle();
  const p = data as { id: string; role: ProfileRole; active: boolean } | null;
  if (!p || !p.active || p.role !== "admin") return null;
  return p.id;
}

/** Abilita/disabilita un membro dello staff. Un admin non può disattivarsi. */
export async function setUserActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const adminId = await currentAdminId();
  if (!adminId)
    return { ok: false, error: "Solo un amministratore può gestire gli utenti." };
  if (id === adminId && !active)
    return { ok: false, error: "Non puoi disattivare il tuo stesso account." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/utenti");
  return { ok: true };
}

/** Cambia il ruolo. Un admin non può togliersi il ruolo di admin da solo. */
export async function setUserRole(
  id: string,
  role: ProfileRole,
): Promise<ActionResult> {
  const adminId = await currentAdminId();
  if (!adminId)
    return { ok: false, error: "Solo un amministratore può gestire gli utenti." };
  if (id === adminId && role !== "admin")
    return {
      ok: false,
      error: "Non puoi rimuovere a te stesso il ruolo di amministratore.",
    };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/utenti");
  return { ok: true };
}
