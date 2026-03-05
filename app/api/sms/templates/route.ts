import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SmsTemplate, SmsTemplateCreate } from '@/types/communications'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: templates, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: templates as SmsTemplate[] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SmsTemplateCreate = await request.json()

  // Extract variables from body
  const variablePattern = /\{\{(\w+)\}\}/g
  const variables = body.body.match(variablePattern)?.map(m => m.replace(/[{}]/g, '')) || null

  const { data: template, error } = await supabase
    .from('sms_templates')
    .insert({
      user_id: user.id,
      name: body.name,
      body: body.body,
      category: body.category,
      variables,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: template as SmsTemplate })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: templateId } = await params

  const { error } = await supabase
    .from('sms_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
