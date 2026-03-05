import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailLog } from '@/types/communications'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as string
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabase
    .from('email_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: logs, error } = await query.limit(limit)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: logs as EmailLog[] })
}
