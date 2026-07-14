"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<string | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return "Sessione scaduta.";
  const { data } = await sb
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  const p = data as { role: string; active: boolean } | null;
  if (!p || !p.active) return "Accesso non abilitato.";
  if (p.role !== "admin") return "Solo un amministratore può cambiare le impostazioni.";
  return null;
}

export interface AppSettingsInput {
  maggiorazione_insoluto: number;
  iban_bonifico: string;
  causale_bonifico: string;
  statement_descriptor: string;
}

export async function updateAppSettings(
  input: AppSettingsInput,
): Promise<ActionResult> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  if (!(input.maggiorazione_insoluto >= 0))
    return { ok: false, error: "La maggiorazione non può essere negativa." };
  const sb = await createClient();
  const { error } = await sb
    .from("app_settings")
    .update({
      maggiorazione_insoluto: input.maggiorazione_insoluto,
      iban_bonifico: input.iban_bonifico.trim() || null,
      causale_bonifico: input.causale_bonifico.trim() || null,
      statement_descriptor: input.statement_descriptor.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/insoluti");
  return { ok: true };
}
