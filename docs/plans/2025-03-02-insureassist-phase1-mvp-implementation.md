# InsureAssist Phase 1 (MVP) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the MVP of InsureAssist - a multi-tenant CRM with CSV lead upload, SMS qualification via Twilio, and Claude AI analysis.

**Architecture:** Next.js (App Router) + Supabase (PostgreSQL with RLS) + Twilio SMS + Claude API. Multi-tenant security enforced at database level via Row Level Security.

**Tech Stack:** Next.js 15+, React 19+, TypeScript, Tailwind CSS, Shadcn/UI, Supabase CLI, Twilio Node SDK, Anthropic SDK, Papaparse (CSV parsing)

---

## Prerequisites

Before starting, ensure you have:

1. **Node.js 20+** installed: `node --version`
2. **Supabase account** with a project created
3. **Twilio account** with a phone number configured
4. **Anthropic API key** for Claude access
5. **pnpm** or **npm** (we'll use pnpm for faster installs)

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json` (via Next.js CLI)
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Step 1: Create Next.js project**

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
```

**Step 2: Install dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr twilio @anthropic-ai/sdk papaparse clsx tailwind-merge
pnpm add -D @types/papaparse
```

**Step 3: Initialize Tailwind and configure Shadcn/UI**

```bash
pnpm dlx shadcn@latest init
# Select: Default style, CSS variables, Slate color, No (radius), Yes (aliases)
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project with Shadcn/UI"
```

---

## Task 2: Configure Supabase Client

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (add `.env.local`)

**Step 1: Create Supabase client (browser)**

Create `lib/supabase.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './supabase/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create Supabase client (server)**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './supabase/types'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )
}
```

**Step 3: Generate Supabase types**

```bash
# From Supabase Dashboard > Settings > API
# Or use CLI if installed:
# supabase gen types typescript --local > lib/supabase/types.ts
```

For now, create placeholder `lib/supabase/types.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone_number: string | null
          agency_name: string | null
          created_at: string
        }
        Insert: Omit<Profiles['Row'], 'id' | 'created_at'>
        Update: Partial<Profiles['Row']>
      }
      leads: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          source_type: string
          csv_upload_id: string | null
          source_filename: string | null
          source_row_id: string | null
          disposition: string
          tags: string[]
          notes: string | null
          ai_score: number | null
          ai_qualification_reason: string | null
          created_at: string
          updated_at: string
          normalized_email: string | null
          normalized_phone: string | null
        }
        Insert: Omit<Leads['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Leads['Row']>
      }
      // Add other tables as needed (csv_uploads, sms_logs, etc.)
    }
  }
}
```

**Step 4: Create environment template**

Create `.env.local.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Anthropic (Claude)
ANTHROPIC_API_KEY=your-api-key
```

**Step 5: Update .gitignore**

Add to `.gitignore`:
```
.env.local
```

**Step 6: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase client configuration"
```

---

## Task 3: Set Up Database in Supabase

**Files:**
- No files created (SQL executed in Supabase)

**Step 1: Go to Supabase Dashboard**

1. Open your project at https://supabase.com/dashboard
2. Navigate to **SQL Editor**

**Step 2: Create profiles table**

```sql
-- Profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT UNIQUE,
  agency_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Execute and verify: Success message

**Step 3: Create csv_uploads table**

```sql
-- CSV uploads tracking
CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT
);
```

Execute and verify: Success message

**Step 4: Create leads table**

```sql
-- Leads/contacts (multi-tenant)
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

  -- Source tracking
  source_type TEXT NOT NULL,
  csv_upload_id UUID REFERENCES csv_uploads(id) ON DELETE SET NULL,
  source_filename TEXT,
  source_row_id TEXT,

  -- Disposition and tags
  disposition TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- AI-qualified
  ai_score INTEGER,
  ai_qualification_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  normalized_email TEXT,
  normalized_phone TEXT
);
```

Execute and verify: Success message

**Step 5: Create sms_logs table**

```sql
-- SMS outreach logs
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  twilio_message_id TEXT UNIQUE,
  direction TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- AI analysis
  ai_category TEXT,
  ai_confidence INTEGER,
  ai_analysis TEXT
);
```

Execute and verify: Success message

**Step 6: Create sms_templates table**

```sql
-- SMS templates
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);
```

Execute and verify: Success message

**Step 7: Enable RLS and create policies**

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can CRUD their own leads
CREATE POLICY "Users can CRUD own leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id);

-- Users can CRUD their own CSV uploads
CREATE POLICY "Users can CRUD own csv_uploads"
  ON csv_uploads FOR ALL
  USING (auth.uid() = user_id);

-- Users can CRUD their own SMS logs
CREATE POLICY "Users can CRUD own sms_logs"
  ON sms_logs FOR ALL
  USING (auth.uid() = user_id);

-- Users can CRUD their own templates
CREATE POLICY "Users can CRUD own templates"
  ON sms_templates FOR ALL
  USING (auth.uid() = user_id);
```

Execute and verify: Success message

**Step 8: Create indexes**

```sql
-- Performance indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_disposition ON leads(disposition);
CREATE INDEX idx_leads_csv_upload_id ON leads(csv_upload_id);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_sms_logs_lead_id ON sms_logs(lead_id);
CREATE INDEX idx_sms_logs_user_id ON sms_logs(user_id);
```

Execute and verify: Success message

**Step 9: Update local .env.local**

Copy your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Step 10: Commit**

```bash
git add .env.local.example
git commit -m "docs: add SQL setup instructions"
```

---

## Task 4: Create Auth Pages (Login/Signup)

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`

**Step 1: Create auth layout**

Create `app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
```

**Step 2: Create login page**

Create `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Sign in to InsureAssist</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Create signup page**

Create `app/(auth)/signup/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
      })
      router.push('/dashboard')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create your InsureAssist account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add auth pages (login/signup)"
```

---

## Task 5: Create Dashboard Layout with Navigation

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`

**Step 1: Create dashboard layout**

Create `app/(dashboard)/layout.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/uploads', label: 'Upload CSV' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login'
      } else {
        setUser(user)
      }
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h1 className="text-2xl font-bold mb-6">InsureAssist</h1>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md ${
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

**Step 2: Create dashboard overview page**

Create `app/(dashboard)/dashboard/page.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    todaySMS: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    async function loadStats() {
      // Get total leads
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      // Get hot leads
      const { count: hotCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('disposition', 'hot')

      // Get today's SMS (simplified - you'd filter by date properly)
      const { count: smsCount } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalLeads: count || 0,
        hotLeads: hotCount || 0,
        todaySMS: smsCount || 0,
      })
    }

    loadStats()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hot Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">{stats.hotLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SMS Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{stats.todaySMS}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/
git commit -m "feat: add dashboard layout and overview page"
```

---

## Task 6: Create Leads List Page

**Files:**
- Create: `app/(dashboard)/leads/page.tsx`
- Create: `components/lead-list.tsx`

**Step 1: Create lead list component**

Create `components/lead-list.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  disposition: string
  tags: string[]
  source_filename: string | null
  created_at: string
}

const dispositionColors: Record<string, string> = {
  new: 'bg-gray-500',
  hot: 'bg-red-500',
  nurture: 'bg-yellow-500',
  sold: 'bg-green-500',
  wrong_number: 'bg-red-900',
  do_not_contact: 'bg-gray-900',
}

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dispositionFilter, setDispositionFilter] = useState<string>('all')

  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [search, dispositionFilter])

  async function loadLeads() {
    setLoading(true)

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (dispositionFilter !== 'all') {
      query = query.eq('disposition', dispositionFilter)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Error loading leads:', error)
    } else {
      setLeads(data || [])
    }

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Leads</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          value={dispositionFilter}
          onChange={(e) => setDispositionFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Dispositions</option>
          <option value="new">New</option>
          <option value="hot">Hot</option>
          <option value="nurture">Nurture</option>
          <option value="sold">Sold</option>
          <option value="wrong_number">Wrong Number</option>
          <option value="do_not_contact">Do Not Contact</option>
        </select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Disposition</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  {lead.first_name} {lead.last_name}
                </TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>
                  <Badge className={dispositionColors[lead.disposition] || 'bg-gray-500'}>
                    {lead.disposition}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>{lead.source_filename}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/leads/${lead.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

**Step 2: Create leads page**

Create `app/(dashboard)/leads/page.tsx`:

```typescript
import LeadList from '@/components/lead-list'

export default function LeadsPage() {
  return <LeadList />
}
```

**Step 3: Commit**

```bash
git add components/lead-list.tsx app/\(dashboard\)/leads/page.tsx
git commit -m "feat: add leads list page with filters"
```

---

## Task 7: Create Lead Detail Page

**Files:**
- Create: `app/(dashboard)/leads/[id]/page.tsx`
- Create: `components/lead-detail.tsx`
- Create: `components/sms-thread.tsx`

**Step 1: Create SMS thread component**

Create `components/sms-thread.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SMSLog {
  id: string
  direction: string
  content: string
  sent_at: string
  ai_category: string | null
}

interface SMSThreadProps {
  leadId: string
}

export default function SMSThread({ leadId }: SMSThreadProps) {
  const [messages, setMessages] = useState<SMSLog[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadMessages()
  }, [leadId])

  async function loadMessages() {
    const { data } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: true })

    setMessages(data || [])
  }

  async function handleSendSMS() {
    if (!newMessage.trim()) return

    setSending(true)

    // TODO: Call /api/sms endpoint
    // For now, just add to list
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('sms_logs').insert({
      user_id: userData.user?.id,
      lead_id: leadId,
      direction: 'outbound',
      content: newMessage,
    })

    if (!error) {
      setNewMessage('')
      await loadMessages()
    }

    setSending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Conversation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.direction === 'outbound'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(msg.sent_at).toLocaleString()}
                  {msg.ai_category && (
                    <span className="block text-xs">
                      AI: {msg.ai_category}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendSMS()}
          />
          <Button onClick={handleSendSMS} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Create lead detail component**

Create `components/lead-detail.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import SMSThread from '@/components/sms-thread'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  disposition: string
  tags: string[]
  notes: string | null
  source_filename: string | null
  source_row_id: string | null
  created_at: string
  ai_score: number | null
  ai_qualification_reason: string | null
}

export default function LeadDetail() {
  const params = useParams()
  const leadId = params.id
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Lead>>({})

  const supabase = createClient()

  useEffect(() => {
    loadLead()
  }, [leadId])

  async function loadLead() {
    const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()

    setLead(data)
    setFormData(data || {})
    setLoading(false)
  }

  async function handleSave() {
    const { error } = await supabase.from('leads').update(formData).eq('id', leadId)

    if (!error) {
      setLead({ ...lead!, ...formData } as Lead)
      setEditing(false)
    }
  }

  function handleAddTag(tag: string) {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag],
      })
    }
  }

  function handleRemoveTag(tag: string) {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    })
  }

  if (loading) return <div>Loading...</div>
  if (!lead) return <div>Lead not found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {lead.first_name} {lead.last_name}
        </h1>
        <Button onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lead Info */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>First Name</Label>
              {editing ? (
                <Input
                  value={formData.first_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              ) : (
                <p>{lead.first_name}</p>
              )}
            </div>
            <div>
              <Label>Last Name</Label>
              {editing ? (
                <Input
                  value={formData.last_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              ) : (
                <p>{lead.last_name}</p>
              )}
            </div>
            <div>
              <Label>Email</Label>
              {editing ? (
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              ) : (
                <p>{lead.email}</p>
              )}
            </div>
            <div>
              <Label>Phone</Label>
              {editing ? (
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              ) : (
                <p>{lead.phone}</p>
              )}
            </div>
            <div>
              <Label>Address</Label>
              {editing ? (
                <Input
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              ) : (
                <p>{lead.address}</p>
              )}
            </div>
            <div>
              <Label>Disposition</Label>
              {editing ? (
                <select
                  value={formData.disposition || 'new'}
                  onChange={(e) =>
                    setFormData({ ...formData, disposition: e.target.value })
                  }
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="new">New</option>
                  <option value="hot">Hot</option>
                  <option value="nurture">Nurture</option>
                  <option value="sold">Sold</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="do_not_contact">Do Not Contact</option>
                </select>
              ) : (
                <Badge className="text-lg px-3 py-1">{lead.disposition}</Badge>
              )}
            </div>
            {editing && (
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Source & AI Info */}
        <Card>
          <CardHeader>
            <CardTitle>Source & AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Source File</Label>
              <p>{lead.source_filename}</p>
            </div>
            <div>
              <Label>Row ID</Label>
              <p>{lead.source_row_id}</p>
            </div>
            <div>
              <Label>Upload Date</Label>
              <p>{new Date(lead.created_at).toLocaleString()}</p>
            </div>
            {lead.ai_score && (
              <div>
                <Label>AI Score</Label>
                <p className="text-2xl font-bold">{lead.ai_score}/100</p>
              </div>
            )}
            {lead.ai_qualification_reason && (
              <div>
                <Label>AI Qualification</Label>
                <p className="text-sm">{lead.ai_qualification_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {(formData.tags || []).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={`px-3 py-1 ${tag === 'WHALE' ? 'border-blue-500 text-blue-600' : ''}`}
              >
                {tag}
                {editing && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-xs hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add tag (e.g., WHALE)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
              <Button onClick={() => handleAddTag('WHALE')}>Add WHALE</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border rounded-md p-3 min-h-32"
              placeholder="Add notes about this lead..."
            />
          ) : (
            <p className="whitespace-pre-wrap">{lead.notes || 'No notes'}</p>
          )}
        </CardContent>
      </Card>

      {/* SMS Thread */}
      <SMSThread leadId={leadId!} />
    </div>
  )
}
```

**Step 3: Create lead detail page**

Create `app/(dashboard)/leads/[id]/page.tsx`:

```typescript
import LeadDetail from '@/components/lead-detail'

export default function LeadDetailPage() {
  return <LeadDetail />
}
```

**Step 4: Commit**

```bash
git add components/sms-thread.tsx components/lead-detail.tsx app/\(dashboard\)/leads/[id]/page.tsx
git commit -m "feat: add lead detail page with SMS thread"
```

---

## Task 8: Create CSV Upload Page

**Files:**
- Create: `app/(dashboard)/uploads/page.tsx`
- Create: `components/csv-uploader.tsx`
- Create: `lib/csv-parser.ts`

**Step 1: Create CSV parser utility**

Create `lib/csv-parser.ts`:

```typescript
import papaparse from 'papaparse'
import { z } from 'zod'

// Schema for lead row validation
const LeadRowSchema = z.object({
  firstName: z.string().optional(),
  first_name: z.string().optional(),
  lastname: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
})

export type LeadRow = z.infer<typeof LeadRowSchema>

export interface ParsedLead {
  row_id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  normalized_email: string | null
  phone: string | null
  normalized_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

export function normalizeEmail(email: string | null): string | null {
  if (!email) return null
  return email.toLowerCase().trim()
}

export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  // Remove all non-digit characters
  return phone.replace(/\D/g, '')
}

export function normalizeName(name: string | null): string | null {
  if (!name) return null
  return name.trim()
}

export function parseCSV(file: File): Promise<ParsedLead[]> {
  return new Promise((resolve, reject) => {
    papaparse.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedLeads: ParsedLead[] = []

        results.data.forEach((row: any, index: number) => {
          try {
            // Normalize keys to common format
            const normalizedRow: any = {}
            Object.keys(row).forEach((key) => {
              const lowerKey = key.toLowerCase().replace(/[_\s]/g, '')
              normalizedRow[lowerKey] = row[key]
            })

            // Validate against schema
            const validated = LeadRowSchema.parse(normalizedRow)

            const first_name = normalizeName(
              validated.firstName || validated.first_name
            )
            const last_name = normalizeName(
              validated.lastname || validated.last_name
            )
            const email = normalizeEmail(validated.email)
            const phone = normalizePhone(validated.phone)

            parsedLeads.push({
              row_id: index + 1,
              first_name,
              last_name,
              email,
              normalized_email: email,
              phone,
              normalized_phone: phone,
              address: validated.address || null,
              city: validated.city || null,
              state: validated.state || null,
              zip: validated.zip || null,
            })
          } catch (error) {
            console.warn(`Skipping invalid row ${index + 1}:`, error)
          }
        })

        resolve(parsedLeads)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
```

**Step 2: Create CSV uploader component**

Create `components/csv-uploader.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { parseCSV } from '@/lib/csv-parser'

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')

  const supabase = createClient()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setStatus('')
    } else {
      alert('Please select a CSV file')
    }
  }

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setStatus('Parsing CSV...')

    try {
      // Create CSV upload record
      const { data: userData } = await supabase.auth.getUser()
      const { data: uploadData, error: uploadError } = await supabase
        .from('csv_uploads')
        .insert({
          user_id: userData.user?.id,
          filename: file.name,
          status: 'processing',
        })
        .select()
        .single()

      if (uploadError) throw uploadError
      setUploadId(uploadData.id)

      // Parse CSV
      setProgress(20)
      const parsedLeads = await parseCSV(file)
      setStatus(`Found ${parsedLeads.length} leads...`)

      // Insert leads in batches
      setProgress(40)
      const batchSize = 50
      for (let i = 0; i < parsedLeads.length; i += batchSize) {
        const batch = parsedLeads.slice(i, i + batchSize)

        const { error } = await supabase.from('leads').insert(
          batch.map((lead) => ({
            user_id: userData.user?.id,
            csv_upload_id: uploadData.id,
            source_type: 'csv_upload',
            source_filename: file.name,
            source_row_id: lead.row_id.toString(),
            disposition: 'new',
            tags: [],
            ...lead,
          }))
        )

        if (error) {
          console.error('Error inserting batch:', error)
          throw error
        }

        setProgress(40 + (i / parsedLeads.length) * 50)
      }

      // Update upload status
      setProgress(90)
      const { error: updateError } = await supabase
        .from('csv_uploads')
        .update({
          status: 'completed',
          row_count: parsedLeads.length,
        })
        .eq('id', uploadData.id)

      if (updateError) throw updateError

      setProgress(100)
      setStatus('Upload complete!')
      setTimeout(() => {
        window.location.href = '/dashboard/leads'
      }, 1500)
    } catch (error) {
      console.error('Upload error:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

      // Update upload status to failed
      if (uploadId) {
        await supabase
          .from('csv_uploads')
          .update({ status: 'failed', error_message: String(error) })
          .eq('id', uploadId)
      }
    }

    setUploading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:rounded-md file:border-0
              file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && <p className="text-sm mt-2">Selected: {file.name}</p>}
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center">{status}</p>
          </div>
        )}

        {!uploading && status && status !== 'Upload complete!' && (
          <p className="text-sm text-red-500">{status}</p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Create uploads page**

Create `app/(dashboard)/uploads/page.tsx`:

```typescript
import CSVUploader from '@/components/csv-uploader'

export default function UploadsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Upload CSV</h1>
      <CSVUploader />
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add lib/csv-parser.ts components/csv-uploader.tsx app/\(dashboard\)/uploads/page.tsx
git commit -m "feat: add CSV upload with parsing and normalization"
```

---

## Task 9: Create Twilio SMS API Route

**Files:**
- Create: `lib/twilio.ts`
- Create: `app/api/sms/route.ts`

**Step 1: Create Twilio client utility**

Create `lib/twilio.ts`:

```typescript
import { Twilio } from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials not configured')
}

export const twilioClient = new Twilio(accountSid, authToken)

export async function sendSMS(to: string, body: string) {
  try {
    const message = await twilioClient.messages.create({
      from: twilioPhoneNumber!,
      to: to,
      body,
    })

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    }
  } catch (error) {
    console.error('Twilio error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

**Step 2: Create SMS send API route**

Create `app/api/sms/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { leadId, content } = await request.json()

    if (!leadId || !content) {
      return NextResponse.json(
        { error: 'leadId and content are required' },
        { status: 400 }
      )
    }

    // Get user from session
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('phone, user_id')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (lead.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!lead.phone) {
      return NextResponse.json(
        { error: 'Lead has no phone number' },
        { status: 400 }
      )
    }

    // Send SMS via Twilio
    const result = await sendSMS(lead.phone, content)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Log SMS
    const { error: logError } = await supabase.from('sms_logs').insert({
      user_id: user.id,
      lead_id: leadId,
      twilio_message_id: result.messageId,
      direction: 'outbound',
      content,
    })

    if (logError) {
      console.error('Error logging SMS:', logError)
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Update .env.local**

Add your Twilio credentials to `.env.local`:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567
```

**Step 4: Update SMS thread to use API**

Modify `components/sms-thread.tsx` handleSendSMS function:

```typescript
  async function handleSendSMS() {
    if (!newMessage.trim()) return

    setSending(true)

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          content: newMessage,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNewMessage('')
        await loadMessages()
      } else {
        alert(data.error || 'Failed to send SMS')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      alert('Failed to send SMS')
    }

    setSending(false)
  }
```

**Step 5: Commit**

```bash
git add lib/twilio.ts app/api/sms/route.ts
git commit -m "feat: add Twilio SMS integration"
```

---

## Task 10: Create Twilio Webhook Route

**Files:**
- Create: `app/api/sms/webhook/route.ts`

**Step 1: Create webhook route**

Create `app/api/sms/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Twilio webhook endpoint for receiving SMS
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    if (!from || !body) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Find lead by phone number
    const normalizedPhone = from.replace(/\D/g, '')
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, user_id')
      .eq('normalized_phone', normalizedPhone)

    if (leadsError || !leads || leads.length === 0) {
      // Lead not found, but still respond to Twilio
      return new NextResponse(
        `<Response><Message>Received via InsureAssist</Message></Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    // Log the inbound SMS for each matching lead
    for (const lead of leads) {
      await supabase.from('sms_logs').insert({
        user_id: lead.user_id,
        lead_id: lead.id,
        twilio_message_id: messageSid,
        direction: 'inbound',
        content: body,
      })

      // TODO: Trigger Claude AI analysis here
      // Will be implemented in next task
    }

    return new NextResponse(
      `<Response><Message>Received via InsureAssist</Message></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
```

**Step 2: Note on Twilio configuration**

You'll need to configure the webhook URL in Twilio:
1. Go to Twilio Console → Phone Numbers → Your number
2. Under "Messaging", set Webhook URL to: `https://your-domain.com/api/sms/webhook`
3. Set webhook to "HTTP POST"

**Step 3: Commit**

```bash
git add app/api/sms/webhook/route.ts
git commit -m "feat: add Twilio webhook endpoint"
```

---

## Task 11: Create Claude AI Analysis Route

**Files:**
- Create: `lib/claude.ts`
- Create: `app/api/ai/analyze-sms/route.ts`

**Step 1: Create Claude API utility**

Create `lib/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SMSAnalysis {
  category: 'interested' | 'not_interested' | 'callback_requested' | 'unknown'
  confidence: number
  reasoning: string
}

export async function analyzeSMS(
  message: string,
  leadContext?: {
    firstName?: string
    lastName?: string
    disposition?: string
    tags?: string[]
  }
): Promise<SMSAnalysis> {
  try {
    const context = leadContext
      ? `\n\nLead Context:\n- Name: ${leadContext.firstName || ''} ${leadContext.lastName || ''}\n- Disposition: ${leadContext.disposition || 'new'}\n- Tags: ${leadContext.tags?.join(', ') || 'none'}`
      : ''

    const prompt = `Analyze this SMS response from an insurance lead:${context}

SMS Message: "${message}"

Categorize the response as one of:
- "interested": Lead shows interest, asks questions, wants more info
- "not_interested": Lead is not interested, asks to be removed, declines
- "callback_requested": Lead wants a phone call
- "unknown": Can't determine

Provide your response as JSON:
{
  "category": "one_of_the_categories_above",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Try to parse JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          category: parsed.category,
          confidence: parsed.confidence || 70,
          reasoning: parsed.reasoning || '',
        }
      }
    }

    // Fallback to default if parsing fails
    return {
      category: 'unknown',
      confidence: 50,
      reasoning: 'Could not parse AI response',
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return {
      category: 'unknown',
      confidence: 0,
      reasoning: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

**Step 2: Create AI analysis API route**

Create `app/api/ai/analyze-sms/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { analyzeSMS } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const { message, leadContext } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    const analysis = await analyzeSMS(message, leadContext)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Update webhook to call Claude**

Modify `app/api/sms/webhook/route.ts` to add AI analysis:

```typescript
import { analyzeSMS } from '@/lib/claude'

// In the webhook POST function, after logging the SMS:

// Get lead details for context
const { data: leadDetails } = await supabase
  .from('leads')
  .select('first_name, last_name, disposition, tags')
  .eq('id', lead.id)
  .single()

// Analyze with Claude
const analysis = await analyzeSMS(body, {
  firstName: leadDetails?.first_name || undefined,
  lastName: leadDetails?.last_name || undefined,
  disposition: leadDetails?.disposition,
  tags: leadDetails?.tags,
})

// Update SMS log with AI analysis
await supabase
  .from('sms_logs')
  .update({
    ai_category: analysis.category,
    ai_confidence: analysis.confidence,
    ai_analysis: analysis.reasoning,
  })
  .eq('twilio_message_id', messageSid)

// Auto-update lead disposition based on analysis
if (analysis.category === 'interested') {
  await supabase
    .from('leads')
    .update({ disposition: 'hot' })
    .eq('id', lead.id)
} else if (analysis.category === 'not_interested') {
  await supabase
    .from('leads')
    .update({ disposition: 'do_not_contact' })
    .eq('id', lead.id)
}
```

**Step 4: Update .env.local**

Add Anthropic API key to `.env.local`:
```env
ANTHROPIC_API_KEY=your-api-key-here
```

**Step 5: Commit**

```bash
git add lib/claude.ts app/api/ai/analyze-sms/route.ts
git commit -m "feat: add Claude AI SMS analysis"
```

---

## Task 12: Add Missing UI Components

**Files:**
- Create: `components/ui/progress.tsx` (Shadcn)
- Create: `components/ui/badge.tsx` (Shadcn)
- Create: `components/ui/label.tsx` (Shadcn)
- Create: `components/ui/table.tsx` (Shadcn)

**Step 1: Add missing components using Shadcn CLI**

```bash
pnpm dlx shadcn@latest add progress badge label table
```

**Step 2: Commit**

```bash
git add components/ui/
git commit -m "feat: add missing Shadcn UI components"
```

---

## Task 13: Basic Lead Qualification Rules

**Files:**
- Create: `lib/qualification-rules.ts`
- Modify: `components/csv-uploader.tsx`

**Step 1: Create qualification rules utility**

Create `lib/qualification-rules.ts`:

```typescript
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
```

**Step 2: Apply qualification during CSV upload**

Modify `components/csv-uploader.tsx` to apply rules:

Import at top:
```typescript
import { applyBasicQualificationRules } from '@/lib/qualification-rules'
```

Update the batch insert part:
```typescript
const { error } = await supabase.from('leads').insert(
  batch.map((lead) => {
    const qualification = applyBasicQualificationRules(
      lead.email,
      lead.phone,
      lead.first_name,
      lead.last_name
    )

    return {
      user_id: userData.user?.id,
      csv_upload_id: uploadData.id,
      source_type: 'csv_upload',
      source_filename: file.name,
      source_row_id: lead.row_id.toString(),
      disposition: qualification.disposition,
      tags: qualification.tags,
      ai_score: qualification.aiScore,
      ai_qualification_reason: qualification.aiQualificationReason,
      ...lead,
    }
  })
)
```

**Step 3: Commit**

```bash
git add lib/qualification-rules.ts components/csv-uploader.tsx
git commit -m "feat: add basic lead qualification rules"
```

---

## Task 14: Final Testing & Cleanup

**Files:**
- None (testing)

**Step 1: Run development server**

```bash
pnpm dev
```

**Step 2: Test the flow**

1. Go to http://localhost:3000/signup
2. Create an account
3. Upload a test CSV with leads
4. View leads list - verify they appear with correct disposition
5. Click a lead - verify details display correctly
6. Send an SMS from lead detail
7. Verify SMS appears in conversation (Twilio may need ngrok for local testing)
8. Check AI analysis applied (for inbound SMS)

**Step 3: Check for any console errors**

Open browser DevTools and check for errors.

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final cleanup and testing"
```

---

## Deployment

Once testing is complete:

**Step 1: Create production build**

```bash
pnpm build
```

**Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

**Step 3: Configure environment variables in Vercel**

Add all environment variables from `.env.local` to Vercel project settings:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- ANTHROPIC_API_KEY

**Step 4: Configure Twilio webhook**

Update Twilio webhook URL to point to your Vercel domain:
`https://your-app.vercel.app/api/sms/webhook`

---

## Summary

This implementation plan builds a complete Phase 1 MVP of InsureAssist:

✅ Multi-tenant CRM with Supabase RLS
✅ CSV upload with parsing and normalization
✅ Lead management with tags, dispositions, WHALE support
✅ SMS qualification via Twilio
✅ Claude AI analysis of SMS responses
✅ Basic lead qualification rules
✅ Dashboard with stats

**Next Steps (Phase 2):**
- Multi-step follow-up sequences
- Calendar integration
- Enhanced AI learning from user habits
- Lead scoring improvement
- Duplicate detection and merging
