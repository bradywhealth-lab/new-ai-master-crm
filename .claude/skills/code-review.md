---
name: code-review
description: Review pull requests or committed code for quality, bugs, and best practices
triggers:
  - "review.*code"
  - "review.*pr"
  - "check.*pull.*request"
  - "code.*quality"
  - "review.*changes"
---

# Code Review

Perform comprehensive code reviews for pull requests or recent commits. Focus on bug fixes, security vulnerabilities, and adherence to project conventions.

## Review Checklist

### Code Quality
- [ ] No smart quotes (`"` or `"`) in app/, components/, lib/
- [ ] TypeScript types properly used (no `any` unless necessary)
- [ ] Error handling in place where needed
- [ ] No console.log statements left in production code

### Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities in user input
- [ ] Supabase RLS policies respected
- [ ] API keys and secrets not exposed

### Performance
- [ ] Efficient database queries (proper indexes)
- [ ] No unnecessary re-renders
- [ ] Proper use of React hooks (no dependency arrays missing)

### Testing
- [ ] New features have tests
- [ ] Edge cases handled
- [ ] Error paths tested

### Documentation
- [ ] Complex logic has comments
- [ ] API endpoints documented
- [ ] New components have usage examples

## Project-Specific Rules

### Supabase
- Use `createClient()` with await and `cookies()` in API routes
- Verify user ownership before operations
- Use `activity_log` table (not `activities`)

### Next.js
- File extensions must be `.ts` for API routes
- Use App Router directory structure
- Server components for data fetching, client for interaction

### Scraper
- Phone numbers are mandatory for all scraped leads
- Only leads with phone are added to results
- Headless mode enabled by default
