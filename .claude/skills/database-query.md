---
name: database
description: Execute Supabase database queries for debugging and data inspection
triggers:
  - "run.*query"
  - "check.*database"
  - "supabase.*query"
  - "database.*check"
  - "inspect.*data"
---

# Database Query Helper

Execute safe, read-only Supabase queries to inspect database state, debug issues, or verify data integrity.

## Usage Examples

- "Check if any leads are missing phone numbers"
- "Show me recent SMS logs"
- "Count leads by disposition"
- "Find leads without email addresses"
- "Check database table schemas"

## Available Query Types

### Table Inspection
- List all tables
- Check table structure
- Count rows in tables

### Data Queries
- Filter records by conditions
- Sort and limit results
- Join related tables

### Common Tables
- `leads` - Lead records
- `profiles` - User profiles
- `sms_logs` - SMS history
- `email_logs` - Email history
- `activity_log` - Activity timeline
- `appointments` - Calendar events
- `follow_ups` - Follow-up schedules
- `notes` - Lead notes
- `sequences` - Multi-step campaigns
- `email_templates` - Email templates
- `sms_templates` - SMS templates

## Notes
- All queries are read-only for safety
- Use table name `activity_log` (not `activities`)
- Respect RLS policies - only query user's own data when possible
