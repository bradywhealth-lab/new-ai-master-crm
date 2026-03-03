import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FollowUpSchedule } from '@/types/phase3'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scheduleId = params.id
  const body = await request.json()

  // Update follow-up schedule
  const { data: schedule, error } = await supabase
    .from('follow_up_schedules')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) {
    console.error('Follow-up update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: schedule as FollowUpSchedule })
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

  const scheduleId = params.id

  // Delete follow-up schedule
  const { error } = await supabase
    .from('follow_up_schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) {
    console.error('Follow-up delete error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
