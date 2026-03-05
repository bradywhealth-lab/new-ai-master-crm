'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ScrapeConfig from '@/components/scrape-config'
import ScrapeResults from '@/components/scrape-results'

export default function ScrapingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Web Scraping</h1>
        <p className="text-gray-600">Automatically capture leads from websites and directories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrape Config */}
        <div className="lg:col-span-1">
          <ScrapeConfig />
        </div>

        {/* Scrape Results */}
        <div className="lg:col-span-1">
          <ScrapeResults />
        </div>
      </div>
    </div>
  )
}
