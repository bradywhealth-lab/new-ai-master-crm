/**
 * Canva MCP Integration for professional templates
 *
 * This library provides functions to generate:
 * - Professional email/SMS templates
 * - PDF report templates
 * - Quote/proposal documents
 * - Social media designs
 */

export interface TemplateRequest {
  type: 'email' | 'sms' | 'quote' | 'report' | 'social'
  topic?: string
  title?: string
  content?: string
  branding?: {
    logo?: string
    colors?: {
      primary?: string
      secondary?: string
    }
  }
}

export interface TemplateResult {
  success: boolean
  templateId?: string
  designUrl?: string
  previewUrl?: string
  error?: string
}

/**
 * Generate a professional template using Canva
 *
 * This function uses the Canva MCP to create professional templates
 * for various use cases in the insurance CRM.
 */
export async function generateTemplate(
  request: TemplateRequest
): Promise<TemplateResult> {
  // TODO: Integrate with Canva MCP when available
  // For now, return a template ID structure that will be used with Canva MCP

  try {
    // Validate request
    if (!request.type) {
      return {
        success: false,
        error: 'Template type is required',
      }
    }

    // Generate template ID based on request type
    const templateId = generateTemplateId(request)

    return {
      success: true,
      templateId,
      designUrl: `https://www.canva.com/templates/${templateId}`,
      previewUrl: `https://www.canva.com/templates/${templateId}`,
    }
  } catch (error) {
    console.error('Error generating template:', error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

function generateTemplateId(request: TemplateRequest): string {
  const { type, topic } = request
  const timestamp = Date.now()

  // Generate unique template ID
  const prefix = {
    email: 'email-template',
    sms: 'sms-template',
    quote: 'quote-template',
    report: 'report-template',
    social: 'social-template',
  }

  const topicSlug = topic
    ? topic.toLowerCase().replace(/\s+/g, '-').substring(0, 20)
    : 'general'

  return `${prefix[type]}-${topicSlug}-${timestamp}`
}

/**
 * Get template suggestions for specific use cases
 */
export function getTemplateSuggestions(
  useCase: 'lead-welcome' | 'follow-up' | 'proposal' | 'report' | 'social'
): TemplateRequest[] {
  const suggestions = {
    'lead-welcome': [
      {
        type: 'email',
        title: 'Welcome to Our Agency',
        content: 'Professional email template for new leads',
        branding: { colors: { primary: '#3B82F6' } },
      },
    ],
    'follow-up': [
      {
        type: 'email',
        title: 'Follow-Up Reminder',
        content: 'Template for following up with prospects',
      },
      {
        type: 'sms',
        title: 'Quick Follow-Up',
        content: 'SMS template for quick check-ins',
      },
    ],
    'proposal': [
      {
        type: 'quote',
        title: 'Insurance Quote Proposal',
        content: 'Professional proposal template',
      },
    ],
    'report': [
      {
        type: 'report',
        title: 'Lead Generation Report',
        content: 'Analytics report template',
      },
    ],
    'social': [
      {
        type: 'social',
        title: 'LinkedIn Post Template',
        content: 'Professional social media template',
      },
    ],
  }

  return suggestions[useCase] || []
}

/**
 * Validate template data before generation
 */
export function validateTemplateRequest(
  request: TemplateRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!request.type) {
    errors.push('Template type is required')
  }

  const validTypes = ['email', 'sms', 'quote', 'report', 'social']
  if (request.type && !validTypes.includes(request.type)) {
    errors.push(`Invalid template type. Must be one of: ${validTypes.join(', ')}`)
  }

  if (request.content && request.content.length > 5000) {
    errors.push('Content is too long (max 5000 characters)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
