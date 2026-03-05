'use client'

import CalendarView from '@/components/calendar-view'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-gray-600">View and manage your appointments and follow-ups.</p>
      </div>

      <CalendarView />
    </div>
  )
}
