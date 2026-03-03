import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadNote } from '@/types/phase3'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const noteId = params.id
  const body = await request.json()

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
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const noteId = params.id

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
