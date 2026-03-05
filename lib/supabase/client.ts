import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, environment variables aren't available
  // Return a mock client that won't be used at build time
  if (!url || !key) {
    return createBrowserClient<Database>('https://placeholder.com', 'placeholder-key')
  }

  return createBrowserClient<Database>(url, key)
}
