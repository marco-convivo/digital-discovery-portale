import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AppSettings {
  maggiorazione_insoluto: number;
  iban_bonifico: string | null;
  causale_bonifico: string | null;
  statement_descriptor: string | null;
}

const DEFAULTS: AppSettings = {
  maggiorazione_insoluto: 5,
  iban_bonifico: null,
  causale_bonifico: "Saldo insoluto pratica Digital Discovery",
  statement_descriptor: "DIGITAL DISCOVERY",
};

const COLS =
  "maggiorazione_insoluto, iban_bonifico, causale_bonifico, statement_descriptor";

/** Impostazioni con sessione staff (RLS). */
export async function getAppSettings(): Promise<AppSettings> {
  const sb = await createClient();
  const { data } = await sb
    .from("app_settings")
    .select(COLS)
    .eq("id", true)
    .maybeSingle();
  return (data as AppSettings | null) ?? DEFAULTS;
}

/** Impostazioni in contesto server-role (per webhook / recupero, senza sessione). */
export async function getAppSettingsAdmin(): Promise<AppSettings> {
  const db = createAdminClient();
  const { data } = await db
    .from("app_settings")
    .select(COLS)
    .eq("id", true)
    .maybeSingle();
  return (data as AppSettings | null) ?? DEFAULTS;
}
