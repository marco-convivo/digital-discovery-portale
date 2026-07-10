import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client } from "@/lib/types";

/**
 * Risolve il cliente del portale per l'utente loggato. Alla prima apertura
 * collega l'utente (auth) alla sua anagrafica per email (clients.auth_user_id),
 * usando la service role (la RLS non permetterebbe l'update prima del link).
 * Ritorna null se non c'è utente o l'email non corrisponde a nessun cliente.
 */
export async function getPortalClient(): Promise<Client | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // già collegato?
  const { data: linked } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (linked) return linked as Client;

  // primo accesso: collega per email (service role)
  if (!user.email) return null;
  const admin = createAdminClient();
  const { data: match } = await admin
    .from("clients")
    .select("*")
    .ilike("email", user.email)
    .is("auth_user_id", null)
    .maybeSingle();
  if (!match) return null;

  const { data: updated } = await admin
    .from("clients")
    .update({ auth_user_id: user.id })
    .eq("id", match.id)
    .select("*")
    .single();
  return (updated ?? match) as Client;
}
