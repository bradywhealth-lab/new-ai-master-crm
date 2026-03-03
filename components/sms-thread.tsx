'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SMSLog {
  id: string
  direction: string
  content: string
  sent_at: string
  ai_category: string | null
}

interface SMSThreadProps {
  leadId: string
}

export default function SMSThread({ leadId }: SMSThreadProps) {
  const [messages, setMessages] = useState<SMSLog[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadMessages()
  }, [leadId])

  async function loadMessages() {
    const { data } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: true })

    setMessages(data || [])
  }

  async function handleSendSMS() {
    if (!newMessage.trim()) return

    setSending(true)

    // TODO: Call /api/sms endpoint
    // For now, just add to list
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('sms_logs').insert({
      user_id: userData.user?.id,
      lead_id: leadId,
      direction: 'outbound',
      content: newMessage,
    })

    if (!error) {
      setNewMessage('')
      await loadMessages()
    }

    setSending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Conversation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.direction === 'outbound'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(msg.sent_at).toLocaleString()}
                  {msg.ai_category && (
                    <span className="block text-xs">
                      AI: {msg.ai_category}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendSMS()}
          />
          <Button onClick={handleSendSMS} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
