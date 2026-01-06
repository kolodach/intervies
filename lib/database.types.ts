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
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pricing: {
        Row: {
          cached_input_price_per_token: number
          created_at: string | null
          id: string
          input_price_per_token: number
          model: string
          output_price_per_token: number
          state: string
          updated_at: string | null
        }
        Insert: {
          cached_input_price_per_token?: number
          created_at?: string | null
          id?: string
          input_price_per_token: number
          model: string
          output_price_per_token: number
          state?: string
          updated_at?: string | null
        }
        Update: {
          cached_input_price_per_token?: number
          created_at?: string | null
          id?: string
          input_price_per_token?: number
          model?: string
          output_price_per_token?: number
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          cached_input_tokens: number
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type_enum"]
          id: string
          input_tokens: number
          output_tokens: number
          price_id: string
          timestamp: string
          total_cost_usd: number
          user_id: string
        }
        Insert: {
          cached_input_tokens?: number
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type_enum"]
          id?: string
          input_tokens?: number
          output_tokens?: number
          price_id: string
          timestamp?: string
          total_cost_usd: number
          user_id: string
        }
        Update: {
          cached_input_tokens?: number
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type_enum"]
          id?: string
          input_tokens?: number
          output_tokens?: number
          price_id?: string
          timestamp?: string
          total_cost_usd?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "ai_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          categories: string[]
          created_at: string | null
          description: string
          difficulty: string
          evaluation_criteria: Json
          id: string
          is_active: boolean | null
          requirements: Json
          sample_requirements: string[]
          tags: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          categories?: string[]
          created_at?: string | null
          description: string
          difficulty: string
          evaluation_criteria?: Json
          id?: string
          is_active?: boolean | null
          requirements?: Json
          sample_requirements?: string[]
          tags?: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          categories?: string[]
          created_at?: string | null
          description?: string
          difficulty?: string
          evaluation_criteria?: Json
          id?: string
          is_active?: boolean | null
          requirements?: Json
          sample_requirements?: string[]
          tags?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          board_state: Json
          concluded_at: string | null
          conversation: Json
          created_at: string | null
          evaluated_at: string | null
          evaluation: Json | null
          evaluation_checklist: Json | null
          id: string
          prev_board_state: Json
          problem_id: string
          state: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          board_state?: Json
          concluded_at?: string | null
          conversation?: Json
          created_at?: string | null
          evaluated_at?: string | null
          evaluation?: Json | null
          evaluation_checklist?: Json | null
          id?: string
          prev_board_state?: Json
          problem_id: string
          state?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          board_state?: Json
          concluded_at?: string | null
          conversation?: Json
          created_at?: string | null
          evaluated_at?: string | null
          evaluation?: Json | null
          evaluation_checklist?: Json | null
          id?: string
          prev_board_state?: Json
          problem_id?: string
          state?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          name: string
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          user_id?: string
        }
        Update: {
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          status: string
          stripe_customer_id: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          is_admin: boolean | null
          name: string | null
        }
        Insert: {
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          is_admin?: boolean | null
          name?: string | null
        }
        Update: {
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          is_admin?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_user_by_clerk_id: { Args: { clerk_id: string }; Returns: string }
    }
    Enums: {
      entity_type_enum: "solution" | "evaluation"
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
      entity_type_enum: ["solution", "evaluation"],
    },
  },
} as const

