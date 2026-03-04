import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailTemplate, EmailTemplateCreate } from '@/types/communications'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: templates as EmailTemplate[] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: EmailTemplateCreate = await request.json()

  // Extract variables from body (e.g., {{firstName}}, {{lastName}})
  const variablePattern = /\{\{(\w+)\}\}/g
  const variables = body.body.match(variablePattern)?.map(m => m.replace(/[{}]/g, '')) || null

  const { data: template, error } = await supabase
    .from('email_templates')
    .insert({
      user_id: user.id,
      name: body.name,
      subject: body.subject,
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

  return Response.json({ data: template as EmailTemplate })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: templateId } = await params

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
