import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailTemplate } from '@/types/communications'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // First verify user owns this template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete the template
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
