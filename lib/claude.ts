import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SMSAnalysis {
  category: 'interested' | 'not_interested' | 'callback_requested' | 'unknown'
  confidence: number
  reasoning: string
}

export async function analyzeSMS(
  message: string,
  leadContext?: {
    firstName?: string
    lastName?: string
    disposition?: string
    tags?: string[]
  }
): Promise<SMSAnalysis> {
  try {
    const context = leadContext
      ? `\n\nLead Context:\n- Name: ${leadContext.firstName || ''} ${leadContext.lastName || ''}\n- Disposition: ${leadContext.disposition || 'new'}\n- Tags: ${leadContext.tags?.join(', ') || 'none'}`
      : ''

    const prompt = `Analyze this SMS response from an insurance lead:${context}

SMS Message: "${message}"

Categorize the response as one of:
- "interested": Lead shows interest, asks questions, wants more info
- "not_interested": Lead is not interested, asks to be removed, declines
- "callback_requested": Lead wants a phone call
- "unknown": Can't determine

Provide your response as JSON:
{
  "category": "one_of_the_categories_above",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Try to parse JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          category: parsed.category,
          confidence: parsed.confidence || 70,
          reasoning: parsed.reasoning || '',
        }
      }
    }

    // Fallback to default if parsing fails
    return {
      category: 'unknown',
      confidence: 50,
      reasoning: 'Could not parse AI response',
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return {
      category: 'unknown',
      confidence: 0,
      reasoning: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
