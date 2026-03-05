'use client'

import ContentCalendar from '@/components/content-calendar'

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Content Calendar</h1>
        <p className="text-gray-600">Schedule and manage your content queue.</p>
      </div>

      <ContentCalendar />
    </div>
  )
}
