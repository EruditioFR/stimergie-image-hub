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
          featured_image_url: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          client_id?: string | null
          content: string
          content_type?: string | null
          created_at?: string
          featured_image_url?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          client_id?: string | null
          content?: string
          content_type?: string | null
          created_at?: string
          featured_image_url?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
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
          nom: string
          secteur_activite: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          contact_principal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          secteur_activite?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          contact_principal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          secteur_activite?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          height: number
          id: number
          id_projet: string
          orientation: string
          tags: string | null
          title: string
          updated_at: string
          url: string
          url_miniature: string | null
          width: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          height: number
          id?: number
          id_projet: string
          orientation: string
          tags?: string | null
          title: string
          updated_at?: string
          url: string
          url_miniature?: string | null
          width: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          height?: number
          id?: number
          id_projet?: string
          orientation?: string
          tags?: string | null
          title?: string
          updated_at?: string
          url?: string
          url_miniature?: string | null
          width?: number
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
        Args: {
          user_id: string
          new_password: string
        }
        Returns: undefined
      }
      check_can_access_client: {
        Args: {
          client_id: string
        }
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
      create_user_with_profile: {
        Args: {
          email: string
          password: string
          first_name: string
          last_name: string
          role?: string
          company_id?: string
        }
        Returns: string
      }
      generate_unique_slug: {
        Args: {
          title: string
          company_id: string
        }
        Returns: string
      }
      get_album_by_share_key: {
        Args: {
          share_key_param: string
        }
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
      get_user_client_id: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      get_user_profile_data: {
        Args: {
          user_id: string
        }
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
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      has_specific_role: {
        Args: {
          required_role: string
        }
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
    }
    Enums: {
      user_role: "admin" | "admin_client" | "user" | "administrateur"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
