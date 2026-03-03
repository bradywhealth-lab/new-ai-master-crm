# AI Feedback Learning System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build AI feedback system that learns from user corrections to improve lead qualification accuracy over time.

**Architecture:** Next.js API routes for feedback collection, Supabase for storage, Claude API integration for pattern learning. Multi-tenant RLS enforced at database level.

**Tech Stack:** Next.js 15+, TypeScript, Supabase (PostgreSQL with RLS), @supabase/supabase-js, Anthropic Claude SDK, Tailwind CSS, Shadcn/UI

---

## Task 1: Update Database Schema

**Files:**
- Create: `docs/database-updates.sql`

**Step 1: Write SQL for new columns**

```sql
-- Add disposition change tracking to leads table
ALTER TABLE leads ADD COLUMN last_disposition_change TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN previous_disposition TEXT;
ALTER TABLE leads ADD COLUMN disposition_changes JSONB DEFAULT '[]';
```

**Step 2: Run SQL in Supabase**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `docs/database-updates.sql`
3. Click "Run"
4. Verify success message

**Step 3: Enable RLS on ai_feedback**

```sql
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own feedback"
  ON ai_feedback FOR ALL
  USING (auth.uid() = user_id);
```

**Step 4: Verify tables**

Run: In Supabase Dashboard → Table Editor, verify:
- `leads` table has new columns
- `ai_feedback` has RLS enabled

**Step 5: Commit**

```bash
git add docs/database-updates.sql
git commit -m "feat: add disposition change tracking columns"
```

---

## Task 2: Create Feedback Types

**Files:**
- Create: `types/feedback.ts`

**Step 1: Write TypeScript types**

```typescript
export interface AIPrediction {
  disposition: string
  score: number
  reasoning: string
}

export interface UserCorrection {
  disposition?: string
  score?: number
  note?: string
}

export interface FeedbackData {
  lead_id: string
  sms_log_id: string | null
  ai_prediction: AIPrediction
  user_correction: UserCorrection
  feedback_type: 'outcome_based' | 'manual_review'
}

export interface ReviewSubmission {
  lead_id: string
  ai_prediction_confirmed: boolean
  new_disposition?: string
  new_score?: number
  note?: string
}

export interface LearningInsights {
  accuracy_over_time: Array<{date: string, correct: number, total: number, percentage: number}>
  common_corrections: Array<{prediction: string, correction: string, frequency: number}>
  learned_patterns: Array<{pattern: string, confidence: number, examples: string[]}>
  leads_needing_review: Array<{id: string, name: string, prediction: string, uncertainty: number}>
  next_improvements: string[]
}
```

**Step 2: Commit**

```bash
git add types/feedback.ts
git commit -m "feat: add feedback types"
```

---

## Task 3: Create Feedback API Route (Auto on Disposition Change)

**Files:**
- Create: `app/api/leads/[id]/feedback/route.ts`

**Step 1: Write feedback creation route**

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIPrediction, FeedbackData } from '@/types/feedback'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leadId = params.id
  const { newDisposition, newScore, smsLogId } = await request.json()

  // Get current lead to capture AI prediction
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Verify ownership via RLS
  if (lead.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const aiPrediction: AIPrediction = {
    disposition: lead.disposition,
    score: lead.ai_score || 0,
    reasoning: lead.ai_qualification_reason || ''
  }

  const feedbackData: FeedbackData = {
    lead_id: leadId,
    sms_log_id: smsLogId || null,
    ai_prediction: aiPrediction,
    user_correction: {
      disposition: newDisposition,
      score: newScore
    },
    feedback_type: 'outcome_based'
  }

  // Create feedback entry
  const { error: feedbackError } = await supabase
    .from('ai_feedback')
    .insert(feedbackData)

  if (feedbackError) {
    console.error('Feedback creation error:', feedbackError)
    return Response.json({ error: 'Failed to create feedback' }, { status: 500 })
  }

  // Update lead disposition
  const dispositionChange = {
    from: lead.disposition,
    to: newDisposition,
    at: new Date().toISOString(),
    triggered_by: 'user'
  }

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      disposition: newDisposition,
      ai_score: newScore,
      previous_disposition: lead.disposition,
      last_disposition_change: new Date().toISOString(),
      disposition_changes: [...(lead.disposition_changes || []), dispositionChange]
    })
    .eq('id', leadId)

  if (updateError) {
    console.error('Lead update error:', updateError)
    return Response.json({ error: 'Failed to update lead' }, { status: 500 })
  }

  return Response.json({ success: true, feedback: feedbackData })
}
```

**Step 2: Commit**

```bash
git add app/api/leads/\[id\]/feedback/route.ts
git commit -m "feat: add feedback creation API route"
```

---

## Task 4: Create Manual Review Submission API

**Files:**
- Create: `app/api/feedback/submit/route.ts`

**Step 1: Write review submission route**

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReviewSubmission, AIPrediction } from '@/types/feedback'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ReviewSubmission = await request.json()
  const { lead_id, ai_prediction_confirmed, new_disposition, new_score, note } = body

  // Get current lead
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .single()

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  const aiPrediction: AIPrediction = {
    disposition: lead.disposition,
    score: lead.ai_score || 0,
    reasoning: lead.ai_qualification_reason || ''
  }

  const feedbackData = {
    lead_id,
    sms_log_id: null,
    ai_prediction: aiPrediction,
    user_correction: {
      disposition: new_disposition,
      score: new_score,
      note
    },
    feedback_type: 'manual_review'
  }

  // Create feedback
  const { error: feedbackError } = await supabase
    .from('ai_feedback')
    .insert(feedbackData)

  if (feedbackError) {
    return Response.json({ error: feedbackError.message }, { status: 500 })
  }

  // Update lead if corrections provided
  if (new_disposition || new_score) {
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        disposition: new_disposition,
        ai_score: new_score
      })
      .eq('id', lead_id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }
  }

  return Response.json({ success: true })
}
```

**Step 2: Commit**

```bash
git add app/api/feedback/submit/route.ts
git commit -m "feat: add manual review submission API"
```

---

## Task 5: Create Learning Insights API

**Files:**
- Create: `app/api/ai/insights/route.ts`
- Modify: `lib/supabase/server.ts`

**Step 1: Write insights route**

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get all feedback for user
  const { data: feedback } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  if (!feedback) {
    return Response.json({
      accuracy_over_time: [],
      common_corrections: [],
      learned_patterns: [],
      leads_needing_review: [],
      next_improvements: ['Submit feedback to see insights']
    })
  }

  // Calculate accuracy over time
  const accuracyMap = new Map<string, {correct: number, total: number}>()
  const correctionMap = new Map<string, number>()

  for (const fb of feedback) {
    const date = fb.created_at.split('T')[0]
    const key = `${fb.ai_prediction.disposition}_${fb.user_correction.disposition}`

    if (!accuracyMap.has(date)) {
      accuracyMap.set(date, { correct: 0, total: 0 })
    }

    const acc = accuracyMap.get(date)!
    acc.total++

    if (fb.ai_prediction.disposition === fb.user_correction.disposition) {
      acc.correct++
    }

    // Track common corrections
    const corrKey = `${fb.ai_prediction.disposition}→${fb.user_correction.disposition}`
    correctionMap.set(corrKey, (correctionMap.get(corrKey) || 0) + 1)
  }

  const accuracyOverTime = Array.from(accuracyMap.entries()).map(([date, acc]) => ({
    date,
    correct: acc.correct,
    total: acc.total,
    percentage: Math.round((acc.correct / acc.total) * 100)
  }))

  const commonCorrections = Array.from(correctionMap.entries())
    .map(([key, freq]) => {
      const [prediction, correction] = key.split('→')
      return { prediction, correction, frequency: freq }
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  return Response.json({
    accuracy_over_time: accuracyOverTime,
    common_corrections: commonCorrections,
    learned_patterns: [],
    leads_needing_review: [],
    next_improvements: commonCorrections.length > 0
      ? [`Consider adjusting rules for ${commonCorrections[0].prediction} predictions`]
      : ['Continue providing feedback to improve accuracy']
  })
}
```

**Step 2: Commit**

```bash
git add app/api/ai/insights/route.ts
git commit -m "feat: add learning insights API"
```

---

## Task 6: Create AI Prediction Card Component

**Files:**
- Create: `components/ui/dialog.tsx` (if not exists)
- Create: `components/ai-prediction-card.tsx`

**Step 1: Write Dialog component (Shadcn)**

```typescript
'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const DialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

const Dialog = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const [open, setOpen] = React.useState(false)
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      <div {...props}>{children}</div>
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Slot> & React.ComponentPropsWithoutRef<'button'>>(
  ({ className, children, ...props }, ref
) => {
  const { setOpen } = React.useContext(DialogContext)
  return (
    <Slot
      ref={ref}
      className={cn('inline-flex items-center justify-center', className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </Slot>
  )
})
DialogTrigger.displayName = 'DialogTrigger'

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref
) => {
  const { open, setOpen } = React.useContext(DialogContext)
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-lg shadow-lg p-6 w-full max-w-md',
          className
        )}
        {...props}
      >
        {children}
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
    </div>
  ) : null
})
DialogContent.displayName = 'DialogContent'

export { Dialog, DialogTrigger, DialogContent }
```

**Step 2: Write AI Prediction Card component**

```typescript
'use client'

import { useState } from 'react'
import type { AIPrediction } from '@/types/feedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

interface AIPredictionCardProps {
  prediction: AIPrediction
  onConfirm: () => void
  onEdit: () => void
  onAddNote: (note: string) => void
}

export default function AIPredictionCard({
  prediction,
  onConfirm,
  onEdit,
  onAddNote
}: AIPredictionCardProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')

  const confidenceLevel = prediction.score >= 80 ? 'High' : prediction.score >= 60 ? 'Medium' : 'Low'
  const confidenceColor = prediction.score >= 80 ? 'bg-green-100 text-green-800' : prediction.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🤖 AI Prediction</span>
          <Badge className={confidenceColor}>{confidenceLevel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{prediction.disposition.toUpperCase()}</span>
          <span className="text-gray-600">({prediction.score}/100)</span>
        </div>

        <p className="text-sm text-gray-700">{prediction.reasoning}</p>

        <div className="flex gap-2 pt-2">
          <Button onClick={onConfirm} size="sm" variant="default">
            ✓ Confirm
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">✏️ Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-semibold mb-4">Edit Prediction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Disposition</label>
                  <input
                    type="text"
                    defaultValue={prediction.disposition}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={prediction.score}
                    className="w-full border rounded p-2"
                  />
                </div>
                <Button onClick={onEdit} className="w-full">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">📝 Add Note</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-semibold mb-4">Add Note</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context about this prediction..."
                className="w-full border rounded p-2 min-h-[100px]"
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={() => { onAddNote(note); setNoteOpen(false) }} className="flex-1">
                  Save Note
                </Button>
                <Button onClick={() => setNoteOpen(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Commit**

```bash
git add components/ui/dialog.tsx components/ai-prediction-card.tsx
git commit -m "feat: add AI prediction card component"
```

---

## Task 7: Create AI Reviews Page

**Files:**
- Create: `app/(dashboard)/ai-reviews/page.tsx`
- Create: `components/ai-review-list.tsx`

**Step 1: Write AI reviews page**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AireviewList from '@/components/ai-review-list'

export default function AIReviewsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [filter])

  async function loadLeads() {
    const { data: userData } = await supabase.auth.getUser()

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', userData.user?.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('disposition', filter)
    }

    const { data } = await query
    setLeads(data || [])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Predictions Review</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Leads</option>
          <option value="new">New</option>
          <option value="hot">Hot</option>
          <option value="nurture">Nurture</option>
        </select>
      </div>

      <AireviewList leads={leads} />
    </div>
  )
}
```

**Step 2: Write AI review list component**

```typescript
'use client'

import { useState } from 'react'
import type { AIPrediction } from '@/types/feedback'
import AIPredictionCard from '@/components/ai-prediction-card'

interface AireviewListProps {
  leads: Array<any>
}

export default function AireviewList({ leads }: AireviewListProps) {
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())

  const handleConfirm = (leadId: string) => {
    setConfirmedIds(new Set(confirmedIds).add(leadId))
  }

  const handleEdit = (leadId: string) => {
    // Open edit dialog
    console.log('Edit prediction for:', leadId)
  }

  const handleAddNote = (leadId: string, note: string) => {
    console.log('Add note for:', leadId, note)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => {
        const prediction: AIPrediction = {
          disposition: lead.disposition,
          score: lead.ai_score || 0,
          reasoning: lead.ai_qualification_reason || ''
        }

        if (confirmedIds.has(lead.id)) {
          return null // Hide confirmed leads
        }

        return (
          <AIPredictionCard
            key={lead.id}
            prediction={prediction}
            onConfirm={() => handleConfirm(lead.id)}
            onEdit={() => handleEdit(lead.id)}
            onAddNote={(note) => handleAddNote(lead.id, note)}
          />
        )
      })}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/ai-reviews/page.tsx components/ai-review-list.tsx
git commit -m "feat: add AI predictions review page"
```

---

## Task 8: Create Learning Dashboard Page

**Files:**
- Create: `app/(dashboard)/ai-insights/page.tsx`
- Create: `components/learning-dashboard.tsx`

**Step 1: Write insights page**

```typescript
'use client'

import { useEffect, useState } from 'react'
import LearningDashboard from '@/components/learning-dashboard'
import type { LearningInsights } from '@/types/feedback'

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<LearningInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  async function loadInsights() {
    try {
      const response = await fetch('/api/ai/insights')
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Learning Insights</h1>
      {insights && <LearningDashboard insights={insights} />}
    </div>
  )
}
```

**Step 2: Write learning dashboard component**

```typescript
'use client'

import type { LearningInsights } from '@/types/feedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LearningDashboardProps {
  insights: LearningInsights
}

export default function LearningDashboard({ insights }: LearningDashboardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Accuracy Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Accuracy (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.accuracy_over_time.length > 0 ? (
            <div className="h-40 flex items-end space-x-1">
              {insights.accuracy_over_time.slice(-10).map((data, i) => {
                const height = `${(data.percentage / 100) * 100}%`
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height }}
                    title={`${data.date}: ${data.percentage}%`}
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No data yet. Provide feedback to see accuracy.</p>
          )}
        </CardContent>
      </Card>

      {/* Common Corrections */}
      <Card>
        <CardHeader>
          <CardTitle>Common Corrections</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.common_corrections.length > 0 ? (
            <ul className="space-y-2">
              {insights.common_corrections.slice(0, 5).map((corr, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{corr.prediction}</span>
                  {' '}→{' '}
                  <span className="text-green-600">{corr.correction}</span>
                  <span className="text-gray-500 ml-2">({corr.frequency}x)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No corrections data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Improvements */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Next Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            {insights.next_improvements.map((imp, i) => (
              <li key={i} className="text-sm">{imp}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/ai-insights/page.tsx components/learning-dashboard.tsx
git commit -m "feat: add learning dashboard page"
```

---

## Task 9: Integrate AI Prediction into Lead Detail

**Files:**
- Modify: `app/(dashboard)/leads/[id]/page.tsx`

**Step 1: Update lead detail page**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AIPredictionCard from '@/components/ai-prediction-card'
import SMSThread from '@/components/sms-thread'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadLead()
  }, [params.id])

  async function loadLead() {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single()

    setLead(data)
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>
  if (!lead) return <div>Lead not found</div>

  return (
    <div className="space-y-6">
      {/* Lead Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {lead.first_name} {lead.last_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
          <div className="flex items-center gap-2">
            <Badge>{lead.disposition}</Badge>
            {lead.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Prediction Card */}
      {lead.ai_score !== null && (
        <AIPredictionCard
          prediction={{
            disposition: lead.disposition,
            score: lead.ai_score || 0,
            reasoning: lead.ai_qualification_reason || ''
          }}
          onConfirm={() => console.log('Confirmed prediction')}
          onEdit={() => console.log('Edit prediction')}
          onAddNote={(note) => console.log('Add note:', note)}
        />
      )}

      {/* SMS Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <SMSThread leadId={params.id} />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/leads/\[id\]/page.tsx
git commit -m "feat: integrate AI prediction into lead detail page"
```

---

## Task 10: Add Navigation Links

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

**Step 1: Update layout sidebar**

```typescript
// Add to navigation items array
{
  name: 'AI Reviews',
  href: '/dashboard/ai-reviews',
  icon: '🤖'
},
{
  name: 'AI Insights',
  href: '/dashboard/ai-insights',
  icon: '📊'
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/layout.tsx
git commit -m "feat: add AI reviews and insights navigation"
```

---

## Task 11: Test Complete Flow

**Files:**
- No files (manual testing)

**Step 1: Test feedback creation**

1. Navigate to a lead detail page
2. Verify AI Prediction Card is displayed
3. Change lead disposition
4. Check that feedback is created in ai_feedback table
5. Verify lead has updated disposition and tracking data

**Step 2: Test manual review**

1. Navigate to `/dashboard/ai-reviews`
2. Verify leads with AI predictions are shown
3. Click "Edit" on a prediction
4. Submit new disposition and note
5. Verify feedback is created

**Step 3: Test insights**

1. Navigate to `/dashboard/ai-insights`
2. Verify accuracy chart displays
3. Check common corrections are shown
4. Verify improvements are suggested

**Step 4: Commit final changes**

```bash
git add .
git commit -m "feat: complete AI Feedback Learning System"
```

---

## Task 12: Create Utils for Pattern Analysis

**Files:**
- Create: `lib/feedback-analyzer.ts`

**Step 1: Write feedback analyzer**

```typescript
import type { AIPrediction, FeedbackData } from '@/types/feedback'

export interface PatternAnalysis {
  patterns: Array<{
    pattern: string
    confidence: number
    examples: string[]
  }>
  common_corrections: Array<{
    prediction: string
    correction: string
    frequency: number
  }>
}

export function analyzeFeedbackPatterns(feedback: FeedbackData[]): PatternAnalysis {
  const patternMap = new Map<string, {count: number, examples: string[]}>()
  const correctionMap = new Map<string, number>()

  for (const fb of feedback) {
    // Track common corrections
    const key = `${fb.ai_prediction.disposition}→${fb.user_correction.disposition}`
    correctionMap.set(key, (correctionMap.get(key) || 0) + 1)

    // Track patterns
    const features = extractFeatures(fb.ai_prediction)
    const outcome = fb.ai_prediction.disposition === fb.user_correction.disposition ? 'correct' : 'incorrect'

    for (const feature of features) {
      const patternKey = `${feature}_${outcome}`
      if (!patternMap.has(patternKey)) {
        patternMap.set(patternKey, { count: 0, examples: [] })
      }
      const pattern = patternMap.get(patternKey)!
      pattern.count++
      if (pattern.examples.length < 3) {
        pattern.examples.push(JSON.stringify(fb.ai_prediction))
      }
    }
  }

  const patterns = Array.from(patternMap.entries())
    .map(([key, data]) => {
      const [feature, outcome] = key.split('_')
      return {
        pattern: feature,
        confidence: Math.round((data.count / feedback.length) * 100),
        examples: data.examples
      }
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)

  const commonCorrections = Array.from(correctionMap.entries())
    .map(([key, freq]) => {
      const [prediction, correction] = key.split('→')
      return { prediction, correction, frequency: freq }
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  return { patterns, common_corrections: commonCorrections }
}

function extractFeatures(prediction: AIPrediction): string[] {
  const features: string[] = []

  // Email domain analysis
  if (prediction.reasoning.toLowerCase().includes('email')) {
    features.push('has_email')
  }
  if (prediction.reasoning.toLowerCase().includes('corporate') ||
      prediction.reasoning.toLowerCase().includes('professional')) {
    features.push('professional_email')
  }

  // Phone presence
  if (prediction.reasoning.toLowerCase().includes('phone')) {
    features.push('has_phone')
  }

  // Score ranges
  if (prediction.score >= 80) {
    features.push('high_score')
  } else if (prediction.score >= 60) {
    features.push('medium_score')
  } else {
    features.push('low_score')
  }

  // Disposition type
  features.push(`disposition_${prediction.disposition}`)

  return features
}
```

**Step 2: Commit**

```bash
git add lib/feedback-analyzer.ts
git commit -m "feat: add feedback pattern analyzer"
```

---

## Task 13: Update Claude Integration for Learning

**Files:**
- Modify: `lib/claude.ts`

**Step 1: Add pattern-based analysis**

```typescript
import { createClient } from '@/lib/supabase/server'
import { analyzeFeedbackPatterns } from '@/lib/feedback-analyzer'

export interface QualificationWithLearning {
  smsContent: string
  leadContext: {
    email?: string
    phone?: string
    first_name?: string
    last_name?: string
    source_type?: string
  }
}

export async function analyzeSMSWithLearning(
  params: QualificationWithLearning
): Promise<{ disposition: string; confidence: number; reasoning: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get learning patterns from user's feedback
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: feedback } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo)

  let learningContext = ''
  if (feedback && feedback.length > 0) {
    const analysis = analyzeFeedbackPatterns(feedback)
    learningContext = formatLearningContext(analysis)
  }

  const prompt = `Analyze this SMS response from a lead and qualify them.

Lead Context:
${params.leadContext.first_name ? `- Name: ${params.leadContext.first_name} ${params.leadContext.last_name || ''}` : ''}
${params.leadContext.email ? `- Email: ${params.leadContext.email}` : ''}
${params.leadContext.phone ? `- Phone: ${params.leadContext.phone}` : ''}

SMS Response:
${params.smsContent}

${learningContext}

Categorize as: interested, not_interested, callback_requested, or unknown.
Provide confidence score (0-100) and reasoning.`

Response as JSON:
{
  "disposition": "category",
  "confidence": score,
  "reasoning": "explanation"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const result = JSON.parse(response.content[0].text)

  return {
    disposition: result.disposition,
    confidence: result.confidence,
    reasoning: result.reasoning
  }
}

function formatLearningContext(analysis: ReturnType<typeof analyzeFeedbackPatterns>): string {
  if (analysis.patterns.length === 0) {
    return ''
  }

  let context = 'User Qualification Patterns (from feedback history):\n'

  for (const pattern of analysis.patterns.slice(0, 5)) {
    context += `- Leads with ${pattern.pattern} tend to be qualified with ${pattern.confidence}% accuracy\n`
  }

  if (analysis.common_corrections.length > 0) {
    context += '\nCommon Corrections:\n'
    for (const corr of analysis.common_corrections.slice(0, 3)) {
      context += `- ${corr.prediction} predictions often corrected to ${corr.correction}\n`
    }
  }

  return context
}
```

**Step 2: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: integrate learning patterns into Claude analysis"
```

---

## Summary

This plan implements:
1. Database schema updates for tracking feedback
2. API routes for automatic and manual feedback
3. AI prediction review UI components
4. Learning insights dashboard
5. Pattern analysis utilities
6. Claude integration that uses learned patterns

**Total commits:** 13 bite-sized tasks

---

Plan complete and saved to `docs/plans/2025-03-03-insureassist-phase2-ai-feedback-learning-implementation.md`
