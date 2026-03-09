---
name: Pre-Commit Code Quality Check
trigger: PreToolUse
condition: tool_name == "Bash" && (tool.command starts_with "git commit" || tool.command starts_with "git add")
---

You are about to commit code. Before proceeding, verify these quality checks:

## Code Quality Checklist

### ✅ TypeScript
- [ ] No TypeScript errors in the files being committed
- [ ] Proper types used (no `any` unless absolutely necessary)
- [ ] All imports resolved correctly
- [ ] Supabase types are up to date (run `npm run supabase:generate` if needed)

### ✅ Code Style
- [ ] No smart quotes (`"` or `"`) in app/, components/, or lib/
- [ ] Consistent formatting
- [ ] No console.log statements left in production code
- [ ] No commented-out code blocks

### ✅ Best Practices
- [ ] Error handling in place where needed
- [ ] No security vulnerabilities (SQL injection, XSS, etc.)
- [ ] Supabase RLS policies respected
- [ ] User ownership verified before data operations

### ✅ Project-Specific
- [ ] API routes have `.ts` extension
- [ ] Using `activity_log` table (not `activities`)
- [ ] Supabase client used correctly (server vs browser)
- [ ] `await cookies()` before Supabase operations in API routes

## Before You Proceed

If any check fails:
1. Fix the issue
2. Run build to verify: `npm run build`
3. Then commit again

## Commit Message Format

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build/chore changes

Example: `feat: add lead source tracking`
