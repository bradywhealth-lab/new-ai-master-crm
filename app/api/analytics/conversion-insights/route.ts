import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeConversion, type LeadJourney } from '@/lib/conversion-analyzer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing required field: leadId' },
        { status: 400 }
      )
    }

    // Fetch lead data
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Fetch activities for this lead
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    // Build lead journey
    const interactions = (activities || []).map((activity: any) => ({
      type: activity.activity_type,
      date: activity.created_at,
      outcome: activity.outcome || undefined,
    }))

    const leadJourney: LeadJourney = {
      created_at: lead.created_at,
      qualificationScore: lead.qualification_score || 0,
      qualificationReasoning: lead.ai_qualification_reason || '',
      disposition: lead.disposition || 'new',
      lastContact: lead.last_contact || null,
      activitiesCount: interactions.length,
      interactions,
    }

    // Analyze conversion
    const analysis = await analyzeConversion(leadJourney)

    // Store analysis (optional - could be saved for tracking)
    // await supabase.from('conversion_analyses').insert({
    //   lead_id: leadId,
    //   user_id: user.id,
    //   ...analysis
    // })

    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    console.error('Error analyzing conversion:', error)
    return NextResponse.json(
      { error: 'Failed to analyze conversion', details: (error as Error).message },
      { status: 500 }
    )
  }
}
