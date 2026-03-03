import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIPrediction, FeedbackData } from '@/types/feedback'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leadId = params.id
  const { newDisposition, newScore, smsLogId } = await request.json()

  // Get current lead to capture AI prediction
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Verify ownership via RLS
  if (lead.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const aiPrediction: AIPrediction = {
    disposition: lead.disposition,
    score: lead.ai_score || 0,
    reasoning: lead.ai_qualification_reason || ''
  }

  const feedbackData: FeedbackData = {
    lead_id: leadId,
    sms_log_id: smsLogId || null,
    ai_prediction: aiPrediction,
    user_correction: {
      disposition: newDisposition,
      score: newScore
    },
    feedback_type: 'outcome_based'
  }

  // Create feedback entry
  const { error: feedbackError } = await supabase
    .from('ai_feedback')
    .insert(feedbackData)

  if (feedbackError) {
    console.error('Feedback creation error:', feedbackError)
    return Response.json({ error: 'Failed to create feedback' }, { status: 500 })
  }

  // Update lead disposition
  const dispositionChange = {
    from: lead.disposition,
    to: newDisposition,
    at: new Date().toISOString(),
    triggered_by: 'user'
  }

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      disposition: newDisposition,
      ai_score: newScore,
      previous_disposition: lead.disposition,
      last_disposition_change: new Date().toISOString(),
      disposition_changes: [...(lead.disposition_changes || []), dispositionChange]
    })
    .eq('id', leadId)

  if (updateError) {
    console.error('Lead update error:', updateError)
    return Response.json({ error: 'Failed to update lead' }, { status: 500 })
  }

  return Response.json({ success: true, feedback: feedbackData })
}
