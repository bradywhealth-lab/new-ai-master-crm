'use client'

import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { SMSThread } from '@/components/sms-thread'
import { AIPredictionCard } from '@/components/ai-prediction-card'
import type { Outcome } from '@/types/outcome'
import { LeadNotes } from '@/components/lead-notes'
import { FollowUpScheduler } from '@/components/follow-up-scheduler'
import { AppointmentsManager } from '@/components/appointments-manager'
import { OutcomeTracker } from '@/components/outcome-tracker'
import {
  Phone,
  Mail,
  MessageSquare,
  Edit,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  MoreVertical,
  User,
  Clock,
  FileText,
  MapPin,
} from 'lucide-react'

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
  last_activity: string | null
  last_activity_date: string | null
}

interface Activity {
  id: string
  lead_id: string
  activity_type: string
  description: string
  created_at: string
}

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

const getDispositionColor = (disposition: string) => {
  switch (disposition) {
    case 'hot':
      return 'bg-destructive text-destructive-foreground'
    case 'nurture':
      return 'bg-secondary text-secondary-foreground'
    case 'sold':
      return 'bg-green-600 text-white'
    default:
      return 'bg-gray-200 text-gray-700'
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'sms_sent':
      return <MessageSquare className="w-5 h-5 text-green-500" />
    case 'email_sent':
      return <Mail className="w-5 h-5 text-blue-500" />
    case 'call_made':
      return <Phone className="w-5 h-5 text-purple-500" />
    case 'note_added':
      return <FileText className="w-5 h-5 text-yellow-600" />
    case 'appointment_scheduled':
      return <Calendar className="w-5 h-5 text-orange-500" />
    case 'disposition_changed':
      return <Edit className="w-5 h-5 text-pink-500" />
    default:
      return <User className="w-5 h-5 text-gray-500" />
  }
}

export default function LeadDetail() {
  const router = useRouter()
  const params = useParams()
  const leadId = (params.id || '') as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'followups' | 'appointments' | 'notes' | 'activity'>('overview')
  const [activities, setActivities] = useState<Activity[]>([])

  const loadLead = useCallback(async () => {
    try {
      const supabase = createClient()
      const query = supabase.from('leads').select('*')
      const filtered = (query as any).filter({ id: leadId })
      const limited = filtered.limit(1)
      const { data } = await limited
      setLead(data && data.length > 0 ? data[0] as any : null)
    } catch (error) {
      console.error('Failed to load lead:', error)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  const loadActivities = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/activities`)
      const result = await response.json()
      setActivities(result.data || [])
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }, [leadId])

  useEffect(() => {
    loadLead()
    loadActivities()
  }, [leadId])

  // Reload lead data after AI prediction actions
  const handleAIAction = useCallback(() => {
    loadLead()
    }, [loadLead])

  const handleOutcomeChange = useCallback(() => {
    loadLead()
  }, [loadLead])

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>
  )

  if (!lead) return <div>Lead not found</div>

  const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
  const aiScore = lead.ai_score || 0
  const scoreLabel = getScoreLabel(aiScore)
  const scoreColor = getScoreColor(aiScore)

  return (
    <div className="min-h-screen bg-background">
      {/* Elite Gradient Header */}
      <header className="bg-gradient-to-r from-primary via-primary-hover to-primary-dark text-white shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-primary font-bold text-xl">
                  {fullName.charAt(0)}
                </div>
                <h1 className="text-2xl font-bold">{fullName}</h1>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-4">
                {lead.ai_score !== null && (
                  <>
                    <div className="text-sm text-primary-light">AI Score</div>
                    <div className="flex items-center gap-2">
                      <div className={`text-3xl font-bold ${scoreColor}`}>
                        {aiScore}
                      </div>
                      <Badge className={scoreColor}>{scoreLabel}</Badge>
                    </div>
                  </>
                )}
              </div>
              <Badge className={getDispositionColor(lead.disposition)} className="text-sm px-4 py-2">
                {lead.disposition.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info (spans 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info Card */}
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2">
                      {lead.email ? (
                        <>
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <button
                            onClick={() => window.open(`mailto:${lead.email}`)}
                            className="text-blue-600 hover:underline font-medium transition-colors"
                          >
                            {lead.email}
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">No email</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="flex items-center gap-2">
                      {lead.phone ? (
                        <>
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <button
                            onClick={() => window.open(`tel:${lead.phone}`)}
                            className="text-blue-600 hover:underline font-medium transition-colors"
                          >
                            {lead.phone}
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </div>
                  </div>
                </div>

                {lead.address && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-foreground">{lead.address}</p>
                  </div>
                )}

                {lead.city && lead.state && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-foreground">{lead.city}, {lead.state}</p>
                  </div>
                )}

                {lead.zip && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">ZIP Code</label>
                    <p className="text-foreground">{lead.zip}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Score Breakdown Card */}
            {lead.ai_score !== null && (
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    AI Qualification Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                    {/* Visual Score Circle */}
                    <div className="relative w-32 h-32">
                      <svg
                        className="w-full h-full transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-gray-200"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className={scoreColor}
                          strokeLinecap="round"
                          style={{
                            strokeDasharray: `${aiScore * 1.005} 100.52`,
                            transformOrigin: 'center',
                            transform: 'rotate(-90deg)'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${scoreColor}`}>
                          {aiScore}
                        </span>
                      </div>
                    </div>

                    {/* Score Details */}
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-muted-foreground">Overall Score</span>
                          <span className="text-3xl font-bold text-foreground">{aiScore}/100</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={scoreColor}>{scoreLabel}</Badge>
                          {aiScore >= 80 && (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          )}
                          {aiScore < 60 && (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {lead.ai_qualification_reason && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-foreground leading-relaxed">
                        {lead.ai_qualification_reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Source Info Card */}
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Source Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source File</label>
                  <p className="text-foreground">{lead.source_filename || 'Manual'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Row ID</label>
                  <p className="text-foreground">{lead.source_row_id || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                  <p className="text-foreground">
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
                {lead.last_activity_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                    <p className="text-foreground">
                      {new Date(lead.last_activity_date).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.tags && lead.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-0">
                <div className="flex gap-2 border-b">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'followups', label: 'Follow-ups' },
                    { key: 'appointments', label: 'Appointments' },
                    { key: 'notes', label: 'Notes' },
                    { key: 'activity', label: 'Activity' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'border-b-2 border-primary text-primary'
                          : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="mt-6 space-y-6">
                    {/* AI Prediction Card */}
                    <AIPredictionCard
                      leadId={leadId}
                      prediction={{
                        disposition: lead.disposition,
                        score: aiScore,
                        reasoning: lead.ai_qualification_reason || ''
                      }}
                      onConfirm={handleAIAction}
                      onEdit={handleAIAction}
                      onAddNote={handleAIAction}
                    />

                    {/* SMS Thread */}
                    <SMSThread leadId={leadId} />
                  </div>
                )}

                {activeTab === 'followups' && (
                  <div className="mt-6">
                    <FollowUpScheduler leadId={leadId} />
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div className="mt-6">
                    <AppointmentsManager leadId={leadId} />
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="mt-6">
                    <LeadNotes leadId={leadId} />
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="mt-6 space-y-6">
                    {activities.length > 0 ? (
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
                          >
                            <div className="mt-1">{getActivityIcon(activity.activity_type)}</div>
                            <div className="flex-1 min-w-0">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {activity.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(activity.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <User className="w-12 h-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">No activity recorded yet</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions (spans 1) */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="hover:shadow-lg transition-all sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => window.open(`tel:${lead.phone}`)}
                  disabled={!lead.phone}
                  className="w-full justify-start"
                  variant="default"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Lead
                </Button>

                <Button
                  onClick={() => window.open(`mailto:${lead.email}`)}
                  disabled={!lead.email}
                  variant="secondary"
                  className="w-full justify-start"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>

                <Button
                  onClick={() => setActiveTab('notes')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Note
                </Button>

                <Button
                  onClick={() => setActiveTab('followups')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Follow-up
                </Button>

                <Button
                  onClick={() => router.push(`/dashboard/leads/${leadId}/edit`)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Lead
                </Button>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="w-full"
                  >
                    Back to List
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Last Activity Card */}
            {lead.last_activity && (
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="mt-1">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {lead.last_activity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.last_activity_date ? new Date(lead.last_activity_date).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags Summary */}
            {lead.tags && lead.tags.length > 0 && (
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Outcome Tracker */}
            <OutcomeTracker
              leadId={leadId}
              currentDisposition={lead.disposition}
              onOutcomeChange={handleOutcomeChange}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
