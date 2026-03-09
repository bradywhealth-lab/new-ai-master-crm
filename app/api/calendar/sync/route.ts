import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { appointmentId } = body

  if (!appointmentId) {
    return Response.json({ error: 'Appointment ID is required' }, { status: 400 })
  }

  // Fetch appointment with lead information
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      leads (
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('id', appointmentId)
    .eq('user_id', user.id)
    .single()

  if (!appointment) {
    return Response.json({ error: 'Appointment not found' }, { status: 404 })
  }

  // For Google Calendar sync, you would typically use OAuth2
  // This is a placeholder for the integration
  // In a real implementation, you would:
  // 1. Store Google OAuth tokens in user_preferences table
  // 2. Create event in Google Calendar using those tokens
  // 3. Map appointment data to Google Calendar event format

  return Response.json({
    success: true,
    message: 'Google Calendar sync not yet implemented - OAuth integration required',
    appointment: {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      lead: appointment.leads,
    }
  })
}
