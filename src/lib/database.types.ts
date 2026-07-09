// GENERATO da Supabase (generate_typescript_types) — NON modificare a mano.
// Rigenera con l'MCP Supabase / `supabase gen types` dopo ogni migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          a_stato: Database["public"]["Enums"]["client_stato"] | null
          actor_id: string | null
          azione: string
          client_id: string | null
          created_at: string
          da_stato: Database["public"]["Enums"]["client_stato"] | null
          id: string
        }
        Insert: {
          a_stato?: Database["public"]["Enums"]["client_stato"] | null
          actor_id?: string | null
          azione: string
          client_id?: string | null
          created_at?: string
          da_stato?: Database["public"]["Enums"]["client_stato"] | null
          id?: string
        }
        Update: {
          a_stato?: Database["public"]["Enums"]["client_stato"] | null
          actor_id?: string | null
          azione?: string
          client_id?: string | null
          created_at?: string
          da_stato?: Database["public"]["Enums"]["client_stato"] | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          auth_user_id: string | null
          codice_fiscale: string | null
          codice_sdi: string | null
          created_at: string
          email: string | null
          id: string
          indirizzo: string | null
          owner_id: string | null
          p_iva: string | null
          pec: string | null
          ragione_sociale: string
          referente: string | null
          stato: Database["public"]["Enums"]["client_stato"]
          telefono: string | null
        }
        Insert: {
          auth_user_id?: string | null
          codice_fiscale?: string | null
          codice_sdi?: string | null
          created_at?: string
          email?: string | null
          id?: string
          indirizzo?: string | null
          owner_id?: string | null
          p_iva?: string | null
          pec?: string | null
          ragione_sociale: string
          referente?: string | null
          stato?: Database["public"]["Enums"]["client_stato"]
          telefono?: string | null
        }
        Update: {
          auth_user_id?: string | null
          codice_fiscale?: string | null
          codice_sdi?: string | null
          created_at?: string
          email?: string | null
          id?: string
          indirizzo?: string | null
          owner_id?: string | null
          p_iva?: string | null
          pec?: string | null
          ragione_sociale?: string
          referente?: string | null
          stato?: Database["public"]["Enums"]["client_stato"]
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          docuseal_submission_id: string | null
          id: string
          quote_id: string | null
          signed_at: string | null
          signed_pdf_url: string | null
          stato: Database["public"]["Enums"]["contract_stato"]
        }
        Insert: {
          client_id: string
          created_at?: string
          docuseal_submission_id?: string | null
          id?: string
          quote_id?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          stato?: Database["public"]["Enums"]["contract_stato"]
        }
        Update: {
          client_id?: string
          created_at?: string
          docuseal_submission_id?: string | null
          id?: string
          quote_id?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          stato?: Database["public"]["Enums"]["contract_stato"]
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          data: string | null
          id: string
          importo: number | null
          numero: string | null
          payment_id: string | null
          pdf_url: string | null
          stato: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: string | null
          id?: string
          importo?: number | null
          numero?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          stato?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: string | null
          id?: string
          importo?: number | null
          numero?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          stato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_setups: {
        Row: {
          client_id: string
          contract_id: string | null
          created_at: string
          id: string
          metodo: Database["public"]["Enums"]["payment_metodo"] | null
          stato: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          client_id: string
          contract_id?: string | null
          created_at?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_metodo"] | null
          stato?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          client_id?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_metodo"] | null
          stato?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_setups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_setups_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          client_id: string
          contract_id: string | null
          created_at: string
          id: string
          importo: number | null
          numero_rata: number | null
          paid_at: string | null
          scadenza: string | null
          stato: Database["public"]["Enums"]["payment_stato"]
          stripe_payment_intent_id: string | null
          subscription_id: string | null
        }
        Insert: {
          client_id: string
          contract_id?: string | null
          created_at?: string
          id?: string
          importo?: number | null
          numero_rata?: number | null
          paid_at?: string | null
          scadenza?: string | null
          stato?: Database["public"]["Enums"]["payment_stato"]
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          client_id?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          importo?: number | null
          numero_rata?: number | null
          paid_at?: string | null
          scadenza?: string | null
          stato?: Database["public"]["Enums"]["payment_stato"]
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["profile_role"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["profile_role"]
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["profile_role"]
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          descrizione: string
          id: string
          prezzo_unitario: number
          quantita: number
          quote_id: string
        }
        Insert: {
          descrizione: string
          id?: string
          prezzo_unitario?: number
          quantita?: number
          quote_id: string
        }
        Update: {
          descrizione?: string
          id?: string
          prezzo_unitario?: number
          quantita?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_id: string
          created_at: string
          id: string
          importo_totale: number | null
          numero: string | null
          public_token: string
          rata_mensile: number | null
          rate_num: number | null
          stato: Database["public"]["Enums"]["quote_stato"]
          tipo: Database["public"]["Enums"]["quote_tipo"]
          valido_fino: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          importo_totale?: number | null
          numero?: string | null
          public_token?: string
          rata_mensile?: number | null
          rate_num?: number | null
          stato?: Database["public"]["Enums"]["quote_stato"]
          tipo: Database["public"]["Enums"]["quote_tipo"]
          valido_fino?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          importo_totale?: number | null
          numero?: string | null
          public_token?: string
          rata_mensile?: number | null
          rate_num?: number | null
          stato?: Database["public"]["Enums"]["quote_stato"]
          tipo?: Database["public"]["Enums"]["quote_tipo"]
          valido_fino?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          client_id: string
          contract_id: string | null
          created_at: string
          data_attivazione: string | null
          id: string
          nome: string
          stato: string | null
        }
        Insert: {
          client_id: string
          contract_id?: string | null
          created_at?: string
          data_attivazione?: string | null
          id?: string
          nome: string
          stato?: string | null
        }
        Update: {
          client_id?: string
          contract_id?: string | null
          created_at?: string
          data_attivazione?: string | null
          id?: string
          nome?: string
          stato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_stato:
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
        | "cessato"
      contract_stato: "inviato" | "firmato" | "annullato"
      payment_metodo: "sdd" | "carta" | "bonifico"
      payment_stato: "scheduled" | "pending" | "paid" | "failed"
      profile_role: "admin" | "commerciale"
      quote_stato:
        | "bozza"
        | "inviato"
        | "visto"
        | "accettato"
        | "rifiutato"
        | "scaduto"
      quote_tipo: "ricorrente" | "una_tantum" | "acconto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
