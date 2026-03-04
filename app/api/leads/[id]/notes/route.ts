import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadNoteCreate, LeadNote } from '@/types/phase3'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: leadId } = await params
  const body: LeadNoteCreate = await request.json()

  // Verify lead exists and belongs to user
  const { data: lead } = await supabase
    .from('leads')
    .select('id, user_id')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Verify ownership - user can only access their own leads
  if (lead.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create note
  const { data: note, error } = await supabase
    .from('lead_notes')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      note: body.note,
      note_type: body.note_type || 'general',
      is_pinned: body.is_pinned || false
    })
    .select()
    .single()

  if (error) {
    console.error('Note creation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: note as LeadNote })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: leadId } = await params

  // Verify lead ownership before fetching notes
  const { data: lead } = await supabase
    .from('leads')
    .select('id, user_id')
    .eq('id', leadId)
    .single()

  if (!lead || lead.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get notes for this lead
  const { data: notes, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: notes as LeadNote[] })
}
