import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase per Server Components / Route Handlers / Server Actions.
 * Rispetta la RLS (usa la sessione dell'utente dai cookie). Va creato per
 * richiesta perché legge i cookie di Next.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Nei Server Components la scrittura dei cookie può fallire: la
          // gestisce il middleware al refresh della sessione. Ignoriamo qui.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op
          }
        },
      },
    },
  );
}
