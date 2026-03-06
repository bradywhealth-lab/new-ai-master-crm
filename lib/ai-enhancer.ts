import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
})

export interface LeadContext {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  qualificationScore?: number
  disposition?: string
  lastInteraction?: string
  notes?: string[]
}

export interface EnhancementResult {
  enhancedMessage: string
  reasoning: string
  suggestedChanges: string[]
}

/**
 * Enhance a message (SMS or email) for better conversion using AI
 */
export async function enhanceMessage(
  type: 'sms' | 'email',
  originalMessage: string,
  leadContext: LeadContext
): Promise<EnhancementResult> {
  if (!originalMessage.trim()) {
    return {
      enhancedMessage: originalMessage,
      reasoning: 'Original message is empty',
      suggestedChanges: [],
    }
  }

  try {
    const prompt = buildEnhancementPrompt(type, originalMessage, leadContext)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
    })

    const enhancedContent = response.content[0]?.text || originalMessage

    return parseEnhancementResult(enhancedContent, originalMessage)
  } catch (error) {
    console.error('Error enhancing message:', error)
    return {
      enhancedMessage: originalMessage,
      reasoning: 'Error during enhancement: ' + (error as Error).message,
      suggestedChanges: [],
    }
  }
}

function buildEnhancementPrompt(
  type: 'sms' | 'email',
  originalMessage: string,
  leadContext: LeadContext
): string {
  const leadInfo = [
    leadContext.firstName && `Name: ${leadContext.firstName} ${leadContext.lastName || ''}`,
    leadContext.email && `Email: ${leadContext.email}`,
    leadContext.phone && `Phone: ${leadContext.phone}`,
    leadContext.qualificationScore !== undefined && `Qualification Score: ${leadContext.qualificationScore}/100`,
    leadContext.disposition && `Disposition: ${leadContext.disposition}`,
    leadContext.lastInteraction && `Last Contact: ${leadContext.lastInteraction}`,
  ].filter(Boolean).join('\n')

  const characterLimit = type === 'sms' ? 160 : 500

  return `You are an expert in insurance sales and customer communication.

Task: Improve the following ${type} message for better conversion rates.

Lead Information:
${leadInfo}

Original ${type} message:
"${originalMessage}"

Requirements:
1. Keep the enhanced message under ${characterLimit} characters for ${type}
2. Make it more engaging, personal, and action-oriented
3. Include relevant details from the lead's context
4. ${type === 'sms' ? 'Use a clear call-to-action with a question or incentive' : 'Write a compelling subject line and clear value proposition'}
5. Maintain professional but friendly tone appropriate for insurance
6. ${leadContext.qualificationScore && leadContext.qualificationScore < 60 ? 'The lead needs more nurturing - be helpful and informative' : ''}
7. ${leadContext.qualificationScore && leadContext.qualificationScore >= 80 ? 'This is a hot lead - include urgency or exclusive offer' : ''}

IMPORTANT: Return your response in this exact JSON format:
{
  "enhancedMessage": "your improved message here",
  "reasoning": "brief explanation of key changes (2-3 sentences)",
  "suggestedChanges": ["change 1", "change 2", "change 3"]
}

Do NOT include any other text or explanation outside the JSON.`
}

function parseEnhancementResult(
  content: string,
  originalMessage: string
): EnhancementResult {
  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\{[\s\S]*"enhancedMessage"[\s\S]*:[\s\S]*"/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      enhancedMessage: parsed.enhancedMessage || originalMessage,
      reasoning: parsed.reasoning || 'No reasoning provided',
      suggestedChanges: Array.isArray(parsed.suggestedChanges)
        ? parsed.suggestedChanges
        : [],
    }
  } catch (error) {
    console.error('Error parsing enhancement result:', error)
    return {
      enhancedMessage: originalMessage,
      reasoning: 'Could not parse enhancement result',
      suggestedChanges: [],
    }
  }
}
