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
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
}

const dispositionColors: Record<string, string> = {
  new: 'bg-gray-500',
  hot: 'bg-red-500',
  nurture: 'bg-yellow-500',
  sold: 'bg-green-500',
  wrong_number: 'bg-red-900',
  do_not_contact: 'bg-gray-900',
}

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dispositionFilter, setDispositionFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkSMSDialog, setShowBulkSMSDialog] = useState(false)
  const [bulkSMSMessage, setBulkSMSMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [search, dispositionFilter, sourceFilter])

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        {selectedLeads.size > 0 && (
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkSMSDialog(true)} size="sm">
              📱 Send SMS ({selectedLeads.size})
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          value={dispositionFilter}
          onChange={(e) => setDispositionFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Dispositions</option>
          <option value="new">New</option>
          <option value="hot">Hot</option>
          <option value="nurture">Nurture</option>
          <option value="sold">Sold</option>
          <option value="wrong_number">Wrong Number</option>
          <option value="do_not_contact">Do Not Contact</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Sources</option>
          <option value="referral">Referral</option>
          <option value="website">Website</option>
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook</option>
          <option value="google">Google</option>
          <option value="other">Other</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Table */}
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Disposition</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                </TableCell>
                <TableCell>
                  {lead.first_name} {lead.last_name}
                </TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>
                  <Badge className={dispositionColors[lead.disposition] || 'bg-gray-500'}>
                    {lead.disposition}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>{lead.source || 'manual'}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/leads/${lead.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Bulk SMS Dialog */}
      {showBulkSMSDialog && (
        <Dialog open={showBulkSMSDialog} onOpenChange={setShowBulkSMSDialog}>
          <DialogContent className="max-w-md">
            <h2 className="text-lg font-semibold mb-4">Send Bulk SMS</h2>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  This will send SMS to {selectedLeads.size} selected lead(s)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={bulkSMSMessage}
                  onChange={(e) => setBulkSMSMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full border rounded-md p-3"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button onClick={() => setShowBulkSMSDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleBulkSMS}>
                Send SMS
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
