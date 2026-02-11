/**
 * OAuth State Management
 *
 * PHASE-SM-01: Generates and validates CSRF state tokens
 * stored in the social_oauth_states table.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Generate a PKCE code verifier (43-128 chars, URL-safe)
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Derive the SHA-256 code challenge from a verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Create and persist an OAuth state token.
 * Returns the state string and optional PKCE verifier.
 */
export async function createOAuthState(params: {
  platform: string
  siteId: string
  tenantId: string
  userId: string
  usePKCE?: boolean
}): Promise<{ state: string; codeVerifier?: string }> {
  const supabase = await createClient()
  const state = crypto.randomBytes(24).toString('hex')
  const codeVerifier = params.usePKCE ? generateCodeVerifier() : undefined

  await (supabase as any).from('social_oauth_states').insert({
    state,
    platform: params.platform,
    site_id: params.siteId,
    tenant_id: params.tenantId,
    user_id: params.userId,
    code_verifier: codeVerifier ?? null,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
  })

  return { state, codeVerifier }
}

/**
 * Validate and consume an OAuth state token (one-time use).
 */
export async function consumeOAuthState(state: string): Promise<{
  platform: string
  siteId: string
  tenantId: string
  userId: string
  codeVerifier: string | null
} | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('social_oauth_states')
    .select('*')
    .eq('state', state)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null

  // Delete the consumed state
  await (supabase as any).from('social_oauth_states').delete().eq('state', state)

  return {
    platform: data.platform,
    siteId: data.site_id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    codeVerifier: data.code_verifier,
  }
}
