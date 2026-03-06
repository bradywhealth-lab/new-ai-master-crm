import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { syncAppointmentToGoogle, findAvailableSlots, checkSlotAvailability } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { appointmentId, calendarId } = await request.json()

    if (!appointmentId || !calendarId) {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentId, calendarId' },
        { status: 400 }
      )
    }

    // Fetch appointment
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Build calendar event
    const calendarEvent = {
      id: `crm-${appointment.id}`,
      summary: appointment.title || `Insurance Appointment`,
      description: appointment.description || '',
      start: new Date(appointment.start_time).toISOString(),
      end: new Date(appointment.end_time).toISOString(),
      attendees: appointment.lead_email ? [{ email: appointment.lead_email }] : [],
      location: appointment.location || '',
    }

    // Sync to Google Calendar
    const result = await syncAppointmentToGoogle(calendarId, calendarEvent)

    // Update appointment with Google Calendar event ID
    await supabase
      .from('appointments')
      .update({ google_calendar_event_id: result.eventId })
      .eq('id', appointmentId)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error)
    return NextResponse.json(
      { error: 'Failed to sync to Google Calendar', details: (error as Error).message },
      { status: 500 }
    )
  }
}
