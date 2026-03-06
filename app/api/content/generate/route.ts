import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSocialPost, type SocialPostRequest } from '@/lib/social-content-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, platform, tone, includeHashtags } = await request.json()

    if (!topic || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, platform' },
        { status: 400 }
      )
    }

    const validPlatforms = ['linkedin', 'facebook', 'twitter']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        {
          error: 'Invalid platform. Must be one of: ' + validPlatforms.join(', '),
        },
        { status: 400 }
      )
    }

    const socialRequest: SocialPostRequest = {
      topic,
      platform: platform as 'linkedin' | 'facebook' | 'twitter',
      tone: tone || 'professional',
      includeHashtags: includeHashtags !== false,
    }

    const result = await generateSocialPost(socialRequest)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error generating social content:', error)
    return NextResponse.json(
      { error: 'Failed to generate social content', details: (error as Error).message },
      { status: 500 }
    )
  }
}
