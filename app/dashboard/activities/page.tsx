'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Activity {
  id: string
  activity_type: string
  description: string
  metadata: any
  lead_id: string | null
  created_at: string
}

const activityIcons: Record<string, string> = {
  sms_sent: '💬',
  sms_received: '📱',
  email_sent: '📧',
  email_received: '📨',
  call_made: '📞',
  call_received: '📞',
  note_added: '📝',
  note_pinned: '📌',
  appointment_created: '📅',
  appointment_updated: '📆',
  appointment_completed: '✅',
  lead_created: '👤',
  lead_updated: '✏️',
  lead_disposition_changed: '🔄',
  status_changed: '📊',
}

const activityColors: Record<string, string> = {
  sms_sent: 'bg-blue-100 text-blue-800 border-blue-300',
  sms_received: 'bg-blue-100 text-blue-800 border-blue-300',
  email_sent: 'bg-green-100 text-green-800 border-green-300',
  email_received: 'bg-green-100 text-green-800 border-green-300',
  call_made: 'bg-purple-100 text-purple-800 border-purple-300',
  call_received: 'bg-purple-100 text-purple-800 border-purple-300',
  note_added: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  note_pinned: 'bg-orange-100 text-orange-800 border-orange-300',
  appointment_created: 'bg-teal-100 text-teal-800 border-teal-300',
  appointment_updated: 'bg-teal-100 text-teal-800 border-teal-300',
  appointment_completed: 'bg-green-100 text-green-800 border-green-300',
  lead_created: 'bg-gray-100 text-gray-800 border-gray-300',
  lead_updated: 'bg-gray-100 text-gray-800 border-gray-300',
  lead_disposition_changed: 'bg-red-100 text-red-800 border-red-300',
  status_changed: 'bg-indigo-100 text-indigo-800 border-indigo-300',
}

const activityLabels: Record<string, string> = {
  sms_sent: 'SMS Sent',
  sms_received: 'SMS Received',
  email_sent: 'Email Sent',
  email_received: 'Email Received',
  call_made: 'Call Made',
  call_received: 'Call Received',
  note_added: 'Note Added',
  note_pinned: 'Note Pinned',
  appointment_created: 'Appointment Created',
  appointment_updated: 'Appointment Updated',
  appointment_completed: 'Appointment Completed',
  lead_created: 'Lead Created',
  lead_updated: 'Lead Updated',
  lead_disposition_changed: 'Disposition Changed',
  status_changed: 'Status Changed',
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState('all')
  const [leadIdFilter, setLeadIdFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadActivities()
  }, [activityFilter, leadIdFilter, startDate, endDate])

  async function loadActivities() {
    setLoading(true)

    let url = '/api/activities'
    const params = new URLSearchParams()
    if (activityFilter !== 'all') params.append('activity_type', activityFilter)
    if (leadIdFilter) params.append('lead_id', leadIdFilter)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()

    if (data.activities) {
      setActivities(data.activities)
    }

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Activity Timeline</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Activity Type</label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">All Activities</option>
              <option value="sms_sent">SMS Sent</option>
              <option value="sms_received">SMS Received</option>
              <option value="email_sent">Email Sent</option>
              <option value="email_received">Email Received</option>
              <option value="note_added">Notes</option>
              <option value="appointment_created">Appointments</option>
              <option value="lead_created">Leads</option>
              <option value="lead_updated">Lead Updates</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Lead ID</label>
            <Input
              placeholder="Filter by lead..."
              value={leadIdFilter}
              onChange={(e) => setLeadIdFilter(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Button onClick={loadActivities} variant="outline">
          Apply Filters
        </Button>
      </Card>

      {/* Activity Timeline */}
      {loading ? (
        <div className="text-center py-8">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activities found
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="ml-8 space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative pl-8 pb-4">
                {/* Timeline Dot */}
                <div className="absolute left-0 top-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-lg">{activityIcons[activity.activity_type]}</span>
                </div>

                {/* Activity Card */}
                <Card className={`ml-8 ${activityColors[activity.activity_type]} border-2 rounded-lg p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {activityLabels[activity.activity_type]}
                      </span>
                      {activity.lead_id && (
                        <Badge variant="outline" className="text-xs">
                          Lead ID: {activity.lead_id.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-gray-800">{activity.description}</p>

                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current opacity-20">
                      <span className="text-xs font-mono">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </span>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
