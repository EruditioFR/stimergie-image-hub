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
      album_images: {
        Row: {
          album_id: string
          created_at: string
          id: string
          image_id: number
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          image_id: number
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          image_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "album_images_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          access_from: string
          access_until: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          recipients: string[]
          share_key: string
          updated_at: string
        }
        Insert: {
          access_from: string
          access_until: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          recipients?: string[]
          share_key: string
          updated_at?: string
        }
        Update: {
          access_from?: string
          access_until?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          recipients?: string[]
          share_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          category: string | null
          client_id: string | null
          content: string
          content_type: string | null
          created_at: string
          dropbox_image_url: string | null
          featured_image_url: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
          url_miniature: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          client_id?: string | null
          content: string
          content_type?: string | null
          created_at?: string
          dropbox_image_url?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
          url_miniature?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          client_id?: string | null
          content?: string
          content_type?: string | null
          created_at?: string
          dropbox_image_url?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          url_miniature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_principal: string | null
          created_at: string
          email: string | null
          id: string
          logo: string | null
          nom: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          contact_principal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          nom: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          contact_principal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          nom?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      download_requests: {
        Row: {
          created_at: string
          download_url: string
          error_details: string | null
          expires_at: string
          id: string
          image_id: string
          image_src: string
          image_title: string
          is_hd: boolean
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_url: string
          error_details?: string | null
          expires_at?: string
          id?: string
          image_id: string
          image_src: string
          image_title: string
          is_hd?: boolean
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_url?: string
          error_details?: string | null
          expires_at?: string
          id?: string
          image_id?: string
          image_src?: string
          image_title?: string
          is_hd?: boolean
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          height: number | null
          id: number
          id_projet: string
          orientation: string | null
          tags: string | null
          title: string
          updated_at: string
          url: string
          url_miniature: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          height?: number | null
          id?: number
          id_projet: string
          orientation?: string | null
          tags?: string | null
          title: string
          updated_at?: string
          url: string
          url_miniature?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          height?: number | null
          id?: number
          id_projet?: string
          orientation?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
          url?: string
          url_miniature?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_id_projet_fkey"
            columns: ["id_projet"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          page_type: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          page_type: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          page_type?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      logs_erreurs: {
        Row: {
          date: string | null
          erreur: string | null
          id: number
          image_url: string | null
          source: string | null
        }
        Insert: {
          date?: string | null
          erreur?: string | null
          id?: number
          image_url?: string | null
          source?: string | null
        }
        Update: {
          date?: string | null
          erreur?: string | null
          id?: number
          image_url?: string | null
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          id_client: string | null
          last_name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          id_client?: string | null
          last_name?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          id_client?: string | null
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_client_fkey"
            columns: ["id_client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      project_access_periods: {
        Row: {
          access_end: string
          access_start: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          project_id: string
          updated_at: string
        }
        Insert: {
          access_end: string
          access_start: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          project_id: string
          updated_at?: string
        }
        Update: {
          access_end?: string
          access_start?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_periods_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      projets: {
        Row: {
          created_at: string
          id: string
          id_client: string
          nom_dossier: string | null
          nom_projet: string
          type_projet: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_client: string
          nom_dossier?: string | null
          nom_projet: string
          type_projet?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_client?: string
          nom_dossier?: string | null
          nom_projet?: string
          type_projet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projets_id_client_fkey"
            columns: ["id_client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_password: {
        Args: { user_id: string; new_password: string }
        Returns: boolean
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_can_access_client: {
        Args: { client_id: string }
        Returns: boolean
      }
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_is_admin_client: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_project_access: {
        Args: { user_id: string; project_id: string; check_time?: string }
        Returns: boolean
      }
      generate_unique_slug: {
        Args: { title: string; company_id: string }
        Returns: string
      }
      get_accessible_projects: {
        Args: { user_id: string; check_time?: string }
        Returns: {
          project_id: string
        }[]
      }
      get_album_by_share_key: {
        Args: { share_key_param: string }
        Returns: {
          id: string
          name: string
          description: string
          access_from: string
          access_until: string
          images: Json
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_last_image_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_client_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_profile_data: {
        Args: { user_id: string }
        Returns: {
          first_name: string
          last_name: string
          role: string
          id_client: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_shared_albums: {
        Args: { limit_param?: number; offset_param?: number }
        Returns: {
          id: string
          name: string
          description: string
          access_from: string
          access_until: string
          created_at: string
          created_by: string
          created_by_name: string
          share_key: string
          image_count: number
        }[]
      }
      get_user_shared_albums_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      has_specific_role: {
        Args: { required_role: string }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_client: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      user_role: "admin" | "admin_client" | "user" | "administrateur"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      user_role: ["admin", "admin_client", "user", "administrateur"],
    },
  },
} as const
