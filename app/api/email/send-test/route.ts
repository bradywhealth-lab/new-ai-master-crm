import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailTemplate } from '@/types/communications'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { template_id } = body

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', template_id)
    .single()

  if (templateError || !template) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }

  // Get user's email for test (from profiles table)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!userProfile || !userProfile.email) {
    // Fallback to auth email
    const { data: userData } = await supabase.auth.admin.getUserById(user.id)
    if (!userData || !userData.user?.email) {
      return Response.json({ error: 'User email not found' }, { status: 404 })
    }
  }

  const toEmail = userProfile?.email || userData?.user?.email || ''

  // Send actual email
  const emailResult = await sendEmail({
    to: toEmail,
    subject: `[TEST] ${template.subject}`,
    text: template.body,
  })

  // Create email log
  const { data: log, error: logError } = await supabase
    .from('email_logs')
    .insert({
      user_id: user.id,
      template_id: template_id,
      to_email: toEmail,
      subject: `[TEST] ${template.subject}`,
      body: template.body,
      status: emailResult.success ? 'sent' : 'failed',
      error_message: emailResult.error || null,
      sent_at: emailResult.success ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (logError) {
    return Response.json({ error: 'Failed to log email' }, { status: 500 })
  }

  return Response.json({
    success: emailResult.success,
    message: emailResult.success
      ? 'Test email sent successfully!'
      : `Failed to send email: ${emailResult.error}`,
    log: log
  })
}
