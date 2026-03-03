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
          full_name: string | null
          phone_number: string | null
          agency_name: string | null
          created_at: string
        }
        Insert: Omit<Profiles['Row'], 'id' | 'created_at'>
        Update: Partial<Profiles['Row']>
      }
      leads: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          source_type: string
          csv_upload_id: string | null
          source_filename: string | null
          source_row_id: string | null
          disposition: string
          tags: string[]
          notes: string | null
          ai_score: number | null
          ai_qualification_reason: string | null
          created_at: string
          updated_at: string
          normalized_email: string | null
          normalized_phone: string | null
        }
        Insert: Omit<Leads['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Leads['Row']>
      }
      csv_uploads: {
        Row: {
          id: string
          user_id: string
          filename: string
          uploaded_at: string
          row_count: number | null
          status: string
          error_message: string | null
        }
        Insert: Omit<Csv_uploads['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Csv_uploads['Row']>
      }
      sms_logs: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          twilio_message_id: string
          direction: string
          content: string
          sent_at: string
          ai_category: string | null
          ai_confidence: number | null
          ai_analysis: string | null
        }
        Insert: Omit<Sms_logs['Row'], 'id' | 'sent_at'>
        Update: Partial<Sms_logs['Row']>
      }
      sms_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          content: string
          is_default: boolean
        }
        Insert: Omit<Sms_templates['Row'], 'id'>
        Update: Partial<Sms_templates['Row']>
      }
    }
  }
}
