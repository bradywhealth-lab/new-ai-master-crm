import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { enhanceMessage, type LeadContext } from '@/lib/ai-enhancer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, message, leadId } = await request.json()

    if (!type || !message || !leadId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, message, leadId' },
        { status: 400 }
      )
    }

    if (type !== 'sms' && type !== 'email') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "sms" or "email"' },
        { status: 400 }
      )
    }

    // Fetch lead data for context
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Build lead context
    const leadContext: LeadContext = {
      id: lead.id,
      firstName: lead.first_name || undefined,
      lastName: lead.last_name || undefined,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      qualificationScore: lead.qualification_score || undefined,
      disposition: lead.disposition || undefined,
      lastInteraction: lead.last_contact || undefined,
      notes: lead.notes || [],
    }

    // Enhance the message
    const result = await enhanceMessage(type, message, leadContext)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error enhancing message:', error)
    return NextResponse.json(
      { error: 'Failed to enhance message', details: (error as Error).message },
      { status: 500 }
    )
  }
}
