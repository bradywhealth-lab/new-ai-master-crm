import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './supabase/types'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // During build time, environment variables aren't available
  // Return a mock client that won't be used at build time
  const clientUrl = url || 'https://placeholder.com'
  const clientKey = key || 'placeholder-key'

  return createServerClient<Database>(clientUrl, clientKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value)
      },
      remove(name: string, options: any) {
        cookieStore.delete(name)
      },
    },
  })
}

export { createClient as createServerSupabaseClient }
