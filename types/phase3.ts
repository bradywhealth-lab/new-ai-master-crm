// ========================================
// Phase 3: Follow-up, Appointments, Notes - Type Definitions
// ========================================

// Follow-up Schedules
export interface FollowUpSchedule {
  id: string
  user_id: string
  lead_id: string
  name: string
  description: string | null
  scheduled_for: string
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | null
  recurrence_interval: number | null
  end_date: string | null
  message_content: string
  sms_template_id: string | null
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled'
  sent_count: number
  created_at: string
  updated_at: string
}

export interface FollowUpScheduleCreate {
  lead_id: string
  name: string
  description?: string
  scheduled_for: string
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly'
  recurrence_interval?: number
  end_date?: string
  message_content: string
  sms_template_id?: string
}

// Follow-up Messages
export interface FollowUpMessage {
  id: string
  schedule_id: string
  lead_id: string
  sms_log_id: string | null
  message_content: string
  scheduled_for: string
  sent_at: string | null
  twilio_message_id: string | null
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  created_at: string
}

// Appointments
export interface Appointment {
  id: string
  user_id: string
  lead_id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  outcome_notes: string | null
  reminder_sent: boolean
  reminder_scheduled_for: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentCreate {
  lead_id: string
  title: string
  description?: string
  location?: string
  start_time: string
  end_time?: string
  duration_minutes?: number
}

// Lead Notes
export interface LeadNote {
  id: string
  user_id: string
  lead_id: string
  note: string
  note_type: 'general' | 'call' | 'meeting' | 'outcome'
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface LeadNoteCreate {
  lead_id: string
  note: string
  note_type?: 'general' | 'call' | 'meeting' | 'outcome'
  is_pinned?: boolean
}
