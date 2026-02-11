'use server'

/**
 * Social Media Module - Account Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for managing social media accounts
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { 
  SocialAccount, 
  SocialPlatform, 
  AccountStatus 
} from '../types'

// ============================================================================
// ACCOUNT CRUD
// ============================================================================

/**
 * Get all social accounts for a site
 */
export async function getSocialAccounts(
  siteId: string,
  options?: {
    platform?: SocialPlatform
    status?: AccountStatus
  }
): Promise<{ accounts: SocialAccount[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    let query = (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (options?.platform) {
      query = query.eq('platform', options.platform)
    }
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return { accounts: mapRecords<SocialAccount>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting accounts:', error)
    return { accounts: [], error: (error as Error).message }
  }
}

/**
 * Get a single social account
 */
export async function getSocialAccount(
  accountId: string
): Promise<{ account: SocialAccount | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (error) throw error
    
    return { account: data ? mapRecord<SocialAccount>(data) : null, error: null }
  } catch (error) {
    console.error('[Social] Error getting account:', error)
    return { account: null, error: (error as Error).message }
  }
}

/**
 * Create a new social account (after OAuth)
 */
export async function createSocialAccount(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    platform: SocialPlatform
    platformAccountId: string
    accountType?: string
    accountName: string
    accountHandle?: string
    accountAvatar?: string
    accountUrl?: string
    accessToken: string
    refreshToken?: string
    tokenExpiresAt?: string
    scopes?: string[]
  }
): Promise<{ account: SocialAccount | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: account, error } = await (supabase as any)
      .from('social_accounts')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        platform: data.platform,
        platform_account_id: data.platformAccountId,
        account_type: data.accountType || 'profile',
        account_name: data.accountName,
        account_handle: data.accountHandle,
        account_avatar: data.accountAvatar,
        account_url: data.accountUrl,
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        token_expires_at: data.tokenExpiresAt,
        scopes: data.scopes || [],
        status: 'active',
        created_by: userId,
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/accounts`)
    return { account: account ? mapRecord<SocialAccount>(account) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating account:', error)
    return { account: null, error: (error as Error).message }
  }
}

/**
 * Update account status
 */
export async function updateAccountStatus(
  accountId: string,
  status: AccountStatus,
  error?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    if (error) {
      updateData.last_error = error
      updateData.last_error_at = new Date().toISOString()
    }
    
    const { error: updateError } = await (supabase as any)
      .from('social_accounts')
      .update(updateData)
      .eq('id', accountId)
    
    if (updateError) throw updateError
    
    return { success: true, error: null }
  } catch (err) {
    console.error('[Social] Error updating account status:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Refresh account tokens (real implementation via ensureValidToken)
 */
export async function refreshAccountToken(
  accountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { ensureValidToken } = await import('../lib/token-refresh')
    const token = await ensureValidToken(accountId)

    if (!token) {
      return { success: false, error: 'Token refresh failed — please reconnect the account' }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('[Social] Error refreshing token:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Disconnect (delete) an account
 */
export async function disconnectSocialAccount(
  accountId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_accounts')
      .delete()
      .eq('id', accountId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/accounts`)
    return { success: true, error: null }
  } catch (err) {
    console.error('[Social] Error disconnecting account:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Sync account stats from platform (real API calls)
 */
export async function syncAccountStats(
  accountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    // Get account
    const { data: account, error: fetchError } = await (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (fetchError) throw fetchError
    if (!account) throw new Error('Account not found')

    const { ensureValidToken } = await import('../lib/token-refresh')
    const token = await ensureValidToken(accountId)
    if (!token) {
      return { success: false, error: 'Unable to obtain valid token' }
    }

    let followers = account.followers_count || 0
    let following = account.following_count || 0

    try {
      switch (account.platform) {
        case 'facebook': {
          const res = await fetch(
            `https://graph.facebook.com/v21.0/${account.platform_account_id}?fields=fan_count,followers_count&access_token=${token}`,
          )
          const fb = await res.json()
          followers = fb.followers_count || fb.fan_count || followers
          break
        }
        case 'instagram': {
          const res = await fetch(
            `https://graph.facebook.com/v21.0/${account.platform_account_id}?fields=followers_count,follows_count&access_token=${token}`,
          )
          const ig = await res.json()
          followers = ig.followers_count || followers
          following = ig.follows_count || following
          break
        }
        case 'twitter': {
          const res = await fetch(
            `https://api.twitter.com/2/users/${account.platform_account_id}?user.fields=public_metrics`,
            { headers: { Authorization: `Bearer ${token}` } },
          )
          const tw = await res.json()
          followers = tw.data?.public_metrics?.followers_count || followers
          following = tw.data?.public_metrics?.following_count || following
          break
        }
        case 'linkedin': {
          // LinkedIn follower stats require org endpoints
          break
        }
        case 'tiktok': {
          const res = await fetch(
            'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count',
            { headers: { Authorization: `Bearer ${token}` } },
          )
          const tt = await res.json()
          followers = tt.data?.user?.follower_count || followers
          following = tt.data?.user?.following_count || following
          break
        }
        case 'youtube': {
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${account.platform_account_id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          )
          const yt = await res.json()
          const ch = yt.items?.[0]?.statistics
          followers = Number(ch?.subscriberCount) || followers
          break
        }
        default:
          break
      }
    } catch (apiErr) {
      console.warn(`[Social] API call failed for ${account.platform}, using cached stats:`, apiErr)
    }

    await (supabase as any)
      .from('social_accounts')
      .update({
        followers_count: followers,
        following_count: following,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)

    return { success: true, error: null }
  } catch (err) {
    console.error('[Social] Error syncing account:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Get account health metrics
 */
export async function getAccountHealth(
  accountId: string
): Promise<{ 
  healthScore: number
  issues: string[]
  recommendations: string[]
  error: string | null 
}> {
  try {
    const supabase = await createClient()
    
    const { data: account, error } = await (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (error) throw error
    if (!account) throw new Error('Account not found')
    
    const issues: string[] = []
    const recommendations: string[] = []
    let healthScore = 100
    
    // Check token expiration
    if (account.token_expires_at) {
      const expiresAt = new Date(account.token_expires_at)
      const now = new Date()
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) {
        issues.push('Access token has expired')
        healthScore -= 50
      } else if (daysUntilExpiry < 7) {
        issues.push(`Access token expires in ${daysUntilExpiry} days`)
        healthScore -= 20
      }
    }
    
    // Check last sync
    if (account.last_synced_at) {
      const lastSync = new Date(account.last_synced_at)
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceSync > 24) {
        recommendations.push('Account has not synced in over 24 hours')
        healthScore -= 10
      }
    } else {
      recommendations.push('Account has never been synced')
      healthScore -= 15
    }
    
    // Check for errors
    if (account.status === 'error') {
      issues.push(`Account error: ${account.last_error || 'Unknown error'}`)
      healthScore -= 30
    } else if (account.status === 'rate_limited') {
      issues.push('Account is rate limited by the platform')
      healthScore -= 20
    }
    
    // Check engagement rate
    if (account.engagement_rate < 1) {
      recommendations.push('Consider posting more engaging content to improve engagement rate')
    }
    
    return {
      healthScore: Math.max(0, healthScore),
      issues,
      recommendations,
      error: null,
    }
  } catch (err) {
    console.error('[Social] Error getting account health:', err)
    return { 
      healthScore: 0, 
      issues: [], 
      recommendations: [], 
      error: (err as Error).message 
    }
  }
}

// ============================================================================
// BLUESKY (ATP) — credential-based auth
// ============================================================================

/**
 * Connect a Bluesky account using handle + app password.
 */
export async function connectBlueskyAccount(
  siteId: string,
  tenantId: string,
  userId: string,
  data: { handle: string; appPassword: string },
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Dynamic import – @atproto/api is optional (falls back to direct HTTP)
    let BskyAgent: any = null
    try {
      const atproto = await import('@atproto/api')
      BskyAgent = atproto.BskyAgent ?? atproto.AtpAgent ?? (atproto as any).default?.BskyAgent
    } catch (err) {
      // Package not installed, use direct HTTP fallback
      console.log('Using Bluesky HTTP fallback (atproto package not installed)')
    }

    let did: string
    let displayName: string
    let avatar: string | undefined
    let accessJwt: string
    let refreshJwt: string

    if (BskyAgent) {
      const agent = new BskyAgent({ service: 'https://bsky.social' })
      const loginResult = await agent.login({
        identifier: data.handle,
        password: data.appPassword,
      })
      did = loginResult.data.did
      accessJwt = loginResult.data.accessJwt
      refreshJwt = loginResult.data.refreshJwt

      const profile = await agent.getProfile({ actor: did })
      displayName = profile.data.displayName || data.handle
      avatar = profile.data.avatar
    } else {
      // Fallback: direct XRPC call
      const loginRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: data.handle, password: data.appPassword }),
      })
      if (!loginRes.ok) {
        const errBody = await loginRes.text()
        throw new Error(`Bluesky login failed: ${errBody.slice(0, 200)}`)
      }
      const session = await loginRes.json()
      did = session.did
      accessJwt = session.accessJwt
      refreshJwt = session.refreshJwt

      const profileRes = await fetch(
        `https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
        { headers: { Authorization: `Bearer ${accessJwt}` } },
      )
      const prof = profileRes.ok ? await profileRes.json() : {}
      displayName = prof.displayName || data.handle
      avatar = prof.avatar
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    await (supabase as any).from('social_accounts').upsert(
      {
        site_id: siteId,
        tenant_id: tenantId,
        user_id: userId,
        platform: 'bluesky',
        platform_account_id: did,
        account_name: displayName,
        account_handle: data.handle,
        account_avatar: avatar || null,
        account_url: `https://bsky.app/profile/${data.handle}`,
        access_token: accessJwt,
        refresh_token: refreshJwt,
        status: 'active',
        connected_at: now,
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: 'site_id,platform,platform_account_id', ignoreDuplicates: false },
    )

    revalidatePath(`/dashboard/sites/${siteId}/social/accounts`)
    return { success: true, error: null }
  } catch (err) {
    console.error('[Social] Bluesky connect error:', err)
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================================
// MASTODON — instance-aware OAuth
// ============================================================================

/**
 * Register/get the DRAMAC app on a Mastodon instance and return the authorize URL.
 */
export async function registerMastodonApp(
  instanceUrl: string,
  siteId: string,
  tenantId: string,
  userId: string,
): Promise<{ authorizeUrl: string | null; error: string | null }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/social/oauth/callback`

    // Register the application on the instance
    const regRes = await fetch(`${instanceUrl}/api/v1/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'DRAMAC CMS',
        redirect_uris: redirectUri,
        scopes: 'read write push',
        website: appUrl,
      }),
    })

    if (!regRes.ok) {
      throw new Error(`Mastodon app registration failed: ${regRes.status}`)
    }

    const app = await regRes.json()

    // Store the app credentials temporarily in oauth_states
    const { createOAuthState: createState } = await import('../lib/oauth-state')
    const { state } = await createState({
      platform: 'mastodon',
      siteId,
      tenantId,
      userId,
    })

    // Also store the instance info so callback can use it
    const supabase = await createClient()
    await (supabase as any).from('social_oauth_states').update({
      code_verifier: JSON.stringify({
        instanceUrl,
        clientId: app.client_id,
        clientSecret: app.client_secret,
      }),
    }).eq('state', state)

    // Build authorize URL
    const params = new URLSearchParams({
      client_id: app.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read write push',
      state,
    })

    return {
      authorizeUrl: `${instanceUrl}/oauth/authorize?${params.toString()}`,
      error: null,
    }
  } catch (err) {
    console.error('[Social] Mastodon registration error:', err)
    return { authorizeUrl: null, error: (err as Error).message }
  }
}

