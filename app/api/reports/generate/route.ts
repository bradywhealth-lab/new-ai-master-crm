import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

interface ReportRequest {
  date_range: '30' | '90' | 'all'
  report_type: 'summary' | 'detailed' | 'activities' | 'conversion'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ReportRequest = await request.json()

  // Calculate date filter
  let startDate = new Date()
  if (body.date_range === '30') {
    startDate.setDate(startDate.getDate() - 30)
  } else if (body.date_range === '90') {
    startDate.setDate(startDate.getDate() - 90)
  }

  // Get leads
  let leadsQuery = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (body.date_range !== 'all') {
    leadsQuery = leadsQuery.gte('created_at', startDate.toISOString())
  }

  const { data: leads, error } = await leadsQuery

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const leadList = leads || []

  // Generate PDF
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`InsureAssist Report - ${body.report_type.charAt(0).toUpperCase() + body.report_type.slice(1)}`, 20, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 25, { align: 'center' })

  let yPosition = 40

  // Add summary section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 20, yPosition)
  yPosition += 10

  const totalLeads = leadList.length
  const contactedLeads = leadList.filter(l => l.disposition && l.disposition !== 'new').length
  const qualifiedLeads = leadList.filter(l => ['qualified', 'proposal', 'closed'].includes(l.disposition)).length
  const closedLeads = leadList.filter(l => l.disposition === 'closed').length
  const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : 0

  doc.setFontSize(10)
  doc.text(`Total Leads: ${totalLeads}`, 25, yPosition)
  yPosition += 7
  doc.text(`Contacted: ${contactedLeads}`, 25, yPosition)
  yPosition += 7
  doc.text(`Qualified: ${qualifiedLeads}`, 25, yPosition)
  yPosition += 7
  doc.text(`Closed: ${closedLeads}`, 25, yPosition)
  yPosition += 7
  doc.text(`Conversion Rate: ${conversionRate}%`, 25, yPosition)

  yPosition += 20

  if (body.report_type === 'detailed' || body.report_type === 'activities') {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Lead Activities', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.text('Date\tName\tEmail\tDisposition\tAI Score', 25, yPosition)
    yPosition += 7

    leadList.forEach((lead) => {
      doc.text(
        `${new Date(lead.created_at).toLocaleDateString()}\t${lead.first_name} ${lead.last_name}\t${lead.email}\t${lead.disposition || 'new'}\t${lead.ai_score || 0}`,
        25,
        yPosition
      )
      yPosition += 5
    })
  }

  if (body.report_type === 'conversion') {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Conversion Analysis', 20, yPosition)
    yPosition += 10

    const dispositionBreakdown: Record<string, number> = {
      new: totalLeads - contactedLeads,
      contacted: contactedLeads - qualifiedLeads,
      qualified: qualifiedLeads - closedLeads,
      closed: closedLeads
    }

    Object.entries(dispositionBreakdown).forEach(([disposition, count]) => {
      if (count > 0) {
        doc.setFontSize(10)
        doc.text(`${disposition.charAt(0).toUpperCase() + disposition.slice(1)}: ${count}`, 25, yPosition)
        yPosition += 7
      }
    })
  }

  // Generate PDF buffer
  const pdfBytes = doc.output('datauristring')

  // Return both PDF and CSV options
  const csvData = leadList.map(lead => ({
    'Name': `${lead.first_name} ${lead.last_name}`.trim(),
    'Email': lead.email,
    'Phone': lead.phone,
    'Disposition': lead.disposition || 'new',
    'AI Score': lead.ai_score || 0,
    'Created At': new Date(lead.created_at).toISOString(),
    'Notes': lead.notes || ''
  }))

  // Convert CSV to string
  const csvHeader = Object.keys(csvData[0]).join(',')
  const csvRows = csvData.map(row => {
    const values = Object.values(row).map(v => {
      const str = String(v)
      return `"${str.replace(/"/g, '""')}"`
    })
    return values.join(',')
  })
  const csvString = [csvHeader, ...csvRows].join('\n')

  // In production, save PDF to storage or send as email attachment
  return Response.json({
    data: {
      pdf_data: pdfBytes,
      csv: csvString
    }
  })
}
