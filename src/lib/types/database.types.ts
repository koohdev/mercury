export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          legal_full_name: string
          email: string
          role: 'admin' | 'moderator' | 'manager'
          payment_method: string | null
          whop_username: string | null
          discord_username: string | null
          timezone: string
          pay_rate: number
          status: 'active' | 'deactivated'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          legal_full_name: string
          email: string
          role?: 'admin' | 'moderator' | 'manager'
          payment_method?: string | null
          whop_username?: string | null
          discord_username?: string | null
          timezone?: string
          pay_rate?: number
          status?: 'active' | 'deactivated'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          legal_full_name?: string
          email?: string
          role?: 'admin' | 'moderator' | 'manager'
          payment_method?: string | null
          whop_username?: string | null
          discord_username?: string | null
          timezone?: string
          pay_rate?: number
          status?: 'active' | 'deactivated'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          id: string
          user_id: string
          clock_in: string
          clock_out: string | null
          summary: string | null
          total_active_time: string | null
          total_break_time: string | null
          status: 'active' | 'on_break' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clock_in?: string
          clock_out?: string | null
          summary?: string | null
          total_active_time?: string | null
          total_break_time?: string | null
          status?: 'active' | 'on_break' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clock_in?: string
          clock_out?: string | null
          summary?: string | null
          total_active_time?: string | null
          total_break_time?: string | null
          status?: 'active' | 'on_break' | 'completed'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      breaks: {
        Row: {
          id: string
          shift_id: string
          start_time: string
          end_time: string | null
        }
        Insert: {
          id?: string
          shift_id: string
          start_time?: string
          end_time?: string | null
        }
        Update: {
          id?: string
          shift_id?: string
          start_time?: string
          end_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breaks_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          }
        ]
      }
      schedule_entries: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string
          label: string | null
          color: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time: string
          label?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string
          label?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      availability: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          is_available: boolean
          start_time: string
          end_time: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          is_available: boolean
          start_time: string | null
          end_time: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          is_available?: boolean
          start_time?: string
          end_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      template_categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      response_templates: {
        Row: {
          id: string
          category_id: string
          title: string
          body: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          title: string
          body: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          title?: string
          body?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      pay_records: {
        Row: {
          id: string
          user_id: string
          period_label: string
          period_start: string
          period_end: string
          amount: number
          status: 'confirmed' | 'pending'
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          period_label: string
          period_start: string
          period_end: string
          amount: number
          status?: 'confirmed' | 'pending'
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          period_label?: string
          period_start?: string
          period_end?: string
          amount?: number
          status?: 'confirmed' | 'pending'
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pay_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      pay_change_requests: {
        Row: {
          id: string
          user_id: string
          pay_record_id: string
          reason: string
          requested_amount: number
          status: 'pending' | 'approved' | 'denied'
          admin_notes: string | null
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          pay_record_id: string
          reason: string
          requested_amount: number
          status?: 'pending' | 'approved' | 'denied'
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          pay_record_id?: string
          reason?: string
          requested_amount?: number
          status?: 'pending' | 'approved' | 'denied'
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pay_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_change_requests_pay_record_id_fkey"
            columns: ["pay_record_id"]
            isOneToOne: false
            referencedRelation: "pay_records"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'schedule_change' | 'pay_update' | 'admin_announcement'
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'schedule_change' | 'pay_update' | 'admin_announcement'
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'schedule_change' | 'pay_update' | 'admin_announcement'
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'paused'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
        }
        Relationships: []
      }
      campaign_assignments: {
        Row: {
          id: string
          campaign_id: string
          moderator_id: string
          assigned_by: string | null
          assigned_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          moderator_id: string
          assigned_by?: string | null
          assigned_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          moderator_id?: string
          assigned_by?: string | null
          assigned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assignments_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
