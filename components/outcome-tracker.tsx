'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'

interface Outcome {
  id: string
  outcome: 'sold' | 'lost' | 'not_interested' | 'wrong_number' | 'do_not_contact' | 'pending'
  outcome_date: string
  notes: string | null
  estimated_value: number | null
  actual_value: number | null
  follow_up_count: number
}

interface OutcomeTrackerProps {
  leadId: string
  currentDisposition: string
  onOutcomeChange: (outcome: Outcome) => void
}

const outcomeConfig = [
  { value: 'sold', label: 'Sold', icon: CheckCircle2, color: 'bg-green-500 hover:bg-green-600' },
  { value: 'lost', label: 'Lost', icon: XCircle, color: 'bg-red-500 hover:bg-red-600' },
  { value: 'not_interested', label: 'Not Interested', icon: XCircle, color: 'bg-gray-500 hover:bg-gray-600' },
  { value: 'wrong_number', label: 'Wrong Number', icon: XCircle, color: 'bg-orange-500 hover:bg-orange-600' },
  { value: 'do_not_contact', label: 'Do Not Contact', icon: XCircle, color: 'bg-yellow-600 hover:bg-yellow-700' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-blue-500 hover:bg-blue-600' },
]

const getOutcomeIcon = (outcome: string) => {
  const config = outcomeConfig.find(c => c.value === outcome)
  return config ? <config.icon className="w-5 h-5" /> : <Clock className="w-5 h-5" />
}

const getOutcomeColor = (outcome: string) => {
  switch (outcome) {
    case 'sold': return 'bg-green-100 text-green-800 border-green-300'
    case 'lost': return 'bg-red-100 text-red-800 border-red-300'
    case 'not_interested': return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'wrong_number': return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'do_not_contact': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'pending': return 'bg-blue-100 text-blue-800 border-blue-300'
    default: return 'bg-gray-50 text-gray-600'
  }
}

export default function OutcomeTracker({ leadId, currentDisposition, onOutcomeChange }: OutcomeTrackerProps) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<'sold' | 'lost' | 'not_interested' | 'wrong_number' | 'do_not_contact' | 'pending'>('pending')
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [actualValue, setActualValue] = useState('')
  const [message, setMessage] = useState('')

  const loadOutcomes = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/outcomes`)
      const result = await response.json()
      setOutcomes(result.data || [])
    } catch (error) {
      console.error('Failed to load outcomes:', error)
    }
  }

  useEffect(() => {
    loadOutcomes()
  }, [leadId])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/outcomes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          outcome: selectedOutcome,
          notes: outcomeNotes || null,
          estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
          actual_value: actualValue ? parseFloat(actualValue) : null,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage(`Failed: ${error.error || 'Unknown error'}`)
        return
      }

      setMessage('Outcome recorded!')
      setOpen(false)
      setOutcomeNotes('')
      setEstimatedValue('')
      setActualValue('')
      loadOutcomes()

      if (selectedOutcome === 'sold' || selectedOutcome === 'lost') {
        onOutcomeChange({
          id: Date.now().toString(),
          outcome: selectedOutcome,
          outcome_date: new Date().toISOString(),
          notes: outcomeNotes || null,
          estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
          actual_value: actualValue ? parseFloat(actualValue) : null,
          follow_up_count: 0,
        })
      }
    } catch (error) {
      console.error('Failed to record outcome:', error)
      setMessage('Failed to record outcome')
    } finally {
      setLoading(false)
    }
  }

  const latestOutcome = outcomes.length > 0 ? outcomes[0] : null

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Outcome Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`p-3 rounded ${message.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}

        {/* Current Outcome Display */}
        {latestOutcome ? (
          <div className={`p-4 rounded-lg border-2 ${getOutcomeColor(latestOutcome.outcome)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getOutcomeIcon(latestOutcome.outcome)}
                <Badge variant="outline" className="capitalize">
                  {latestOutcome.outcome.replace('_', ' ')}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(latestOutcome.outcome_date).toLocaleDateString()}
              </span>
            </div>

            {latestOutcome.notes && (
              <p className="text-sm text-foreground mb-2">
                <strong>Note:</strong> {latestOutcome.notes}
              </p>
            )}

            {(latestOutcome.estimated_value !== null || latestOutcome.actual_value !== null) && (
              <div className="flex gap-4 text-sm">
                {latestOutcome.estimated_value !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Est. Value:</span>
                    <span className="font-semibold text-foreground">
                      ${latestOutcome.estimated_value.toLocaleString()}
                    </span>
                  </div>
                )}
                {latestOutcome.actual_value !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Act. Value:</span>
                    <span className="font-semibold text-foreground">
                      ${latestOutcome.actual_value.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {latestOutcome.follow_up_count > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {latestOutcome.follow_up_count} follow-ups before outcome
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/50 rounded-lg text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p>No outcome recorded yet</p>
          </div>
        )}

        {/* Record New Outcome */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="default">
              Record Outcome
            </Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Record Lead Outcome</h3>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Outcome</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {outcomeConfig.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedOutcome(opt.value as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedOutcome === opt.value
                          ? opt.color + ' text-white border-current'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-muted/50'
                      }`}
                    >
                      <opt.icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="outcomeNotes" className="block text-sm font-medium mb-2">
                  Notes (optional)
                </Label>
                <textarea
                  id="outcomeNotes"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Add any context about this outcome..."
                  rows={3}
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedValue" className="block text-sm font-medium mb-2">
                    Estimated Value (optional)
                  </Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="actualValue" className="block text-sm font-medium mb-2">
                    Actual Value (optional)
                  </Label>
                  <Input
                    id="actualValue"
                    type="number"
                    value={actualValue}
                    onChange={(e) => setActualValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading || selectedOutcome === 'pending'}>
                  {loading ? 'Saving...' : 'Save Outcome'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Outcome History */}
        {outcomes.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Outcome History
            </h4>
            <div className="space-y-2">
              {outcomes.slice(1).map((outcome) => (
                <div
                  key={outcome.id}
                  className={`p-3 rounded border-2 ${getOutcomeColor(outcome.outcome)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(outcome.outcome)}
                      <span className="text-sm font-medium capitalize">
                        {outcome.outcome.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(outcome.outcome_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
