import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const duration = parseInt(url.searchParams.get('duration') || '60', 10)
  const startDate = url.searchParams.get('start_date') as string
  const endDate = url.searchParams.get('end_date') as string

  // Calculate time range for slot search
  const start = startDate ? new Date(startDate) : new Date()
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  // Get existing appointments to block out times
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('user_id', user.id)
    .gte('start_time', start.toISOString())
    .lt('end_time', end.toISOString())
    .eq('status', 'scheduled')

  // Generate available slots (business hours: 9 AM - 5 PM)
  const availableSlots = []
  const businessHoursStart = 9 // 9 AM
  const businessHoursEnd = 17 // 5 PM
  const slotDuration = duration // minutes

  let currentDate = new Date(start)
  currentDate.setHours(businessHoursStart, 0, 0, 0)

  while (currentDate < end) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Generate hourly slots during business hours
      let hour = businessHoursStart
      while (hour < businessHoursEnd) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, 0, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotStart.getMinutes() + slotDuration)

        // Check if this slot conflicts with existing appointments
        const isAvailable = !appointments?.some(apt => {
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)
          return slotStart < aptEnd && slotEnd > aptStart
        })

        if (isAvailable) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          })
        }

        hour += 1
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setHours(businessHoursStart, 0, 0, 0)
  }

  return Response.json({
    slots: availableSlots,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    duration
  })
}
