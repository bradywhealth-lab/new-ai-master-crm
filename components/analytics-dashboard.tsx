'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import type { Lead } from '@/types/lead'

interface AnalyticsData {
  leadsByDisposition: { name: string, value: number }[]
  leadsByScore: { score: string, count: number }[]
  leadsOverTime: { date: string, count: number }[]
  conversionRate: number
  totalLeads: number
  contactedLeads: number
  qualifiedLeads: number
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'30' | '90' | 'all'>('30')
  const [dispositionFilter, setDispositionFilter] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, dispositionFilter])

  async function loadAnalytics() {
    try {
      const params = new URLSearchParams()
      if (dateRange !== '30') params.set('date_range', dateRange)
      if (dispositionFilter) params.set('disposition', dispositionFilter)

      const response = await fetch(`/api/analytics?${params.toString()}`)
      const result = await response.json()
      setData(result.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setLoading(false)
    }
  }

  if (loading) return <div>Loading analytics...</div>
  if (!data) return <div>No analytics data available</div>

  const dispositionColors: Record<string, string> = {
    'New': '#3B82F6',
    'Contacted': '#F59E0B',
    'Qualified': '#10B981',
    'Proposal': '#8B5CF6',
    'Closed': '#06B6D4',
    'Lost': '#EF4444'
  }

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#06B6D4', '#EF4444']

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Analytics Overview</CardTitle>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="border rounded p-2 text-sm"
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
              <select
                value={dispositionFilter || ''}
                onChange={(e) => setDispositionFilter(e.target.value || null)}
                className="border rounded p-2 text-sm"
              >
                <option value="">All Dispositions</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Leads</div>
              <div className="text-2xl font-bold">{data.totalLeads}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Contacted</div>
              <div className="text-2xl font-bold">{data.contactedLeads}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Qualified</div>
              <div className="text-2xl font-bold">{data.qualifiedLeads}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-2xl font-bold">{(data.conversionRate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads by Disposition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.leadsByDisposition}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Leads">
                  {data.leadsByDisposition.map((entry) => (
                    <Cell key={entry.name} fill={dispositionColors[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads by AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.leadsByScore}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="score" />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Leads" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads Over Time (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="value"
                name="Leads"
                cy="50%"
                cx="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.leadsByDisposition.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={dispositionColors[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
