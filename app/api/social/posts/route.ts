import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SocialPost, SocialPostCreate } from '@/types/social'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url).searchParams
  const platform = searchParams.get('platform') as string
  const status = searchParams.get('status') as string

  // Build query
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: true })

  if (platform) {
    query = query.eq('platform', platform)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: posts, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: posts as SocialPost[] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SocialPostCreate = await request.json()

  // Create social post
  const { data: post, error } = await supabase
    .from('social_posts')
    .insert({
      user_id: user.id,
      platform: body.platform,
      title: body.title || null,
      content: body.content,
      media_urls: body.media_urls || null,
      scheduled_for: body.scheduled_for,
      lead_ids: body.lead_ids || null,
      status: 'scheduled'
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: post as SocialPost })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: postId } = await params

  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', postId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
