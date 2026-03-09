---
name: test
description: Run tests or check specific functionality
parameters:
  name: type
  type: string
  description: Type of test to run (all, api, unit, integration)
  optional: true
  default: all
---

Run tests for the InsureAssist CRM application.

**Usage:** `/test`

**Options:**
- `all` - Run all tests (default)
- `api` - Test API endpoints
- `unit` - Run unit tests
- `integration` - Run integration tests

**Examples:**
- `/test` - Run all tests
- `/test api` - Test API routes
- `/test unit` - Run unit tests

**What this does:**
1. Runs `npm test` or specific test command
2. Shows test results
3. Reports any failures
4. Provides coverage report if available
