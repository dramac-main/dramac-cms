/**
 * Token Refresh & Platform HTTP Client
 *
 * PHASE-SM-01: Ensures tokens are valid before API calls,
 * handles automatic refresh when tokens expire.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getOAuthConfig } from './platform-oauth-config'
import type { SocialPlatform } from '../types'

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Ensure a social account has a valid (non-expired) access token.
 * If expired, attempt to refresh using the stored refresh_token.
 * Returns the (possibly refreshed) access token or null on failure.
 */
export async function ensureValidToken(accountId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: account, error } = await (supabase as any)
    .from('social_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) return null

  // Check if token is still valid (with 5-min buffer)
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  if (expiresAt && expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return account.access_token
  }

  // Try to refresh
  const refreshToken = account.refresh_token
  if (!refreshToken) {
    // Mark account as expired
    await (supabase as any)
      .from('social_accounts')
      .update({ status: 'expired', last_error: 'No refresh token available' })
      .eq('id', accountId)
    return null
  }

  const platform = account.platform as SocialPlatform
  const config = getOAuthConfig(platform as any)
  if (!config) {
    // Bluesky/Mastodon don't use OAuth refresh
    return account.access_token
  }

  try {
    const body: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }

    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      await (supabase as any)
        .from('social_accounts')
        .update({
          status: 'expired',
          last_error: `Token refresh failed: ${res.status} ${errText.slice(0, 200)}`,
        })
        .eq('id', accountId)
      return null
    }

    const tokens = await res.json()

    // Update stored tokens
    const updates: Record<string, any> = {
      access_token: tokens.access_token,
      status: 'active',
      last_error: null,
      updated_at: new Date().toISOString(),
    }
    if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token
    if (tokens.expires_in) {
      updates.token_expires_at = new Date(
        Date.now() + tokens.expires_in * 1000,
      ).toISOString()
    }

    await (supabase as any)
      .from('social_accounts')
      .update(updates)
      .eq('id', accountId)

    return tokens.access_token
  } catch (err: any) {
    await (supabase as any)
      .from('social_accounts')
      .update({ status: 'error', last_error: err.message?.slice(0, 200) })
      .eq('id', accountId)
    return null
  }
}

// ============================================================================
// PLATFORM-AWARE FETCH
// ============================================================================

/**
 * Make an authenticated API call to a social platform.
 * Automatically refreshes the token if needed.
 */
export async function platformFetch(
  accountId: string,
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await ensureValidToken(accountId)
  if (!token) throw new Error('Unable to obtain a valid access token')

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, { ...options, headers })
}
