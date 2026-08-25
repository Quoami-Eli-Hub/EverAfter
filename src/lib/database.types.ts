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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          allow_downloads: boolean
          cover_media_id: number | null
          created_at: string
          description: string | null
          event_id: number
          id: number
          is_public: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          allow_downloads?: boolean
          cover_media_id?: number | null
          created_at?: string
          description?: string | null
          event_id: number
          id?: never
          is_public?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          allow_downloads?: boolean
          cover_media_id?: number | null
          created_at?: string
          description?: string | null
          event_id?: number
          id?: never
          is_public?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          event_id: number | null
          id: number
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          event_id?: number | null
          id?: never
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          event_id?: number | null
          id?: never
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          allow_download: boolean
          byte_size: number
          created_at: string
          document_type: string
          event_id: number
          id: number
          is_public: boolean
          mime_type: string
          storage_path: string
          title: string
        }
        Insert: {
          allow_download?: boolean
          byte_size: number
          created_at?: string
          document_type: string
          event_id: number
          id?: never
          is_public?: boolean
          mime_type: string
          storage_path: string
          title: string
        }
        Update: {
          allow_download?: boolean
          byte_size?: number
          created_at?: string
          document_type?: string
          event_id?: number
          id?: never
          is_public?: boolean
          mime_type?: string
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sections: {
        Row: {
          body: Json
          created_at: string
          event_id: number
          heading: string | null
          id: number
          is_visible: boolean
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body?: Json
          created_at?: string
          event_id: number
          heading?: string | null
          id?: never
          is_visible?: boolean
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body?: Json
          created_at?: string
          event_id?: number
          heading?: string | null
          id?: never
          is_visible?: boolean
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_photo_downloads: boolean
          branding_removed: boolean
          color_key: string
          cover_path: string | null
          created_at: string
          event_date: string | null
          event_type: string
          excerpt: string | null
          font_key: string
          id: number
          max_party_size: number
          owner_id: string
          plan_code: string
          published_at: string | null
          rsvp_deadline: string | null
          rsvp_enabled: boolean
          slug: string
          status: string
          storage_limit_bytes: number
          storage_used_bytes: number
          theme_key: string
          timezone: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_photo_downloads?: boolean
          branding_removed?: boolean
          color_key?: string
          cover_path?: string | null
          created_at?: string
          event_date?: string | null
          event_type: string
          excerpt?: string | null
          font_key?: string
          id?: never
          max_party_size?: number
          owner_id: string
          plan_code?: string
          published_at?: string | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean
          slug: string
          status?: string
          storage_limit_bytes?: number
          storage_used_bytes?: number
          theme_key?: string
          timezone?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_photo_downloads?: boolean
          branding_removed?: boolean
          color_key?: string
          cover_path?: string | null
          created_at?: string
          event_date?: string | null
          event_type?: string
          excerpt?: string | null
          font_key?: string
          id?: never
          max_party_size?: number
          owner_id?: string
          plan_code?: string
          published_at?: string | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean
          slug?: string
          status?: string
          storage_limit_bytes?: number
          storage_used_bytes?: number
          theme_key?: string
          timezone?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          album_id: number | null
          allow_download: boolean
          byte_size: number
          caption: string | null
          created_at: string
          event_id: number
          height: number | null
          id: number
          is_public: boolean
          media_type: string
          mime_type: string
          original_name: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          album_id?: number | null
          allow_download?: boolean
          byte_size: number
          caption?: string | null
          created_at?: string
          event_id: number
          height?: number | null
          id?: never
          is_public?: boolean
          media_type: string
          mime_type: string
          original_name: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          album_id?: number | null
          allow_download?: boolean
          byte_size?: number
          caption?: string | null
          created_at?: string
          event_id?: number
          height?: number | null
          id?: never
          is_public?: boolean
          media_type?: string
          mime_type?: string
          original_name?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          onboarding_complete: boolean
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          onboarding_complete?: boolean
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          attending: boolean
          checked_in_at: string | null
          created_at: string
          event_id: number
          guest_name: string
          id: number
          note: string | null
          party_size: number
          phone: string
          updated_at: string
        }
        Insert: {
          attending: boolean
          checked_in_at?: string | null
          created_at?: string
          event_id: number
          guest_name: string
          id?: never
          note?: string | null
          party_size?: number
          phone: string
          updated_at?: string
        }
        Update: {
          attending?: boolean
          checked_in_at?: string | null
          created_at?: string
          event_id?: number
          guest_name?: string
          id?: never
          note?: string | null
          party_size?: number
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          event_id: number
          id: number
          is_public: boolean
          sort_order: number
          starts_at: string
          title: string
          venue_id: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id: number
          id?: never
          is_public?: boolean
          sort_order?: number
          starts_at: string
          title: string
          venue_id?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id?: number
          id?: never
          is_public?: boolean
          sort_order?: number
          starts_at?: string
          title?: string
          venue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      tributes: {
        Row: {
          author_name: string
          created_at: string
          event_id: number
          id: number
          message: string
          moderated_at: string | null
          status: string
        }
        Insert: {
          author_name: string
          created_at?: string
          event_id: number
          id?: never
          message: string
          moderated_at?: string | null
          status?: string
        }
        Update: {
          author_name?: string
          created_at?: string
          event_id?: number
          id?: never
          message?: string
          moderated_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tributes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          created_at: string
          directions: string | null
          event_id: number
          id: number
          is_public: boolean
          latitude: number | null
          longitude: number | null
          map_url: string | null
          name: string
          sort_order: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          directions?: string | null
          event_id: number
          id?: never
          is_public?: boolean
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          directions?: string | null
          event_id?: number
          id?: never
          is_public?: boolean
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "venues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_event_password: { Args: { p_event_id: number }; Returns: undefined }
      create_event: {
        Args: {
          p_event_date?: string
          p_event_type: string
          p_slug: string
          p_title: string
        }
        Returns: number
      }
      get_event_gate: {
        Args: { p_slug: string }
        Returns: { event_type: string; title: string; visibility: string }[]
      }
      set_event_password: {
        Args: { p_event_id: number; p_password: string }
        Returns: undefined
      }
      unlock_event: {
        Args: { p_password: string; p_slug: string }
        Returns: string
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
