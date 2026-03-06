import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
})

export interface SocialPostRequest {
  topic: string
  platform: 'linkedin' | 'facebook' | 'twitter'
  tone?: 'professional' | 'friendly' | 'urgent' | 'informative'
  includeHashtags?: boolean
}

export interface SocialPostResult {
  content: string
  hashtags: string[]
  characterCount: number
}

const PLATFORM_CONFIGS = {
  linkedin: {
    maxChars: 1300,
    tone: 'professional and insightful',
    focus: 'industry trends, thought leadership, data-driven insights',
  },
  facebook: {
    maxChars: 2200,
    tone: 'engaging and conversational',
    focus: 'community stories, helpful tips, customer education',
  },
  twitter: {
    maxChars: 280,
    tone: 'punchy and timely',
    focus: 'quick tips, breaking news, stats',
  },
}

const INSURANCE_HASHTAGS = [
  '#Insurance',
  '#RiskManagement',
  '#CustomerService',
  '#InsureTech',
  '#HealthInsurance',
  '#Claims',
  '#InsurancePros',
  '#IndustryInsights',
  '#AgencyGrowth',
  '#ClientSuccess',
  '#DigitalTransformation',
]

/**
 * Generate social media content for insurance topics using AI
 */
export async function generateSocialPost(
  request: SocialPostRequest
): Promise<SocialPostResult> {
  const { topic, platform, tone = 'professional', includeHashtags = true } = request
  const config = PLATFORM_CONFIGS[platform]

  const prompt = buildSocialPostPrompt(topic, platform, tone, config, includeHashtags)

  try {
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

    const content = response.content[0]?.text || ''

    return parseSocialPostResult(content, platform, includeHashtags)
  } catch (error) {
    console.error('Error generating social post:', error)
    return {
      content: generateFallbackPost(topic, platform, tone),
      hashtags: includeHashtags ? selectRelevantHashtags(3) : [],
      characterCount: topic.length,
    }
  }
}

function buildSocialPostPrompt(
  topic: string,
  platform: string,
  tone: string,
  config: any,
  includeHashtags: boolean
): string {
  const platformGuidance = `
Platform: ${platform.toUpperCase()}
${getPlatformGuideline(platform, tone)}
${includeHashtags ? 'Include 3-5 relevant insurance-related hashtags at the end' : ''}
`.trim()

  return `You are an expert in social media content creation for the insurance industry.

Task: Generate a compelling social media post about "${topic}".

${platformGuidance}

Content Guidelines:
- Write as if you're an insurance professional sharing valuable insights
- Avoid overly salesy language - focus on education and value
- Include at least one engaging question or call-to-action
- Make it relevant to current industry trends

IMPORTANT: Return your response in this exact JSON format:
{
  "content": "your social media post here",
  "hashtags": ["#Insurance", "#RiskManagement"]
}

Do NOT include any other text or explanation outside the JSON.`
}

function getPlatformGuideline(platform: string, tone: string): string {
  switch (platform) {
    case 'linkedin':
      return `Tone: ${tone}
Max length: ${PLATFORM_CONFIGS.linkedin.maxChars} characters
Focus: ${PLATFORM_CONFIGS.linkedin.focus}
Style: Professional, data-driven, thought leadership
CTA: "What's your experience?" or "Share with someone who needs this"`

    case 'facebook':
      return `Tone: ${tone}
Max length: ${PLATFORM_CONFIGS.facebook.maxChars} characters
Focus: ${PLATFORM_CONFIGS.facebook.focus}
Style: Engaging, conversational, community-focused
CTA: "Like if you agree" or "Tag a colleague"`

    case 'twitter':
      return `Tone: ${tone}
Max length: ${PLATFORM_CONFIGS.twitter.maxChars} characters
Focus: ${PLATFORM_CONFIGS.twitter.focus}
Style: Punchy, timely, stats-focused
CTA: "What do you think?" or "Retweet if helpful"`

    default:
      return 'Generate professional insurance content'
  }
}

function parseSocialPostResult(
  content: string,
  platform: string,
  includeHashtags: boolean
): SocialPostResult {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\{[\s\S]*"content"[\s\S]*:[\s\S]*"([^"]*)"/)

    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}') + 1
    const jsonStr = content.substring(jsonStart, jsonEnd)

    const parsed = JSON.parse(jsonStr)

    return {
      content: parsed.content || '',
      hashtags: includeHashtags && Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      characterCount: (parsed.content || '').length,
    }
  } catch (error) {
    console.error('Error parsing social post result:', error)
    return {
      content: content.replace(/\{[\s\S]*.*}/g, '').trim(),
      hashtags: includeHashtags ? selectRelevantHashtags(3) : [],
      characterCount: content.length,
    }
  }
}

function generateFallbackPost(
  topic: string,
  platform: string,
  tone: string
): string {
  const templates = {
    linkedin: [
      `Insurance ${tone}: ${topic} continues to transform our industry. What trends are you seeing in your market?`,
      `${topic} in insurance: The challenges we face today create opportunities for tomorrow's innovations.`,
    ],
    facebook: [
      `Excited to share thoughts on ${topic}! This is what makes our industry special. What's your take?`,
      `${topic} matters more than ever in insurance. Let's discuss how it impacts you and your family.`,
    ],
    twitter: [
      `${topic} is reshaping insurance. Are you ready? #Insurance #Innovation`,
      `${topic} trends: 3 things insurance pros need to know now #InsureTech`,
    ],
  }

  const platformTemplates = templates[platform as keyof typeof templates] || templates.linkedin
  return platformTemplates[Math.floor(Math.random() * platformTemplates.length)]
}

function selectRelevantHashtags(count: number): string[] {
  const shuffled = [...INSURANCE_HASHTAGS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
