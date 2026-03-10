'use client'

import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  BarChart,
  Calendar,
  Activity,
  Bell,
  Plus
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    thisWeekSMS: 0,
    conversionRate: 0,
  })

  const [recentActivity, setRecentActivity] = useState([
    { type: 'lead_added', message: 'New lead from Website', time: '2 min ago' },
    { type: 'sms_sent', message: 'SMS sent to John Smith', time: '15 min ago' },
    { type: 'appointment', message: 'Meeting with Sarah Johnson', time: '1 hour ago' },
    { type: 'email_sent', message: 'Email to Mike Brown', time: '2 hours ago' },
  ])

  useEffect(() => {
    const supabase = createClient()
    async function loadStats() {
      const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
      const { count: hotCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('disposition', 'hot')
      const { count: smsCount } = await supabase.from('sms_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalLeads: count || 0,
        hotLeads: hotCount || 0,
        thisWeekSMS: smsCount || 0,
        conversionRate: Math.round(((hotCount || 0) / (count || 1)) * 100),
      })
    }
    loadStats()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_added':
        return <Users className="w-5 h-5 text-primary" />
      case 'sms_sent':
        return <MessageSquare className="w-5 h-5 text-success" />
      case 'email_sent':
        return <Activity className="w-5 h-5 text-info" />
      case 'appointment':
        return <Calendar className="w-5 h-5 text-purple" />
      default:
        return <Activity className="w-5 h-5 text-foreground-muted" />
    }
  }

  const StatCard = ({
    title,
    value,
    trend,
    icon,
  }: {
    title: string
    value: number
    trend: 'up' | 'down' | 'neutral'
    icon: React.ReactNode
  }) => (
    <Card className="card-elite">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
              {title}
            </div>
            <div className="flex items-center">
              {icon}
              {trend === 'up' && (
                <div className="flex items-center text-success text-sm font-medium ml-2">
                  <TrendingUp className="w-4 h-4" />
                  +12%
                </div>
              )}
              {trend === 'down' && (
                <div className="flex items-center text-destructive text-sm font-medium ml-2">
                  <TrendingDown className="w-4 h-4" />
                  -3%
                </div>
              )}
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {value.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Elite Gradient Header */}
      <header className="bg-gradient-to-br from-primary via-primary-hover to-primary text-white py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-primary-foreground">Elite CRM - Your Insurance Command Center</p>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 text-white/80" />
              <button className="relative p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold">
                  JD
                </div>
                <div className="hidden md:block text-sm text-white/90">
                  John Doe
                </div>
                <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full text-white text-xs flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            trend="neutral"
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Hot Leads"
            value={stats.hotLeads}
            trend="up"
            icon={<BarChart className="w-6 h-6 text-warning" />}
          />
          <StatCard
            title="SMS This Week"
            value={stats.thisWeekSMS}
            trend="up"
            icon={<MessageSquare className="w-6 h-6 text-success" />}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            trend={stats.conversionRate > 0 ? 'up' : 'down'}
            icon={<TrendingUp className="w-6 h-6 text-info" />}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Spans 2 columns */}
          <div className="lg:col-span-2">
            <Card className="card-elite">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="btn-elite-primary flex items-center justify-start gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Lead
                  </Button>
                  <Button className="btn-elite-secondary flex items-center justify-start gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send Bulk SMS
                  </Button>
                  <Button className="btn-elite-secondary flex items-center justify-start gap-2">
                    <Activity className="w-5 h-5" />
                    Send Bulk Email
                  </Button>
                  <Button className="btn-elite-ghost border-border-light flex items-center justify-start gap-2">
                    <Plus className="w-5 h-5" />
                    Import CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Spans 1 column */}
          <div>
            <Card className="card-elite">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded border border-border-light hover:bg-hover transition-smooth"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trend Chart Placeholder */}
        <Card className="card-elite">
          <CardHeader>
            <CardTitle>Lead Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-foreground-muted">
              <BarChart className="w-12 h-12 mx-auto text-primary/20" />
              <p className="mt-4 text-sm">Lead distribution by disposition</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
