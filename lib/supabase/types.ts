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
      // User profiles
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone_number: string | null
          agency_name: string | null
          email: string | null
          created_at: string
        }
        Insert: Omit<Profiles['Row'], 'id' | 'created_at'>
        Update: Partial<Profiles['Row']>
      }
      // Leads
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
          source_type: string | null
          source: string | null
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
      // CSV Uploads
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
      // SMS Logs
      sms_logs: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          template_id: string | null
          to_phone: string
          message: string
          status: 'pending' | 'sent' | 'failed'
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: Omit<Sms_logs['Row'], 'id' | 'sent_at' | 'created_at'>
        Update: Partial<Sms_logs['Row']>
      }
      // SMS Templates
      sms_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          content: string
          category: 'follow_up' | 'appointment' | 'reminder' | null
          variables: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Sms_templates['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Sms_templates['Row']>
      }
      // Email Logs
      email_logs: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          template_id: string | null
          to_email: string
          subject: string
          body: string
          status: 'pending' | 'sent' | 'failed'
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: Omit<Email_logs['Row'], 'id' | 'sent_at' | 'created_at'>
        Update: Partial<Email_logs['Row']>
      }
      // Email Templates
      email_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          body: string
          category: 'follow_up' | 'proposal' | 'reminder' | 'newsletter' | null
          variables: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Email_templates['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Email_templates['Row']>
      }
      // Activities
      activities: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          activity_type: string
          details: string
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Activities['Row'], 'id' | 'created_at'>
        Update: Partial<Activities['Row']>
      }
      // Follow-ups
      follow_ups: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          scheduled_at: string
          completed_at: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Follow_ups['Row'], 'id' | 'created_at'>
        Update: Partial<Follow_ups['Row']>
      }
      // Notes
      notes: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          content: string
          is_pinned: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Notes['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Notes['Row']>
      }
      // Appointments
      appointments: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Appointments['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Appointments['Row']>
      }
      // Scrape Targets
      scrape_targets: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          status: string
          last_scraped_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Scrape_targets['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Scrape_targets['Row']>
      }
      // Content Queue
      content_queue: {
        Row: {
          id: string
          user_id: string
          title: string
          topic: string | null
          status: string
          generated_content: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Content_queue['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Content_queue['Row']>
      }
      // Social Posts
      social_posts: {
        Row: {
          id: string
          user_id: string
          platform: string
          content: string
          scheduled_at: string | null
          posted_at: string | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Social_posts['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Social_posts['Row']>
      }
      // Sequences
      sequences: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Sequences['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Sequences['Row']>
      }
      // Feedback
      feedback: {
        Row: {
          id: string
          user_id: string
          type: string
          feedback: string
          helpful: boolean | null
          created_at: string
        }
        Insert: Omit<Feedback['Row'], 'id' | 'created_at'>
        Update: Partial<Feedback['Row']>
      }
      // Trends Analysis
      trends_analysis: {
        Row: {
          id: string
          user_id: string
          title: string
          analysis: string
          created_at: string
        }
        Insert: Omit<Trends_analysis['Row'], 'id' | 'created_at'>
        Update: Partial<Trends_analysis['Row']>
      }
    }
  }
}
