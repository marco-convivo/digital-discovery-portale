// Tipi di dominio derivati dai tipi generati da Supabase (database.types.ts).
// Rigenera database.types.ts dopo ogni migration; questi alias seguono da soli.
import type { Database } from "@/lib/database.types";

export type ClientStato = Database["public"]["Enums"]["client_stato"];
export type ProfileRole = Database["public"]["Enums"]["profile_role"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];

/** Il cliente con il nome del proprietario (join su profiles) — per le card della board. */
export interface ClientWithOwner extends Client {
  owner: Pick<Profile, "id" | "full_name"> | null;
}
