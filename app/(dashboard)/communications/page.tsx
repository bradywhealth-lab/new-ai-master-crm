'use client'

import { useState } from 'react'
import EmailTemplates from '@/components/email-templates'
import SmsTemplates from '@/components/sms-templates'
import EmailLogs from '@/components/email-logs'
import SmsLogs from '@/components/sms-logs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email')
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'logs'>('templates')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Communications</h1>
        <p className="text-gray-600">Manage email and SMS templates, logs, and automation.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => {
        setActiveTab(value as 'email' | 'sms')
        setActiveSubTab('templates')
      }}>
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <div className="mb-4">
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveSubTab('templates')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeSubTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveSubTab('logs')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeSubTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Logs
              </button>
            </div>
          </div>
          {activeSubTab === 'templates' ? <EmailTemplates /> : <EmailLogs />}
        </TabsContent>

        <TabsContent value="sms">
          <div className="mb-4">
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveSubTab('templates')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeSubTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveSubTab('logs')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeSubTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Logs
              </button>
            </div>
          </div>
          {activeSubTab === 'templates' ? <SmsTemplates /> : <SmsLogs />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
