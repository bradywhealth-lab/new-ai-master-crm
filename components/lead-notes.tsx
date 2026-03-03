'use client'

import { useState, useEffect } from 'react'
import type { LeadNote, LeadNoteCreate } from '@/types/phase3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

interface LeadNotesProps {
  leadId: string
}

export default function LeadNotes({ leadId }: LeadNotesProps) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<'general' | 'call' | 'meeting' | 'outcome'>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [leadId])

  async function loadNotes() {
    const response = await fetch(`/api/leads/${leadId}/notes`)
    const result = await response.json()
    setNotes(result.data || [])
    setLoading(false)
  }

  async function createNote() {
    if (!newNote.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote,
          note_type: noteType
        } as LeadNoteCreate)
      })

      if (response.ok) {
        setNewNote('')
        setOpen(false)
        loadNotes()
      }
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePin(noteId: string, isPinned: boolean) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinned })
      })

      if (response.ok) {
        loadNotes()
      }
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm('Delete this note?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadNotes()
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const noteTypeColors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-800',
    call: 'bg-blue-100 text-blue-800',
    meeting: 'bg-green-100 text-green-800',
    outcome: 'bg-purple-100 text-purple-800'
  }

  if (loading) return <div>Loading notes...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes yet. Add one to get started.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-3 border rounded relative group">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={noteTypeColors[note.note_type]}>
                        {note.note_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                      {note.is_pinned && (
                        <span className="text-xs">📌</span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePin(note.id, note.is_pinned)}
                    >
                      {note.is_pinned ? '📌' : '📍'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Note Type</label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="general">General</option>
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="outcome">Outcome</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="w-full border rounded p-2 min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createNote}
                  className="flex-1"
                  disabled={isSubmitting || !newNote.trim()}
                >
                  Save Note
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
