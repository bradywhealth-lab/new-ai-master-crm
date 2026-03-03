// ========================================
// Phase 4: Scraping - Type Definitions
// ========================================

// Scrape Targets
export interface ScrapeTarget {
  id: string
  user_id: string
  name: string
  url: string
  selector_type: 'css' | 'xpath' | 'custom'
  selectors: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }
  status: 'active' | 'paused' | 'archived'
  last_scraped_at: string | null
  leads_found: number
  created_at: string
  updated_at: string
}

export interface ScrapeTargetCreate {
  name: string
  url: string
  selector_type: 'css' | 'xpath' | 'custom'
  selectors: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }
}

// Scrape Job
export interface ScrapeJob {
  id: string
  user_id: string
  target_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string | null
  completed_at: string | null
  leads_scraped: number
  error_message: string | null
  created_at: string
}

export interface ScrapeJobCreate {
  target_id: string
}

// Scrape Result
export interface ScrapeResult {
  target_id: string
  leads: Array<{
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
  }>
  url: string
  scraped_at: string
  metadata: {
    total_found: number
    duplicates_filtered: number
  }
}

// Scraper Configuration
export interface ScraperConfig {
  headless: boolean
  timeout: number
  max_pages: number
  delay_between_requests: number
}
