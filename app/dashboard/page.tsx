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
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      const { count: hotCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('disposition', 'hot')

      const { count: smsCount } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })

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
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case 'email_sent':
        return <Activity className="w-5 h-5 text-blue-500" />
      case 'appointment':
        return <Calendar className="w-5 h-5 text-purple-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
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
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
          {trend === 'up' ? (
            <div className="flex items-center text-green-500 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12%
            </div>
          ) : trend === 'down' ? (
            <div className="flex items-center text-red-500 text-sm font-medium">
              <TrendingDown className="w-4 h-4 mr-1" />
              -3%
            </div>
          ) : (
            <div className="text-gray-400 text-sm font-medium">
              0%
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-2 rounded-lg mr-3">
              {icon}
            </div>
            <div className="text-3xl font-bold text-foreground">
              {value.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-primary via-primary-hover to-primary-dark text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-primary-light mt-1">Welcome back, Agent</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold">
                  JD
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">John Doe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            trend="up"
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Hot Leads"
            value={stats.hotLeads}
            trend="up"
            icon={<BarChart className="w-6 h-6 text-orange-500" />}
          />
          <StatCard
            title="SMS This Week"
            value={stats.thisWeekSMS}
            trend="up"
            icon={<MessageSquare className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            title="Conversion Rate"
            value={stats.conversionRate}
            trend="neutral"
            icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Spans 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="default" className="h-12 justify-start">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Lead
                  </Button>
                  <Button variant="secondary" className="h-12 justify-start">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Send Bulk SMS
                  </Button>
                  <Button variant="secondary" className="h-12 justify-start">
                    <Activity className="w-5 h-5 mr-2" />
                    Send Bulk Email
                  </Button>
                  <Button variant="secondary" className="h-12 justify-start">
                    <Activity className="w-5 h-5 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Spans 1 column */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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
      </main>
    </div>
  )
}
