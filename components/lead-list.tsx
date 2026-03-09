'use client'

import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  X,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  disposition: string
  tags: string[]
  source: string | null
  source_filename: string | null
  created_at: string
  ai_score: number
  last_activity: string | null
  last_activity_date: string | null
}

const dispositionConfig = [
  { value: 'all', label: 'All Dispositions' },
  { value: 'new', label: 'New', color: 'default' },
  { value: 'hot', label: 'Hot', color: 'destructive' },
  { value: 'nurture', label: 'Nurture', color: 'secondary' },
  { value: 'sold', label: 'Sold', color: 'success' },
]

const sourceConfig = [
  { value: 'all', label: 'All Sources' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'other', label: 'Other' },
  { value: 'manual', label: 'Manual' },
]

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-500'
  if (score >= 80) return 'text-blue-500'
  if (score >= 70) return 'text-yellow-500'
  if (score >= 60) return 'text-orange-500'
  return 'text-red-500'
}

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Hot'
  if (score >= 70) return 'Qualified'
  if (score >= 60) return 'Warm'
  return 'Cold'
}

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dispositionFilter, setDispositionFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkSMSDialog, setShowBulkSMSDialog] = useState(false)
  const [bulkSMSMessage, setBulkSMSMessage] = useState('')
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false)
  const [bulkEmailSubject, setBulkEmailSubject] = useState('')
  const [bulkEmailMessage, setBulkEmailMessage] = useState('')
  const [actionMenuLead, setActionMenuLead] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [search, dispositionFilter, sourceFilter, dateRange])

  async function loadLeads() {
    setLoading(true)

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (dispositionFilter !== 'all') {
      query = query.eq('disposition', dispositionFilter)
    }

    if (sourceFilter !== 'all') {
      query = query.eq('source', sourceFilter)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Error loading leads:', error)
    } else {
      setLeads(data || [])
    }

    setLoading(false)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedLeads(new Set(leads.map(l => l.id)))
    } else {
      setSelectedLeads(new Set())
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeads)
    if (checked) {
      newSelected.add(leadId)
    } else {
      newSelected.delete(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const handleBulkSMS = async () => {
    if (selectedLeads.size === 0) {
      alert('Please select at least one lead')
      return
    }
    if (!bulkSMSMessage.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      const response = await fetch('/api/leads/bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          message: bulkSMSMessage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Failed: ${result.error || 'Unknown error'}`)
        return
      }

      alert(`SMS sent to ${result.sent || 0} leads, ${result.failed || 0} failed`)
      setShowBulkSMSDialog(false)
      setBulkSMSMessage('')
      setSelectedLeads(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('Bulk SMS error:', error)
      alert('Failed to send SMS')
    }
  }

  const handleBulkEmail = async () => {
    if (selectedLeads.size === 0) {
      alert('Please select at least one lead')
      return
    }
    if (!bulkEmailSubject.trim() || !bulkEmailMessage.trim()) {
      alert('Please enter a subject and message')
      return
    }

    try {
      const response = await fetch('/api/leads/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          subject: bulkEmailSubject,
          message: bulkEmailMessage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Failed: ${result.error || 'Unknown error'}`)
        return
      }

      alert(`Email sent to ${result.sent || 0} leads, ${result.failed || 0} failed`)
      setShowBulkEmailDialog(false)
      setBulkEmailSubject('')
      setBulkEmailMessage('')
      setSelectedLeads(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('Bulk email error:', error)
      alert('Failed to send email')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header with Bulk Actions */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">Manage your pipeline with AI-qualified prospects</p>
          </div>
          {selectedLeads.size > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => setShowBulkSMSDialog(true)} size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                SMS ({selectedLeads.size})
              </Button>
              <Button onClick={() => setShowBulkEmailDialog(true)} size="sm" variant="secondary">
                <Mail className="w-4 h-4 mr-2" />
                Email ({selectedLeads.size})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
              icon={
                <div className="absolute right-3 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-1-1 0 0 10 5" />
                  </svg>
                </div>
              }
            />
            <select
              value={dispositionFilter}
              onChange={(e) => setDispositionFilter(e.target.value)}
              className="flex-1"
            >
              <option value="all">All Dispositions</option>
              {dispositionConfig.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="flex-1"
            >
              <option value="all">All Sources</option>
              {sourceConfig.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selectAll && leads.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4"
                />
              </TableHead>
              <TableHead>Lead</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent">
                      <div className="sr-only">Loading...</div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead, index) => (
                <TableRow
                  key={lead.id}
                  className={index % 2 === 0 ? 'bg-muted/30' : ''}
                >
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="font-medium">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="md:hidden text-xs text-muted-foreground">
                        {lead.email || <span className="text-red-500">No email</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {lead.phone || <span className="text-red-500">No phone</span>}
                  </TableCell>
                  <TableCell>
                    {/* AI Score Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getScoreColor(lead.ai_score || 0)}`}>
                        {lead.ai_score || 0}
                      </div>
                      <div className="hidden md:inline-block w-24">
                        <div className={`text-xs font-medium ${getScoreColor(lead.ai_score || 0)}`}>
                          {getScoreLabel(lead.ai_score || 0)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={lead.disposition === 'hot' ? 'destructive' : 'secondary'}
                    >
                      {lead.disposition}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {lead.source || 'manual'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {lead.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{lead.tags.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.last_activity ? (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={lead.last_activity}>
                        {lead.last_activity}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No activity</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {lead.last_activity_date ? (
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.last_activity_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActionMenuLead(lead.id === actionMenuLead ? null : lead.id)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {actionMenuLead === lead.id && (
                        <div className="absolute right-0 top-full mt-8 w-48 bg-card border shadow-lg rounded-lg z-10">
                          <div className="py-1">
                            <Link
                              href={`/dashboard/leads/${lead.id}`}
                              className="block px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </Link>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => window.location.href = `tel:${lead.phone}`}
                            >
                              <Phone className="w-4 h-4 mr-2" /> Call
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => window.open(`mailto:${lead.email}`)}
                            >
                              <Mail className="w-4 h-4 mr-2" /> Email
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                              onClick={() => {/* Delete handler */}}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Bulk SMS Dialog */}
      {showBulkSMSDialog && (
        <Dialog open={showBulkSMSDialog} onOpenChange={setShowBulkSMSDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Bulk SMS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will send SMS to <span className="font-semibold">{selectedLeads.size}</span> selected lead(s)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={bulkSMSMessage}
                  onChange={(e) => setBulkSMSMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowBulkSMSDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkSMS}>
                Send SMS
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Email Dialog */}
      {showBulkEmailDialog && (
        <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Bulk Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will send email to <span className="font-semibold">{selectedLeads.size}</span> selected lead(s) with valid email addresses
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={bulkEmailMessage}
                  onChange={(e) => setBulkEmailMessage(e.target.value)}
                  placeholder="Enter your message... Use {firstName} and {lastName} for personalization"
                  rows={6}
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowBulkEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEmail}>
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
