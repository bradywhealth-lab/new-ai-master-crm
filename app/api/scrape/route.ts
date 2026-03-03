import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScrapeJobCreate, ScrapeJob } from '@/types/scraping'
import { scrapeLeads, validateUrl } from '@/lib/scraper'

// Simple in-memory job tracking (in production, use a proper job queue)
const jobs = new Map<string, { status: string, startedAt: number }>()

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { target_id } = body as ScrapeJobCreate

  // Get target configuration
  const { data: target } = await supabase
    .from('scrape_targets')
    .select('*')
    .eq('id', target_id)
    .single()

  if (!target) {
    return Response.json({ error: 'Scrape target not found' }, { status: 404 })
  }

  if (target.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (target.status !== 'active') {
    return Response.json({ error: 'Target is not active' }, { status: 400 })
  }

  if (!validateUrl(target.url)) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Create scrape job record
  const { data: job, error: jobError } = await supabase
    .from('scrape_jobs')
    .insert({
      user_id: user.id,
      target_id: target.id,
      status: 'pending'
    })
    .select()
    .single()

  if (jobError) {
    return Response.json({ error: jobError.message }, { status: 500 })
  }

  // Start scraping in background
  startScrapeJob(job.id, target.id, target.url, target.selectors, user.id)

  return Response.json({ data: job as ScrapeJob })
}

async function startScrapeJob(
  jobId: string,
  targetId: string,
  url: string,
  selectors: any,
  userId: string
) {
  const supabase = createClient()

  // Update job status to running
  await supabase
    .from('scrape_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId)

  try {
    // Run scraping
    const result = await scrapeLeads(url, selectors)

    // Insert scraped leads
    let leadsInserted = 0
    for (const lead of result.leads) {
      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          zip: lead.zip,
          source_type: 'scraped',
          scrape_url: url,
          source_filename: `scrape-${Date.now()}`,
          source_row_id: result.leads.indexOf(lead).toString(),
          disposition: 'new'
        })

      if (!error) {
        leadsInserted++
      }
    }

    // Update job status to completed
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        leads_scraped: leadsInserted
      })
      .eq('id', jobId)

    // Update target with last scraped info
    await supabase
      .from('scrape_targets')
      .update({
        last_scraped_at: new Date().toISOString(),
        leads_found: (target.leads_found || 0) + leadsInserted
      })
      .eq('id', targetId)

  } catch (error) {
    console.error('Scrape job error:', error)

    // Update job status to failed
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', jobId)
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all scrape jobs for this user
  const { data: jobs, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: jobs as ScrapeJob[] })
}
