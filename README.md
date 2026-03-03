# InsureAssist - Insurance CRM + AI Assistant

A multi-tenant CRM for insurance agents with AI-powered lead qualification and SMS outreach automation.

## Features

- **Multi-tenant CRM** with user data isolation via Supabase Row Level Security
- **CSV Lead Upload** with automatic qualification scoring
- **AI-Powered Analysis** using Claude for SMS response categorization
- **SMS Integration** via Twilio for outbound outreach and inbound response handling
- **Lead Qualification** with automatic scoring (hot/nurture/new) and tagging
- **"WHALE" Tagging** for big family leads

## Tech Stack

- **Frontend**: Next.js 15+ with React 19
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS + Shadcn/UI
- **SMS**: Twilio SDK
- **AI**: Anthropic Claude API
- **CSV Parsing**: Papaparse

## Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL from `docs/database-setup.sql` in the Supabase SQL Editor:
   - Navigate to your project → SQL Editor
   - Copy contents of `docs/database-setup.sql`
   - Paste and run

3. Get your Supabase credentials from Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side)

### 2. Set Up Twilio

1. Go to [twilio.com](https://twilio.com) and create an account
2. Get a phone number for sending/receiving SMS
3. Get credentials from Console:
   - `TWILIO_ACCOUNT_SID` - Account SID
   - `TWILIO_AUTH_TOKEN` - Auth Token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (E.164 format: +1XXXXXXXXXX)

4. **Configure Webhook**:
   - Go to your phone number in Twilio Console
   - Under "Messaging" → "A message comes in", set Webhook URL:
   ```
   https://your-domain.com/api/sms/webhook
   ```
   - For local testing, use ngrok: `ngrok http 3000`

### 3. Set Up Claude AI

1. Go to [anthropic.com](https://anthropic.com) and create an account
2. Get your API key from API Keys section
3. Set as `ANTHROPIC_API_KEY`

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in all values:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication

1. Go to `/signup` to create a new account
2. Or go to `/login` to sign in

### Uploading Leads (CSV)

1. Navigate to `/dashboard/uploads`
2. Upload a CSV file with the following columns:
   - `first_name` (required)
   - `last_name` (required)
   - `email` (optional)
   - `phone` (optional)
   - `address` (optional)
   - `city` (optional)
   - `state` (optional)
   - `zip` (optional)

3. CSV filename and upload date are automatically tracked
4. Leads are automatically qualified based on:
   - Email and phone presence
   - Professional email domains
   - Full name provided
   - Valid phone number

### Viewing and Managing Leads

1. Navigate to `/dashboard/leads`
2. View all leads with search and disposition filters
3. Click on a lead to view details and SMS thread

### Sending SMS

1. Go to a lead's detail page
2. Type your message and click Send
3. SMS is logged and can be viewed in the conversation thread

### Incoming SMS Handling

When a lead replies:
1. Twilio webhook receives the SMS
2. Message is logged to the database
3. (Future: AI analyzes response and updates lead disposition)

## Project Structure

```
app/
├── (auth)/           # Authentication pages
│   ├── login/
│   └── signup/
├── (dashboard)/       # Dashboard pages
│   ├── dashboard/      # Overview page
│   ├── leads/          # Lead list and detail
│   └── uploads/        # CSV upload page
└── api/              # API routes
    ├── sms/           # Send SMS
    │   └── webhook/    # Receive SMS from Twilio
    └── ai/
        └── analyze-sms/  # Analyze SMS with Claude

components/
├── ui/               # Shadcn/UI components
├── csv-uploader.tsx   # CSV upload with qualification
├── lead-list.tsx      # Lead list with filters
└── sms-thread.tsx     # SMS conversation display

lib/
├── supabase/         # Supabase client config
├── csv-parser.ts      # CSV parsing utilities
├── twilio.ts          # Twilio client wrapper
├── claude.ts          # Claude API wrapper
└── qualification-rules.ts  # Lead qualification logic

docs/
└── database-setup.sql # Database schema and RLS policies
```

## Database Schema

### Tables

- **profiles**: User profiles (extends Supabase auth)
- **csv_uploads**: Track CSV file uploads
- **leads**: All lead data with source tracking and qualification scores
- **sms_logs**: All SMS messages sent/received
- **sms_templates**: Reusable SMS templates

### Security

All tables use Row Level Security (RLS) to ensure:
- Users can only see/edit their own data
- Multi-tenant isolation is enforced at database level

## Lead Qualification Rules

Leads are scored based on:
- **Base score**: 50 points
- **Email + Phone**: +20 points
- **Professional email domain**: +10 points
- **Full name provided**: +10 points
- **Valid phone (10+ digits)**: +10 points

Dispositions:
- **Hot** (score 80+): High priority, ready for outreach
- **Nurture** (score 60-79): Potential leads, need follow-up
- **New** (score <60): New leads, need research

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Files

- `.env.local.example` - Example environment variables
- `.env.local` - Your actual environment variables (not committed)
- `.env.local` is automatically loaded by Next.js

## Troubleshooting

### Twilio Webhook Not Working

1. Ensure your server is publicly accessible (use ngrok for local development)
2. Check the webhook URL is correct in Twilio console
3. Verify the endpoint returns 200 OK

### AI Analysis Failing

1. Check `ANTHROPIC_API_KEY` is set correctly
2. Verify you have API credits in your Anthropic account
3. Check browser console for error messages

### CSV Upload Issues

1. Ensure CSV has required columns (first_name, last_name)
2. Check file type is `.csv`
3. Verify Supabase RLS policies are set correctly

## Future Enhancements

- [ ] AI learns from user corrections to improve qualification
- [ ] Automatic appointment scheduling
- [ ] Lead scraping from external sources
- [ ] Social media marketing automation
- [ ] Advanced AI for natural conversation handling
- [ ] Email integration for multi-channel outreach

## License

MIT
