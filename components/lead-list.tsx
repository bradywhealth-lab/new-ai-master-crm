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

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [search, dispositionFilter])

  async function loadLeads() {
    setLoading(true)

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (dispositionFilter !== 'all') {
      query = query.eq('disposition', dispositionFilter)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Error loading leads:', error)
    } else {
      setLeads(data || [])
    }

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Leads</h1>

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
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={7} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
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
                <TableCell>{lead.source_filename}</TableCell>
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
    </div>
  )
}
