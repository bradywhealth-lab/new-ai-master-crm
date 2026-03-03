'use client'

import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import SMSThread from '@/components/sms-thread'
import AIPredictionCard from '@/components/ai-prediction-card'
import LeadNotes from '@/components/lead-notes'
import FollowUpScheduler from '@/components/follow-up-scheduler'
import AppointmentsManager from '@/components/appointments-manager'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  disposition: string
  tags: string[]
  notes: string | null
  source_filename: string | null
  source_row_id: string | null
  created_at: string
  ai_score: number | null
  ai_qualification_reason: string | null
}

export default function LeadDetail() {
  const params = useParams()
  const leadId = params.id
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'followups' | 'appointments' | 'notes'>('overview')
  const supabase = createClient()

  useEffect(() => {
    loadLead()
  }, [leadId])

  async function loadLead() {
    const { data } = await supabase.from('leads').select('*').eq('id', leadId).single() as any
    setLead(data)
    setLoading(false)
  }

  // Reload lead data after AI prediction actions
  function handleAIAction() {
    loadLead()
  }

  if (loading) return <div>Loading...</div>
  if (!lead) return <div>Lead not found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {lead.first_name} {lead.last_name}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lead Info */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>First Name</Label>
              <p>{lead.first_name}</p>
            </div>
            <div>
              <Label>Last Name</Label>
              <p>{lead.last_name}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{lead.email}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p>{lead.phone}</p>
            </div>
            <div>
              <Label>Disposition</Label>
              <Badge className="text-lg px-3 py-1">{lead.disposition}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Source & AI Info */}
        <Card>
          <CardHeader>
            <CardTitle>Source & AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Source File</Label>
              <p>{lead.source_filename}</p>
            </div>
            <div>
              <Label>Row ID</Label>
              <p>{lead.source_row_id}</p>
            </div>
            <div>
              <Label>Upload Date</Label>
              <p>{new Date(lead.created_at).toLocaleString()}</p>
            </div>
            {lead.ai_score && (
              <div>
                <Label>AI Score</Label>
                <p className="text-2xl font-bold">{lead.ai_score}/100</p>
              </div>
            )}
            {lead.ai_qualification_reason && (
              <div>
                <Label>AI Qualification</Label>
                <p className="text-sm">{lead.ai_qualification_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {(lead.tags || []).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={`px-3 py-1 ${tag === 'WHALE' ? 'border-blue-500 text-blue-600' : ''}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'followups', label: 'Follow-ups' },
            { key: 'appointments', label: 'Appointments' },
            { key: 'notes', label: 'Notes' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* AI Prediction Card */}
          {lead.ai_score !== null && (
            <AIPredictionCard
              leadId={leadId!}
              prediction={{
                disposition: lead.disposition,
                score: lead.ai_score || 0,
                reasoning: lead.ai_qualification_reason || ''
              }}
              onConfirm={handleAIAction}
              onEdit={handleAIAction}
              onAddNote={handleAIAction}
            />
          )}

          {/* SMS Thread */}
          <SMSThread leadId={leadId!} />
        </>
      )}

      {activeTab === 'followups' && (
        <FollowUpScheduler leadId={leadId!} />
      )}

      {activeTab === 'appointments' && (
        <AppointmentsManager leadId={leadId!} />
      )}

      {activeTab === 'notes' && (
        <LeadNotes leadId={leadId!} />
      )}
    </div>
  )
}
