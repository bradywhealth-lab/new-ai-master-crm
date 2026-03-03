-- ========================================
-- Phase 3: Follow-up, Appointments, Notes - Database Updates
-- ========================================

-- Table 1: follow_up_schedules
-- Stores scheduled follow-up messages for leads
CREATE TABLE IF NOT EXISTS follow_up_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Schedule details
  name TEXT NOT NULL,
  description TEXT,

  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL,  -- When to send (one-time) or start date (recurring)
  recurrence_type TEXT,  -- 'none', 'daily', 'weekly', 'monthly'
  recurrence_interval INTEGER,  -- Interval for recurrence (e.g., 2 for every 2 weeks)
  end_date TIMESTAMPTZ,  -- Optional end date for recurring schedules

  -- Message content
  message_content TEXT NOT NULL,
  sms_template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'pending',  -- 'pending', 'active', 'paused', 'completed', 'cancelled'
  sent_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for follow_up_schedules
CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_user_id ON follow_up_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_lead_id ON follow_up_schedules(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_scheduled_for ON follow_up_schedules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_follow_up_schedules_status ON follow_up_schedules(status);

-- Table 2: follow_up_messages
-- Stores individual messages sent as part of follow-up sequences
CREATE TABLE IF NOT EXISTS follow_up_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES follow_up_schedules(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sms_log_id UUID REFERENCES sms_logs(id) ON DELETE SET NULL,

  -- Message details
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  twilio_message_id TEXT,

  -- Status
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'failed', 'cancelled'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for follow_up_messages
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_schedule_id ON follow_up_messages(schedule_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_lead_id ON follow_up_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_scheduled_for ON follow_up_messages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_status ON follow_up_messages(status);

-- Table 3: appointments
-- Stores appointments with leads
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Appointment details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Status and outcome
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled', 'no_show'
  outcome_notes TEXT,

  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_scheduled_for TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Table 4: lead_notes
-- Stores notes on leads with history tracking
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Note content
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',  -- 'general', 'call', 'meeting', 'outcome'

  -- Status
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lead_notes
CREATE INDEX IF NOT EXISTS idx_lead_notes_user_id ON lead_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON lead_notes(created_at DESC);

-- Enable RLS on Phase 3 tables
ALTER TABLE follow_up_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for Phase 3 tables
-- Users can CRUD their own follow-up schedules
CREATE POLICY IF NOT EXISTS "Users can CRUD own follow_up_schedules"
ON follow_up_schedules FOR ALL
USING (auth.uid() = user_id);

-- Users can CRUD their own follow-up messages
CREATE POLICY IF NOT EXISTS "Users can CRUD own follow_up_messages"
ON follow_up_messages FOR ALL
USING (auth.uid() IN (SELECT user_id FROM follow_up_schedules WHERE id = schedule_id);

-- Users can CRUD their own appointments
CREATE POLICY IF NOT EXISTS "Users can CRUD own appointments"
ON appointments FOR ALL
USING (auth.uid() = user_id);

-- Users can CRUD their own lead notes
CREATE POLICY IF NOT EXISTS "Users can CRUD own lead_notes"
ON lead_notes FOR ALL
USING (auth.uid() = user_id);
