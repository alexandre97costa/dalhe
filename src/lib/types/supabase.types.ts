// This file was generated and you can get an updated version of it here 
// https://supabase.com/dashboard/project/kuqpwuozwlqiqgphzgai/api?page=tables-intro
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      car: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          make_id: number
          model: string
          year: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          make_id: number
          model: string
          year: number
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          make_id?: number
          model?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "car_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_make"
            referencedColumns: ["id"]
          },
        ]
      }
      car_category: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      car_make: {
        Row: {
          created_at: string
          id: number
          logo: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          logo?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      game: {
        Row: {
          banner: string | null
          created_at: string
          id: number
          logo: string | null
          name: string
        }
        Insert: {
          banner?: string | null
          created_at?: string
          id?: number
          logo?: string | null
          name: string
        }
        Update: {
          banner?: string | null
          created_at?: string
          id?: number
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      lap_time: {
        Row: {
          car_id: number
          created_at: string
          driver_id: string
          for_testing: boolean
          game_id: number | null
          id: number
          pole_rating: number
          time_milliseconds: number
          tournament_id: number | null
          track_id: number
          was_podium: boolean
          wet: boolean
        }
        Insert: {
          car_id: number
          created_at?: string
          driver_id?: string
          for_testing?: boolean
          game_id?: number | null
          id?: number
          pole_rating?: number
          time_milliseconds: number
          tournament_id?: number | null
          track_id: number
          was_podium?: boolean
          wet?: boolean
        }
        Update: {
          car_id?: number
          created_at?: string
          driver_id?: string
          for_testing?: boolean
          game_id?: number | null
          id?: number
          pole_rating?: number
          time_milliseconds?: number
          tournament_id?: number | null
          track_id?: number
          was_podium?: boolean
          wet?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lap_time_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lap_time_driver_id_fkey1"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "listing_recent_laptimes"
            referencedColumns: ["driverid"]
          },
          {
            foreignKeyName: "lap_time_driver_id_fkey1"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lap_time_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lap_time_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lap_time_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "listing_recent_laptimes"
            referencedColumns: ["trackid"]
          },
          {
            foreignKeyName: "lap_time_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "race_track"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      race_track: {
        Row: {
          country_code: string | null
          created_at: string
          id: number
          length: number | null
          location: string | null
          name: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          id?: number
          length?: number | null
          location?: string | null
          name: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          id?: number
          length?: number | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      reference_time: {
        Row: {
          category_id: number
          created_at: string
          game_id: number
          id: number
          time_ms: number
          track_id: number
        }
        Insert: {
          category_id: number
          created_at?: string
          game_id: number
          id?: number
          time_ms: number
          track_id: number
        }
        Update: {
          category_id?: number
          created_at?: string
          game_id?: number
          id?: number
          time_ms?: number
          track_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reference_time_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "car_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_time_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_time_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "listing_recent_laptimes"
            referencedColumns: ["trackid"]
          },
          {
            foreignKeyName: "reference_time_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "race_track"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: number
          is_private: boolean
          name: string
          scoring_type: Database["public"]["Enums"]["TournamentScoring"]
          start_date: string
          status: Database["public"]["Enums"]["TournamentStatus"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          is_private?: boolean
          name: string
          scoring_type?: Database["public"]["Enums"]["TournamentScoring"]
          start_date: string
          status?: Database["public"]["Enums"]["TournamentStatus"]
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          is_private?: boolean
          name?: string
          scoring_type?: Database["public"]["Enums"]["TournamentScoring"]
          start_date?: string
          status?: Database["public"]["Enums"]["TournamentStatus"]
        }
        Relationships: []
      }
      tournament_participant: {
        Row: {
          created_at: string
          driver_id: string
          id: number
          is_admin: boolean
          tournament_id: number
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: number
          is_admin?: boolean
          tournament_id: number
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: number
          is_admin?: boolean
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participant_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "listing_recent_laptimes"
            referencedColumns: ["driverid"]
          },
          {
            foreignKeyName: "tournament_participant_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participant_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_track: {
        Row: {
          created_at: string
          id: number
          order_index: number | null
          tournament_id: number
          track_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          order_index?: number | null
          tournament_id: number
          track_id: number
        }
        Update: {
          created_at?: string
          id?: number
          order_index?: number | null
          tournament_id?: number
          track_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_track_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_track_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "listing_recent_laptimes"
            referencedColumns: ["trackid"]
          },
          {
            foreignKeyName: "tournament_track_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "race_track"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listing_recent_laptimes: {
        Row: {
          car_make: string | null
          car_model: string | null
          created_at: string | null
          driver: string | null
          driverid: string | null
          game_id: number | null
          is_personal_best: boolean | null
          is_track_record: boolean | null
          laptime: number | null
          previous_laptime: number | null
          track_name: string | null
          trackid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lap_time_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_driver_timeline: {
        Args: { driverid: string; testing: boolean }
        Returns: {
          car_make: string
          car_model: string
          created_at: string
          driver: string
          is_personal_best: boolean
          is_track_record: boolean
          laptime: number
          previous_laptime: number
          track_name: string
          track_record: number
          trackid: number
        }[]
      }
      get_leaderboard_by_track: {
        Args: { category: number; testing: boolean; track: number }
        Returns: {
          car_make: string
          car_model: string
          created_at: string
          driver: string
          driverid: string
          laptime: number
          rank: number
          track_record: number
        }[]
      }
    }
    Enums: {
      TournamentScoring:
        | "Aggregate"
        | "Points-Based (Participants)"
        | "Points-Based (F1)"
      TournamentStatus: "Draft" | "Scheduled" | "Ongoing" | "Completed"
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
      TournamentScoring: [
        "Aggregate",
        "Points-Based (Participants)",
        "Points-Based (F1)",
      ],
      TournamentStatus: ["Draft", "Scheduled", "Ongoing", "Completed"],
    },
  },
} as const
