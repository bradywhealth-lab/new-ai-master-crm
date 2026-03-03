-- ========================================
-- AI Feedback Learning System - Database Updates
-- ========================================

-- Add disposition change tracking to leads table
ALTER TABLE leads ADD COLUMN last_disposition_change TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN previous_disposition TEXT;
ALTER TABLE leads ADD COLUMN disposition_changes JSONB DEFAULT '[]';

-- Enable RLS on ai_feedback table
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own feedback"
  ON ai_feedback FOR ALL
  USING (auth.uid() = user_id);
