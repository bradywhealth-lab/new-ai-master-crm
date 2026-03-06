import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { leadIds, subject, message } = body

  if (!leadIds || leadIds.length === 0) {
    return Response.json({ error: 'No leads provided' }, { status: 400 })
  }

  if (!subject || !message) {
    return Response.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  // Get leads with email addresses
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('email, first_name, last_name')
    .in('id', leadIds)

  if (leadsError || !leads) {
    return Response.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  // Filter leads with valid emails
  const leadsWithEmail = leads.filter(l => l.email && l.email.includes('@'))

  if (leadsWithEmail.length === 0) {
    return Response.json({ error: 'No valid email addresses found' }, { status: 400 })
  }

  // Send emails to all leads
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const lead of leadsWithEmail) {
    const personalizedMessage = message.replace(/{firstName}/g, lead.first_name || 'there')
      .replace(/{lastName}/g, lead.last_name || '')

    const emailResult = await sendEmail({
      to: lead.email!,
      subject: subject,
      text: personalizedMessage,
    })

    if (emailResult.success) {
      sent++
    } else {
      failed++
      errors.push(`${lead.email}: ${emailResult.error}`)
    }
  }

  // Log bulk email activity
  for (const leadId of leadIds) {
    const lead = leads.find(l => l.id === leadId)
    if (lead && lead.email && lead.email.includes('@')) {
      await supabase.from('activities').insert({
        user_id: user.id,
        lead_id: leadId,
        activity_type: 'email_sent',
        details: `Bulk email: ${subject}`,
        metadata: { subject, message, bulk: true },
      })
    }
  }

  return Response.json({
    sent,
    failed,
    errors,
    total: leadsWithEmail.length,
  })
}
