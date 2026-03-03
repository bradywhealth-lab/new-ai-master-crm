'use client'

import TrendResearch from '@/components/trend-research'

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Trend Research</h1>
        <p className="text-gray-600">Research trending keywords and hashtags across social platforms.</p>
      </div>

      <TrendResearch />
    </div>
  )
}
