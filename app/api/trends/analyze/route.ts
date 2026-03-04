import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Trend, HashtagAnalysis } from '@/types/social'

// Simulated trend analysis - In production, this would use social media APIs
async function analyzeTrend(keyword: string, platform: string): Promise<Trend> {
  // This is a mock implementation
  // In production, integrate with actual social media APIs:
  // - Twitter/X API
  // - LinkedIn API
  // - Instagram Graph API

  const mockVolume = Math.floor(Math.random() * 100000) + 5000
  const mockGrowth = (Math.random() * 100 - 50).toFixed(2)
  const relatedKeywords = [
    `${keyword} tips`,
    `${keyword} guide`,
    `${keyword} 2026`,
    `best ${keyword}`,
    `${keyword} strategy`
  ].slice(0, Math.floor(Math.random() * 3) + 2)

  return {
    id: crypto.randomUUID(),
    keyword,
    platform: platform as any,
    volume: mockVolume,
    growth_rate: parseFloat(mockGrowth),
    related_keywords: relatedKeywords,
    last_analyzed: new Date().toISOString()
  }
}

async function analyzeHashtag(hashtag: string, platform: string): Promise<HashtagAnalysis> {
  // Mock hashtag analysis
  const mockPostCount = Math.floor(Math.random() * 50000) + 1000
  const mockAvgLikes = Math.floor(Math.random() * 500) + 50
  const mockAvgComments = Math.floor(Math.random() * 100) + 5
  const mockGrowth = Math.random()

  let recentPerformance: HashtagAnalysis['recent_performance'] = 'stable'
  if (mockGrowth > 0.6) {
    recentPerformance = 'trending_up'
  } else if (mockGrowth < 0.4) {
    recentPerformance = 'trending_down'
  }

  return {
    hashtag,
    post_count: mockPostCount,
    avg_likes: mockAvgLikes,
    avg_comments: mockAvgComments,
    recent_performance: recentPerformance
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { keyword, hashtag, platform } = body

  if (!platform) {
    return Response.json({ error: 'Platform is required' }, { status: 400 })
  }

  const results: { trend?: Trend, hashtagAnalysis?: HashtagAnalysis } = {}

  if (keyword) {
    try {
      results.trend = await analyzeTrend(keyword, platform)

      // Store trend in database
      await supabase
        .from('trends')
        .insert({
          user_id: user.id,
          keyword,
          platform,
          volume: results.trend.volume,
          growth_rate: results.trend.growth_rate,
          related_keywords: results.trend.related_keywords
        })
    } catch (error) {
      console.error('Failed to analyze trend:', error)
    }
  }

  if (hashtag) {
    try {
      results.hashtagAnalysis = await analyzeHashtag(hashtag, platform)

      // Store hashtag analysis in database
      await supabase
        .from('hashtag_analyses')
        .insert({
          user_id: user.id,
          hashtag,
          platform,
          post_count: results.hashtagAnalysis.post_count,
          avg_likes: results.hashtagAnalysis.avg_likes,
          avg_comments: results.hashtagAnalysis.avg_comments,
          recent_performance: results.hashtagAnalysis.recent_performance
        })
    } catch (error) {
      console.error('Failed to analyze hashtag:', error)
    }
  }

  return Response.json({ data: results })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URLSearchParams(request.url)
  const platform = searchParams.get('platform') as string
  const type = searchParams.get('type') as string // 'trend' or 'hashtag'

  const results: { trends: Trend[], hashtagAnalyses: HashtagAnalysis[] } = {
    trends: [],
    hashtagAnalyses: []
  }

  if (!type || type === 'trend') {
    let query = supabase
      .from('trends')
      .select('*')
      .eq('user_id', user.id)
      .order('last_analyzed', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: trends } = await query.limit(20)
    results.trends = trends || []
  }

  if (!type || type === 'hashtag') {
    let query = supabase
      .from('hashtag_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: hashtagAnalyses } = await query.limit(20)
    results.hashtagAnalyses = hashtagAnalyses || []
  }

  return Response.json({ data: results })
}
