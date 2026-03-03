-- ========================================
-- Phase 4: Social Media - Database Updates
-- ========================================

-- Social posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed')),
  engagement_stats JSONB,
  lead_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL UNIQUE CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  access_token_encrypted TEXT NOT NULL,
  account_name TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content queue table
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('social_post', 'follow_up', 'campaign')),
  title TEXT,
  content TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'failed')),
  lead_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trends table
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  volume INTEGER DEFAULT 0,
  growth_rate INTEGER DEFAULT 0,
  related_keywords TEXT[] DEFAULT '{}',
  last_analyzed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hashtag performance tracking (extend leads table)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hashtag_performance JSONB DEFAULT '{}';

-- Indexes for social tables
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_for ON social_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_content_queue_user_id ON content_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled_for ON content_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends(keyword);
CREATE INDEX IF NOT EXISTS idx_trends_platform ON trends(platform);

-- Enable RLS on social tables
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;

-- RLS policies for social tables
CREATE POLICY IF NOT EXISTS "Users can CRUD own social_posts"
ON social_posts FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can CRUD own social_connections"
ON social_connections FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can CRUD own content_queue"
ON content_queue FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can CRUD own trends"
ON trends FOR ALL
USING (auth.uid() = user_id);
