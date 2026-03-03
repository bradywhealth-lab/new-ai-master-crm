import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Twilio webhook endpoint for receiving SMS
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    if (!from || !body) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Find lead by phone number
    const normalizedPhone = from.replace(/\D/g, '')
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, user_id')
      .eq('normalized_phone', normalizedPhone)

    if (leadsError || !leads || leads.length === 0) {
      // Lead not found, but still respond to Twilio
      return new NextResponse(
        `<Response><Message>Received via InsureAssist</Message></Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    // Log to inbound SMS for each matching lead
    for (const lead of leads) {
      await supabase.from('sms_logs').insert({
        user_id: lead.user_id,
        lead_id: lead.id,
        twilio_message_id: messageSid,
        direction: 'inbound',
        content: body,
      })
    }

    return new NextResponse(
      `<Response><Message>Received via InsureAssist</Message></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
