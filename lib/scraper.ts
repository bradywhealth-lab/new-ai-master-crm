import puppeteer, { Page, Browser } from 'puppeteer'
import type { ScraperConfig } from '@/types/scraping'

// Simple CSS/XPath selector extractor
// Phone is now MANDATORY for scraped leads
export async function scrapeLeads(
  url: string,
  selectors: {
    first_name?: string
    last_name?: string
    email?: string
    phone: string,
    address?: string
    city?: string
    state?: string
    zip?: string
  },
  config: ScraperConfig = {
    headless: true,
    timeout: 30000,
    max_pages: 10,
    delay_between_requests: 1000
  }
) {
  let browser: Browser | null = null
  const leads: Array<{
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
  }> = []

  try {
    browser = await puppeteer.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: config.timeout })
    await page.setViewport({ width: 1920, height: 1080 })

    // Extract data using selectors
    const extractedData = await page.evaluate((selectors) => {
      const result: any = {}

      // Helper to extract text from selector
      const getText = (selector: string) => {
        const el = document.querySelector(selector)
        return el ? el.textContent?.trim() : null
      }

      // Helper to extract all text from selector (for multiple items)
      const getTextAll = (selector: string) => {
        const els = document.querySelectorAll(selector)
        return Array.from(els).map(el => el.textContent?.trim() || null).filter(Boolean)
      }

      // Extract each field
      if (selectors.first_name) result.first_name = getText(selectors.first_name)
      if (selectors.last_name) result.last_name = getText(selectors.last_name)
      if (selectors.email) result.email = getText(selectors.email)
      if (selectors.phone) result.phone = getText(selectors.phone)
      if (selectors.address) result.address = getText(selectors.address)
      if (selectors.city) result.city = getText(selectors.city)
      if (selectors.state) result.state = getText(selectors.state)
      if (selectors.zip) result.zip = getText(selectors.zip)

      return result
    }, selectors)

    // If selectors return multiple items (e.g., a list of contacts)
    const itemCount = Math.max(
      extractedData.first_name ? 1 : 0,
      extractedData.last_name ? 1 : 0,
      extractedData.email ? 1 : 0
    )

    // Determine if we're scraping a list or single item
    if (itemCount > 1) {
      // Assume multi-item scrape - need to find patterns
      const listLength = Math.max(
        ...(Object.values(extractedData).map(v => Array.isArray(v) ? v.length : 1))
      )

      for (let i = 0; i < listLength; i++) {
        const lead: any = {
          first_name: null,
          last_name: null,
          email: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          zip: null
        }

        if (extractedData.first_name && typeof extractedData.first_name === 'string') {
          lead.first_name = extractedData.first_name
        }
        if (extractedData.last_name && typeof extractedData.last_name === 'string') {
          lead.last_name = extractedData.last_name
        }
        if (extractedData.email && typeof extractedData.email === 'string') {
          lead.email = extractedData.email
        }
        if (extractedData.phone && typeof extractedData.phone === 'string') {
          lead.phone = extractedData.phone
        }
        if (extractedData.address && typeof extractedData.address === 'string') {
          lead.address = extractedData.address
        }
        if (extractedData.city && typeof extractedData.city === 'string') {
          lead.city = extractedData.city
        }
        if (extractedData.state && typeof extractedData.state === 'string') {
          lead.state = extractedData.state
        }
        if (extractedData.zip && typeof extractedData.zip === 'string') {
          lead.zip = extractedData.zip
        }

        if (lead.first_name || lead.last_name || lead.email || lead.phone) {
          leads.push(lead)
        }
      }
    } else {
      // Single item scrape
      const lead: any = {
        first_name: extractedData.first_name,
        last_name: extractedData.last_name,
        email: extractedData.email,
        phone: extractedData.phone,
        address: extractedData.address,
        city: extractedData.city,
        state: extractedData.state,
        zip: extractedData.zip
      }

      if (lead.first_name || lead.last_name || lead.email || lead.phone) {
        leads.push(lead)
      }
    }

    await page.close()

  } catch (error) {
    console.error('Scraping error:', error)
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  return {
    url,
    scraped_at: new Date().toISOString(),
    total_found: leads.length,
    leads
  }
}

// Validate URL before scraping
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Extract contact info from text (fallback)
export function extractFromText(text: string) {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,3}/gi
  const phoneRegex = /(\+?\d{1,3}[-.\s]?\d{3,15}|\d{3}[-.\s]?\d{4})/g
  const zipRegex = /\b\d{5}(-\d{4})?\b/g

  const emails = text.match(emailRegex) || []
  const phones = text.match(phoneRegex) || []
  const zips = text.match(zipRegex) || []

  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    zips: [...new Set(zips)]
  }
}
