'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  disposition: string
  pipeline_status: string
  ai_score: number
  tags: string[]
}

const pipelineColumns = [
  { id: 'new', label: 'New', color: 'bg-gray-100' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-100' },
  { id: 'qualified', label: 'Qualified', color: 'bg-yellow-100' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-100' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-100' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100' },
]

export default function PipelinePage() {
  const [leads, setLeads] = useState<Record<string, Lead[]>>({
    new: [],
    contacted: [],
    qualified: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [searchTerm])

  async function loadLeads() {
    setLoading(true)

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('Error loading leads:', error)
    } else {
      // Organize by pipeline status
      const organized: Record<string, Lead[]> = {
        new: [],
        contacted: [],
        qualified: [],
        proposal: [],
        negotiation: [],
        closed_won: [],
        closed_lost: [],
      }

      data?.forEach((lead) => {
        const status = lead.pipeline_status || 'new'
        if (organized[status]) {
          organized[status].push(lead)
        }
      })

      setLeads(organized)
    }

    setLoading(false)
  }

  function moveLead(leadId: string, fromStatus: string, toStatus: string) {
    const lead = leads[fromStatus].find(l => l.id === leadId)
    if (!lead) return

    // Optimistic update
    setLeads(prev => ({
      ...prev,
      [fromStatus]: prev[fromStatus].filter(l => l.id !== leadId),
      [toStatus]: [...prev[toStatus], lead],
    }))

    // Update in database
    supabase.from('leads').update({ pipeline_status: toStatus }).eq('id', leadId).then()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Lead Pipeline</h1>

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={loadLeads}>Refresh</Button>
        </div>
      </Card>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-8">Loading pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {pipelineColumns.map(column => (
            <Card key={column.id} className={`${column.color} p-4 min-h-96`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{column.label}</h2>
                <Badge variant="outline">
                  {leads[column.id]?.length || 0}
                </Badge>
              </div>

              <div className="space-y-3">
                {leads[column.id]?.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No leads
                  </div>
                ) : (
                  leads[column.id]?.map(lead => (
                    <Card
                      key={lead.id}
                      className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                        selectedLead?.id === lead.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="font-semibold text-lg">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {lead.email || lead.phone || 'No contact info'}
                      </div>
                      {lead.ai_score && (
                        <div className="flex items-center gap-1 mt-2">
                          <Badge className={lead.ai_score >= 80 ? 'bg-green-500' : lead.ai_score >= 50 ? 'bg-yellow-500' : 'bg-gray-500'}>
                            Score: {lead.ai_score}
                          </Badge>
                        </div>
                      )}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {lead.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Move buttons */}
                      {pipelineColumns.slice(pipelineColumns.indexOf(column) + 1).map(nextCol => (
                        <Button
                          key={nextCol.id}
                          size="sm"
                          variant="outline"
                          className="mt-2 mr-1"
                          onClick={() => moveLead(lead.id, column.id, nextCol.id)}
                        >
                          {nextCol.label} →
                        </Button>
                      ))}
                    </Card>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedLead(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Lead Details</h2>
              <Button size="sm" variant="outline" onClick={() => setSelectedLead(null)}>Close</Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold">{selectedLead.first_name} {selectedLead.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{selectedLead.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{selectedLead.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">AI Score</p>
                <p className="font-semibold">{selectedLead.ai_score || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold capitalize">{selectedLead.pipeline_status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
