-- ========================================
-- Phase 4: Trends & Hashtag Analysis
-- ========================================

-- Trends table for tracking trending keywords
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  volume INTEGER NOT NULL DEFAULT 0,
  growth_rate NUMERIC NOT NULL DEFAULT 0,
  related_keywords TEXT[] DEFAULT '{}',
  last_analyzed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT trends_user_platform_unique UNIQUE (user_id, keyword, platform)
);

-- Hashtag Analyses table for tracking hashtag performance
CREATE TABLE IF NOT EXISTS hashtag_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  post_count INTEGER NOT NULL DEFAULT 0,
  avg_likes INTEGER NOT NULL DEFAULT 0,
  avg_comments INTEGER NOT NULL DEFAULT 0,
  recent_performance TEXT NOT NULL CHECK (recent_performance IN ('trending_up', 'trending_down', 'stable')),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT hashtag_analyses_user_platform_unique UNIQUE (user_id, hashtag, platform)
);

-- RLS Policies for trends
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trends"
ON trends FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trends"
ON trends FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trends"
ON trends FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trends"
ON trends FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for hashtag_analyses
ALTER TABLE hashtag_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hashtag analyses"
ON hashtag_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hashtag analyses"
ON hashtag_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hashtag analyses"
ON hashtag_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hashtag analyses"
ON hashtag_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trends_user_last_analyzed ON trends(user_id, last_analyzed DESC);
CREATE INDEX IF NOT EXISTS idx_trends_platform ON trends(platform);
CREATE INDEX IF NOT EXISTS idx_hashtag_analyses_user_analyzed ON hashtag_analyses(user_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_analyses_platform ON hashtag_analyses(platform);
