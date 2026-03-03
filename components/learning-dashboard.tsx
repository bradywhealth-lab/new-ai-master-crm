'use client'

import type { LearningInsights } from '@/types/feedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LearningDashboardProps {
  insights: LearningInsights
}

export default function LearningDashboard({ insights }: LearningDashboardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Accuracy Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Accuracy (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.accuracy_over_time.length > 0 ? (
            <div className="h-40 flex items-end space-x-1">
              {insights.accuracy_over_time.slice(-10).map((data, i) => {
                const height = `${(data.percentage / 100) * 100}%`
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height }}
                    title={`${data.date}: ${data.percentage}%`}
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No data yet. Provide feedback to see accuracy.</p>
          )}
        </CardContent>
      </Card>

      {/* Common Corrections */}
      <Card>
        <CardHeader>
          <CardTitle>Common Corrections</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.common_corrections.length > 0 ? (
            <ul className="space-y-2">
              {insights.common_corrections.slice(0, 5).map((corr, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{corr.prediction}</span>
                  {' '}→{' '}
                  <span className="text-green-600">{corr.correction}</span>
                  <span className="text-gray-500 ml-2">({corr.frequency}x)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No corrections data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Improvements */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Next Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            {insights.next_improvements.map((imp, i) => (
              <li key={i} className="text-sm">{imp}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
