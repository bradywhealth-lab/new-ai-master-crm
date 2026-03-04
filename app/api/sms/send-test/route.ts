import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { template_id } = body

  // Get template and verify ownership
  const { data: template, error: templateError } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('id', template_id)
    .single()

  if (templateError || !template) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }

  // Verify ownership - user can only use their own templates
  if (template.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get user's phone number for test
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', user.id)
    .single()

  if (!userProfile || !userProfile.phone_number) {
    return Response.json({ error: 'User phone number not found' }, { status: 404 })
  }

  // Create SMS log (test mode - no actual sending)
  const { data: log, error: logError } = await supabase
    .from('sms_logs')
    .insert({
      user_id: user.id,
      template_id: template_id,
      to_phone: userProfile.phone_number,
      message: `[TEST] ${template.body}`,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .select()
    .single()

  if (logError) {
    return Response.json({ error: 'Failed to log SMS' }, { status: 500 })
  }

  return Response.json({
    success: true,
    message: 'Test SMS logged successfully. Configure your Twilio service to send actual SMS.',
    log: log
  })
}
