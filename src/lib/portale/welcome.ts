import "server-only";
import { createClient } from "@supabase/supabase-js";

// URL pubblico dell'app (il webhook non ha un "origin" di richiesta).
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

/**
 * Invia al cliente il magic link di accesso al portale (via SMTP Supabase/Resend).
 * Chiamato a pagamento attivato. Best-effort: gli errori NON devono mai rompere
 * l'attivazione del pagamento (il portale resta comunque accessibile da /accedi).
 */
export async function inviaAccessoPortale(
  email: string | null | undefined,
): Promise<void> {
  if (!email) return;
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE}/auth/callback?next=/portale`,
        shouldCreateUser: true,
      },
    });
  } catch {
    // best-effort: ignora (il pagamento è già attivo)
  }
}
