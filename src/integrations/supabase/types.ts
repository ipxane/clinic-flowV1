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
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          duration: number
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          period_name: string
          service_id: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          duration: number
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          period_name: string
          service_id: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          duration?: number
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          period_name?: string
          service_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          confirmed_appointment_id: string | null
          contact_info: string
          contact_type: string
          created_at: string
          id: string
          notes: string | null
          patient_name: string
          patient_type: "adult" | "child"
          date_of_birth: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_email: string | null
          requested_date: string
          requested_period: string
          service_id: string | null
          service_name: string
          staff_notes: string | null
          status: string
          suggested_date: string | null
          suggested_period: string | null
          updated_at: string
        }
        Insert: {
          confirmed_appointment_id?: string | null
          contact_info: string
          contact_type: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_name: string
          patient_type?: "adult" | "child"
          date_of_birth?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_email?: string | null
          requested_date: string
          requested_period: string
          service_id?: string | null
          service_name: string
          staff_notes?: string | null
          status?: string
          suggested_date?: string | null
          suggested_period?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_appointment_id?: string | null
          contact_info?: string
          contact_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_name?: string
          patient_type?: "adult" | "child"
          date_of_birth?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_email?: string | null
          requested_date?: string
          requested_period?: string
          service_id?: string | null
          service_name?: string
          staff_notes?: string | null
          status?: string
          suggested_date?: string | null
          suggested_period?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_confirmed_appointment_id_fkey"
            columns: ["confirmed_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          booking_range_days: number
          booking_range_enabled: boolean
          clinic_description: string | null
          clinic_name: string
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_range_days?: number
          booking_range_enabled?: boolean
          clinic_description?: string | null
          clinic_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_range_days?: number
          booking_range_enabled?: boolean
          clinic_description?: string | null
          clinic_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guardians: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          end_date: string | null
          id: string
          note: string | null
          recurring_end_day: number | null
          recurring_end_month: number | null
          recurring_start_day: number | null
          recurring_start_month: number | null
          start_date: string | null
          type: Database["public"]["Enums"]["holiday_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_date?: string | null
          id?: string
          note?: string | null
          recurring_end_day?: number | null
          recurring_end_month?: number | null
          recurring_start_day?: number | null
          recurring_start_month?: number | null
          start_date?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_date?: string | null
          id?: string
          note?: string | null
          recurring_end_day?: number | null
          recurring_end_month?: number | null
          recurring_start_day?: number | null
          recurring_start_month?: number | null
          start_date?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          guardian_id: string | null
          id: string
          notes: string | null
          patient_type: Database["public"]["Enums"]["patient_type"]
          phone: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          guardian_id?: string | null
          id?: string
          notes?: string | null
          patient_type?: Database["public"]["Enums"]["patient_type"]
          phone?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          guardian_id?: string | null
          id?: string
          notes?: string | null
          patient_type?: Database["public"]["Enums"]["patient_type"]
          phone?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      working_days: {
        Row: {
          created_at: string
          day_name: string
          day_of_week: number
          id: string
          is_working: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_name: string
          day_of_week: number
          id?: string
          is_working?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_name?: string
          day_of_week?: number
          id?: string
          is_working?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      working_periods: {
        Row: {
          created_at: string
          end_time: string
          id: string
          name: string
          start_time: string
          updated_at: string
          working_day_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          name: string
          start_time: string
          updated_at?: string
          working_day_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          updated_at?: string
          working_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_periods_working_day_id_fkey"
            columns: ["working_day_id"]
            isOneToOne: false
            referencedRelation: "working_days"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_first_user: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "doctor" | "staff" | "pending"
      appointment_status:
      | "pending"
      | "confirmed"
      | "postponed"
      | "cancelled"
      | "completed"
      | "no_show"
      holiday_type:
      | "holiday"
      | "closed"
      | "special"
      | "long_holiday"
      | "recurring_annual"
      patient_status: "active" | "follow_up" | "archived"
      patient_type: "adult" | "child"
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
      app_role: ["admin", "doctor", "staff", "pending"],
      appointment_status: [
        "pending",
        "confirmed",
        "postponed",
        "cancelled",
        "completed",
        "no_show",
      ],
      holiday_type: [
        "holiday",
        "closed",
        "special",
        "long_holiday",
        "recurring_annual",
      ],
      patient_status: ["active", "follow_up", "archived"],
      patient_type: ["adult", "child"],
    },
  },
} as const
