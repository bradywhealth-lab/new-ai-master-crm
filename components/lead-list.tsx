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
  { value: 'new', label: 'New' },
  { value: 'hot', label: 'Hot' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'sold', label: 'Sold' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
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
  if (score >= 90) return 'text-success'
  if (score >= 80) return 'text-primary'
  if (score >= 70) return 'text-warning'
  if (score >= 60) return 'text-info'
  return 'text-destructive'
}

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Hot'
  if (score >= 70) return 'Qualified'
  if (score >= 60) return 'Warm'
  return 'Cold'
}

const getDispositionBadgeColor = (disposition: string) => {
  switch (disposition) {
    case 'sold': return 'bg-success text-success-foreground'
    case 'hot': return 'bg-destructive text-destructive-foreground'
    case 'nurture': return 'bg-secondary text-secondary-foreground'
    case 'qualified': return 'bg-primary text-primary-foreground'
    case 'new': return 'bg-muted text-foreground-secondary'
    case 'proposal': return 'bg-info text-info-foreground'
    case 'negotiation': return 'bg-warning text-warning-foreground'
    default: return 'bg-muted text-foreground-secondary'
  }
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
      {/* Elite Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-foreground-secondary">Manage your pipeline with AI-qualified prospects</p>
          </div>
          {selectedLeads.size > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => setShowBulkSMSDialog(true)} size="sm" className="btn-elite-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                SMS ({selectedLeads.size})
              </Button>
              <Button onClick={() => setShowBulkEmailDialog(true)} size="sm" className="btn-elite-secondary">
                <Mail className="w-4 h-4 mr-2" />
                Email ({selectedLeads.size})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Elite Filters Toolbar */}
      <Card className="card-elite mb-6">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-elite flex-1"
              icon={
                <div className="absolute right-3 text-foreground-muted">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-1-1 0 0 10 5" />
                  </svg>
                </div>
              }
            />
            <select
              value={dispositionFilter}
              onChange={(e) => setDispositionFilter(e.target.value)}
              className="input-elite flex-1"
            >
              <option value="all">All Dispositions</option>
              {dispositionConfig.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="input-elite flex-1"
            >
              <option value="all">All Sources</option>
              {sourceConfig.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Elite Table */}
      <Card className="card-elite table-container">
        <Table className="table-elite">
          <TableHeader>
            <TableRow>
              <TableHead className="table-header-elite w-10 px-4">
                <input
                  type="checkbox"
                  checked={selectAll && leads.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4"
                />
              </TableHead>
              <TableHead className="px-4">Lead</TableHead>
              <TableHead className="hidden md:table-cell px-4">Email</TableHead>
              <TableHead className="hidden md:table-cell px-4">Phone</TableHead>
              <TableHead className="px-4">AI Score</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="hidden md:table-cell px-4">Source</TableHead>
              <TableHead className="hidden md:table-cell px-4">Tags</TableHead>
              <TableHead className="px-4">Last Activity</TableHead>
              <TableHead className="px-4">Actions</TableHead>
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
                  className={`table-row-elite ${index % 2 === 0 ? 'bg-hover/50' : ''}`}
                >
                  <TableCell className="w-10 px-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-start gap-3">
                      <div className="font-medium text-foreground">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="md:hidden text-xs text-foreground-secondary">
                        {lead.email || <span className="text-destructive">No email</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-4">
                    {lead.phone || <span className="text-destructive">No phone</span>}
                  </TableCell>
                  <TableCell className="px-4">
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
                  <TableCell className="px-4">
                    <Badge className={getDispositionBadgeColor(lead.disposition)}>
                      {lead.disposition}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-4">
                    {lead.source || 'manual'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-4">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {lead.tags.length > 2 && (
                        <span className="text-xs text-foreground-muted">+{lead.tags.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    {lead.last_activity ? (
                      <div className="text-sm text-foreground-secondary truncate max-w-[200px]" title={lead.last_activity}>
                        {lead.last_activity}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground-muted">No activity</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-4">
                    {lead.last_activity_date ? (
                      <span className="text-xs text-foreground-muted">
                        {new Date(lead.last_activity_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-foreground-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActionMenuLead(lead.id === actionMenuLead ? null : lead.id)}
                        className="text-primary"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {actionMenuLead === lead.id && (
                        <div className="absolute right-0 top-full mt-8 w-48 bg-surface border shadow-lg rounded-lg z-10">
                          <div className="py-1">
                            <Link
                              href={`/dashboard/leads/${lead.id}`}
                              className="block px-3 py-2 text-sm text-foreground hover:bg-hover transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2 text-primary" /> View Details
                            </Link>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-hover transition-colors"
                              onClick={() => window.location.href = `tel:${lead.phone}`}
                            >
                              <Phone className="w-4 h-4 mr-2 text-primary" /> Call
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-hover transition-colors"
                              onClick={() => window.open(`mailto:${lead.email}`)}
                            >
                              <Mail className="w-4 h-4 mr-2 text-primary" /> Email
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
            <h3 className="text-lg font-bold mb-4">Send Bulk SMS</h3>
            <div className="space-y-4">
              <div className="bg-hover p-4 rounded-lg border border-border-light">
                <p className="text-sm text-foreground-secondary">
                  This will send SMS to <span className="font-semibold text-foreground">{selectedLeads.size}</span> selected lead(s)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Message</label>
                <textarea
                  value={bulkSMSMessage}
                  onChange={(e) => setBulkSMSMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="input-elite w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowBulkSMSDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkSMS} className="btn-elite-primary">
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
            <h3 className="text-lg font-bold mb-4">Send Bulk Email</h3>
            <div className="space-y-4">
              <div className="bg-hover p-4 rounded-lg border border-border-light">
                <p className="text-sm text-foreground-secondary">
                  This will send email to <span className="font-semibold text-foreground">{selectedLeads.size}</span> selected lead(s) with valid email addresses
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Subject</label>
                <Input
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="input-elite"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Message</label>
                <textarea
                  value={bulkEmailMessage}
                  onChange={(e) => setBulkEmailMessage(e.target.value)}
                  placeholder="Enter your message... Use {firstName} and {lastName} for personalization"
                  rows={6}
                  className="input-elite w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowBulkEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEmail} className="btn-elite-primary">
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
