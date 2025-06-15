export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
