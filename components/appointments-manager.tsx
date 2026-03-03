'use client'

import { useState, useEffect } from 'react'
import type { Appointment, AppointmentCreate } from '@/types/phase3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

interface AppointmentsManagerProps {
  leadId: string
}

export default function AppointmentsManager({ leadId }: AppointmentsManagerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [leadId])

  async function loadAppointments() {
    const response = await fetch(`/api/leads/${leadId}/appointments`)
    const result = await response.json()
    setAppointments(result.data || [])
    setLoading(false)
  }

  async function createAppointment() {
    if (!title.trim() || !startTime) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          start_time: startTime,
          end_time: endTime || null,
          location: location || null,
          description: description || null
        } as AppointmentCreate)
      })

      if (response.ok) {
        setTitle('')
        setStartTime('')
        setEndTime('')
        setLocation('')
        setDescription('')
        setOpen(false)
        loadAppointments()
      }
    } catch (error) {
      console.error('Failed to create appointment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function updateStatus(appointmentId: string, status: Appointment['status']) {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadAppointments()
      }
    } catch (error) {
      console.error('Failed to update appointment:', error)
    }
  }

  async function deleteAppointment(appointmentId: string) {
    if (!confirm('Delete this appointment?')) return

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadAppointments()
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error)
    }
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800'
  }

  if (loading) return <div>Loading appointments...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-sm">No appointments scheduled yet.</p>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{appointment.title}</span>
                      <Badge className={statusColors[appointment.status]}>
                        {appointment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {new Date(appointment.start_time).toLocaleString()}
                      {appointment.end_time && ` - ${new Date(appointment.end_time).toLocaleString()}`}
                    </p>
                    {appointment.location && (
                      <p className="text-sm text-gray-600 mb-1">📍 {appointment.location}</p>
                    )}
                    {appointment.description && (
                      <p className="text-sm text-gray-600">{appointment.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(appointment.id, 'completed')}>
                            ✓ Complete
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(appointment.id, 'cancelled')}>
                            ✕ Cancel
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteAppointment(appointment.id)}>
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Schedule Appointment</Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Schedule Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Initial consultation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time (optional)</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location (optional)</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Office, Phone call"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this appointment..."
                  className="w-full border rounded p-2 min-h-[80px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createAppointment}
                  className="flex-1"
                  disabled={isSubmitting || !title.trim() || !startTime}
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
