---
name: db
description: Execute Supabase database queries
parameters:
  name: query
  type: string
  description: SQL query or description of data to retrieve
  optional: true
---

Execute Supabase database queries to inspect data or debug issues.

**Usage:** `/db "Show leads without phone numbers"`

**Common queries:**
- Leads count by disposition
- Recent activities
- Leads without email
- Leads without phone
- SMS logs from today
- Email send status
- Appointments this week

**Examples:**
- `/db "count leads by disposition"`
- `/db "show recent activities"`
- `/db "find leads missing phone"`
- `/db "check SMS logs"`

**Safety:**
- All queries are read-only
- No data modification
- RLS policies respected
- Only user's own data when possible
