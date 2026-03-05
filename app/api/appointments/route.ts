import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Appointment } from '@/types/phase3'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const startDate = url.searchParams.get('start_date') as string
  const endDate = url.searchParams.get('end_date') as string

  // Get all appointments
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  if (startDate) {
    query = query.gte('start_time', startDate)
  }

  if (endDate) {
    query = query.lte('end_time', endDate)
  }

  const { data: appointments, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: appointments as Appointment[] })
}
