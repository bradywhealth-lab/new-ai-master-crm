'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { parseCSV } from '@/lib/csv-parser'
import { applyBasicQualificationRules } from '@/lib/qualification-rules'

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')

  const supabase = createClient()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setStatus('')
    } else {
      alert('Please select a CSV file')
    }
  }

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setStatus('Parsing CSV...')

    try {
      // Create CSV upload record
      const { data: userData } = await supabase.auth.getUser()
      const { data: uploadData, error: uploadError } = await supabase
        .from('csv_uploads')
        .insert({
          user_id: userData.user?.id,
          filename: file.name,
          status: 'processing',
        } as any)
        .select()
        .single() as { data: { id: string } | null; error: any }

      if (uploadError) throw uploadError
      if (!uploadData) throw new Error('Failed to create upload record')
      setUploadId(uploadData.id)

      // Parse CSV
      setProgress(20)
      const parsedLeads = await parseCSV(file)
      setStatus(`Found ${parsedLeads.length} leads...`)

      // Insert leads in batches
      setProgress(40)
      const batchSize = 50
      for (let i = 0; i < parsedLeads.length; i += batchSize) {
        const batch = parsedLeads.slice(i, i + batchSize)

        // Apply qualification rules to each lead
        const qualifiedLeads = batch.map((lead) => {
          const qualification = applyBasicQualificationRules(
            lead.email,
            lead.phone,
            lead.first_name,
            lead.last_name
          )

          return {
            user_id: userData.user?.id,
            csv_upload_id: uploadData.id,
            source_type: 'csv_upload',
            source_filename: file.name,
            source_row_id: lead.row_id.toString(),
            disposition: qualification.disposition,
            ai_score: qualification.aiScore,
            ai_qualification_reason: qualification.aiQualificationReason,
            tags: qualification.tags,
            ...lead,
          }
        })

        const { error } = await supabase.from('leads').insert(qualifiedLeads as any)

        if (error) {
          console.error('Error inserting batch:', error)

          // Show which lead in the batch failed
          const failedLeadIndex = i / batchSize
          const failedLead = batch[failedLeadIndex] || {}

          throw new Error(`Failed to insert batch starting at lead #${failedLeadIndex + 1}: ${error.message}`)
        }

        setProgress(40 + (i / parsedLeads.length) * 50)
      }

      // Update upload status
      setProgress(90)
      const { error: updateError } = await supabase
        .from('csv_uploads')
        .update({
          status: 'completed',
          row_count: parsedLeads.length,
        } as any)
        .eq('id', uploadData.id)

      if (updateError) throw updateError

      setProgress(100)
      setStatus('Upload complete!')
      setTimeout(() => {
        window.location.href = '/dashboard/leads'
      }, 1500)
    } catch (error) {
      console.error('Upload error:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

      // Update upload status to failed
      if (uploadId) {
        await supabase
          .from('csv_uploads')
          .update({ status: 'failed', error_message: String(error) })
          .eq('id', uploadId)
      }
    }

    setUploading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:rounded-md file:border-0
              file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && <p className="text-sm mt-2">Selected: {file.name}</p>}
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center">{status}</p>
          </div>
        )}

        {!uploading && status && status !== 'Upload complete!' && (
          <p className="text-sm text-red-500">{status}</p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </Button>
      </CardContent>
    </Card>
  )
}
