-- Activity Log Migration
-- Creates activity_log table for unified timeline of all interactions

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'sms_sent', 'sms_received', 'email_sent', 'email_received',
    'call_made', 'call_received', 'note_added', 'note_pinned',
    'appointment_created', 'appointment_updated', 'appointment_completed',
    'lead_created', 'lead_updated', 'lead_disposition_changed',
    'status_changed'
  )),
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_lead_id ON activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own activities
CREATE POLICY "Users can view their own activities"
ON activity_log FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
ON activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);
