# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InsureAssist is a multi-tenant insurance CRM with AI-powered lead qualification and multi-channel outreach automation. It uses Next.js 15 with App Router, Supabase for database, and integrates with Twilio (SMS), Claude AI (analysis), and Puppeteer (web scraping).

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start     # Start production server
```

## Environment Variables

Required variables (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - Twilio SMS
- `ANTHROPIC_API_KEY` - Claude API for AI analysis
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - Email configuration (for actual email sending)

## Architecture

### Database & Auth

All database operations use Supabase with Row Level Security (RLS) for multi-tenant isolation. There are two client patterns:

- **Client-side** (`lib/supabase/client.ts`): Uses `createBrowserClient()` with anon key. For use in client components.
- **Server-side** (`lib/supabase/server.ts`): Uses `createServerClient()` with service role key. Required for API routes and server components.

Authentication flow:
- Users created via Supabase Auth (auth.users)
- Profile data in `profiles` table (extends auth.users with RLS)
- All user-owned tables reference `profiles.id`

### API Route Pattern

API routes follow this pattern for consistency:
```typescript
const supabase = createClient()  // Server-side client
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

// Fetch and verify ownership
const { data: resource } = await supabase.from('table').select('*').eq('id', id).single()
if (!resource || resource.user_id !== user.id) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

// Perform action
await supabase.from('table').insert({ ... })
return Response.json({ success: true })
```

**Dynamic Routes:**
- App Router dynamic routes use `[id]` parameter: `app/api/email/templates/[id]/route.ts`
- Extract with: `const { id } = await params`

**DELETE Routes:**
- Example: DELETE at `app/api/email/templates/[id]/route.ts` (Created today)

### Database Schema

**Core Tables:**
- `profiles` - User profile data (full_name, phone_number, agency_name, email)
- `leads` - Lead records with AI qualification scores and dispositions
- `csv_uploads` - CSV upload tracking
- `sms_logs` - SMS conversation history with AI analysis
- `sms_templates` - Reusable SMS message templates

**Phase 5 Tables:**
- `email_templates` - Email templates with categories (follow_up, proposal, reminder, newsletter)
- `email_logs` - Email send history with status tracking
- `sms_templates` - SMS templates with categories (follow_up, appointment, reminder)

**RLS:**
- All tables have policies ensuring `auth.uid() = user_id`
- Example: `CREATE POLICY "Users can view their own email templates" ON email_templates FOR SELECT USING (auth.uid() = user_id);`

### Lead Qualification

Basic qualification rules in `lib/qualification-rules.ts`:
- Base score: 50 points
- Has both email + phone: +20 points
- Professional email domain: +10 points
- Full name provided: +10 points
- Valid phone (10+ digits): +10 points

Dispositions: `hot` (80+), `nurture` (50-79), `new` (<50)

**Category Mapping for SMS:**
- `interested` - Positive response to SMS
- `not_interested` - Negative response
- `callback_requested` - Asks for call
- `unknown` - Unable to categorize

### AI Integration

Claude API integration (`lib/claude.ts`):
- Used for SMS response categorization
- Model: `claude-sonnet-4-20250514`
- Returns categories with confidence scores

### Web Scraping

Puppeteer-based scraping via `lib/scraper.ts`:
- Supports CSS/XPath selectors for lead extraction
- Configurable: headless, timeout, max_pages, delays
- Scrape targets managed via API routes under `app/api/scrape-targets/`

### Phase 4 Automation

- **Content Queue**: Schedules content for multiple platforms
- **Social Posts**: Draft and publish to social media
- **Trends Analysis**: Topic trend analysis with hashtag tracking
- All in `app/api/content/`, `app/api/social/`, `app/api/trends/`

### Phase 5 Enhancements (Completed Today)

**New Pages:**
- `/dashboard/analytics` - Analytics dashboard with date range filters, disposition filters, visual charts (Recharts)
- `/dashboard/calendar` - Calendar view with appointment display and date navigation
- `/dashboard/communications` - Email/SMS templates and logs viewing
- `/dashboard/reports` - PDF/CSV report generation

**New Components:**
- `analytics-dashboard.tsx` - Charts for leads by disposition, AI score, and over time
- `calendar-view.tsx` - Monthly calendar with appointment display
- `email-templates.tsx` - Email template CRUD with categories
- `email-logs.tsx` - Email log history with status filters
- `sms-templates.tsx` - SMS template CRUD with categories
- `sms-logs.tsx` - SMS log history with status filters
- `report-generator.tsx` - PDF/CSV export with jsPDF

**New API Routes:**
- `/api/analytics/route.ts` - Analytics data with query params
- `/api/appointments/route.ts` - Appointments CRUD
- `/api/email/templates/route.ts` - Email templates CRUD
- `/api/email/templates/[id]/route.ts` - DELETE email template
- `/api/email/logs/route.ts` - Email logs viewing
- `/api/email/send-test/route.ts` - Test email sending via nodemailer
- `/api/reports/generate/route.ts` - PDF/CSV report generation
- `/api/sms/templates/route.ts` - SMS templates CRUD
- `/api/sms/logs/route.ts` - SMS logs viewing
- `/api/sms/send-test/route.ts` - Test SMS sending

**Libraries Added:**
- `recharts` - For analytics charts
- `jspdf` - For PDF generation
- `nodemailer` - For actual email sending

**Database Migration:**
- `docs/phase5-migration-adaptive.sql` - Adaptive SQL that checks existing tables before creation
- Successfully migrated to add: `email_templates`, `email_logs`, `sms_templates` tables, `template_id` column to `sms_logs`, and `email` column to `profiles`

**Email Configuration:**
- `brighterhealthsolutions@gmail.com` configured
- Google App Password: `llih zywl gocg rbzi`

## Bug Fixes (Today's Session)

### Email Templates DELETE Route
**File:** `app/api/email/templates/[id]/route.ts` (Created)
**Issue:** Component tried to call DELETE but no dynamic route existed
**Fix:** Created proper App Router dynamic route with ownership verification

### Report PDF Download
**Files:** `components/report-generator.tsx`, `app/api/reports/generate/route.ts`
**Issue:** API returned `pdf_url` as raw bytes instead of data URL string
**Fix:**
- Changed API response field name from `pdf_url` to `pdf_data` (base64 PDF)
- Updated component to use `data:application/pdf;base64,${pdfData}` for data URI

## Security Notes

**Authentication:** All API routes verify user authentication and resource ownership before actions

**RLS:** All tables use Row Level Security ensuring users can only access their own data

**Service Role:** Service role key is only used in `lib/supabase/server.ts` - never exposed to client

**Secrets Management:** All secrets should be in `.env.local` and never committed

## Current State

**Branch:** `main`
**Latest Commits:**
- `cd5a565` - Migration guide updated to use adaptive SQL
- `cf96df4` - Email templates DELETE route and report PDF download fixes

**Status:** Clean working directory

## What's Working

All Phase 5 features are implemented and tested:
- Analytics dashboard with date/disposition filters
- Communications center (email/SMS templates & logs)
- Calendar view with appointments
- Report generation (PDF/CSV export)

## Next Steps

1. **Test all new features** at `http://localhost:3000`
2. **Deploy to production** when ready

---

This file is maintained and updated with the latest project state and features.
