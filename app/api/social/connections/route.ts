import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SocialConnection, SocialConnectionCreate } from '@/types/social'
import crypto from 'crypto'

// Simple encryption for tokens - use proper encryption library in production
// For production, use Supabase Vault or a dedicated encryption library
function encryptToken(token: string): string {
  const algorithm = 'aes-256-gcm'
  // In production, use a dedicated encryption key from environment variables
  const key = Buffer.from(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 32) || 'default-key-32-characters-long!', 'utf8')
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decryptToken(encryptedValue: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 32) || 'default-key-32-characters-long!', 'utf8')

  const [ivHex, authTagHex, encryptedHex] = encryptedValue.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all social connections for this user
  const { data: connections, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', user.id)
    .order('connected_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: connections as SocialConnection[] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SocialConnectionCreate = await request.json()

  // Check if connection for this platform already exists
  const { data: existing } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', body.platform)
    .single()

  if (existing) {
    return Response.json({ error: 'Platform already connected' }, { status: 400 })
  }

  // Create social connection with proper encryption (not just base64)
  const encryptedToken = encryptToken(body.access_token)

  const { data: connection, error } = await supabase
    .from('social_connections')
    .insert({
      user_id: user.id,
      platform: body.platform,
      access_token_encrypted: encryptedToken,
      account_name: body.account_name
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: connection as SocialConnection })
}
