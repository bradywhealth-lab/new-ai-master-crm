'use client'

import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    todaySMS: 0,
  })

  useEffect(() => {
    const supabase = createClient()
    async function loadStats() {
      // Get total leads
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      // Get hot leads
      const { count: hotCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('disposition', 'hot')

      // Get today's SMS (simplified - you'd filter by date properly)
      const { count: smsCount } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalLeads: count || 0,
        hotLeads: hotCount || 0,
        todaySMS: smsCount || 0,
      })
    }

    loadStats()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hot Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">{stats.hotLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SMS Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{stats.todaySMS}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
