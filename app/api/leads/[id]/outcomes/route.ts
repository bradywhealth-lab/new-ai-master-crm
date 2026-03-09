import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: leadId } = await params

  // Verify ownership of lead
  const { data: lead } = await supabase
    .from('leads')
    .select('user_id')
    .eq('id', leadId)
    .single()

  if (!lead || lead.user_id !== user.id) {
    return Response.json({ error: 'Lead not found or forbidden' }, { status: 404 })
  }

  // Fetch outcomes for this lead
  const { data: outcomes } = await supabase
    .from('lead_outcomes')
    .select('*')
    .eq('lead_id', leadId)
    .order('outcome_date', { ascending: false })

  return Response.json({ data: outcomes })
}
