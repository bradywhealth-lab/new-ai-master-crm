import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get all feedback for user
  const { data: feedback } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  if (!feedback) {
    return Response.json({
      accuracy_over_time: [],
      common_corrections: [],
      learned_patterns: [],
      leads_needing_review: [],
      next_improvements: ['Submit feedback to see insights']
    })
  }

  // Calculate accuracy over time
  const accuracyMap = new Map<string, {correct: number, total: number}>()
  const correctionMap = new Map<string, number>()

  for (const fb of feedback) {
    const date = fb.created_at.split('T')[0]
    const key = `${fb.ai_prediction.disposition}_${fb.user_correction.disposition}`

    if (!accuracyMap.has(date)) {
      accuracyMap.set(date, { correct: 0, total: 0 })
    }

    const acc = accuracyMap.get(date)!
    acc.total++

    if (fb.ai_prediction.disposition === fb.user_correction.disposition) {
      acc.correct++
    }

    // Track common corrections
    const corrKey = `${fb.ai_prediction.disposition}→${fb.user_correction.disposition}`
    correctionMap.set(corrKey, (correctionMap.get(corrKey) || 0) + 1)
  }

  const accuracyOverTime = Array.from(accuracyMap.entries()).map(([date, acc]) => ({
    date,
    correct: acc.correct,
    total: acc.total,
    percentage: Math.round((acc.correct / acc.total) * 100)
  }))

  const commonCorrections = Array.from(correctionMap.entries())
    .map(([key, freq]) => {
      const [prediction, correction] = key.split('→')
      return { prediction, correction, frequency: freq }
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  return Response.json({
    accuracy_over_time: accuracyOverTime,
    common_corrections: commonCorrections,
    learned_patterns: [],
    leads_needing_review: [],
    next_improvements: commonCorrections.length > 0
      ? [`Consider adjusting rules for ${commonCorrections[0].prediction} predictions`]
      : ['Continue providing feedback to improve accuracy']
  })
}
