import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScrapeTarget } from '@/types/scraping'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: targetId } = await params
  const body = await request.json()

  // Verify ownership before update
  const { data: existing } = await supabase
    .from('scrape_targets')
    .select('user_id')
    .eq('id', targetId)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update scrape target
  const { data: target, error } = await supabase
    .from('scrape_targets')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: target as ScrapeTarget })
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

  const { id: targetId } = await params

  // Verify ownership before delete
  const { data: existing } = await supabase
    .from('scrape_targets')
    .select('user_id')
    .eq('id', targetId)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete scrape target
  const { error } = await supabase
    .from('scrape_targets')
    .delete()
    .eq('id', targetId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
