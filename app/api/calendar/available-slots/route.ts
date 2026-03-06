import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { findAvailableSlots, checkSlotAvailability } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { calendarId, startDate, endDate, durationMinutes, date } = await request.json()

    if (!calendarId) {
      return NextResponse.json({ error: 'Missing required field: calendarId' }, { status: 400 })
    }

    // Parse dates
    let start = startDate ? new Date(startDate) : new Date()
    let end = endDate ? new Date(endDate) : new Date()
    const duration = durationMinutes || 60

    // If specific date is provided, set the range
    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(9)
      targetDate.setMinutes(0)
      targetDate.setSeconds(0)
      targetDate.setMilliseconds(0)
      start = new Date(targetDate)
      end = new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days out
    }

    // Find available slots
    const slots = await findAvailableSlots(calendarId, duration, start, end)

    // Filter slots to only show business hours (9 AM - 5 PM, weekdays)
    const businessSlots = slots.filter(slot => {
      const slotDate = new Date(slot.start)
      return (
        slotDate.getDay() !== 0 && // Not Sunday
        slotDate.getDay() !== 6 && // Not Saturday
        slotDate.getHours() >= 9 &&
        slotDate.getHours() < 17
      )
    })

    return NextResponse.json({ success: true, data: { slots: businessSlots } })
  } catch (error) {
    console.error('Error finding available slots:', error)
    return NextResponse.json(
      { error: 'Failed to find available slots', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { calendarId } = await request.json?.data || {}

    if (!calendarId) {
      return NextResponse.json({ error: 'Missing required field: calendarId' }, { status: 400 })
    }

    // Check if a specific time slot is available
    const { startTime, endTime } = await request.json?.data || {}

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: startTime, endTime' },
        { status: 400 }
      )
    }

    const available = await checkSlotAvailability(
      calendarId,
      new Date(startTime),
      new Date(endTime)
    )

    return NextResponse.json({ success: true, data: { available } })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability', details: (error as Error).message },
      { status: 500 }
    )
  }
}
