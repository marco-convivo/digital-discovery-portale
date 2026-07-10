import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase con la SERVICE ROLE — bypassa la RLS.
 * Solo per contesti server SENZA sessione utente (webhook Stripe/DocuSeal, che
 * fanno avanzare la macchina a stati per conto del sistema). Non importare MAI
 * in codice client né in route con sessione utente.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
