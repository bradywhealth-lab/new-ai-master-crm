'use client'

import { useEffect, useState } from 'react'
import LearningDashboard from '@/components/learning-dashboard'
import type { LearningInsights } from '@/types/feedback'

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<LearningInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  async function loadInsights() {
    try {
      const response = await fetch('/api/ai/insights')
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Learning Insights</h1>
      {insights && <LearningDashboard insights={insights} />}
    </div>
  )
}
