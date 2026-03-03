'use client'

import { useState, useEffect } from 'react'
import type { FollowUpSchedule, FollowUpScheduleCreate } from '@/types/phase3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

interface FollowUpSchedulerProps {
  leadId: string
}

export default function FollowUpScheduler({ leadId }: FollowUpSchedulerProps) {
  const [schedules, setSchedules] = useState<FollowUpSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [message, setMessage] = useState('')
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadSchedules()
  }, [leadId])

  async function loadSchedules() {
    const response = await fetch(`/api/leads/${leadId}/follow-ups`)
    const result = await response.json()
    setSchedules(result.data || [])
    setLoading(false)
  }

  async function createSchedule() {
    if (!name.trim() || !message.trim() || !scheduledFor) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          message_content: message,
          scheduled_for: scheduledFor,
          recurrence_type: recurrenceType === 'none' ? null : recurrenceType,
          recurrence_interval: recurrenceType === 'none' ? null : recurrenceInterval,
          end_date: endDate || null
        } as FollowUpScheduleCreate)
      })

      if (response.ok) {
        setName('')
        setMessage('')
        setScheduledFor('')
        setRecurrenceType('none')
        setRecurrenceInterval(1)
        setEndDate('')
        setOpen(false)
        loadSchedules()
      }
    } catch (error) {
      console.error('Failed to create schedule:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteSchedule(scheduleId: string) {
    if (!confirm('Delete this follow-up schedule?')) return

    try {
      const response = await fetch(`/api/follow-ups/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadSchedules()
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  if (loading) return <div>Loading follow-ups...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-sm">No follow-ups scheduled yet.</p>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{schedule.name}</span>
                      <Badge className={statusColors[schedule.status]}>
                        {schedule.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{schedule.message_content}</p>
                    <div className="text-xs text-gray-500">
                      Scheduled for: {new Date(schedule.scheduled_for).toLocaleString()}
                      {schedule.recurrence_type && schedule.recurrence_type !== 'none' && (
                        <span> • Recurring: {schedule.recurrence_type}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSchedule(schedule.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Schedule Follow-up</Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Schedule Follow-up</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., First follow-up call"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled For</label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recurrence</label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {recurrenceType !== 'none' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Interval</label>
                  <Input
                    type="number"
                    min="1"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your follow-up message..."
                  className="w-full border rounded p-2 min-h-[80px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createSchedule}
                  className="flex-1"
                  disabled={isSubmitting || !name.trim() || !message.trim() || !scheduledFor}
                >
                  Schedule
                </Button>
                <Button
                  onClick={() => setOpen(false)}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
