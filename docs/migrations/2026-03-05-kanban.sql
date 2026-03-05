-- Kanban Board Migration
-- Add pipeline_status column to leads for visual workflow tracking

-- First, add the pipeline_status column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'pipeline_status'
  ) THEN
    ALTER TABLE leads ADD COLUMN pipeline_status VARCHAR(50)
      DEFAULT 'new'
      CHECK (pipeline_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'));
  END IF;
$$;

-- Update existing leads' disposition to pipeline_status mapping
UPDATE leads
SET pipeline_status = CASE
  WHEN disposition = 'new' THEN 'new'
  WHEN disposition IN ('hot', 'nurture') THEN 'qualified'
  WHEN disposition = 'sold' THEN 'closed_won'
  WHEN disposition IN ('wrong_number', 'do_not_contact') THEN 'closed_lost'
  ELSE 'new'
END
WHERE pipeline_status IS NULL;

-- Create index for pipeline filtering
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_status ON leads(pipeline_status);
DO $$ END;
