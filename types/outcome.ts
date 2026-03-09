export interface Outcome {
  id: string
  outcome: 'sold' | 'lost' | 'not_interested' | 'wrong_number' | 'do_not_contact' | 'pending'
  outcome_date: string
  notes: string | null
  estimated_value: number | null
  actual_value: number | null
  follow_up_count: number
}
