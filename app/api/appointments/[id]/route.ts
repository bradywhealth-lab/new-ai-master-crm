import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Appointment } from '@/types/phase3'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const appointmentId = params.id
  const body = await request.json()

  // Update appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('Appointment update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: appointment as Appointment })
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

  const appointmentId = params.id

  // Delete appointment
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)

  if (error) {
    console.error('Appointment delete error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
