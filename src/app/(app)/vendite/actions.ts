"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddLeadResult = { ok: true } | { ok: false; error: string };

export async function addLead(formData: FormData): Promise<AddLeadResult> {
  const ragione_sociale = String(formData.get("ragione_sociale") ?? "").trim();
  if (!ragione_sociale) {
    return { ok: false, error: "La ragione sociale è obbligatoria." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const text = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };

  // stato di default 'lead'; il trigger scrive la riga iniziale in activity_log.
  const { error } = await supabase.from("clients").insert({
    ragione_sociale,
    referente: text("referente"),
    email: text("email"),
    telefono: text("telefono"),
    owner_id: user.id, // "mia" trattativa → modifica consentita al commerciale
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/vendite");
  return { ok: true };
}
