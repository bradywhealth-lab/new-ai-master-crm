---
name: debug-error
description: Investigate and debug errors in the CRM application
triggers:
  - "debug.*error"
  - "fix.*error"
  - "investigate.*error"
  - "error.*debug"
  - "something.*wrong"
  - "not.*working"
  - ".*broken"
---

# Error Debugging

Systematically investigate and debug errors in the InsureAssist CRM application.

## Investigation Steps

1. **Identify the error**
   - What were you doing when it happened?
   - What error message appeared?
   - Was it a build error, runtime error, or deployment error?

2. **Check logs**
   - Browser console for client errors
   - Server terminal for server errors
   - Vercel logs for production errors
   - Supabase logs for database errors

3. **Check environment**
   - Are all environment variables set?
   - Is Supabase connection working?
   - Are API keys valid?
   - Is dev server running?

4. **Check code**
   - Syntax errors
   - Missing imports
   - Type errors
   - Logic errors

## Common Error Types

### Build Errors

#### Module Not Found
```
Module not found: 'package-name'
```
**Solution:** Install missing package
```bash
npm install package-name
```

#### TypeScript Error
```
Type 'X' is not assignable to type 'Y'
```
**Solution:** Check types and fix type mismatches
- Add proper type definitions
- Update interfaces
- Check Supabase types

#### Import Error
```
Cannot find module '@/path/to/file'
```
**Solution:** Check file path and extension
- Verify file exists
- Check tsconfig.json paths

### Runtime Errors

#### 404 Not Found
```
GET /api/endpoint 404
```
**Solution:**
- Check file extension (.ts for API routes)
- Verify file location in `app/api/`
- Check route path matches URL

#### 401 Unauthorized
```
Unauthorized
```
**Solution:**
- Check if user is signed in
- Verify cookie is sent
- Check auth.getUser() in API route

#### 403 Forbidden
```
Forbidden
```
**Solution:**
- Check user ownership verification
- Verify RLS policies
- Check if correct user ID is used

#### 500 Internal Server Error
```
Internal Server Error
```
**Solution:**
- Check server terminal for error
- Check database connection
- Check environment variables
- Check Supabase service role key

### Database Errors

#### Connection Error
```
Failed to connect to Supabase
```
**Solution:**
- Check NEXT_PUBLIC_SUPABASE_URL
- Check SUPABASE_SERVICE_ROLE_KEY
- Verify project is not paused
- Check network connection

#### RLS Policy Error
```
new row violates row-level security policy
```
**Solution:**
- Check RLS policies in Supabase
- Verify auth.uid() = user_id
- Check user is authenticated

#### Table Not Found
```
relation "table_name" does not exist
```
**Solution:**
- Check table name spelling
- Verify migration ran
- Use `activity_log` not `activities`

### Integration Errors

#### Twilio Error
```
Authentication Error - invalid credentials
```
**Solution:**
- Check TWILIO_ACCOUNT_SID
- Check TWILIO_AUTH_TOKEN
- Verify credentials are valid

#### Email Error
```
Invalid login
```
**Solution:**
- Check SMTP credentials
- Verify app password is correct
- Check SMTP settings (host, port)

#### AI Analysis Error
```
Anthropic API error
```
**Solution:**
- Check ANTHROPIC_API_KEY
- Verify API key is valid
- Check rate limits

## Debugging Commands

### Check Logs
```bash
# Server logs
npm run dev

# Vercel logs (production)
vercel logs

# Supabase logs
# Check Supabase dashboard
```

### Check Build
```bash
npm run build
```

### Check Types
```bash
npx tsc --noEmit
```

### Check Lint
```bash
npm run lint
```

## Debugging Checklist

### Before Starting
- [ ] Dev server is running on correct port
- [ ] All environment variables are set
- [ ] Database connection is working
- [ ] No build errors
- [ ] No TypeScript errors

### When Error Occurs
- [ ] Note exact error message
- [ ] Note what you were doing
- [ ] Note time it happened
- [ ] Check browser console
- [ ] Check server terminal

### After Fix
- [ ] Test the fix
- [ ] Verify no other issues
- [ ] Test related functionality
- [ ] Commit the fix

## Project-Specific Notes

### Known Issues
- `activities` table is named `activity_log` in database
- API routes must use `.ts` extension
- Supabase client requires `await cookies()` in API routes
- Dev server runs on port 3000 (or 3001 if 3000 taken)

### Common Mistakes
- Using `activities` instead of `activity_log`
- Missing `.ts` extension on API route files
- Forgetting `await` before `cookies()`
- Using wrong Supabase client (server vs browser)
- Not checking user ownership before operations
