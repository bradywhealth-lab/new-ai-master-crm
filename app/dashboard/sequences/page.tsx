'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Step {
  id: string
  step_order: number
  delay_hours: number
  subject: string
  body: string
  template_id: string | null
}

interface Sequence {
  id: string
  name: string
  sequence_type: string
  is_active: boolean
  follow_up_steps?: Step[]
  created_at: string
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSequenceName, setNewSequenceName] = useState('')
  const [newSequenceType, setNewSequenceType] = useState('email')
  const [steps, setSteps] = useState<Step[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadSequences()
  }, [])

  async function loadSequences() {
    setLoading(true)
    const response = await fetch('/api/sequences')
    const data = await response.json()

    if (data.sequences) {
      setSequences(data.sequences)
    }

    setLoading(false)
  }

  function addStep() {
    setSteps([...steps, { step_order: steps.length, delay_hours: 0, subject: '', body: '', template_id: null }])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index))
  }

  function updateStep(index: number, field: string, value: any) {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  async function createSequence() {
    if (!newSequenceName.trim()) {
      alert('Please enter a sequence name')
      return
    }

    if (steps.length === 0) {
      alert('Please add at least one step')
      return
    }

    const response = await fetch('/api/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSequenceName,
        sequence_type: newSequenceType,
        steps,
      }),
    })

    if (response.ok) {
      setNewSequenceName('')
      setSteps([])
      setShowCreateForm(false)
      loadSequences()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Drip Campaigns</h1>
        <Button onClick={() => setShowCreateForm(true)}>New Sequence</Button>
      </div>

      {/* Create Sequence Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateForm(false)}>
          <Card className="max-w-2xl w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Create New Sequence</h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sequence Name</label>
                <Input
                  value={newSequenceName}
                  onChange={(e) => setNewSequenceName(e.target.value)}
                  placeholder="e.g., Follow-up for hot leads"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sequence Type</label>
                <select
                  value={newSequenceType}
                  onChange={(e) => setNewSequenceType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="email">Email Sequence</option>
                  <option value="sms">SMS Sequence</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Steps</h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <Card key={index} className="p-4 relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => removeStep(index)}
                    >
                      Remove
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Step {index + 1}</label>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Delay (hours)</label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delay_hours}
                            onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Subject</label>
                          <Input
                            value={step.subject}
                            onChange={(e) => updateStep(index, 'subject', e.target.value)}
                            placeholder="Email subject..."
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Body</label>
                          <Textarea
                            value={step.body}
                            onChange={(e) => updateStep(index, 'body', e.target.value)}
                            placeholder="Email body..."
                            rows={4}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button onClick={addStep} variant="outline" className="w-full">
                    Add Step
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createSequence}>
                  Create Sequence
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sequences List */}
      {loading ? (
        <div className="text-center py-8">Loading sequences...</div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sequences found. Create your first drip campaign!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((sequence) => (
            <Card key={sequence.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{sequence.name}</h3>
                  <Badge className={sequence.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {sequence.sequence_type}
                  </Badge>
                </div>
                <Badge variant="outline">
                  {sequence.follow_up_steps?.length || 0} steps
                </Badge>
              </div>

              <div className="text-sm text-gray-500 mb-2">
                Created {new Date(sequence.created_at).toLocaleDateString()}
              </div>

              <Link href={`/dashboard/sequences/${sequence.id}`} className="block">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
