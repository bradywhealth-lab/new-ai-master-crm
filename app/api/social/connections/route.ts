import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SocialConnection, SocialConnectionCreate } from '@/types/social'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all social connections for this user
  const { data: connections, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', user.id)
    .order('connected_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: connections as SocialConnection[] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SocialConnectionCreate = await request.json()

  // Check if connection for this platform already exists
  const { data: existing } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', body.platform)
    .single()

  if (existing) {
    return Response.json({ error: 'Platform already connected' }, { status: 400 })
  }

  // Create social connection (encrypting token for storage)
  const { data: connection, error } = await supabase
    .from('social_connections')
    .insert({
      user_id: user.id,
      platform: body.platform,
      access_token_encrypted: Buffer.from(body.access_token).toString('base64'),
      account_name: body.account_name
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: connection as SocialConnection })
}
