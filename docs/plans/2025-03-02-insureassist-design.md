# InsureAssist Design Document

**Project:** InsureAssist - CRM + AI Assistant for Insurance Agents
**Date:** 2025-03-02
**Architect:** Claude
**Status:** Approved

---

## Overview

InsureAssist is a "CRM on steroids" and personal AI assistant for insurance agents. It acts as a daily scheduling assistant, sales qualification engine, and multi-tenant CRM that learns from user habits over time.

### Key Goals
- AI qualifies leads completely - user only calls to close deals
- Multi-tenant: each user sees only their own data
- Lead organization with CSV filename, upload time, and tagging
- "WHALE" tag for high-value/big family leads
- Fully automated SMS qualification, responses, and appointment setting

---

## Architecture

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js (App Router) + React | UI, routing, API routes |
| Styling | Tailwind CSS + Shadcn/UI | Component library |
| Backend | Next.js API Routes | API endpoints, business logic |
| Database | Supabase (PostgreSQL) | Data storage, auth, RLS |
| Auth | Supabase Auth | User authentication, multi-tenancy |
| Storage | Supabase Storage | CSV file storage (optional) |
| AI | Claude API (Anthropic) | NLU, SMS analysis, qualification |
| SMS | Twilio | SMS sending/receiving, webhooks |
| Scraping | Puppeteer/Playwright (Phase 3) | Web scraping |
| Social | MCP Social Media (Phase 3) | Social posting automation |

### Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel (free tier) |
| Backend | Vercel (Next.js API Routes) |
| Database | Supabase (free tier initially) |
| Background Jobs | Supabase Edge Functions or separate worker |

---

## Data Model

### Core Tables

```sql
-- Profiles (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT UNIQUE,
  agency_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CSV uploads tracking
CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT
);

-- Leads/contacts (multi-tenant, owned by user)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Contact info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,

  -- Source tracking (CSV filename + upload time required)
  source_type TEXT NOT NULL, -- 'csv_upload', 'scraped', 'manual'
  csv_upload_id UUID REFERENCES csv_uploads(id) ON DELETE SET NULL,
  source_filename TEXT, -- original CSV name or scraped URL
  source_row_id TEXT, -- original row number or scraped identifier

  -- Disposition and tags (WHALE for high-value families)
  disposition TEXT DEFAULT 'new', -- new, hot, nurture, wrong_number, sold, do_not_contact
  tags TEXT[] DEFAULT '{}', -- includes 'WHALE' for big families
  notes TEXT,

  -- AI-qualified
  ai_score INTEGER, -- 0-100 likelihood of conversion
  ai_qualification_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  normalized_email TEXT, -- lowercased, trimmed
  normalized_phone TEXT -- digits only, country code normalized
);

-- SMS outreach logs
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  twilio_message_id TEXT UNIQUE,
  direction TEXT NOT NULL, -- outbound, inbound
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- AI analysis (full qualification engine)
  ai_category TEXT, -- interested, not_interested, callback_requested, unknown
  ai_confidence INTEGER,
  ai_analysis TEXT
);

-- SMS templates
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

-- Follow-up sequences (Phase 2)
CREATE TABLE follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_disposition TEXT, -- new, nurture, etc.
  days_between_messages INTEGER,
  steps JSONB -- array of template_ids with delays
);

-- User habits for learning (Phase 2)
CREATE TABLE user_habits (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT, -- sms_send, lead_view, lead_update
  hour_of_day INTEGER, -- 0-23
  day_of_week INTEGER, -- 0-6 (Sun-Sat)
  frequency INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- AI feedback for learning
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY,
  sms_log_id UUID REFERENCES sms_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ai_prediction TEXT, -- what Claude predicted
  user_correction TEXT, -- what actually happened
  feedback_type TEXT, -- correct, incorrect, partially_correct
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Multi-Tenancy Enforcement

**Row Level Security (RLS) policies** ensure User A can never access User B's data:

```sql
-- Enable RLS on all user-owned tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can CRUD own leads" ON leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own csv_uploads" ON csv_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own sms_logs" ON sms_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own templates" ON sms_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own sequences" ON follow_up_sequences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own habits" ON user_habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own feedback" ON ai_feedback FOR ALL USING (auth.uid() = user_id);
```

### Indexes for Performance

```sql
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_disposition ON leads(disposition);
CREATE INDEX idx_leads_csv_upload_id ON leads(csv_upload_id);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_sms_logs_lead_id ON sms_logs(lead_id);
CREATE INDEX idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX idx_user_habits_user_id ON user_habits(user_id);
```

---

## Feature Phases

### Phase 1: MVP (1-2 weeks)

**Must-have features:**
- User registration/login with Supabase Auth
- CSV upload (drag-drop or file picker)
- CSV parsing and normalization (names, phones, emails)
- Lead storage with source metadata (filename, row ID, upload time)
- Lead list view with filtering by user, search, and sort
- Lead detail view with all fields, tags, and disposition
- Manual lead creation/edit
- Twilio integration for SMS
- Send single SMS to lead from lead detail view
- Receive SMS webhooks from Twilio and store in sms_logs
- Claude API for analyzing inbound SMS (interested/not interested/callback)
- Basic lead qualification rules (email domain, phone format, etc.)
- Simple dispositions: New, Hot, Nurture, Wrong Number, Sold, Do Not Contact
- Basic tags system (add/remove tags, including "WHALE")

**Nice-to-have:**
- Bulk SMS send to multiple leads
- SMS templates library
- Duplicate detection on CSV upload (email/phone match)
- Lead export to CSV
- Activity timeline on lead detail (all SMS shown)
- Basic dashboard (total leads, today's SMS, etc.)

**Risks:**
- Twilio rate limits
- Claude API costs (implement caching)
- CSV parsing edge cases
- Supabase free tier limits

---

### Phase 2: Growth & AI Learning (2-3 weeks)

**Must-have features:**
- Multi-step follow-up sequences
- Automated follow-up triggering
- Appointment management
- Calendar integration (Google Calendar)
- AI habit learning for scheduling
- Lead scoring improvement (Claude analyzes conversation history)
- Duplicate merging tool
- Enhanced AI qualification

**Nice-to-have:**
- Task management integrated with leads
- Email outreach (SendGrid/Mailgun)
- Social media content idea suggestions
- Basic reporting
- Lead lifecycle visualizations

**Risks:**
- External API limits (Google Calendar)
- AI model drift
- Background job reliability

---

### Phase 3: Automation & Scaling (3-4 weeks)

**Must-have features:**
- Website/directory scraping (Puppeteer/Playwright)
- Scraped leads in same pipeline as CSV uploads
- Social media integration (LinkedIn, X, Instagram)
- Content scheduling queue
- Hashtag and trend research
- Cross-platform posting
- Advanced reporting
- Audit trails

**Nice-to-have:**
- Voice AI for outbound calls
- Email drip campaigns
- Lead enrichment (Clearbit)
- Mobile optimization
- White-label options

**Risks:**
- Scraping legal risks
- Social platform API limits
- Data retention/compliance
- Infrastructure scaling

---

## AI Learning & Automation

### Habit Learning

**Data Collection:**
- When you send SMS (time of day, day of week)
- Which leads you contact first after upload
- Which dispositions lead to outcomes
- Response times to leads

**Implementation:**
- Simple analytics in `user_habits` table
- Increment counters when you perform actions
- Query for "best contact time"

**Phase 3 Enhancement:**
- Claude analyzes patterns
- Suggests optimal contact times per disposition
- Learns from successful outcomes

---

### Qualification Learning

**Data Needed:**
- SMS conversation history
- Lead outcomes
- Manual tags and dispositions
- Lead source

**Training/Labeling:**
- Implicit: When you mark lead as "Sold," conversation is marked successful
- Explicit: Add helpful/not helpful button on AI suggestions
- Store labels in `ai_feedback` table

**Model Location:**
- Phase 1-2: Prompt engineering + Claude API (no local models)
- Phase 3: Consider fine-tuning for specific tasks if costs justify

---

### Claude Usage

**As Assistant in UI:**
- Lead detail: "Ask Claude to suggest next message"
- Global chat: "Summarize today's hot leads"
- SMS response analysis (via webhook)

**As Automation Engine:**
- Daily job: Reviews leads due for follow-up, generates SMS
- Social content generation
- Appointment scheduling parsing

**Architecture:**
- Next.js API routes call Anthropic API
- All Claude calls cached (Redis or Supabase cache)
- Prompt templates stored in DB

---

## MCP Servers & Skills

### Essential MCP Servers (Phase 1)

| MCP Server | Purpose |
|------------|---------|
| supabase | Direct DB access, auth management |
| twilio | SMS/voice integration, webhook testing |
| github | Version control |

### Essential MCP Servers (Phase 2-3)

| MCP Server | Purpose |
|------------|---------|
| puppeteer/playwright | Web scraping |
| social-media-mcp | Social posting automation |
| google-calendar | Appointment integration |

### Claude Skills to Install

| Skill | Purpose |
|-------|---------|
| superpowers:writing-plans | Implementation planning |
| superpowers:test-driven-development | TDD for features |
| superpowers:systematic-debugging | Debug systematically |
| superpowers:verification-before-completion | Verify before committing |
| planning-with-files | Reference design docs |

### Custom Skills to Create

**Phase 1-2:**
- `qualify-lead-via-sms` - Full qualification flow automation
- `daily-follow-up-routine` - Daily automation job
- `whale-detector` - High-value lead detection

**Phase 3:**
- `social-content-generator` - Creates and schedules posts
- `scraped-ingest` - Scrapes and ingests leads
- `voice-qualification` - Voice AI for calls

---

## Project Structure

```
insure-assist/
├── app/                          # App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── uploads/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── leads/route.ts
│   │   ├── leads/[id]/route.ts
│   │   ├── uploads/route.ts
│   │   ├── uploads/[id]/route.ts
│   │   ├── sms/route.ts
│   │   ├── sms/webhook/route.ts
│   │   └── ai/analyze-sms/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (Shadcn)
│   ├── lead-card.tsx
│   ├── lead-list.tsx
│   ├── csv-uploader.tsx
│   └── sms-thread.tsx
├── lib/
│   ├── supabase.ts
│   ├── twilio.ts
│   ├── claude.ts
│   └── csv-parser.ts
├── types/
│   ├── lead.ts
│   └── sms.ts
└── docs/
    └── plans/
        └── 2025-03-02-insureassist-design.md (this file)
```

---

## Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/leads` | GET | List leads (filtered by user via RLS) |
| `/api/leads` | POST | Create new lead |
| `/api/leads/[id]` | GET | Get single lead |
| `/api/leads/[id]` | PATCH | Update lead |
| `/api/leads/[id]` | DELETE | Delete lead |
| `/api/uploads` | POST | Upload CSV, parse, insert leads |
| `/api/uploads/[id]` | GET | Get upload status |
| `/api/sms` | POST | Send SMS via Twilio |
| `/api/sms/webhook` | POST | Receive Twilio webhooks |
| `/api/ai/analyze-sms` | POST | Call Claude to analyze SMS |

---

## CSV Upload Flow

1. User drags CSV to csv-uploader component
2. File POST to `/api/uploads` (formdata)
3. API validates file type (.csv)
4. Creates csv_uploads row (status: 'processing')
5. Parse CSV (papaparse library)
6. Detect headers (auto or user-configured mapping)
7. Extract: first_name, last_name, email, phone, address
8. Normalize: email (lowercase, trim), phone (digits only), names (trim, title case)
9. Insert leads batch with source metadata
10. Update csv_uploads row (status: 'completed')
11. Frontend polls `/api/uploads/[id]` for status
12. When 'completed', redirect to leads list

---

## Security

### Authentication
- Supabase Auth handles login/signup
- JWT tokens passed via Supabase client
- All API routes validate session via `supabase.auth.getUser()`

### Multi-Tenancy
- Row Level Security (RLS) enforces user isolation at database level
- Every user-owned table has `user_id` column
- RLS policies: `auth.uid() = user_id`

### PII Protection
- Phone numbers stored in raw and normalized formats
- Email addresses normalized but stored as-is
- No PII in logs (use IDs instead)
- Consider encryption at rest for sensitive fields (Phase 2+)

---

## Implementation Order (Phase 1)

1. Supabase project setup + Auth
2. Create database tables + RLS policies
3. MCP configuration (Supabase, Twilio)
4. Next.js project initialization
5. Supabase client setup
6. Auth pages (login/signup)
7. Dashboard layout + navigation
8. CSV upload feature
9. Lead list page with filters
10. Lead detail page
11. Twilio SMS integration
12. Claude API integration for SMS analysis
13. Testing and refinement

---

## Next Steps

This design document is approved. Next: invoke `writing-plans` skill to create a detailed implementation plan with concrete code examples.

---

**Status:** Design complete and approved. Ready for implementation planning.
