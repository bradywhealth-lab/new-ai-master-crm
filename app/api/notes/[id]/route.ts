import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadNote } from '@/types/phase3'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: noteId } = await params
  const body = await request.json()

  // Verify ownership before update
  const { data: existing } = await supabase
    .from('lead_notes')
    .select('user_id')
    .eq('id', noteId)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update note
  const { data: note, error } = await supabase
    .from('lead_notes')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    console.error('Note update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: note as LeadNote })
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

  const { id: noteId } = await params

  // Verify ownership before delete
  const { data: existing } = await supabase
    .from('lead_notes')
    .select('user_id')
    .eq('id', noteId)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete note
  const { error } = await supabase
    .from('lead_notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    console.error('Note delete error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
