'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import type { SmsTemplate } from '@/types/communications'

export default function SmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<'follow_up' | 'appointment' | 'reminder'>('follow_up')

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const response = await fetch('/api/sms/templates')
      const result = await response.json()
      setTemplates(result.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load templates:', error)
      setLoading(false)
    }
  }

  async function createTemplate() {
    if (!name || !body) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          body,
          category
        })
      })

      if (response.ok) {
        setName('')
        setBody('')
        setOpen(false)
        loadTemplates()
      }
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return

    try {
      const response = await fetch(`/api/sms/templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadTemplates()
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  async function sendTestSms(templateId: string) {
    if (!confirm('Send test SMS?')) return

    try {
      const response = await fetch('/api/sms/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId
        })
      })

      if (response.ok) {
        alert('Test SMS logged successfully!')
      }
    } catch (error) {
      console.error('Failed to send test SMS:', error)
      alert('Failed to send test SMS')
    }
  }

  const categoryColors: Record<string, string> = {
    follow_up: 'bg-blue-100 text-blue-800',
    appointment: 'bg-green-100 text-green-800',
    reminder: 'bg-yellow-100 text-yellow-800'
  }

  if (loading) return <div>Loading SMS templates...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>SMS Templates</CardTitle>
            <Button onClick={() => setOpen(true)}>Create Template</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-gray-500 text-sm">No SMS templates yet.</p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge className={categoryColors[template.category]}>
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => sendTestSms(template.id)}>
                        Test
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTemplate(template.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {template.body}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">Add New Template</Button>
        </DialogTrigger>
        <DialogContent>
          <h3 className="text-lg font-semibold mb-4">Create SMS Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Follow-up Introduction"
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="follow_up">Follow-up</option>
                <option value="appointment">Appointment</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message (use {{firstName}}, {{lastName}} as variables)</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi {{firstName}}, just checking in..."
                className="w-full border rounded p-2 min-h-[120px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createTemplate}
                className="flex-1"
                disabled={isSubmitting || !name || !body}
              >
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
              <Button onClick={() => setOpen(false)} variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
