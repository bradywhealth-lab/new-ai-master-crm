# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InsureAssist is a multi-tenant insurance CRM with AI-powered lead qualification and multi-channel outreach automation. It uses Next.js 15 with App Router, Supabase for the database, and integrates with Twilio (SMS), Claude AI (analysis), and Puppeteer (web scraping).

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required variables (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - Twilio SMS
- `ANTHROPIC_API_KEY` - Claude API for AI analysis

## Architecture

### Database & Auth

All database operations use Supabase with Row Level Security (RLS) for multi-tenant isolation. There are two client patterns:

- **Client-side** (`lib/supabase/client.ts`): Uses `createBrowserClient` with anon key. For use in client components.
- **Server-side** (`lib/supabase/server.ts`): Uses `createServerClient` with service role key. Required for API routes and server components.

Authentication flow:
- Users created via Supabase Auth (auth.users)
- Profile data in `profiles` table (extends auth.users with RLS)
- All user-owned tables reference `profiles.id`

### API Route Pattern

API routes follow this pattern:
1. Extract user from session via `createServerSupabaseClient().auth.getUser()`
2. Fetch the target resource and verify ownership (`resource.user_id === user.id`)
3. Perform the action
4. Return appropriate response

Example (see `app/api/sms/route.ts`):
```typescript
const supabase = createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
if (lead.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

### Database Tables

Core tables (run `docs/database-setup.sql` in Supabase SQL Editor):
- `profiles` - User profile data (extends auth.users)
- `leads` - Lead records with AI qualification scores and dispositions
- `csv_uploads` - CSV upload tracking
- `sms_logs` - SMS conversation history with AI analysis
- `sms_templates` - Reusable SMS message templates

Phase 5 enhancements (run `docs/phase5-enhancements-database.sql`):
- `email_templates` - Email templates with categories
- `email_logs` - Email send history

### Lead Qualification

Basic qualification rules in `lib/qualification-rules.ts`:
- Base score: 50 points
- Has both email + phone: +20 points
- Professional email domain: +10 points
- Full name provided: +10 points
- Valid phone (10+ digits): +10 points

Dispositions: `hot` (80+), `nurture` (50-79), `new` (<50)

### AI Integration

Claude API via `lib/claude.ts`:
- Used for SMS response categorization (`app/api/ai/analyze-sms/route.ts`)
- Returns category: `interested` | `not_interested` | `callback_requested` | `unknown`
- Model: `claude-sonnet-4-20250514`

### Web Scraping

Puppeteer-based scraping via `lib/scraper.ts`:
- Supports CSS/XPath selectors for lead extraction
- Configurable with `ScraperConfig` (headless, timeout, max_pages, delays)
- Scrape targets managed via API routes under `app/api/scrape-targets/`

### TypeScript Types

Database types are auto-generated in `lib/supabase/types.ts` but currently handwritten. Domain types in `types/`:
- `communications.ts` - Email/SMS templates and logs
- `scraping.ts` - Scrape targets, jobs, and results
- `social.ts` - Social media connections and posts
- `feedback.ts` - AI feedback collection

### UI Components

Uses Shadcn/UI components from `components/ui/`. Main dashboard pages in `app/(dashboard)/`:
- Layout with sidebar navigation and auth check
- Client components use `createClient()` from `lib/supabase/client.ts`

## Key Integration Notes

- **Twilio Webhook**: Configure `https://your-domain.com/api/sms/webhook` for inbound SMS
- **RLS Policies**: All tables have policies ensuring `auth.uid() = user_id`
- **Phase 4 automation**: Content queue, social posts, trends analysis in `app/api/content/`, `app/api/social/`, `app/api/trends/`
- **Phase 5 tables**: Email and SMS templates/logs have `is_active` and `category` fields with CHECK constraints

## Testing Twilio Webhooks Locally

Use ngrok: `ngrok http 3000` and point Twilio webhook to the generated URL.
