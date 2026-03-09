import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership of lead
  const { data: lead } = await supabase
    .from('leads')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!lead || lead.user_id !== user.id) {
    return Response.json({ error: 'Lead not found or forbidden' }, { status: 404 })
  }

  // Fetch outcomes for this lead
  const { data: outcomes, error } = await supabase
    .from('lead_outcomes')
    .select('*')
    .eq('lead_id', id)
    .order('outcome_date', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ outcomes })
}
