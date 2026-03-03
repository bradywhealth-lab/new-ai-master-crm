'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AIReviewList from '@/components/ai-review-list'

export default function AIReviewsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [filter])

  async function loadLeads() {
    const { data: userData } = await supabase.auth.getUser()

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', userData.user?.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('disposition', filter)
    }

    const { data } = await query
    setLeads(data || [])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Predictions Review</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Leads</option>
          <option value="new">New</option>
          <option value="hot">Hot</option>
          <option value="nurture">Nurture</option>
        </select>
      </div>

      <AIReviewList leads={leads} />
    </div>
  )
}
