import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('lead_id')
  const activityType = searchParams.get('activity_type')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let query = supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Filter by lead
  if (leadId) {
    query = query.eq('lead_id', leadId)
  }

  // Filter by activity type
  if (activityType && activityType !== 'all') {
    query = query.eq('activity_type', activityType)
  }

  // Filter by date range
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data: activities, error } = await query

  if (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }

  return NextResponse.json({ activities })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lead_id, activity_type, description, metadata } = body

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      lead_id,
      activity_type,
      description,
      metadata: metadata || {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }

  return NextResponse.json({ activity: data })
}
