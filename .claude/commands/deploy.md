---
name: deploy
description: Deploy current changes to Vercel production
parameters:
  name: confirm
  type: boolean
  description: Confirm deployment
  optional: true
---

Deploy the InsureAssist CRM to Vercel production environment.

**This will:**
1. Check if changes are committed
2. Push to `origin/main` branch
3. Trigger Vercel auto-deployment
4. Provide deployment URL

**Usage:** `/deploy`

**Requirements:**
- All changes must be committed first
- Vercel CLI must be configured
- Must be on `main` branch

**Production URL:** https://insureassist-cq3znjsb2-bradywhealth-8854s-projects.vercel.app

**After deployment:**
- Test the live site
- Check Vercel logs if issues occur
- Verify all environment variables are set
