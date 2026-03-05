import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lead_ids, message } = body

  if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids array required' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  // Verify ownership of all leads
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, user_id, phone')
    .in('id', lead_ids)

  if (fetchError) {
    console.error('Error fetching leads:', fetchError)
    return NextResponse.json({ error: 'Failed to verify leads' }, { status: 500 })
  }

  const unauthorizedLeads = leads?.filter(lead => lead.user_id !== user.id)
  if (unauthorizedLeads && unauthorizedLeads.length > 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Send SMS to each lead (using lazy Twilio client)
  const twilio = require('@/lib/twilio').default

  const results = []
  for (const leadId of lead_ids) {
    try {
      const lead = leads?.find(l => l.id === leadId)
      if (!lead || !lead.phone) continue

      const sms = await twilio.messages.create({
        body: message,
        to: lead.phone,
      })

      results.push({
        lead_id: leadId,
        status: 'sent',
        sid: sms.sid,
      })

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        lead_id: leadId,
        activity_type: 'sms_sent',
        description: `Bulk SMS: ${message}`,
        metadata: { sid: sms.sid },
      })
    } catch (error) {
      console.error(`Failed to send SMS to ${leadId}:`, error)
      results.push({
        lead_id: leadId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ results })
}
