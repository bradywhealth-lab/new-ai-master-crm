'use client'

import { useState } from 'react'
import type { AIPrediction } from '@/types/feedback'
import AIPredictionCard from '@/components/ai-prediction-card'

interface AIReviewListProps {
  leads: Array<any>
}

export default function AIReviewList({ leads }: AIReviewListProps) {
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
