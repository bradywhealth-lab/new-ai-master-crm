import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContentQueueItem, ContentQueueCreate } from '@/types/social'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URLSearchParams(request.url)
  const status = searchParams.get('status') as string

  // Get content queue for this user
  let query = supabase
    .from('content_queue')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: items, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: items as ContentQueueItem[] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ContentQueueCreate = await request.json()

  // Create content queue item
  const { data: item, error } = await supabase
    .from('content_queue')
    .insert({
      user_id: user.id,
      content_type: body.content_type,
      title: body.title || null,
      content: body.content,
      platform: body.platform || null,
      scheduled_for: body.scheduled_for,
      lead_ids: body.lead_ids || null
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: item as ContentQueueItem })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: itemId } = await params
  const body = await request.json()

  // Update content queue item
  const { data: item, error } = await supabase
    .from('content_queue')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: item as ContentQueueItem })
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

  const { id: itemId } = await params

  const { error } = await supabase
    .from('content_queue')
    .delete()
    .eq('id', itemId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
