'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Appointment } from '@/types/phase3'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, addMonths, addDays, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    try {
      const response = await fetch('/api/appointments')
      const result = await response.json()
      setAppointments(result.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load appointments:', error)
      setLoading(false)
    }
  }

  function goToPreviousMonth() {
    setCurrentDate(addMonths(currentDate, -1))
  }

  function goToNextMonth() {
    setCurrentDate(addMonths(currentDate, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = []
  let day = startDate

  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => apt.status === 'scheduled' && new Date(apt.start_time).toDateString() === dateStr)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Calendar</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {loading ? (
          <div>Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
              <div key={dayName} className="text-center text-sm font-medium text-gray-600 p-2">
                {dayName}
              </div>
            ))}

            {days.map((date, index) => {
              const isCurrentMonth = isSameMonth(date, currentDate)
              const isToday = isSameDay(date, new Date())
              const appointmentsForDay = getAppointmentsForDate(date)

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                >
                  <div className="text-right text-sm text-gray-500">
                    {date.getDate()}
                  </div>
                  {appointmentsForDay.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {appointmentsForDay.map((apt) => (
                        <Badge
                          key={apt.id}
                          variant="outline"
                          className="text-xs w-full justify-center"
                        >
                          {apt.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
