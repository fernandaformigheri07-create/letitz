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
      agent_actions: {
        Row: {
          authorization_level: number
          created_at: string
          error: string | null
          id: string
          input: Json
          intent: string | null
          lead_id: string | null
          result: string | null
          status: string
          summary: string
          thread_id: string | null
          tool: string
          updated_at: string
          user_id: string
        }
        Insert: {
          authorization_level?: number
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          intent?: string | null
          lead_id?: string | null
          result?: string | null
          status?: string
          summary: string
          thread_id?: string | null
          tool: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          authorization_level?: number
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          intent?: string | null
          lead_id?: string | null
          result?: string | null
          status?: string
          summary?: string
          thread_id?: string | null
          tool?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_audit_log: {
        Row: {
          action_id: string | null
          authorized_by: string | null
          created_at: string
          detail: string | null
          error: string | null
          event: string
          id: string
          intent: string | null
          status: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          action_id?: string | null
          authorized_by?: string | null
          created_at?: string
          detail?: string | null
          error?: string | null
          event: string
          id?: string
          intent?: string | null
          status?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Update: {
          action_id?: string | null
          authorized_by?: string | null
          created_at?: string
          detail?: string | null
          error?: string | null
          event?: string
          id?: string
          intent?: string | null
          status?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_threads: {
        Row: {
          context: Json
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      authorizations: {
        Row: {
          granted_at: string
          id: string
          lead_id: string | null
          level: number
          revoked_at: string | null
          scope: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          lead_id?: string | null
          level: number
          revoked_at?: string | null
          scope: string
          user_id?: string
        }
        Update: {
          granted_at?: string
          id?: string
          lead_id?: string | null
          level?: number
          revoked_at?: string | null
          scope?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorizations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_settings: {
        Row: {
          enabled: boolean
          permissions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          permissions?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          enabled?: boolean
          permissions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience: Json
          created_at: string
          id: string
          message: string | null
          name: string
          status: string
          user_id: string
        }
        Insert: {
          audience?: Json
          created_at?: string
          id?: string
          message?: string | null
          name: string
          status?: string
          user_id?: string
        }
        Update: {
          audience?: Json
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          delivery_status: string
          direction: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          delivery_status?: string
          direction: string
          id?: string
          user_id?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          delivery_status?: string
          direction?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string
          created_at: string
          id: string
          interlocutor_type: string | null
          last_intent: string | null
          lead_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          interlocutor_type?: string | null
          last_intent?: string | null
          lead_id?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          interlocutor_type?: string | null
          last_intent?: string | null
          lead_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          action: string | null
          context: string | null
          created_at: string
          due_at: string
          id: string
          kind: string
          lead_id: string | null
          reason: string
          requires_authorization: boolean
          status: string
          user_id: string
        }
        Insert: {
          action?: string | null
          context?: string | null
          created_at?: string
          due_at: string
          id?: string
          kind?: string
          lead_id?: string | null
          reason: string
          requires_authorization?: boolean
          status?: string
          user_id?: string
        }
        Update: {
          action?: string | null
          context?: string | null
          created_at?: string
          due_at?: string
          id?: string
          kind?: string
          lead_id?: string | null
          reason?: string
          requires_authorization?: boolean
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          source: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          source?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          source?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          city: string | null
          company_name: string
          contact_name: string | null
          contact_role: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          justification: string | null
          lead_quality: string
          lead_score: number
          notes: string | null
          phone: string | null
          segment: string | null
          signals: Json
          source: string
          state: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          justification?: string | null
          lead_quality?: string
          lead_score?: number
          notes?: string | null
          phone?: string | null
          segment?: string | null
          signals?: Json
          source?: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          justification?: string | null
          lead_quality?: string
          lead_score?: number
          notes?: string | null
          phone?: string | null
          segment?: string | null
          signals?: Json
          source?: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          next_step: string | null
          signal: string | null
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          next_step?: string | null
          signal?: string | null
          stage?: string
          title: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          next_step?: string | null
          signal?: string | null
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_name: string
          confirmed_by_user: boolean
          created_at: string
          id: string
          lead_id: string | null
          payment_status: string
          service: string | null
          sold_at: string
          user_id: string
          value: number
        }
        Insert: {
          client_name: string
          confirmed_by_user?: boolean
          created_at?: string
          id?: string
          lead_id?: string | null
          payment_status?: string
          service?: string | null
          sold_at?: string
          user_id?: string
          value?: number
        }
        Update: {
          client_name?: string
          confirmed_by_user?: boolean
          created_at?: string
          id?: string
          lead_id?: string | null
          payment_status?: string
          service?: string | null
          sold_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
