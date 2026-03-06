---
name: generate-social-content
description: Generate social media posts for insurance topics using AI
version: 1.0.0
triggers:
  - User asks to "create social post" or "generate social content"
  - User asks about social media content for insurance
  - User wants content for LinkedIn, Facebook, or Twitter

input_schema:
  topic:
    type: string
    description: Topic to generate social post about
    required: true
  platform:
    type: string
    enum: [linkedin, facebook, twitter]
    description: Social media platform
    required: true
  tone:
    type: string
    enum: [professional, friendly, urgent, informative]
    description: Tone of the post
    required: false
  includeHashtags:
    type: boolean
    description: Whether to include relevant hashtags
    required: false

output_schema:
  type: object
  properties:
    content:
      type: string
      description: Generated social media post content
    hashtags:
      type: array
      items:
        type: string
      description: Relevant hashtags
    characterCount:
      type: number
      description: Character count of the post

---

# Generate Social Media Content

This skill generates platform-specific social media content for insurance professionals.

## Platform-Specific Guidelines

### LinkedIn (Professional)
- Focus on industry insights, thought leadership
- Include statistics or data points when relevant
- Use professional tone with emojis sparingly
- Encourage engagement through questions or calls-to-action
- Ideal length: 400-1300 characters

### Facebook (Engaging)
- More conversational and friendly
- Include visual descriptions or image suggestions
- Use community-focused language
- Encourage sharing and discussion
- Ideal length: 80-200 characters

### Twitter (Concise)
- Punchy, timely content
- Focus on quick tips or breaking news
- Use trending hashtags
- Character limit: 280 characters

## Insurance Topic Categories

Common topics to address:
- Risk management and mitigation
- Health and wellness programs
- Claims process and customer service
- Technology in insurance
- Regulatory updates
- Client success stories
- Industry trends and statistics

## Hashtag Strategy

For insurance-related content, use:
- #Insurance #RiskManagement #CustomerService
- #InsureTech #HealthInsurance #Claims
- #IndustryInsights #InsurancePros

## Call-to-Action Examples

- "Read the full article at [link]"
- "What are your thoughts on this trend?"
- "Share with a colleague who could benefit"
- "Download our guide: [link]"
