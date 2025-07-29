export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          created_at: string | null
          id: string
          input_hash: string
          model_used: string
          result_json: Json | null
          tokens_used: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_hash: string
          model_used: string
          result_json?: Json | null
          tokens_used?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_hash?: string
          model_used?: string
          result_json?: Json | null
          tokens_used?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_info: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_plan: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          renewal_date: string | null
          subscription_status: string | null
          updated_at: string | null
          usage_followups: number | null
          usage_proposals: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_plan?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          renewal_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          usage_followups?: number | null
          usage_proposals?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_plan?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          renewal_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          usage_followups?: number | null
          usage_proposals?: number | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      followups: {
        Row: {
          created_at: string | null
          id: string
          message_text: string
          proposal_id: string
          send_suggestion: string | null
          sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_text: string
          proposal_id: string
          send_suggestion?: string | null
          sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_text?: string
          proposal_id?: string
          send_suggestion?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followups_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_name: string
          created_at: string | null
          gst_enabled: boolean | null
          id: string
          invoice_number: string
          issued_on: string | null
          payment_status: string | null
          pdf_url: string | null
          status: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          client_name: string
          created_at?: string | null
          gst_enabled?: boolean | null
          id?: string
          invoice_number: string
          issued_on?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          status?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string | null
          gst_enabled?: boolean | null
          id?: string
          invoice_number?: string
          issued_on?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      project_summaries: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          project_id: string
          summary_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          project_id: string
          summary_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
          summary_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_summaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          ai_response: string | null
          client_name: string | null
          created_at: string | null
          id: string
          project_desc: string
          status: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          project_desc: string
          status?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          project_desc?: string
          status?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          razorpay_id: string | null
          renewal_date: string | null
          start_date: string | null
          status: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          razorpay_id?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          razorpay_id?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tax_estimations: {
        Row: {
          ai_response: string | null
          created_at: string | null
          id: string
          monthly_income: number
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string | null
          id?: string
          monthly_income: number
          user_id: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string | null
          id?: string
          monthly_income?: number
          user_id?: string
        }
        Relationships: []
      }
      usage_stats: {
        Row: {
          created_at: string | null
          followups_used: number | null
          id: string
          month: string
          proposals_used: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          followups_used?: number | null
          id?: string
          month: string
          proposals_used?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          followups_used?: number | null
          id?: string
          month?: string
          proposals_used?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          login_method: string | null
          name: string | null
          profile_picture: string | null
          subscription_tier: string | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          last_active_at?: string | null
          login_method?: string | null
          name?: string | null
          profile_picture?: string | null
          subscription_tier?: string | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          login_method?: string | null
          name?: string | null
          profile_picture?: string | null
          subscription_tier?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          address: string | null
          bank_details: Json | null
          business_name: string | null
          created_at: string | null
          default_currency: string | null
          gst_number: string | null
          invoice_alerts_optin: boolean | null
          proposal_tips_optin: boolean | null
          quarterly_reminder: boolean | null
          tax_regime: string | null
          tax_reminder_optin: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          bank_details?: Json | null
          business_name?: string | null
          created_at?: string | null
          default_currency?: string | null
          gst_number?: string | null
          invoice_alerts_optin?: boolean | null
          proposal_tips_optin?: boolean | null
          quarterly_reminder?: boolean | null
          tax_regime?: string | null
          tax_reminder_optin?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          bank_details?: Json | null
          business_name?: string | null
          created_at?: string | null
          default_currency?: string | null
          gst_number?: string | null
          invoice_alerts_optin?: boolean | null
          proposal_tips_optin?: boolean | null
          quarterly_reminder?: boolean | null
          tax_regime?: string | null
          tax_reminder_optin?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vector_chunks_metadata: {
        Row: {
          chunk_text: string
          client_id: string
          created_at: string | null
          embedding: string | null
          id: string
          project_id: string
          source_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          chunk_text: string
          client_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          project_id: string
          source_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          chunk_text?: string
          client_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          project_id?: string
          source_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_chunks_metadata_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vector_chunks_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      delete_user_account: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      export_user_data: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_or_create_usage_stats: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string | null
          followups_used: number | null
          id: string
          month: string
          proposals_used: number | null
          tokens_used: number | null
          user_id: string
        }
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
