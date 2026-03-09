---
name: api-test
description: Test API endpoints and verify responses
triggers:
  - "test.*api"
  - "check.*endpoint"
  - "test.*route"
  - "api.*check"
---

# API Testing

Test and verify API endpoints for the InsureAssist CRM application.

## Available Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/user` - Get current user

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get single lead
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead
- `POST /api/leads/bulk-sms` - Bulk SMS send
- `POST /api/leads/bulk-email` - Bulk email send

### Activities
- `GET /api/activities` - List activities
- `POST /api/activities` - Log activity

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Delete appointment

### SMS
- `GET /api/sms/logs` - List SMS logs
- `POST /api/sms/templates` - Create SMS template
- `POST /api/sms/send-test` - Send test SMS

### Email
- `GET /api/email/logs` - List email logs
- `POST /api/email/templates` - Create email template
- `POST /api/email/send-test` - Send test email

### Analytics
- `GET /api/analytics` - Get analytics data

### Scraper
- `POST /api/scrape-targets` - Create scrape target
- `GET /api/scrape-targets` - List scrape targets
- `POST /api/scrape` - Execute scrape

## Testing Commands

### Test Endpoint
```bash
curl -s http://localhost:3000/api/endpoint
curl -w "\nHTTP Status: %{http_code}\n" http://localhost:3000/api/endpoint
```

### Test with Authentication
```bash
# Get session cookie first, then use it
curl -s -c cookies.txt http://localhost:3000/api/endpoint
```

### POST Request
```bash
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### Test Bulk Actions
```bash
curl -X POST http://localhost:3000/api/leads/bulk-sms \
  -H "Content-Type: application/json" \
  -d '{"leadIds": ["1", "2", "3"], "message": "Test message"}'
```

## Response Codes

- `200` - Success
- `201` - Created
- `204` - No Content (success)
- `400` - Bad Request
- `401` - Unauthorized (not signed in)
- `403` - Forbidden (wrong user/permission)
- `404` - Not Found
- `500` - Internal Server Error

## Common Issues

### 401 Unauthorized
- Not signed in
- Session expired
- Cookie not sent

### 403 Forbidden
- Trying to access another user's data
- Missing permission check

### 500 Internal Error
- Database connection issue
- Missing environment variable
- Code error

## Testing Checklist

### Authentication Flow
- [ ] Sign in returns user data
- [ ] Get user returns current user
- [ ] Sign out clears session
- [ ] Protected routes return 401 without auth

### CRUD Operations
- [ ] Create works and returns data
- [ ] Read returns expected records
- [ ] Update modifies data correctly
- [ ] Delete removes record

### Bulk Operations
- [ ] Bulk SMS sends to all leads
- [ ] Bulk email sends to all leads
- [ ] Activities logged for each action
- [ ] Error handling for invalid IDs

### File Operations
- [ ] CSV upload parses correctly
- [ ] Invalid data rejected
- [ ] Progress updates provided
