import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all sequences
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'email'

  const { data: sequences, error } = await supabase
    .from('follow_up_sequences')
    .select('*, follow_up_steps(*)')
    .eq('sequence_type', type)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sequences:', error)
    return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 })
  }

  return NextResponse.json({ sequences })
}

// POST - Create new sequence
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, sequence_type, steps } = body

  if (!name || !sequence_type || !steps || !Array.isArray(steps)) {
    return NextResponse.json({ error: 'name, sequence_type, and steps array required' }, { status: 400 })
  }

  const { data: sequence, error: insertError } = await supabase
    .from('follow_up_sequences')
    .insert({
      user_id: user.id,
      name,
      sequence_type,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating sequence:', insertError)
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
  }

  // Insert steps
  if (steps && steps.length > 0) {
    const stepsToInsert = steps.map((step, index) => ({
      sequence_id: sequence!.id,
      step_order: index,
      delay_hours: step.delay_hours || 0,
      subject: step.subject,
      body: step.body,
      template_id: step.template_id,
    }))

    const { error: stepsError } = await supabase
      .from('follow_up_steps')
      .insert(stepsToInsert)

    if (stepsError) {
      console.error('Error creating steps:', stepsError)
    }
  }

  return NextResponse.json({ sequence })
}
