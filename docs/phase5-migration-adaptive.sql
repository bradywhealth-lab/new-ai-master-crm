-- ========================================
-- Phase 5: Adaptive Migration - Works with existing policies
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

-- Email Templates - create only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'email_templates'
  ) THEN
    RAISE NOTICE 'email_templates table already exists, skipping creation';
  END IF;
END $$;

-- Email Logs - create only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'email_logs'
  ) THEN
    RAISE NOTICE 'email_logs table already exists, skipping creation';
  END IF;
END $$;

-- SMS Templates - create only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'sms_templates'
  ) THEN
    RAISE NOTICE 'sms_templates table already exists, skipping creation';
  END IF;
END $$;

-- Add template_id column to existing sms_logs table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sms_logs' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE sms_logs ADD COLUMN template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Note: If you encounter policy conflicts, your database already has some policies.
-- The existing policies from earlier phases should work correctly for your CRM.
