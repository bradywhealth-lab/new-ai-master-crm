'use client'

import { useState, useEffect } from 'react'
import type { ScrapeTarget, ScrapeTargetCreate } from '@/types/scraping'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

export default function ScrapeConfig() {
  const [targets, setTargets] = useState<ScrapeTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectorType, setSelectorType] = useState<'css' | 'xpath' | 'custom'>('css')
  const [selectors, setSelectors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  })

  useEffect(() => {
    loadTargets()
  }, [])

  async function loadTargets() {
    const response = await fetch('/api/scrape-targets')
    const result = await response.json()
    setTargets(result.data || [])
    setLoading(false)
  }

  async function createTarget() {
    if (!name.trim() || !url.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/scrape-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          url,
          selector_type: selectorType,
          selectors
        } as ScrapeTargetCreate)
      })

      if (response.ok) {
        setName('')
        setUrl('')
        setSelectors({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip: ''
        })
        setOpen(false)
        loadTargets()
      }
    } catch (error) {
      console.error('Failed to create target:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function runScrape(targetId: string) {
    if (!confirm('Start scraping this target?')) return

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId })
      })

      if (response.ok) {
        alert('Scraping job started!')
        loadTargets()
      }
    } catch (error) {
      console.error('Failed to start scrape:', error)
    }
  }

  async function deleteTarget(targetId: string) {
    if (!confirm('Delete this scrape target?')) return

    try {
      const response = await fetch(`/api/scrape-targets/${targetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadTargets()
      }
    } catch (error) {
      console.error('Failed to delete target:', error)
    }
  }

  async function toggleTargetStatus(targetId: string, currentStatus: ScrapeTarget['status']) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'

    try {
      const response = await fetch(`/api/scrape-targets/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        loadTargets()
      }
    } catch (error) {
      console.error('Failed to update target:', error)
    }
  }

  if (loading) return <div>Loading scrape targets...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scrape Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {targets.length === 0 ? (
              <p className="text-gray-500 text-sm">No scrape targets configured. Add one to get started.</p>
            ) : (
              targets.map((target) => (
                <div key={target.id} className="p-4 border rounded flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{target.name}</span>
                      <Badge className={target.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {target.status}
                      </Badge>
                    </div>
                    <a href={target.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {target.url}
                    </a>
                    <p className="text-xs text-gray-500">
                      Last scraped: {target.last_scraped_at ? new Date(target.last_scraped_at).toLocaleString() : 'Never'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Leads found: {target.leads_found || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {target.status === 'active' && (
                      <Button size="sm" onClick={() => runScrape(target.id)}>
                        Scrape Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleTargetStatus(target.id, target.status)}
                    >
                      {target.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTarget(target.id)}
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
              <Button className="w-full">Add Scrape Target</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-semibold mb-4">Add Scrape Target</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Insurance Directory"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/directory"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selector Type</label>
                  <select
                    value={selectorType}
                    onChange={(e) => setSelectorType(e.target.value as any)}
                    className="w-full border rounded p-2"
                  >
                    <option value="css">CSS Selector</option>
                    <option value="xpath">XPath</option>
                    <option value="custom">Custom Parser</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name Selector</label>
                    <Input
                      value={selectors.first_name}
                      onChange={(e) => setSelectors({ ...selectors, first_name: e.target.value })}
                      placeholder=".name, h1.name, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name Selector</label>
                    <Input
                      value={selectors.last_name}
                      onChange={(e) => setSelectors({ ...selectors, last_name: e.target.value })}
                      placeholder=".surname, h2.name, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Selector</label>
                    <Input
                      value={selectors.email}
                      onChange={(e) => setSelectors({ ...selectors, email: e.target.value })}
                      placeholder=".email, .contact-email, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Selector</label>
                    <Input
                      value={selectors.phone}
                      onChange={(e) => setSelectors({ ...selectors, phone: e.target.value })}
                      placeholder=".phone, .tel, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address Selector</label>
                    <Input
                      value={selectors.address}
                      onChange={(e) => setSelectors({ ...selectors, address: e.target.value })}
                      placeholder=".address, .location, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City Selector</label>
                    <Input
                      value={selectors.city}
                      onChange={(e) => setSelectors({ ...selectors, city: e.target.value })}
                      placeholder=".city, .location-city, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State Selector</label>
                    <Input
                      value={selectors.state}
                      onChange={(e) => setSelectors({ ...selectors, state: e.target.value })}
                      placeholder=".state, .region, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ZIP Selector</label>
                    <Input
                      value={selectors.zip}
                      onChange={(e) => setSelectors({ ...selectors, zip: e.target.value })}
                      placeholder=".zip, .postal-code, etc."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={createTarget}
                    className="flex-1"
                    disabled={isSubmitting || !name.trim() || !url.trim()}
                  >
                    Create Target
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
    </div>
  )
}
