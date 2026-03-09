---
name: log
description: Check application logs for debugging
parameters:
  name: source
  type: string
  description: Log source (server, vercel, supabase, browser)
  optional: true
---

Check application logs for debugging and error investigation.

**Usage:** `/log server`

**Options:**
- `server` - Local dev server logs
- `vercel` - Vercel production logs
- `supabase` - Supabase logs
- `browser` - Browser console errors

**Examples:**
- `/log` - Show dev server logs
- `/log vercel` - Show production logs
- `/log supabase` - Check database logs
- `/log browser` - Check console errors

**What this shows:**
- Recent error messages
- Warning messages
- Status information
- Request/response logs
- Database query errors
