# InsureAssist Phase 2 - AI Feedback Learning System Design

**Project:** InsureAssist - CRM + AI Assistant for Insurance Agents
**Date:** 2025-03-03
**Feature:** AI Feedback Learning System (Feature A of Phase 2)
**Status:** Approved

---

## Overview

The AI Feedback Learning System enables the CRM to learn from user corrections and outcomes, progressively improving qualification accuracy. The vision: AI eventually automates everything, user just wakes up to a call list.

### Goals

- Capture feedback from both automatic outcomes (lead dispositions) and manual reviews
- Track feedback quality and patterns over time
- Use learned patterns to improve AI qualification accuracy
- Provide rich review interface for thoughtful corrections

---

## Approach: Hybrid - Lead Outcomes + Rich Review

Combines automatic outcome-based learning (low friction) with a manual review interface (rich context, bulk actions).

### Primary Feedback (Automatic)
- Triggered when lead disposition changes to final outcomes (Sold, Do Not Contact)
- Creates ai_feedback entry automatically
- Minimal UI overhead

### Secondary Feedback (Review Interface)
- "AI Predictions Review" page for reviewing predictions at your own pace
- Add detailed notes, correct predictions, mark as confirmed/corrected
- Bulk actions for efficiency

### Learning Together
- System uses both automatic outcomes and manual reviews
- Tracks feedback quality (automatic vs manual, response time)
- Claude learns from both signals

---

## Section 1: Database Updates

### New Columns on leads Table

```sql
-- Track disposition changes
ALTER TABLE leads ADD COLUMN last_disposition_change TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN previous_disposition TEXT;
ALTER TABLE leads ADD COLUMN disposition_changes JSONB DEFAULT '[]';
```

**disposition_changes structure:**
```json
[
  { "from": "new", "to": "hot", "at": "2024-03-02T10:30:00Z", "triggered_by": "user" }
]
```

### Enable RLS on ai_feedback

```sql
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own feedback"
  ON ai_feedback FOR ALL
  USING (auth.uid() = user_id);
```

---

## Section 2: API Routes

### Route 1: Create Feedback on Disposition Change

**Endpoint:** `POST /api/leads/[id]/feedback`

**Triggered when:** User changes lead disposition

**Creates ai_feedback entry:**
```typescript
{
  id: UUID,
  sms_log_id: UUID | null,
  user_id: UUID,
  ai_prediction: {
    disposition: "hot",
    score: 85,
    reasoning: "Email from corporate domain + phone provided"
  },
  user_correction: {
    disposition: "sold",
    score: 100
  },
  feedback_type: "outcome_based"  // vs "manual_review"
}
```

### Route 2: Submit Manual Review

**Endpoint:** `POST /api/feedback/submit`

**For:** Rich review interface

**Payload:**
```typescript
{
  lead_id: string,
  ai_prediction_confirmed: boolean,
  new_disposition?: string,
  new_score?: number,
  note?: string
}
```

### Route 3: Get Learning Insights

**Endpoint:** `GET /api/ai/insights`

**Returns:**
```typescript
{
  accuracy_over_time: Array<{date, correct, total, percentage}>,
  common_corrections: Array<{prediction, correction, frequency}>,
  learned_patterns: Array<{pattern, confidence, examples}>,
  leads_needing_review: Array<{id, name, prediction, uncertainty}>,
  next_improvements: string[]
}
```

---

## Section 3: UI Components

### Component 1: AI Prediction Card

**Shown on lead detail page**

```
┌─────────────────────────────────────────────┐
│ 🤖 AI Prediction: Hot (85/100)             │
│ Reasoning: Professional email + phone       │
│                                             │
│ [✓ Confirm]  [✏️ Edit]  [📝 Add Note] │
└─────────────────────────────────────────────┘
```

**Features:**
- Shows current AI prediction and confidence
- Quick actions to confirm or correct
- Add notes for context
- Visual confidence indicator

### Component 2: Predictions Review Page

**New page:** `/dashboard/ai-reviews`

**Shows:**
- Leads with AI predictions pending review
- Filter by disposition, ai_score range, age
- Bulk actions: Confirm All, Mark for Refinement
- Sort by: Newest, Lowest Score, Uncertain Predictions

### Component 3: Learning Dashboard

**New page:** `/dashboard/ai-insights`

**Shows:**
- Accuracy chart (correct predictions over time)
- Common correction patterns
- AI's learned preferences
- Next improvement suggestions

---

## Section 4: Learning Flow

### Automatic Learning

```
User changes disposition from "hot" → "sold"
├─ API creates feedback
├─ Stores: previous="hot", actual="sold", type="outcome"
└─ System tracks: positive feedback for "hot" predictions
```

### Manual Review Learning

```
User reviews AI predictions
├─ Sees lead: "New" predicted as "Nurture"
├─ Clicks "Edit": changes to "Hot"
├─ Adds note: "Referred by existing client"
└─ System learns: Referrals should be "Hot"
```

### Learning Application

```
When Claude analyzes new SMS
├─ System queries recent feedback
├─ Passes: "User often corrects: X leads should be Y"
└─ Claude adjusts prediction based on patterns
```

---

## Section 5: Enhanced AI Qualification

### Updated Claude Prompt Structure

```
User Qualification Patterns (from ai_feedback):
- Professional email + phone = HOT (85% accuracy)
- Referral notes = HOT (90% accuracy)
- Single contact method = NURTURE (70% accuracy)

Recent Outcomes:
- Last 10 "hot" predictions: 8 sold (80% accuracy)
- Last 10 "nurture" predictions: 2 sold (20% accuracy)

Analyze this SMS and qualify the lead.
Consider the user's patterns from feedback history.
Provide confidence score and reasoning.
```

### Feedback Query Function

```typescript
async function getQualificationPatterns(userId: string) {
  // Get recent feedback
  const { data: feedback } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', getDaysAgo(30))
    .order('created_at', { ascending: false })

  // Analyze patterns
  return analyzeFeedbackPatterns(feedback)
}
```

---

## Section 6: Implementation Order

1. **Database Updates**
   - Run SQL to add columns to leads table
   - Enable RLS on ai_feedback

2. **Core API Routes**
   - Create `app/api/leads/[id]/feedback/route.ts`
   - Create `app/api/feedback/submit/route.ts`
   - Create `app/api/ai/insights/route.ts`

3. **UI Components**
   - Create `components/ai-prediction-card.tsx`
   - Create `components/ai-review-list.tsx`
   - Create `components/learning-dashboard.tsx`

4. **Pages**
   - Create `app/(dashboard)/ai-reviews/page.tsx`
   - Create `app/(dashboard)/ai-insights/page.tsx`
   - Update lead detail page to show AI prediction

5. **Updated AI Logic**
   - Modify `lib/claude.ts` to query feedback history
   - Pass learned patterns to Claude for better predictions

---

## Section 7: Error Handling

### Feedback Creation Fails
- Log error, show toast notification
- Don't block lead disposition change (fallback: sync later)
- Store failed feedback for retry

### Review Submission Fails
- Save to local storage, retry on reconnect
- Show error with retry button
- Don't lose user's corrections

### Insights API Fails
- Cache last successful insights
- Show "Learning data temporarily unavailable"
- Fallback to basic statistics

---

## Section 8: Testing Strategy

### Test Feedback Flow
1. Change lead disposition → Verify ai_feedback created
2. Manual review → Verify feedback saved with notes
3. Check insights API → Returns accuracy data

### Test Learning
1. Mark several leads as "sold"
2. Verify accuracy chart updates
3. Check new SMS analysis uses learned patterns

### Test UI
1. Navigate to AI reviews page
2. Filter and sort predictions
3. Confirm/correct predictions
4. Add notes and submit

---

## Next Steps

This design is approved. Next: invoke `writing-plans` skill to create a detailed implementation plan with concrete code examples.

---

**Status:** Design complete and approved. Ready for implementation planning.
