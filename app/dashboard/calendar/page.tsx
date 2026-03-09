'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react'
import CalendarView from '@/components/calendar-view'

interface TimeSlot {
  start: string
  end: string
  label: string
}

export default function CalendarPage() {
  const [googleConnected, setGoogleConnected] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  async function loadAvailableSlots() {
    setLoadingSlots(true)
    try {
      const response = await fetch('/api/calendar/available-slots?duration=60')
      const result = await response.json()
      setAvailableSlots(result.slots || [])
    } catch (error) {
      console.error('Failed to load available slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  async function connectGoogleCalendar() {
    // In a real implementation, this would redirect to Google OAuth flow
    // For now, we'll simulate the connection
    setGoogleConnected(true)
    await loadAvailableSlots()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-gray-600">View and manage your appointments and follow-ups.</p>
      </div>

      {/* Google Calendar Integration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {googleConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-green-600 text-white">
                  Connected
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadAvailableSlots}
                  disabled={loadingSlots}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {loadingSlots ? 'Refreshing...' : 'Refresh Slots'}
                </Button>
              </div>

              {availableSlots.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Available Appointment Slots (60 min)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSlots.slice(0, 6).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => console.log('Book slot:', slot)}
                        className="p-4 border rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-medium">
                              {new Date(slot.start).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {slot.label} - {new Date(slot.end).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                        </div>
                        <Plus className="ml-auto w-4 h-4 text-primary" />
                      </button>
                    ))}
                  </div>
                  {availableSlots.length > 6 && (
                    <p className="text-sm text-gray-600 mt-2">
                      +{availableSlots.length - 6} more slots available this week
                    </p>
                  )}
                </div>
              )}

              {loadingSlots && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading available slots...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Connect your Google Calendar to sync appointments and find available meeting slots.
              </p>
              <Button
                onClick={connectGoogleCalendar}
                className="mx-auto"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Connect Google Calendar
              </Button>
              <p className="text-xs text-gray-500">
                Note: Full OAuth2 integration would be implemented in production
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar View */}
      <CalendarView />
    </div>
  )
}
