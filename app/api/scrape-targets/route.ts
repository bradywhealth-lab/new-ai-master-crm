import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScrapeTarget, ScrapeTargetCreate } from '@/types/scraping'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all scrape targets for this user
  const { data: targets, error } = await supabase
    .from('scrape_targets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: targets as ScrapeTarget[] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ScrapeTargetCreate = await request.json()

  // Validate URL
  try {
    new URL(body.url)
  } catch {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Create scrape target
  const { data: target, error } = await supabase
    .from('scrape_targets')
    .insert({
      user_id: user.id,
      name: body.name,
      url: body.url,
      selector_type: body.selector_type,
      selectors: body.selectors,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: target as ScrapeTarget })
}
