-- ========================================
-- Phase 4: Scraping - Database Updates
-- ========================================

-- Add scrape tracking to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scrape_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;

-- Create scrape targets table
CREATE TABLE IF NOT EXISTS scrape_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  selector_type TEXT NOT NULL CHECK (selector_type IN ('css', 'xpath', 'custom')),
  selectors JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  last_scraped_at TIMESTAMPTZ,
  leads_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scrape jobs table
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES scrape_targets(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  leads_scraped INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scraping tables
CREATE INDEX IF NOT EXISTS idx_scrape_targets_user_id ON scrape_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_targets_status ON scrape_targets(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user_id ON scrape_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_target_id ON scrape_jobs(target_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);

-- Enable RLS on scraping tables
ALTER TABLE scrape_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for scraping tables
CREATE POLICY IF NOT EXISTS "Users can CRUD own scrape_targets"
ON scrape_targets FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can CRUD own scrape_jobs"
ON scrape_jobs FOR ALL
USING (auth.uid() = user_id);
