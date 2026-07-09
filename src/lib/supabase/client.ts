import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/** Client Supabase per i componenti client (browser). Usa la chiave pubblica. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
