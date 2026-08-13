"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<{ ok: true; uid: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };
  const { data } = await sb
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  const p = data as { role: string; active: boolean } | null;
  if (!p || !p.active) return { ok: false, error: "Accesso non abilitato." };
  if (p.role !== "admin")
    return { ok: false, error: "Solo un amministratore può gestire gli avvisi." };
  return { ok: true, uid: user.id };
}

/** Nasconde un avviso di scadenza (servizio/contratto che non si vuole rinnovare). */
export async function ignoraAvviso(chiave: string): Promise<ActionResult> {
  const a = await assertAdmin();
  if (!a.ok) return a;
  const sb = await createClient();
  const { error } = await sb
    .from("avviso_stato")
    .upsert(
      { chiave, stato: "ignorato", created_by: a.uid, updated_at: new Date().toISOString() },
      { onConflict: "chiave" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/scadenze");
  return { ok: true };
}

/** Ripristina un avviso precedentemente ignorato. */
export async function ripristinaAvviso(chiave: string): Promise<ActionResult> {
  const a = await assertAdmin();
  if (!a.ok) return a;
  const sb = await createClient();
  const { error } = await sb.from("avviso_stato").delete().eq("chiave", chiave);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/scadenze");
  return { ok: true };
}
