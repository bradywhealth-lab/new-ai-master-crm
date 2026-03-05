-- Email Drip Campaigns Migration
-- Creates tables for multi-step follow-up sequences

-- Follow-up Sequences Table
CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sequence_type VARCHAR(20) NOT NULL CHECK (sequence_type IN ('email', 'sms')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Follow-up Steps Table
CREATE TABLE IF NOT EXISTS follow_up_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  template_id UUID NULL REFERENCES email_templates(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_user_id ON follow_up_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_steps_sequence_id ON follow_up_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_steps_order ON follow_up_steps(sequence_id, step_order);

-- Enable Row Level Security
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_steps ENABLE ROW LEVEL SECURITY;

-- Policies for follow_up_sequences
CREATE POLICY "Users can view their own sequences"
ON follow_up_sequences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sequences"
ON follow_up_sequences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences"
ON follow_up_sequences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences"
ON follow_up_sequences FOR DELETE
USING (auth.uid() = user_id);

-- Policies for follow_up_steps
CREATE POLICY "Users can view their own steps"
ON follow_up_steps FOR SELECT
USING (
    auth.uid() IN (
      SELECT user_id FROM follow_up_sequences
      WHERE follow_up_sequences.id = follow_up_steps.sequence_id
    )
  );

CREATE POLICY "Users can insert their own steps"
ON follow_up_steps FOR INSERT
WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM follow_up_sequences
      WHERE follow_up_sequences.id = follow_up_steps.sequence_id
    )
  );

CREATE POLICY "Users can update their own steps"
ON follow_up_steps FOR UPDATE
WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM follow_up_sequences
      WHERE follow_up_sequences.id = follow_up_steps.sequence_id
    )
  );

CREATE POLICY "Users can delete their own steps"
ON follow_up_steps FOR DELETE
WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM follow_up_sequences
      WHERE follow_up_sequences.id = follow_up_steps.sequence_id
    )
  );
