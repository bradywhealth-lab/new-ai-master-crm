import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('disposition, ai_score, created_at')
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const leadList = leads || []

  const dispositionMap: Record<string, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    closed: 0,
    lost: 0
  }

  const scoreRanges: Record<string, number> = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  }

  const leadsOverTime: Record<string, number> = {}
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  leadList.forEach((lead) => {
    const disposition = lead.disposition || 'new'
    if (disposition in dispositionMap) {
      dispositionMap[disposition]++
    }

    const score = lead.ai_score || 0
    if (score <= 20) scoreRanges['0-20']++
    else if (score <= 40) scoreRanges['21-40']++
    else if (score <= 60) scoreRanges['41-60']++
    else if (score <= 80) scoreRanges['61-80']++
    else scoreRanges['81-100']++

    const leadDate = new Date(lead.created_at)
    if (leadDate >= thirtyDaysAgo) {
      const dateKey = leadDate.toISOString().split('T')[0]
      leadsOverTime[dateKey] = (leadsOverTime[dateKey] || 0) + 1
    }
  })

  const totalLeads = leadList.length
  const contactedLeads = leadList.filter(l => l.disposition && l.disposition !== 'new').length
  const qualifiedLeads = leadList.filter(l => ['qualified', 'proposal', 'closed'].includes(l.disposition)).length
  const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) : 0

  const leadsByDisposition = Object.entries(dispositionMap)
    .filter(([key]) => key !== 'new' || dispositionMap[key] > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .filter((entry: any) => entry.value > 0)

  const leadsByScore = Object.entries(scoreRanges)
    .filter(([_, count]) => count > 0)
    .map(([score, count]) => ({ score, count }))
    .filter((entry: any) => entry.count > 0)

  const leadsOverTimeArray = Object.entries(leadsOverTime)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  return Response.json({
    data: {
      leadsByDisposition,
      leadsByScore,
      leadsOverTime: leadsOverTimeArray,
      conversionRate,
      totalLeads,
      contactedLeads,
      qualifiedLeads
    }
  })
}
