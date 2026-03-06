import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
})

export interface ConversionInsight {
  category: string
  recommendation: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
}

export interface ConversionAnalysis {
  leadId: string
  conversionScore: number
  insights: ConversionInsight[]
  summary: string
  estimatedCloseValue: number
  nextBestAction: string
}

export interface LeadJourney {
  created_at: string
  qualificationScore: number
  qualificationReasoning: string
  disposition: string
  lastContact: string | null
  activitiesCount: number
  interactions: {
    type: string
    date: string
    outcome?: string
  }[]
}

/**
 * Analyze a lead's journey and provide conversion recommendations
 */
export async function analyzeConversion(leadJourney: LeadJourney): Promise<ConversionAnalysis> {
  try {
    const prompt = buildAnalysisPrompt(leadJourney)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
    })

    const analysisContent = response.content[0]?.text || ''

    return parseConversionAnalysis(analysisContent, leadJourney)
  } catch (error) {
    console.error('Error analyzing conversion:', error)
    return {
      leadId: leadJourney.created_at,
      conversionScore: calculateBaseScore(leadJourney),
      insights: [{
        category: 'Error',
        recommendation: 'Could not perform AI analysis. Check lead manually.',
        priority: 'high',
        actionable: true,
      }],
      summary: 'Analysis unavailable due to technical error.',
      estimatedCloseValue: 0,
      nextBestAction: 'Review lead manually',
    }
  }
}

function buildAnalysisPrompt(lead: LeadJourney): string {
  const dateCreated = new Date(lead.created_at).toLocaleDateString()
  const scoreDisplay = `${lead.qualificationScore}/100`
  const dispositionText = lead.disposition
  const activitiesNum = lead.activitiesCount
  const lastContactText = lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 'Never'

  const interactionLines = lead.interactions.map((i) => {
    const outcomeText = i.outcome ? ` -> ${i.outcome}` : ''
    return `  - ${i.date}: ${i.type}${outcomeText}`
  }).join('\n')

  const interactionsSection = lead.interactions.length > 0
    ? `Recent interactions:\n${interactionLines}`
    : 'No interactions recorded yet.'

  const fullPrompt = "You are an expert in insurance sales and lead conversion optimization.\n\nAnalyze this lead's journey and provide actionable recommendations to improve conversion.\n\nLead Information:\nLead created: " + dateCreated + "\nCurrent qualification score: " + scoreDisplay + "\nCurrent disposition: " + dispositionText + "\nActivities: " + activitiesNum + " interactions\nLast contact: " + lastContactText + "\n\n" + interactionsSection + "\n\nIMPORTANT: Return your response in this exact JSON format:\n{\n  \"conversionScore\": number (0-100),\n  \"insights\": [\n    {\n      \"category\": \"e.g., 'Timing', 'Engagement', 'Qualification', 'Content'\",\n      \"recommendation\": \"specific actionable recommendation\",\n      \"priority\": \"high\" | \"medium\" | \"low\",\n      \"actionable\": true\n    }\n  ],\n  \"summary\": \"brief 2-3 sentence summary\",\n  \"estimatedCloseValue\": number (estimated value in dollars, 0 if can't determine),\n  \"nextBestAction\": \"specific immediate action to take\"\n}\n\nPrioritize high-impact actions. Be specific and practical. Do NOT include any other text outside the JSON."

  return fullPrompt
}

function parseConversionAnalysis(
  content: string,
  lead: LeadJourney
): ConversionAnalysis {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\{[\s\S]*"conversionScore"[\s\S]*:/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      leadId: lead.created_at,
      conversionScore: parsed.conversionScore || calculateBaseScore(lead),
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      summary: parsed.summary || 'Analysis completed',
      estimatedCloseValue: parsed.estimatedCloseValue || 0,
      nextBestAction: parsed.nextBestAction || 'Review lead status',
    }
  } catch (error) {
    console.error('Error parsing conversion analysis:', error)
    return {
      leadId: lead.created_at,
      conversionScore: calculateBaseScore(lead),
      insights: [{
        category: 'System',
        recommendation: 'Could not parse analysis results',
        priority: 'medium',
        actionable: false,
      }],
      summary: 'Analysis parsing failed',
      estimatedCloseValue: 0,
      nextBestAction: 'Contact lead to assess interest',
    }
  }
}

function calculateBaseScore(lead: LeadJourney): number {
  let score = 50 // Base score

  // Qualification impact
  score += Math.min((lead.qualificationScore - 50) / 2, 20)

  // Activity engagement
  if (lead.activitiesCount >= 5) score += 15
  else if (lead.activitiesCount >= 3) score += 10
  else if (lead.activitiesCount >= 1) score += 5

  // Recency
  if (lead.lastContact) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 24)
    )
    if (daysSinceContact <= 7) score += 10
    else if (daysSinceContact <= 14) score += 5
    else if (daysSinceContact > 30) score -= 15
  }

  // Disposition impact
  const dispositionScores: { [key: string]: number } = {
    hot: 20,
    qualified: 15,
    proposal: 10,
    negotiation: 5,
    nurture: 0,
    new: -5,
    closed_lost: 0,
  }
  if (lead.disposition in dispositionScores) {
    score += dispositionScores[lead.disposition]
  }

  return Math.max(0, Math.min(100, score))
}
