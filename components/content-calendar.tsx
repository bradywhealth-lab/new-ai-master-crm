'use client'

import { useState, useEffect } from 'react'
import type { ContentQueueItem, ContentQueueCreate } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function ContentCalendar() {
  const [items, setItems] = useState<ContentQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [contentType, setContentType] = useState<'social_post' | 'follow_up' | 'campaign'>('social_post')
  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'instagram'>('linkedin')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const response = await fetch('/api/content/queue')
    const result = await response.json()
    setItems(result.data || [])
    setLoading(false)
  }

  async function createQueueItem() {
    if (!content.trim() || !scheduledFor) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/content/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          title: title || null,
          content: content,
          platform: contentType === 'social_post' ? platform : null,
          scheduled_for: scheduledFor
        } as ContentQueueCreate)
      })

      if (response.ok) {
        setTitle('')
        setContent('')
        setScheduledFor('')
        setOpen(false)
        loadItems()
      }
    } catch (error) {
      console.error('Failed to create queue item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function updateStatus(itemId: string, status: ContentQueueItem['status']) {
    try {
      const response = await fetch(`/api/content/queue/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadItems()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this item?')) return

    try {
      const response = await fetch(`/api/content/queue/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadItems()
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  const typeLabels: Record<string, string> = {
    social_post: 'Social Post',
    follow_up: 'Follow-up',
    campaign: 'Campaign'
  }

  const platformColors: Record<string, string> = {
    linkedin: 'bg-blue-100 text-blue-800',
    twitter: 'bg-gray-100 text-gray-800',
    instagram: 'bg-pink-100 text-pink-800'
  }

  if (loading) return <div>Loading content queue...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">No scheduled content yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-4 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[item.status]}>
                      {item.status}
                    </Badge>
                    {item.content_type && (
                      <span className="text-xs text-gray-500">• {typeLabels[item.content_type]}</span>
                    )}
                    {item.platform && (
                      <Badge className={platformColors[item.platform]} variant="outline">
                        {item.platform}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Scheduled: {new Date(item.scheduled_for).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  {item.title && <p className="font-semibold">{item.title}</p>}
                  <p className="line-clamp-2">{item.content}</p>
                </div>
                <div className="flex gap-2">
                  {item.status === 'pending' && (
                    <Button size="sm" onClick={() => updateStatus(item.id, 'scheduled')}>
                      Schedule
                    </Button>
                  )}
                  {item.status === 'scheduled' && (
                    <Button size="sm" onClick={() => updateStatus(item.id, 'sent')}>
                      Mark Sent
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteItem(item.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Add to Queue</Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Add to Content Queue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="social_post">Social Post</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="campaign">Campaign</option>
                </select>
              </div>

              {contentType === 'social_post' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full border rounded p-2"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">X (Twitter)</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Title (optional)</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Content title..."
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your content..."
                  className="w-full border rounded p-2 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Schedule For</label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createQueueItem}
                  className="flex-1"
                  disabled={isSubmitting || !content.trim() || !scheduledFor}
                >
                  Add to Queue
                </Button>
                <Button
                  onClick={() => setOpen(false)}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
