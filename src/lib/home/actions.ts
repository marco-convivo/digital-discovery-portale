"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvvisoResult = { ok: true } | { ok: false; error: string };

async function upsertAvviso(
  chiave: string,
  stato: "ignorato" | "rimandato",
  snoozeUntil: string | null,
): Promise<AvvisoResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non autorizzato." };

  const { error } = await sb.from("avviso_stato").upsert(
    {
      chiave,
      stato,
      snooze_until: snoozeUntil,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "chiave" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/vendite");
  return { ok: true };
}

/** "Fatto": l'avviso non ricompare più. */
export async function ignoraAvviso(chiave: string): Promise<AvvisoResult> {
  return upsertAvviso(chiave, "ignorato", null);
}

/** "Rimanda": nascondi l'avviso per 7 giorni, poi ricompare. */
export async function rimandaAvviso(chiave: string): Promise<AvvisoResult> {
  const until = new Date(Date.now() + 7 * 86_400_000).toISOString();
  return upsertAvviso(chiave, "rimandato", until);
}
