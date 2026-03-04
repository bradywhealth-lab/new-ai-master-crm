'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import jsPDF from 'jspdf'
import type { Lead } from '@/types/lead'
import { Download, Mail, Printer, FileText } from 'lucide-react'

export default function ReportGenerator() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'30' | '90' | 'all'>('30')
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'activities' | 'conversion'>('summary')
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf')

  async function generateReport() {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: dateRange,
          report_type: reportType
        })
      })

      if (response.ok) {
        const result = await response.json()

        if (format === 'pdf' && result.data.pdf_data) {
          // Download PDF
          const pdfData = result.data.pdf_data
          const link = document.createElement('a')
          link.href = `data:application/pdf;base64,${pdfData}`
          link.download = `InsureAssist_Report_${dateRange}_${reportType}.pdf`
          link.click()
        } else {
          // For CSV, create a download from the data
          const blob = new Blob([result.data.csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `InsureAssist_Report_${dateRange}_${reportType}.csv`
          link.click()
        }

        alert('Report generated successfully!')
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Report</option>
                <option value="activities">Activity Report</option>
                <option value="conversion">Conversion Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <Button
              onClick={generateReport}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <FileText className="h-5 w-5" />
              <div className="text-sm">
                <div className="font-semibold">Pro Tip:</div>
                <div className="text-gray-700">
                  Generate reports to export your lead data for offline analysis or sharing with team.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
