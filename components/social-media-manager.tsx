'use client'

import { useState, useEffect } from 'react'
import type { SocialConnection, SocialConnectionCreate } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

export default function SocialMediaManager() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'instagram'>('linkedin')
  const [accessToken, setAccessToken] = useState('')
  const [accountName, setAccountName] = useState('')

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    const response = await fetch('/api/social/connections')
    const result = await response.json()
    setConnections(result.data || [])
    setLoading(false)
  }

  async function connectPlatform() {
    if (!accessToken.trim() || !accountName.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/social/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          access_token: accessToken,
          account_name: accountName
        } as SocialConnectionCreate)
      })

      if (response.ok) {
        setAccessToken('')
        setAccountName('')
        setOpen(false)
        loadConnections()
      }
    } catch (error) {
      console.error('Failed to connect platform:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function disconnectConnection(connectionId: string) {
    if (!confirm('Disconnect this platform?')) return

    try {
      const response = await fetch(`/api/social/connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadConnections()
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const platformIcons: Record<string, string> = {
    linkedin: '🔗',
    twitter: '🐦',
    instagram: '📷'
  }

  const platformColors: Record<string, string> = {
    linkedin: 'bg-blue-100 text-blue-800',
    twitter: 'bg-gray-100 text-gray-800',
    instagram: 'bg-pink-100 text-pink-800'
  }

  if (loading) return <div>Loading social connections...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          {connections.map((connection) => (
            <div key={connection.id} className="flex justify-between items-center p-4 border rounded">
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${platformColors[connection.platform]}`}>
                  {platformIcons[connection.platform]}
                </span>
                <div>
                  <div className="font-semibold">{connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}</div>
                  <p className="text-sm text-gray-600">{connection.account_name}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Connected
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => disconnectConnection(connection.id)}
              >
                Disconnect
              </Button>
            </div>
          ))}
          {connections.length === 0 && (
            <p className="text-gray-500 text-sm">No social platforms connected yet.</p>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Connect Platform</Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Connect Social Platform</h3>
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
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., @myagency"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Access Token</label>
                <Input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter platform access token"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={connectPlatform}
                  className="flex-1"
                  disabled={isSubmitting || !accessToken.trim() || !accountName.trim()}
                >
                  Connect
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
