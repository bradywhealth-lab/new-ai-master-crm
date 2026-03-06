'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

export interface Outcome {
  id?: string
  lead_id: string
  outcome: 'won' | 'lost' | 'no_decision' | 'not_interested' | 'unresponsive'
  value: number
  estimated_value: number
  reason: string
  outcome_date: Date | null
}

export type OutcomeTrackerProps = {
  leadId: string
  currentDisposition: string
  currentAiScore: number
  onClose?: () => void
}

export default function OutcomeTracker({ leadId, currentDisposition, currentAiScore, onClose }: OutcomeTrackerProps) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { outcome: 'won', label: 'Closed Won', value: 10000, color: 'green' },
    { outcome: 'lost', label: 'Closed Lost', value: 0, color: 'red' },
    { outcome: 'no_decision', label: 'No Decision Yet', value: 0, color: 'gray' },
    { outcome: 'not_interested', label: 'Not Interested', value: 0, color: 'gray' },
    { outcome: 'unresponsive', label: 'Unresponsive', value: 0, color: 'orange' },
  ])
  const [showDialog, setShowDialog] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [estimatedValue, setEstimatedValue] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const handleSave = async () => {
    if (!selectedOutcome || !estimatedValue) {
      alert('Please select an outcome and enter value')
      return
    }

    setSaving(true)
    try {
      let newAiScore = currentAiScore
      if (selectedOutcome === 'won') newAiScore += 20
      else if (selectedOutcome === 'lost') newAiScore = 0

      const { error } = await supabase.from('lead_outcomes').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        lead_id: leadId,
        outcome: selectedOutcome,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        reason,
        outcome_date: new Date().toISOString(),
      })

      if (error) throw error

      if (selectedOutcome === 'won' || selectedOutcome === 'lost') {
        await supabase
          .from('leads')
          .update({ disposition: selectedOutcome, ai_score: newAiScore })
          .eq('id', leadId)
      }

      setOutcomes([...outcomes, selectedOutcome])
      setShowDialog(false)
      onClose?.()
    } catch (error) {
      console.error('Error saving outcome:', error)
      alert('Failed to save outcome')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track Outcome</CardTitle>
        <CardDescription>
          Record final disposition of this lead for conversion analytics
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            {outcomes.map((outcome) => (
              <button
                key={outcome.outcome}
                onClick={() => setSelectedOutcome(outcome.outcome)}
                className={`w-full flex-shrink-0 rounded-lg border-2 ${
                  selectedOutcome === outcome.outcome
                    ? 'border-blue-500'
                    : 'hover:border-gray-200'
                } transition-all`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full ${
                      outcome.outcome === 'won'
                        ? 'bg-green-500'
                        : outcome.outcome === 'lost'
                        ? 'bg-red-500'
                        : outcome.outcome === 'unresponsive'
                        ? 'bg-orange-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <span>{outcome.label}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedOutcome && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Estimated Value</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="max-w-md mb-2"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-500">Reason</Label>
                <Input
                  type="text"
                  placeholder={`Why did they ${selectedOutcome}?`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="max-w-md mb-2"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? 'Saving...' : 'Track Outcome'}
                </Button>
              </div>
            </div>
          )}

          {!selectedOutcome && (
            <p className="text-gray-400 text-sm">No outcome selected yet</p>
          )}

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(!showDialog)}
            >
              {showDialog ? 'Hide' : 'Track Outcome'}
            </Button>
          </div>

          <p className="text-sm text-gray-500 text-xs">
            Previous outcomes will be saved for analytics
          </p>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Track Lead Outcome</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">Select how this lead was dispositioned:</p>

              <div className="grid grid-cols-2 gap-3">
                {outcomes.map((outcome) => (
                  <button
                    key={outcome.outcome}
                    onClick={() => setSelectedOutcome(outcome.outcome)}
                    variant="outline"
                    className={`w-full justify-start px-4 py-2 text-left rounded-lg border-2 ${
                      selectedOutcome === outcome.outcome
                        ? 'bg-blue-50 text-blue-600 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 rounded-full ${
                      selectedOutcome === outcome.outcome ? 'bg-white' : ''
                    } mr-2`}></span>
                    <span>{outcome.label}</span>
                  </button>
                ))}
              </div>

              {selectedOutcome && (
                <div className="col-span-2 mt-4 space-y-2">
                  <Label className="text-sm text-gray-500">Estimated Value</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              )}

              {selectedOutcome && (
                <div className="col-span-2">
                  <Label className="text-sm text-gray-500">Reason</Label>
                  <textarea
                    placeholder={`Why did they ${selectedOutcome}?`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="max-w-md resize-none border rounded-md p-2"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Badge variant="secondary">
          {currentDisposition} / {currentAiScore}
        </Badge>
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save Outcome'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
