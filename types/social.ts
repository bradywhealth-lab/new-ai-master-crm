// ========================================
// Phase 4: Social Media - Type Definitions
// ========================================

// Social Posts
export interface SocialPost {
  id: string
  user_id: string
  platform: 'linkedin' | 'twitter' | 'instagram'
  title: string | null
  content: string
  media_urls: string[] | null
  scheduled_for: string
  posted_at: string | null
  status: 'scheduled' | 'posted' | 'failed'
  engagement_stats: {
    likes: number
    comments: number
    shares: number
    views: number
  } | null
  lead_ids: string[] | null
  created_at: string
  updated_at: string
}

export interface SocialPostCreate {
  platform: 'linkedin' | 'twitter' | 'instagram'
  title?: string
  content: string
  media_urls?: string[]
  scheduled_for: string
  lead_ids?: string[]
}

// Social Connections
export interface SocialConnection {
  id: string
  user_id: string
  platform: 'linkedin' | 'twitter' | 'instagram'
  access_token_encrypted: string
  account_name: string
  connected_at: string
}

export interface SocialConnectionCreate {
  platform: 'linkedin' | 'twitter' | 'instagram'
  access_token: string
  account_name: string
}

// Content Queue
export interface ContentQueueItem {
  id: string
  user_id: string
  content_type: 'social_post' | 'follow_up' | 'campaign'
  title: string | null
  content: string
  platform?: string | null
  scheduled_for: string
  status: 'pending' | 'scheduled' | 'sent' | 'failed'
  lead_ids: string[] | null
  created_at: string
}

export interface ContentQueueCreate {
  content_type: 'social_post' | 'follow_up' | 'campaign'
  title?: string
  content: string
  platform?: string | null
  scheduled_for: string
  lead_ids?: string[]
}

// Trends
export interface Trend {
  id: string
  keyword: string
  platform: 'linkedin' | 'twitter' | 'instagram'
  volume: number
  growth_rate: number
  related_keywords: string[]
  last_analyzed: string
}

export interface HashtagAnalysis {
  hashtag: string
  post_count: number
  avg_likes: number
  avg_comments: number
  recent_performance: 'trending_up' | 'trending_down' | 'stable'
}
