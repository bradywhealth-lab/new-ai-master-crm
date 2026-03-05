'use client'

import AnalyticsDashboard from '@/components/analytics-dashboard'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600">Track your leads, conversion rates, and performance metrics.</p>
      </div>

      <AnalyticsDashboard />
    </div>
  )
}
