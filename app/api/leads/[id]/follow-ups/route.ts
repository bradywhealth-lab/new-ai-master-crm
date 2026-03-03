import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FollowUpScheduleCreate, FollowUpSchedule } from '@/types/phase3'

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
  const body: FollowUpScheduleCreate = await request.json()

  // Verify lead exists and belongs to user
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Create follow-up schedule
  const { data: schedule, error } = await supabase
    .from('follow_up_schedules')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      name: body.name,
      description: body.description || null,
      scheduled_for: body.scheduled_for,
      recurrence_type: body.recurrence_type || 'none',
      recurrence_interval: body.recurrence_interval || null,
      end_date: body.end_date || null,
      message_content: body.message_content,
      sms_template_id: body.sms_template_id || null,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Follow-up creation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: schedule as FollowUpSchedule })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leadId = params.id

  // Get follow-ups for this lead
  const { data: followUps, error } = await supabase
    .from('follow_up_schedules')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: followUps as FollowUpSchedule[] })
}
