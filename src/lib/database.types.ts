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
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      app_settings: {
        Row: {
          causale_bonifico: string | null
          iban_bonifico: string | null
          id: boolean
          maggiorazione_insoluto: number
          statement_descriptor: string | null
          updated_at: string
        }
        Insert: {
          causale_bonifico?: string | null
          iban_bonifico?: string | null
          id?: boolean
          maggiorazione_insoluto?: number
          statement_descriptor?: string | null
          updated_at?: string
        }
        Update: {
          causale_bonifico?: string | null
          iban_bonifico?: string | null
          id?: boolean
          maggiorazione_insoluto?: number
          statement_descriptor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      avviso_stato: {
        Row: {
          chiave: string
          created_at: string
          created_by: string | null
          id: string
          snooze_until: string | null
          stato: string
          updated_at: string
        }
        Insert: {
          chiave: string
          created_at?: string
          created_by?: string | null
          id?: string
          snooze_until?: string | null
          stato: string
          updated_at?: string
        }
        Update: {
          chiave?: string
          created_at?: string
          created_by?: string | null
          id?: string
          snooze_until?: string | null
          stato?: string
          updated_at?: string
        }
        Relationships: []
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
          attempts: number
          client_id: string
          contract_id: string | null
          created_at: string
          failed_at: string | null
          failure_code: string | null
          failure_reason: string | null
          id: string
          importo: number | null
          maggiorazione: number | null
          numero_rata: number | null
          paid_at: string | null
          recovery_checkout_id: string | null
          recovery_stato: Database["public"]["Enums"]["recovery_stato"]
          recovery_token: string | null
          recovery_url: string | null
          scadenza: string | null
          stato: Database["public"]["Enums"]["payment_stato"]
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
        }
        Insert: {
          attempts?: number
          client_id: string
          contract_id?: string | null
          created_at?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          importo?: number | null
          maggiorazione?: number | null
          numero_rata?: number | null
          paid_at?: string | null
          recovery_checkout_id?: string | null
          recovery_stato?: Database["public"]["Enums"]["recovery_stato"]
          recovery_token?: string | null
          recovery_url?: string | null
          scadenza?: string | null
          stato?: Database["public"]["Enums"]["payment_stato"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          attempts?: number
          client_id?: string
          contract_id?: string | null
          created_at?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          importo?: number | null
          maggiorazione?: number | null
          numero_rata?: number | null
          paid_at?: string | null
          recovery_checkout_id?: string | null
          recovery_stato?: Database["public"]["Enums"]["recovery_stato"]
          recovery_token?: string | null
          recovery_url?: string | null
          scadenza?: string | null
          stato?: Database["public"]["Enums"]["payment_stato"]
          stripe_invoice_id?: string | null
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
      portfolio_items: {
        Row: {
          cliente: string | null
          created_at: string
          descrizione: string | null
          id: string
          immagine_url: string | null
          link_url: string | null
          ordine: number
          risultato: string | null
          service_id: string
          settore: string | null
          titolo: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          link_url?: string | null
          ordine?: number
          risultato?: string | null
          service_id: string
          settore?: string | null
          titolo: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          link_url?: string | null
          ordine?: number
          risultato?: string | null
          service_id?: string
          settore?: string | null
          titolo?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
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
          addons: Json
          client_id: string
          created_at: string
          id: string
          importo_totale: number | null
          numero: string | null
          ordine: Json | null
          prezzi: Json | null
          public_token: string
          rata_mensile: number | null
          rate_num: number | null
          sconto: number
          stato: Database["public"]["Enums"]["quote_stato"]
          tipo: Database["public"]["Enums"]["quote_tipo"]
          valido_fino: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          addons?: Json
          client_id: string
          created_at?: string
          id?: string
          importo_totale?: number | null
          numero?: string | null
          ordine?: Json | null
          prezzi?: Json | null
          public_token?: string
          rata_mensile?: number | null
          rate_num?: number | null
          sconto?: number
          stato?: Database["public"]["Enums"]["quote_stato"]
          tipo: Database["public"]["Enums"]["quote_tipo"]
          valido_fino?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          addons?: Json
          client_id?: string
          created_at?: string
          id?: string
          importo_totale?: number | null
          numero?: string | null
          ordine?: Json | null
          prezzi?: Json | null
          public_token?: string
          rata_mensile?: number | null
          rate_num?: number | null
          sconto?: number
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
      service_catalog: {
        Row: {
          attivita_escluse: string[]
          attivita_incluse: string[]
          attivo: boolean
          chiave: string
          condizioni: string[]
          descrizione: string | null
          id: string
          immagine_url: string | null
          ordine: number
          prezzo_base: number | null
          sottotitolo: string | null
          titolo: string
          updated_at: string
        }
        Insert: {
          attivita_escluse?: string[]
          attivita_incluse?: string[]
          attivo?: boolean
          chiave: string
          condizioni?: string[]
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          ordine?: number
          prezzo_base?: number | null
          sottotitolo?: string | null
          titolo: string
          updated_at?: string
        }
        Update: {
          attivita_escluse?: string[]
          attivita_incluse?: string[]
          attivo?: boolean
          chiave?: string
          condizioni?: string[]
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          ordine?: number
          prezzo_base?: number | null
          sottotitolo?: string | null
          titolo?: string
          updated_at?: string
        }
        Relationships: []
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
      recovery_stato:
        | "nessuno"
        | "da_recuperare"
        | "link_inviato"
        | "recuperato"
        | "nuovo_mandato"
        | "annullato"
        | "bonifico_in_verifica"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_stato: [
        "lead",
        "preventivo_inviato",
        "preventivo_visto",
        "preventivo_accettato",
        "contratto_inviato",
        "contratto_firmato",
        "pagamento_setup",
        "pagamento_attivo",
        "cliente_attivo",
        "rifiutato",
        "cessato",
      ],
      contract_stato: ["inviato", "firmato", "annullato"],
      payment_metodo: ["sdd", "carta", "bonifico"],
      payment_stato: ["scheduled", "pending", "paid", "failed"],
      profile_role: ["admin", "commerciale"],
      quote_stato: [
        "bozza",
        "inviato",
        "visto",
        "accettato",
        "rifiutato",
        "scaduto",
      ],
      quote_tipo: ["ricorrente", "una_tantum", "acconto"],
      recovery_stato: [
        "nessuno",
        "da_recuperare",
        "link_inviato",
        "recuperato",
        "nuovo_mandato",
        "annullato",
        "bonifico_in_verifica",
      ],
    },
  },
} as const
