export interface QualificationResult {
  disposition: string
  tags: string[]
  aiScore: number
  aiQualificationReason: string
}

export function applyBasicQualificationRules(
  email: string | null,
  phone: string | null,
  firstName: string | null,
  lastName: string | null
): QualificationResult {
  const tags: string[] = []
  const reasons: string[] = []
  let score = 50

  // Rule: Has both email and phone
  if (email && phone) {
    score += 20
    reasons.push('Has both email and phone')
  }

  // Rule: Professional email domain (Gmail, Outlook, company domains)
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase()
    const professionalDomains = [
      'gmail.com',
      'outlook.com',
      'yahoo.com',
      'hotmail.com',
      'aol.com',
      'icloud.com',
    ]
    if (professionalDomains.includes(domain)) {
      score += 10
      reasons.push(`Uses ${domain} email`)
    }
  }

  // Rule: Full name provided
  if (firstName && lastName) {
    score += 10
    reasons.push('Full name provided')
  }

  // Rule: Phone number format (10 digits = US)
  if (phone && phone.length >= 10) {
    score += 10
    reasons.push('Valid phone number')
  }

  // Determine disposition
  let disposition = 'new'
  if (score >= 70) {
    disposition = 'hot'
    tags.push('qualified')
  } else if (score >= 50) {
    disposition = 'nurture'
  }

  return {
    disposition,
    tags,
    aiScore: Math.min(score, 100),
    aiQualificationReason: reasons.join('; ') || 'Basic rules applied',
  }
}
