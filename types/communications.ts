// ========================================
// Communications - Email & SMS
// ========================================

// Email Templates
export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  subject: string
  body: string
  category: 'follow_up' | 'proposal' | 'reminder' | 'newsletter'
  variables: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailTemplateCreate {
  name: string
  subject: string
  body: string
  category: 'follow_up' | 'proposal' | 'reminder' | 'newsletter'
}

// Email Logs
export interface EmailLog {
  id: string
  user_id: string
  template_id: string | null
  to_email: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface EmailLogCreate {
  template_id: string | null
  to_email: string
  subject: string
  body: string
}

// SMS Templates
export interface SmsTemplate {
  id: string
  user_id: string
  name: string
  body: string
  category: 'follow_up' | 'appointment' | 'reminder'
  variables: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SmsTemplateCreate {
  name: string
  body: string
  category: 'follow_up' | 'appointment' | 'reminder'
}

// SMS Logs
export interface SmsLog {
  id: string
  user_id: string
  template_id: string | null
  to_phone: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface SmsLogCreate {
  template_id: string | null
  to_phone: string
  message: string
}
