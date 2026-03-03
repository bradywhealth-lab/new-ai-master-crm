export interface AIPrediction {
  disposition: string
  score: number
  reasoning: string
}

export interface UserCorrection {
  disposition?: string
  score?: number
  note?: string
}

export interface FeedbackData {
  lead_id: string
  sms_log_id: string | null
  ai_prediction: AIPrediction
  user_correction: UserCorrection
  feedback_type: 'outcome_based' | 'manual_review'
}

export interface ReviewSubmission {
  lead_id: string
  ai_prediction_confirmed: boolean
  new_disposition?: string
  new_score?: number
  note?: string
}

export interface LearningInsights {
  accuracy_over_time: Array<{date: string, correct: number, total: number, percentage: number}>
  common_corrections: Array<{prediction: string, correction: string, frequency: number}>
  learned_patterns: Array<{pattern: string, confidence: number, examples: string[]}>
  leads_needing_review: Array<{id: string, name: string, prediction: string, uncertainty: number}>
  next_improvements: string[]
}
