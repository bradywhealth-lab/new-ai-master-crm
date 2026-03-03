# InsureAssist Phase 4 - Automation & Automation Features
**Project:** InsureAssist - CRM + AI Assistant for Insurance Agents
**Date:** 2026-03-03
**Phase:** 4 - Automation Features
**Status:** In Progress

---

## Overview

Phase 4 implements automation and scaling features to reduce manual work and enable lead acquisition at scale. This includes web scraping, social media integration, and content scheduling.

---

## Features

### 1. Web Scraping Module
**Goal:** Automatically capture leads from websites and directories

**Components:**
- Scraping configuration interface (target URL, selectors)
- Puppeteer/Playwright scraping engine
- Lead extraction and normalization
- Integration with existing leads pipeline

**Implementation:**
- Create `app/api/scrape/route.ts` - Trigger scraping job
- Create `lib/scraper.ts` - Scraping engine
- Create `components/scrape-config.tsx` - UI for scrape targets
- Store scrape metadata in leads table (source_type: 'scraped')

**Schema Updates:**
```sql
-- Add scrape tracking to leads table (if not exists)
ALTER TABLE leads ADD COLUMN scrape_url TEXT;
ALTER TABLE leads ADD COLUMN scraped_at TIMESTAMPTZ;
```

---

### 2. Social Media Integration
**Goal:** Automate social media posting for brand awareness

**Components:**
- Social platform connections (LinkedIn, X/Twitter)
- Content template library
- Post scheduling and queue
- Post history and engagement tracking

**Implementation:**
- Create `app/api/social/[platform]/posts/route.ts` - Create/get posts
- Create `app/api/social/[platform]/connect/route.ts` - Platform auth
- Create `types/social.ts` - Social media types
- Create `components/social-media-manager.tsx` - Social UI

**Schema Updates:**
```sql
-- Social posts table
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'linkedin', 'twitter', 'instagram'
  content TEXT NOT NULL,
  media_urls TEXT[], -- URLs to attached media
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'posted', 'failed'
  engagement_stats JSONB, -- likes, comments, shares
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social connections table
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL UNIQUE,
  access_token_encrypted TEXT,
  account_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. Content Scheduling Queue
**Goal:** Schedule content for posts, follow-ups, and campaigns

**Components:**
- Calendar-based scheduler
- Content queue management
- Template-based content generation
- Posting automation

**Implementation:**
- Create `app/api/content/queue/route.ts` - Manage content queue
- Create `app/api/content/schedule/route.ts` - Schedule content
- Create `components/content-calendar.tsx` - Calendar UI

**Schema Updates:**
```sql
-- Content queue table
CREATE TABLE content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'social_post', 'follow_up', 'campaign'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'sent', 'failed'
  platform TEXT, -- For social posts
  lead_ids UUID[], -- For follow-ups
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4. Hashtag & Trend Research
**Goal:** AI-powered hashtag and trend suggestions

**Components:**
- Trend analysis API integration
- Hashtag performance tracking
- AI suggestion engine

**Implementation:**
- Create `app/api/ai/trends/route.ts` - Get trending hashtags
- Create `components/trend-research.tsx` - Trend UI
- Track hashtag performance in leads table

---

### 5. Cross-Platform Posting
**Goal:** Same content posted to multiple platforms

**Components:**
- Multi-platform selector
- Content adaptation per platform
- Unified posting history

**Implementation:**
- Extend `app/api/social/[platform]/posts/route.ts` for cross-platform
- Add platform-specific content templates

---

## Implementation Plan

### Batch 1: Scraping Module (Tasks 1-3)
1. Create scraping types and library
2. Build scraping engine with Puppeteer
3. Create scrape configuration UI

### Batch 2: Social Media Integration (Tasks 4-6)
4. Create social media database tables
5. Build social connection and post APIs
6. Create social media manager UI

### Batch 3: Content Scheduling (Tasks 7-9)
7. Create content queue system
8. Build calendar-based scheduler
9. Create content calendar UI

### Batch 4: Analytics & Reporting (Tasks 10-12)
10. Create trend research API
11. Build engagement tracking
12. Create reports dashboard

---

## API Routes

### Scraping
- `POST /api/scrape` - Trigger scraping job
- `GET /api/scrape/targets` - List scrape targets
- `POST /api/scrape/targets` - Create scrape target

### Social Media
- `GET /api/social/connections` - List connected platforms
- `POST /api/social/[platform]/connect` - Connect platform
- `DELETE /api/social/connections/[id]` - Disconnect platform
- `GET /api/social/posts` - List scheduled/past posts
- `POST /api/social/posts` - Create scheduled post
- `POST /api/social/posts/[id]/publish` - Publish post now

### Content Queue
- `GET /api/content/queue` - List queued content
- `POST /api/content/queue` - Add to queue
- `PATCH /api/content/queue/[id]` - Update queue item
- `DELETE /api/content/queue/[id]` - Remove from queue

### AI Trends
- `GET /api/ai/trends` - Get trending hashtags
- `POST /api/ai/hashtags/analyze` - Analyze hashtag performance

---

## Components

### Scraping
- `scrape-config.tsx` - Configure and manage scrape targets
- `scrape-results.tsx` - View scraped leads

### Social Media
- `social-media-manager.tsx` - Social platform management
- `post-creator.tsx` - Create and schedule posts
- `post-calendar.tsx` - Calendar view of scheduled posts

### Content
- `content-calendar.tsx` - Calendar for content queue
- `content-template-editor.tsx` - Edit content templates

### Analytics
- `trend-research.tsx` - Hashtag and trend suggestions
- `engagement-dashboard.tsx` - Social media performance

---

## Navigation Updates

Add to dashboard navigation:
- "Scraping" - Scrape targets and results
- "Social" - Social media manager and posts
- "Content" - Content calendar and queue
- "Trends" - Hashtag and trend research

---

## Security Considerations

- Encrypt social platform access tokens
- RLS policies for social tables
- Rate limiting for API calls
- Scraper proxy to avoid IP blocks

---

## Next Steps

1. Review and approve this plan
2. Set up Puppeteer dependencies
3. Configure social media developer accounts
4. Test scraping with target websites
5. Test social platform connections

---

## Dependencies

### New Dependencies
```json
{
  "puppeteer": "^22.0.0",
  "@playwright/test": "^1.42.0",
  "playwright": "^1.42.0"
}
```

---

## Status

- ✅ Plan created
- ⏳ Database schema to be created
- ⏳ API routes to be built
- ⏳ Components to be implemented
- ⏳ Navigation to be updated
- ⏳ Testing to be performed
