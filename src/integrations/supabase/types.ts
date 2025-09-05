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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cowork_sessions: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          host_id: string
          id: string
          invite_code: string
          is_private: boolean
          max_participants: number
          start_time: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          host_id: string
          id?: string
          invite_code: string
          is_private?: boolean
          max_participants?: number
          start_time: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          host_id?: string
          id?: string
          invite_code?: string
          is_private?: boolean
          max_participants?: number
          start_time?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cowork_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          session_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          session_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          session_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cowork_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          linkedin_id: string | null
          linkedin_profile_url: string | null
          name: string
          title: string | null
          updated_at: string
          user_id: string
          virtual_joins_reset_date: string
          virtual_joins_this_month: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          linkedin_id?: string | null
          linkedin_profile_url?: string | null
          name?: string
          title?: string | null
          updated_at?: string
          user_id: string
          virtual_joins_reset_date?: string
          virtual_joins_this_month?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          linkedin_id?: string | null
          linkedin_profile_url?: string | null
          name?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          virtual_joins_reset_date?: string
          virtual_joins_this_month?: number
        }
        Relationships: []
      }
      session_members: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_members_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cowork_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_participations: {
        Row: {
          id: string
          is_virtual: boolean
          joined_at: string
          sprint_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_virtual?: boolean
          joined_at?: string
          sprint_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_virtual?: boolean
          joined_at?: string
          sprint_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_participations_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          paused_at: string | null
          session_id: string
          start_time: string
          started_by: string
          status: string
          title: string
          total_paused_ms: number
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          end_time: string
          id?: string
          paused_at?: string | null
          session_id: string
          start_time?: string
          started_by: string
          status?: string
          title?: string
          total_paused_ms?: number
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          paused_at?: string | null
          session_id?: string
          start_time?: string
          started_by?: string
          status?: string
          title?: string
          total_paused_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "sprints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cowork_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_emails: {
        Row: {
          created_at: string
          email_hash: string
          email_normalized: string
          email_salt: string
          source: Database["public"]["Enums"]["email_source"]
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email_hash: string
          email_normalized: string
          email_salt: string
          source: Database["public"]["Enums"]["email_source"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email_hash?: string
          email_normalized?: string
          email_salt?: string
          source?: Database["public"]["Enums"]["email_source"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_identities: {
        Row: {
          created_at: string
          provider: Database["public"]["Enums"]["app_identity_provider"]
          provider_subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          provider: Database["public"]["Enums"]["app_identity_provider"]
          provider_subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          provider?: Database["public"]["Enums"]["app_identity_provider"]
          provider_subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          created_at: string
          google_place_id: string
          id: string
          latitude: number
          longitude: number
          name: string
          photo_url: string | null
        }
        Insert: {
          address: string
          created_at?: string
          google_place_id: string
          id?: string
          latitude: number
          longitude: number
          name: string
          photo_url?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          google_place_id?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_by_email: {
        Args: { email: string }
        Returns: string
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_session_preview: {
        Args: { invite_code: string }
        Returns: {
          attendee_avatars: string[]
          end_time: string
          host_avatar_url: string
          host_display_name: string
          session_id: string
          start_time: string
          title: string
          venue_name: string
        }[]
      }
      is_admin: {
        Args: { uid?: string }
        Returns: boolean
      }
      upsert_user_email: {
        Args: {
          email: string
          source: Database["public"]["Enums"]["email_source"]
        }
        Returns: string
      }
    }
    Enums: {
      app_identity_provider: "anonymous" | "manual" | "linkedin"
      email_source: "manual" | "linkedin"
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
      app_identity_provider: ["anonymous", "manual", "linkedin"],
      email_source: ["manual", "linkedin"],
    },
  },
} as const
