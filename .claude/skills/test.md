---
name: test
description: Run tests for the CRM application
triggers:
  - "run.*test"
  - "test.*app"
  - "check.*test"
  - "run.*spec"
---

# Test Runner

Run and analyze tests for the InsureAssist CRM application.

## Available Test Commands

### Run All Tests
- `npm test` - Run all tests
- `npm run test -- --watch` - Run in watch mode

### Run Specific Tests
- `npm run test -- --listTests` - List available tests
- `npm run test -- patterns` - Run matching tests

### Coverage
- `npm run test:coverage` - Generate coverage report
- `npm run test:coverage:open` - Open coverage in browser

## Testing Areas

### API Routes
- Authentication and authorization
- CRUD operations
- Bulk actions (SMS, email)
- Scraper execution
- File uploads

### Components
- Lead list and filtering
- Form validation
- Activity timeline
- Dashboard navigation

### Database
- RLS policy enforcement
- Data integrity
- Migration correctness

### Integration
- Twilio SMS sending
- Email sending via SMTP
- Supabase queries
- Puppeteer scraping

## Common Issues

### Test Failing?
1. Check environment variables are set
2. Verify Supabase connection
3. Check Twilio credentials
4. Verify database tables exist

### Coverage Low?
1. Add tests for uncovered paths
2. Test edge cases
3. Test error scenarios
4. Test user permissions
