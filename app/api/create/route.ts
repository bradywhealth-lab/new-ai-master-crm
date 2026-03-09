import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lead_id, outcome, notes, estimated_value, actual_value } = body

  if (!lead_id || !outcome) {
    return Response.json({ error: 'Lead ID and outcome are required' }, { status: 400 })
  }

  // Verify ownership of lead
  const { data: lead } = await supabase
    .from('leads')
    .select('user_id, disposition')
    .eq('id', lead_id)
    .single()

  if (!lead || lead.user_id !== user.id) {
    return Response.json({ error: 'Lead not found or forbidden' }, { status: 404 })
  }

  // Create outcome
  const { error: insertError } = await supabase
    .from('lead_outcomes')
    .insert({
      lead_id,
      user_id: user.id,
      outcome,
      notes,
      estimated_value,
      actual_value,
      follow_up_count: 0, // Will be updated by activity logs
    })

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  // Update lead disposition if outcome indicates final state
  let dispositionUpdate: { disposition: string | null } = { disposition: null }
  if (outcome === 'sold') {
    dispositionUpdate.disposition = 'sold'
  } else if (outcome === 'lost' || outcome === 'not_interested' || outcome === 'wrong_number' || outcome === 'do_not_contact') {
    dispositionUpdate.disposition = 'closed_lost'
  }

  if (dispositionUpdate.disposition) {
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        disposition: dispositionUpdate.disposition,
        last_disposition_change: new Date().toISOString(),
      })
      .eq('id', lead_id)

    if (updateError) {
      return Response.json({ error: `Outcome recorded but failed to update lead: ${updateError.message}` }, { status: 500 })
    }
  }

  return Response.json({ success: true })
}
