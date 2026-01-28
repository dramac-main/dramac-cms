'use server'

/**
 * Social Media Module - Account Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for managing social media accounts
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
      .from('mod_social.accounts')
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
    
    return { accounts: data || [], error: null }
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
      .from('mod_social.accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (error) throw error
    
    return { account: data, error: null }
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
      .from('mod_social.accounts')
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
    
    revalidatePath(`/dashboard/${siteId}/social/accounts`)
    return { account, error: null }
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
      .from('mod_social.accounts')
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
 * Refresh account tokens
 */
export async function refreshAccountToken(
  accountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get account
    const { data: account, error: fetchError } = await (supabase as any)
      .from('mod_social.accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (fetchError) throw fetchError
    if (!account) throw new Error('Account not found')
    if (!account.refresh_token) throw new Error('No refresh token available')
    
    // Platform-specific token refresh would go here
    // For now, just mark as needing reconnection
    
    await (supabase as any)
      .from('mod_social.accounts')
      .update({
        status: 'expired',
        last_error: 'Token refresh required - please reconnect',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
    
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
      .from('mod_social.accounts')
      .delete()
      .eq('id', accountId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/${siteId}/social/accounts`)
    return { success: true, error: null }
  } catch (err) {
    console.error('[Social] Error disconnecting account:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Sync account stats from platform
 */
export async function syncAccountStats(
  accountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get account
    const { data: account, error: fetchError } = await (supabase as any)
      .from('mod_social.accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (fetchError) throw fetchError
    if (!account) throw new Error('Account not found')
    
    // Platform-specific API calls would go here to fetch stats
    // For now, just update sync timestamp
    
    await (supabase as any)
      .from('mod_social.accounts')
      .update({
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
      .from('mod_social.accounts')
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
