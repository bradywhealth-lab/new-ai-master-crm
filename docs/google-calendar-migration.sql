-- Add google_calendar_event_id column to appointments table
-- This stores the Google Calendar event ID after syncing

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Add calendar_id column to track which calendar the appointment belongs to
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS calendar_id TEXT;

-- Add is_synced column to track sync status
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT false;
