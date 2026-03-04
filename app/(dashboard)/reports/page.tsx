'use client'

import ReportGenerator from '@/components/report-generator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-gray-600">Generate and export reports for offline analysis and sharing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportGenerator />

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded bg-gray-50">
                <div>
                  <div className="text-sm text-gray-600">Weekly Summary</div>
                  <Badge>PDF</Badge>
                </div>
                <Button size="sm" variant="outline">Download</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded bg-gray-50">
                <div>
                  <div className="text-sm text-gray-600">Monthly Performance</div>
                  <Badge>PDF</Badge>
                </div>
                <Button size="sm" variant="outline">Download</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded bg-gray-50">
                <div>
                  <div className="text-sm text-gray-600">Lead Activities</div>
                  <Badge>PDF</Badge>
                </div>
                <Button size="sm" variant="outline">Download</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
