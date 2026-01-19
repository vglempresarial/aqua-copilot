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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      availability: {
        Row: {
          boat_id: string
          created_at: string
          date: string
          google_event_id: string | null
          id: string
          is_available: boolean | null
          source: string | null
          updated_at: string
        }
        Insert: {
          boat_id: string
          created_at?: string
          date: string
          google_event_id?: string | null
          id?: string
          is_available?: boolean | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          boat_id?: string
          created_at?: string
          date?: string
          google_event_id?: string | null
          id?: string
          is_available?: boolean | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_photos: {
        Row: {
          boat_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          sort_order: number | null
          url: string
        }
        Insert: {
          boat_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          sort_order?: number | null
          url: string
        }
        Update: {
          boat_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_photos_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          amenities: Json | null
          base_price: number
          capacity: number
          created_at: string
          crew_included: boolean | null
          deposit_amount: number | null
          description: string | null
          has_crew: boolean | null
          id: string
          is_active: boolean | null
          length_meters: number | null
          name: string
          owner_id: string
          rules: string | null
          type: Database["public"]["Enums"]["boat_type"]
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          base_price: number
          capacity: number
          created_at?: string
          crew_included?: boolean | null
          deposit_amount?: number | null
          description?: string | null
          has_crew?: boolean | null
          id?: string
          is_active?: boolean | null
          length_meters?: number | null
          name: string
          owner_id: string
          rules?: string | null
          type: Database["public"]["Enums"]["boat_type"]
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          base_price?: number
          capacity?: number
          created_at?: string
          crew_included?: boolean | null
          deposit_amount?: number | null
          description?: string | null
          has_crew?: boolean | null
          id?: string
          is_active?: boolean | null
          length_meters?: number | null
          name?: string
          owner_id?: string
          rules?: string | null
          type?: Database["public"]["Enums"]["boat_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boats_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          base_price: number
          boat_id: string
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          customer_notes: string | null
          deposit_amount: number | null
          discount_amount: number | null
          end_time: string | null
          id: string
          itinerary_id: string | null
          owner_notes: string | null
          passengers: number
          platform_fee: number | null
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          base_price: number
          boat_id: string
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          customer_notes?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          end_time?: string | null
          id?: string
          itinerary_id?: string | null
          owner_notes?: string | null
          passengers: number
          platform_fee?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          base_price?: number
          boat_id?: string
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          customer_notes?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          end_time?: string | null
          id?: string
          itinerary_id?: string | null
          owner_notes?: string | null
          passengers?: number
          platform_fee?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          owner_id: string | null
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          rich_content: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          rich_content?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          rich_content?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_pricing: {
        Row: {
          boat_id: string
          created_at: string
          day_of_week: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          price_modifier: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          start_date: string | null
          updated_at: string
        }
        Insert: {
          boat_id: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          price_modifier: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          boat_id?: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          price_modifier?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_pricing_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          boat_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          boat_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          boat_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          is_national: boolean | null
          name: string
          state: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_national?: boolean | null
          name: string
          state?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_national?: boolean | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          boat_id: string
          created_at: string
          departure_location: string | null
          description: string | null
          duration_hours: number
          id: string
          included_items: Json | null
          is_active: boolean | null
          name: string
          price_modifier: number | null
          stops: Json | null
          updated_at: string
        }
        Insert: {
          boat_id: string
          created_at?: string
          departure_location?: string | null
          description?: string | null
          duration_hours: number
          id?: string
          included_items?: Json | null
          is_active?: boolean | null
          name: string
          price_modifier?: number | null
          stops?: Json | null
          updated_at?: string
        }
        Update: {
          boat_id?: string
          created_at?: string
          departure_location?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          included_items?: Json | null
          is_active?: boolean | null
          name?: string
          price_modifier?: number | null
          stops?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_logs: {
        Row: {
          action: string
          booking_id: string | null
          created_at: string
          discount_applied: number | null
          id: string
          notes: string | null
          points_change: number | null
          user_id: string
        }
        Insert: {
          action: string
          booking_id?: string | null
          created_at?: string
          discount_applied?: number | null
          id?: string
          notes?: string | null
          points_change?: number | null
          user_id: string
        }
        Update: {
          action?: string
          booking_id?: string | null
          created_at?: string
          discount_applied?: number | null
          id?: string
          notes?: string | null
          points_change?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string | null
          city: string | null
          commission_rate: number | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          marina_name: string
          slug: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          marina_name: string
          slug: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          marina_name?: string
          slug?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          held_at: string | null
          id: string
          owner_amount: number
          platform_fee: number | null
          refunded_at: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          held_at?: string | null
          id?: string
          owner_amount: number
          platform_fee?: number | null
          refunded_at?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          held_at?: string | null
          id?: string
          owner_amount?: number
          platform_fee?: number | null
          refunded_at?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          loyalty_level: Database["public"]["Enums"]["loyalty_level"] | null
          loyalty_points: number | null
          phone: string | null
          total_rentals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_level?: Database["public"]["Enums"]["loyalty_level"] | null
          loyalty_points?: number | null
          phone?: string | null
          total_rentals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_level?: Database["public"]["Enums"]["loyalty_level"] | null
          loyalty_points?: number | null
          phone?: string | null
          total_rentals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_loyalty_level: {
        Args: { total_rentals: number }
        Returns: Database["public"]["Enums"]["loyalty_level"]
      }
      generate_unique_slug: { Args: { base_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "renter"
      boat_type:
        | "leisure_boat"
        | "jet_ski"
        | "yacht"
        | "sailboat"
        | "speedboat"
        | "fishing_boat"
        | "pontoon"
        | "catamaran"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "refunded"
      loyalty_level: "bronze" | "silver" | "gold" | "platinum"
      payment_status: "pending" | "held" | "released" | "refunded" | "failed"
      pricing_type:
        | "weekday"
        | "weekend"
        | "holiday"
        | "high_season"
        | "low_season"
        | "special"
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
      app_role: ["admin", "owner", "renter"],
      boat_type: [
        "leisure_boat",
        "jet_ski",
        "yacht",
        "sailboat",
        "speedboat",
        "fishing_boat",
        "pontoon",
        "catamaran",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "refunded",
      ],
      loyalty_level: ["bronze", "silver", "gold", "platinum"],
      payment_status: ["pending", "held", "released", "refunded", "failed"],
      pricing_type: [
        "weekday",
        "weekend",
        "holiday",
        "high_season",
        "low_season",
        "special",
      ],
    },
  },
} as const
