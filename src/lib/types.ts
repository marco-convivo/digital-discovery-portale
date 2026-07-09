// Tipi di dominio — riflettono gli enum e le tabelle delle migration (supabase/).
// Finché non c'è una connessione al progetto DD per generare i tipi da Supabase,
// li teniamo a mano per le tabelle toccate in FASE 1.

export type ClientStato =
  | "lead"
  | "preventivo_inviato"
  | "preventivo_visto"
  | "preventivo_accettato"
  | "contratto_inviato"
  | "contratto_firmato"
  | "pagamento_setup"
  | "pagamento_attivo"
  | "cliente_attivo"
  | "rifiutato"
  | "cessato";

export type ProfileRole = "admin" | "commerciale";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: ProfileRole;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  ragione_sociale: string;
  p_iva: string | null;
  codice_fiscale: string | null;
  codice_sdi: string | null;
  pec: string | null;
  indirizzo: string | null;
  referente: string | null;
  email: string | null;
  telefono: string | null;
  stato: ClientStato;
  owner_id: string | null;
  auth_user_id: string | null;
  created_at: string;
}

/** Il cliente con il nome del proprietario (join su profiles) — per le card della board. */
export interface ClientWithOwner extends Client {
  owner: Pick<Profile, "id" | "full_name"> | null;
}
