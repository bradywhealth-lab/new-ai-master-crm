export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  profiles: {
    Row: {
      id: string
      user_id: string
      full_name: string | null
      phone_number: string | null
      agency_name: string | null
      email: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      full_name?: string | null
      phone_number?: string | null
      agency_name?: string | null
      email?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      full_name?: string | null
      phone_number?: string | null
      agency_name?: string | null
      email?: string | null
      updated_at?: string
    }
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
      disposition: string
      tags: string[]
      notes: string | null
      source: string | null
      source_filename: string | null
      source_row_id: string | null
      created_at: string
      updated_at: string
      ai_score: number | null
      ai_qualification_reason: string | null
      last_activity: string | null
      last_activity_date: string | null
    }
    Insert: {
      id?: string
      user_id: string
      first_name?: string | null
      last_name?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
      city?: string | null
      state?: string | null
      zip?: string | null
      disposition?: string
      tags?: string[]
      notes?: string | null
      source?: string | null
      source_filename?: string | null
      source_row_id?: string | null
      created_at?: string
      updated_at?: string
      ai_score?: number | null
      ai_qualification_reason?: string | null
      last_activity?: string | null
      last_activity_date?: string | null
    }
    Update: {
      id: string
      user_id?: string
      first_name?: string | null
      last_name?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
      city?: string | null
      state?: string | null
      zip?: string | null
      disposition?: string
      tags?: string[]
      notes?: string | null
      source?: string | null
      source_filename?: string | null
      source_row_id?: string | null
      updated_at?: string
      ai_score?: number | null
      ai_qualification_reason?: string | null
      last_activity?: string | null
      last_activity_date?: string | null
    }
  }
  csv_uploads: {
    Row: {
      id: string
      user_id: string
      filename: string
      row_count: number
      status: string
      error_message: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      filename: string
      row_count: number
      status?: string
      error_message?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      filename?: string
      row_count?: number
      status?: string
      error_message?: string | null
      updated_at?: string
    }
  }
  sms_logs: {
    Row: {
      id: string
      user_id: string
      lead_id: string | null
      template_id: string | null
      message: string
      direction: string
      status: string
      response: string | null
      response_category: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id?: string | null
      template_id?: string | null
      message: string
      direction?: string
      status?: string
      response?: string | null
      response_category?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      lead_id?: string | null
      template_id?: string | null
      message?: string
      direction?: string
      status?: string
      response?: string | null
      response_category?: string | null
      updated_at?: string
    }
  }
  email_logs: {
    Row: {
      id: string
      user_id: string
      lead_id: string | null
      template_id: string | null
      subject: string
      body: string
      status: string
      error_message: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id?: string | null
      template_id?: string | null
      subject: string
      body: string
      status?: string
      error_message?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      lead_id?: string | null
      template_id?: string | null
      subject?: string
      body?: string
      status?: string
      error_message?: string | null
      updated_at?: string
    }
  }
  sms_templates: {
    Row: {
      id: string
      user_id: string
      name: string
      category: string
      message: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      category: string
      message: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      name?: string
      category?: string
      message?: string
      updated_at?: string
    }
  }
  email_templates: {
    Row: {
      id: string
      user_id: string
      name: string
      category: string
      subject: string
      body: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      category: string
      subject: string
      body: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      name?: string
      category?: string
      subject?: string
      body?: string
      updated_at?: string
    }
  }
  activities: {
    Row: {
      id: string
      user_id: string
      lead_id: string
      activity_type: string
      description: string
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id: string
      activity_type: string
      description: string
      created_at?: string
    }
  }
  follow_ups: {
    Row: {
      id: string
      user_id: string
      lead_id: string
      scheduled_date: string
      follow_up_type: string
      notes: string | null
      status: string
      completed_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id: string
      scheduled_date: string
      follow_up_type: string
      notes?: string | null
      status?: string
      completed_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      lead_id?: string
      scheduled_date?: string
      follow_up_type?: string
      notes?: string | null
      status?: string
      completed_at?: string | null
      updated_at?: string
    }
  }
  notes: {
    Row: {
      id: string
      user_id: string
      lead_id: string
      content: string
      is_pinned: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id: string
      content: string
      is_pinned?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      lead_id?: string
      content?: string
      is_pinned?: boolean
      updated_at?: string
    }
  }
  appointments: {
    Row: {
      id: string
      user_id: string
      lead_id: string | null
      title: string
      description: string | null
      appointment_date: string
      duration: number
      location: string | null
      google_event_id: string | null
      status: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id?: string | null
      title: string
      description?: string | null
      appointment_date: string
      duration: number
      location?: string | null
      google_event_id?: string | null
      status?: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      lead_id?: string | null
      title?: string
      description?: string | null
      appointment_date?: string
      duration?: number
      location?: string | null
      google_event_id?: string | null
      status?: string
      updated_at?: string
    }
  }
  scrape_targets: {
    Row: {
      id: string
      user_id: string
      name: string
      target_url: string
      css_selector: string | null
      xpath: string | null
      headless: boolean
      status: string
      last_run_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      target_url: string
      css_selector?: string | null
      xpath?: string | null
      headless?: boolean
      status?: string
      last_run_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      name?: string
      target_url?: string
      css_selector?: string | null
      xpath?: string | null
      headless?: boolean
      status?: string
      last_run_at?: string | null
      updated_at?: string
    }
  }
  content_queue: {
    Row: {
      id: string
      user_id: string
      platform: string
      content_type: string
      content: string
      scheduled_date: string | null
      status: string
      published_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      platform: string
      content_type: string
      content: string
      scheduled_date?: string | null
      status?: string
      published_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      platform?: string
      content_type?: string
      content?: string
      scheduled_date?: string | null
      status?: string
      published_at?: string | null
      updated_at?: string
    }
  }
  social_posts: {
    Row: {
      id: string
      user_id: string
      platform: string
      content: string
      status: string
      scheduled_date: string | null
      published_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      platform: string
      content: string
      status?: string
      scheduled_date?: string | null
      published_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      platform?: string
      content?: string
      status?: string
      scheduled_date?: string | null
      published_at?: string | null
      updated_at?: string
    }
  }
  sequences: {
    Row: {
      id: string
      user_id: string
      name: string
      description: string | null
      status: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      description?: string | null
      status?: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      name?: string
      description?: string | null
      status?: string
      updated_at?: string
    }
  }
  sequence_steps: {
    Row: {
      id: string
      user_id: string
      sequence_id: string
      step_order: number
      step_type: string
      delay_days: number | null
      template_id: string | null
      subject: string | null
      body: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      sequence_id: string
      step_order: number
      step_type: string
      delay_days?: number | null
      template_id?: string | null
      subject?: string | null
      body?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id: string
      user_id?: string
      sequence_id?: string
      step_order?: number
      step_type?: string
      delay_days?: number | null
      template_id?: string | null
      subject?: string | null
      body?: string | null
      updated_at?: string
    }
  }
  feedback: {
    Row: {
      id: string
      user_id: string
      lead_id: string
      sms_log_id: string | null
      ai_prediction: Json
      user_correction: Json
      feedback_type: string
      note: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id: string
      sms_log_id?: string | null
      ai_prediction?: Json
      user_correction?: Json
      feedback_type?: string
      note?: string | null
      created_at?: string
    }
  }
  trends_analysis: {
    Row: {
      id: string
      user_id: string
      topic: string
      trend_score: number
      mentions: number
      hashtags: string[]
      analyzed_at: string
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      topic: string
      trend_score?: number
      mentions?: number
      hashtags?: string[]
      analyzed_at?: string
      created_at?: string
    }
  }
  user_habits: {
    Row: {
      id: string
      user_id: string
      action: string
      count: number
      last_action_at: string
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      action: string
      count?: number
      last_action_at?: string
      created_at?: string
    }
  }
  lead_outcomes: {
    Row: {
      id: string
      user_id: string
      lead_id: string
      outcome: string
      outcome_date: string
      notes: string | null
      estimated_value: number | null
      actual_value: number | null
      follow_up_count: number
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      lead_id: string
      outcome: string
      outcome_date?: string
      notes?: string | null
      estimated_value?: number | null
      actual_value?: number | null
      follow_up_count?: number
      created_at?: string
    }
  }
  user_preferences: {
    Row: {
      id: string
      user_id: string
      contact_method: string
      contact_hours: string | null
      notification_preferences: Json | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      contact_method: string
      contact_hours?: string | null
      notification_preferences?: Json | null
      created_at?: string
      updated_at?: string
    }
  }
}

public type Tables<
  TableName extends keyof Database,
  RowName extends Extract<keyof Database[TableName], `${TableName extends string ? TableName : never}Row`> = {
  [T in RowName]: Database[TableName][T]
}

public type Enums = {}

public type CompositeTypes = {
  [key: string]: never
}
