'use client'

import { useState, useEffect } from 'react'
import type { ScrapeJob } from '@/types/scraping'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScrapeResultsProps {
  user_id?: string
}

export default function ScrapeResults({ user_id }: ScrapeResultsProps) {
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [user_id])

  async function loadJobs() {
    const response = await fetch('/api/scrape')
    const result = await response.json()
    setJobs(result.data || [])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  if (loading) return <div>Loading scrape jobs...</div>

  if (jobs.length === 0) return <div className="text-gray-500 text-sm">No scrape jobs yet.</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrape History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 border rounded">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusColors[job.status]}>
                      {job.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>
                  {job.started_at && (
                    <p className="text-sm text-gray-600">
                      Started: {new Date(job.started_at).toLocaleString()}
                    </p>
                  )}
                  {job.completed_at && (
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(job.completed_at).toLocaleString()}
                    </p>
                  )}
                  {job.leads_scraped > 0 && (
                    <p className="text-sm text-green-600">
                      ✓ {job.leads_scraped} leads scraped
                    </p>
                  )}
                  {job.error_message && (
                    <p className="text-sm text-red-600">
                      ✗ Error: {job.error_message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
