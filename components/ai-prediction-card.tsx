'use client'

import { useState } from 'react'
import type { AIPrediction } from '@/types/feedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

interface AIPredictionCardProps {
  prediction: AIPrediction
  leadId: string
  onConfirm: () => void
  onEdit: (newDisposition?: string, newScore?: number) => void
  onAddNote: (note: string) => void
}

const helpfulColors: Record<string, string> = {
  helpful: 'bg-green-500 hover:bg-green-600',
  not_helpful: 'bg-red-500 hover:bg-red-600',
}

export default function AIPredictionCard({
  prediction,
  leadId,
  onConfirm,
  onEdit,
  onAddNote
}: AIPredictionCardProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editDisposition, setEditDisposition] = useState(prediction.disposition)
  const [editScore, setEditScore] = useState(prediction.score)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const confidenceLevel = prediction.score >= 80 ? 'High' : prediction.score >= 60 ? 'Medium' : 'Low'
  const confidenceColor = prediction.score >= 80
    ? 'bg-green-100 text-green-800'
    : prediction.score >= 60
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800'

  async function handleConfirm() {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDisposition: prediction.disposition,
          newScore: prediction.score,
          confirmOnly: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage(`Failed to confirm: ${error.error || 'Unknown error'}`)
        return
      }

      setMessage('Prediction confirmed!')
      onConfirm?.()
    } catch (error) {
      console.error('Failed to confirm prediction:', error)
      setMessage('Failed to confirm')
    } finally {
      setLoading(false)
    }
  }

  async function handleEditSave() {
    setLoading(true)
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          ai_prediction_confirmed: false,
          new_disposition: editDisposition,
          new_score: editScore,
          note: ''
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage(`Failed to update: ${error.error || 'Unknown error'}`)
        return
      }

      setEditOpen(false)
      onEdit?.(editDisposition, editScore)
      setMessage('Prediction updated!')
    } catch (error) {
      console.error('Failed to edit prediction:', error)
      setMessage('Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNote() {
    setLoading(true)
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          ai_prediction_confirmed: true,
          new_disposition: undefined,
          new_score: undefined,
          note: note
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage(`Failed to add note: ${error.error || 'Unknown error'}`)
        return
      }

      onAddNote?.(note)
      setNoteOpen(false)
      setNote('')
      setMessage('Note added!')
    } catch (error) {
      console.error('Failed to add note:', error)
      setMessage('Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🤖 AI Prediction</span>
          <Badge className={confidenceColor}>{confidenceLevel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`p-2 rounded ${message.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{prediction.disposition.toUpperCase()}</span>
          <span className="text-gray-600">({prediction.score}/100)</span>
        </div>

        <p className="text-sm text-gray-700">{prediction.reasoning}</p>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleConfirm} size="sm" variant="default" disabled={loading}>
            ✓ Confirm
          </Button>
          <Button
            onClick={async () => {
              await fetch('/api/feedback/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lead_id: leadId,
                  ai_prediction_confirmed: false,
                  new_disposition: undefined,
                  new_score: undefined,
                  note: 'Helpful - quick feedback',
                  feedback_type: 'outcome_based',
                })
              })
              setMessage('Thanks for your feedback!')
              setTimeout(() => setMessage(''), 2000)
            }}
            size="sm"
            className={helpfulColors.helpful}
            disabled={loading}
          >
            👍 Helpful
          </Button>
          <Button
            onClick={async () => {
              await fetch('/api/feedback/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lead_id: leadId,
                  ai_prediction_confirmed: false,
                  new_disposition: undefined,
                  new_score: undefined,
                  note: 'Not helpful - quick feedback',
                  feedback_type: 'outcome_based',
                })
              })
              setMessage('Thanks for your feedback!')
              setTimeout(() => setMessage(''), 2000)
            }}
            size="sm"
            className={helpfulColors.not_helpful}
            disabled={loading}
          >
            👎 Not Helpful
          </Button>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger>
              <Button size="sm" variant="outline">✏️ Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-semibold mb-4">Edit Prediction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Disposition</label>
                  <input
                    type="text"
                    value={editDisposition}
                    onChange={(e) => setEditDisposition(e.target.value)}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editScore}
                    onChange={(e) => setEditScore(Number(e.target.value))}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditSave} className="flex-1" disabled={loading}>
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditOpen(false)} variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
            <DialogTrigger>
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
                <Button
                  onClick={handleAddNote}
                  className="flex-1"
                  disabled={loading}
                >
                  Save Note
                </Button>
                <Button
                  onClick={() => setNoteOpen(false)}
                  variant="outline"
                  disabled={loading}
                >
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
