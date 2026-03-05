import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReviewSubmission, AIPrediction } from '@/types/feedback'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ReviewSubmission = await request.json()
  const { lead_id, ai_prediction_confirmed, new_disposition, new_score, note } = body

  // Get current lead
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Verify ownership - user can only submit feedback for their own leads
  if (lead.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const aiPrediction: AIPrediction = {
    disposition: lead.disposition,
    score: lead.ai_score || 0,
    reasoning: lead.ai_qualification_reason || ''
  }

  const feedbackData = {
    lead_id,
    user_id: user.id,
    sms_log_id: null,
    ai_prediction: aiPrediction,
    user_correction: {
      disposition: new_disposition,
      score: new_score,
      note
    },
    feedback_type: 'manual_review'
  }

  // Create feedback
  const { error: feedbackError } = await supabase
    .from('ai_feedback')
    .insert(feedbackData)

  if (feedbackError) {
    return Response.json({ error: feedbackError.message }, { status: 500 })
  }

  // Update lead if corrections provided
  if (new_disposition || new_score) {
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        disposition: new_disposition,
        ai_score: new_score
      })
      .eq('id', lead_id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }
  }

  return Response.json({ success: true })
}
