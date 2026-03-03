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
  const confidenceColor = prediction.score >= 80
    ? 'bg-green-100 text-green-800'
    : prediction.score >= 60
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800'

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
