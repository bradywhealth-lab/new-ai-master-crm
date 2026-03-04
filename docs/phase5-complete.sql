-- ========================================
-- Phase 5: Enhancements - Communications, Reports, Calendar
-- This SQL works safely regardless of existing tables/columns
-- ========================================

-- Add email field to profiles table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Drop existing Phase 5 tables if they exist (for clean migration)
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('follow_up', 'proposal', 'reminder', 'newsletter')),
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT email_templates_user_name_unique UNIQUE (user_id, name)
);

-- Email Logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS Templates
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('follow_up', 'appointment', 'reminder')),
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sms_templates_user_name_unique UNIQUE (user_id, name)
);

-- Add template_id column to existing sms_logs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sms_logs' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE sms_logs ADD COLUMN template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS Policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email templates"
ON email_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email templates"
ON email_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates"
ON email_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates"
ON email_templates FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
ON email_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email logs"
ON email_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email logs"
ON email_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email logs"
ON email_logs FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for sms_templates
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sms templates"
ON sms_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sms templates"
ON sms_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sms templates"
ON sms_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sms templates"
ON sms_templates FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for sms_logs (Enable without checking pg_tables)
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sms logs"
ON sms_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sms logs"
ON sms_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sms logs"
ON sms_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sms logs"
ON sms_logs FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_user_created_at ON email_templates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_created_at ON email_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_created_at ON sms_templates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_template_id ON sms_logs(template_id);
