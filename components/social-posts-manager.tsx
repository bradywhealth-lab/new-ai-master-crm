'use client'

import { useState, useEffect } from 'react'
import type { SocialPost, SocialPostCreate } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

export default function SocialPostsManager() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'instagram'>('linkedin')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    const response = await fetch('/api/social/posts')
    const result = await response.json()
    setPosts(result.data || [])
    setLoading(false)
  }

  async function createPost() {
    if (!content.trim() || !scheduledFor) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          title: title || null,
          content,
          scheduled_for: scheduledFor
        } as SocialPostCreate)
      })

      if (response.ok) {
        setTitle('')
        setContent('')
        setScheduledFor('')
        setOpen(false)
        loadPosts()
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post?')) return

    try {
      const response = await fetch(`/api/social/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadPosts()
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    posted: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  const platformColors: Record<string, string> = {
    linkedin: 'bg-blue-100 text-blue-800',
    twitter: 'bg-gray-100 text-gray-800',
    instagram: 'bg-pink-100 text-pink-800'
  }

  if (loading) return <div>Loading posts...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          {posts.map((post) => (
            <div key={post.id} className="p-4 border rounded">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={platformColors[post.platform]}>
                    {post.platform}
                  </Badge>
                  <div>
                    <p className="font-semibold">{post.title || 'Untitled Post'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(post.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[post.status]}>
                  {post.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {post.content}
              </p>
              {post.engagement_stats && (
                <div className="text-xs text-gray-500 mt-2">
                  👍 {post.engagement_stats.likes} likes • 💬 {post.engagement_stats.comments} comments
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deletePost(post.id)}
              >
                🗑️
              </Button>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-gray-500 text-sm">No posts scheduled yet.</p>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Create New Post</Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Create Social Post</h3>
            <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">Title (optional)</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title..."
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content..."
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
                  onClick={createPost}
                  className="flex-1"
                  disabled={isSubmitting || !content.trim() || !scheduledFor}
                >
                  Create Post
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
