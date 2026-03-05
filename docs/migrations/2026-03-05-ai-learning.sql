-- AI Learning Infrastructure Migration
-- Creates tables for AI feedback, user habits, lead outcomes, and user preferences

-- User Habits Table - Track user working patterns
CREATE TABLE IF NOT EXISTS user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_type VARCHAR(50) NOT NULL CHECK (habit_type IN (
    'working_hours', 'contact_timing', 'follow_up_patterns',
    'lead_preference', 'disposition_accuracy', 'response_rate'
  )),
  pattern_data JSONB NOT NULL DEFAULT '{}',
  frequency INTEGER NOT NULL DEFAULT 0,
  last_tracked TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Lead Outcomes Table - Track final disposition results
CREATE TABLE IF NOT EXISTS lead_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  outcome VARCHAR(50) NOT NULL CHECK (outcome IN (
    'sold', 'lost', 'not_interested', 'wrong_number', 'do_not_contact', 'pending'
  )),
  outcome_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT,
  estimated_value DECIMAL(10, 2),
  actual_value DECIMAL(10, 2),
  follow_up_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User Preferences Table - Store user contact preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preference_key VARCHAR(100) NOT NULL,
  preference_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, preference_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_habits_user_id ON user_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_habits_type ON user_habits(habit_type);
CREATE INDEX IF NOT EXISTS idx_lead_outcomes_user_id ON lead_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_outcomes_lead_id ON lead_outcomes(lead_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own habits
CREATE POLICY "Users can view their own habits"
ON user_habits FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own habits
CREATE POLICY "Users can insert their own habits"
ON user_habits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own habits
CREATE POLICY "Users can update their own habits"
ON user_habits FOR UPDATE
USING (auth.uid() = user_id);

-- Policies: Users can view their own outcomes
CREATE POLICY "Users can view their own outcomes"
ON lead_outcomes FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own outcomes
CREATE POLICY "Users can insert their own outcomes"
ON lead_outcomes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policies: Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);
