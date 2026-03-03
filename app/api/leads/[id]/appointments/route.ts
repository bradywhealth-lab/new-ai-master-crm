import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AppointmentCreate, Appointment } from '@/types/phase3'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: leadId } = await params
  const body: AppointmentCreate = await request.json()

  // Verify lead exists and belongs to user
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Calculate duration if not provided
  let duration = body.duration_minutes || null
  if (!duration && body.end_time && body.start_time) {
    const startTime = new Date(body.start_time).getTime()
    const endTime = new Date(body.end_time).getTime()
    duration = Math.floor((endTime - startTime) / 60000)
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      title: body.title,
      description: body.description || null,
      location: body.location || null,
      start_time: body.start_time,
      end_time: body.end_time || null,
      duration_minutes: duration,
      status: 'scheduled'
    })
    .select()
    .single()

  if (error) {
    console.error('Appointment creation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: appointment as Appointment })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: leadId } = await params

  // Get appointments for this lead
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('lead_id', leadId)
    .order('start_time', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: appointments as Appointment[] })
}
