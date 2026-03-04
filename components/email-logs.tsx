'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { EmailLog } from '@/types/communications'

export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadLogs()
  }, [statusFilter])

  async function loadLogs() {
    try {
      const url = statusFilter === 'all'
        ? '/api/email/logs'
        : `/api/email/logs?status=${statusFilter}`
      const response = await fetch(url)
      const result = await response.json()
      setLogs(result.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load email logs:', error)
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  if (loading) return <div>Loading email logs...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Logs</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded p-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No email logs yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold">{log.subject}</div>
                      <div className="text-sm text-gray-600">
                        To: {log.to_email}
                      </div>
                    </div>
                    <Badge className={statusColors[log.status]}>
                      {log.status}
                    </Badge>
                  </div>
                  {log.error_message && (
                    <div className="text-sm text-red-600 mt-1">
                      Error: {log.error_message}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(log.created_at).toLocaleString()}
                    {log.sent_at && ` • Sent: ${new Date(log.sent_at).toLocaleString()}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
