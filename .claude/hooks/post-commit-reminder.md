---
name: Post-Commit Push Reminder
trigger: PostToolUse
condition: tool_name == "Bash" && (tool.command starts_with "git push")
---

Code has been pushed. Here's what to verify:

## Post-Push Checklist

### ✅ Deployment
- [ ] If pushed to `main`, Vercel will auto-deploy
- [ ] Monitor deployment status: `vercel logs`
- [ ] Check production URL after a few minutes
- [ ] Test critical features in production

### ✅ Database
- [ ] If migrations were committed, run them in Supabase
- [ ] Update TypeScript types: `npm run supabase:generate`
- [ ] Verify RLS policies are working

### ✅ Testing
- [ ] Run tests if affected code
- [ ] Check for regressions
- [ ] Verify new features work end-to-end

### ✅ Documentation
- [ ] Update CLAUDE.md if needed
- [ ] Update any design docs
- [ ] Document breaking changes

## Deployment Information

**Production URL:** https://insureassist-cq3znjsb2-bradywhealth-8854s-projects.vercel.app

**Environment Variables:** All 15 variables configured in Vercel

**To Check Deployment:**
```bash
vercel logs
```

## If Issues Occur

1. Check Vercel logs for errors
2. Rollback if critical: `vercel rollback`
3. Fix the issue
4. Commit and push again
