import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { leadId, content } = await request.json()

    if (!leadId || !content) {
      return NextResponse.json(
        { error: 'leadId and content are required' },
        { status: 400 }
      )
    }

    // Get user from session
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('phone, user_id')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (lead.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!lead.phone) {
      return NextResponse.json(
        { error: 'Lead has no phone number' },
        { status: 400 }
      )
    }

    // Send SMS via Twilio
    const result = await sendSMS(lead.phone, content)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Log SMS
    const { error: logError } = await supabase.from('sms_logs').insert({
      user_id: user.id,
      lead_id: leadId,
      twilio_message_id: result.messageId,
      direction: 'outbound',
      content,
    })

    if (logError) {
      console.error('Error logging SMS:', logError)
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
