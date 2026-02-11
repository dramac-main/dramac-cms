'use server'

/**
 * Social Media Module - Inbox Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for social inbox (comments, messages, mentions)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { 
  InboxItem, 
  InboxItemStatus, 
  InboxPriority,
  SavedReply 
} from '../types'

// ============================================================================
// INBOX QUERIES
// ============================================================================

/**
 * Get inbox items for a site
 */
export async function getInboxItems(
  siteId: string,
  options?: {
    accountIds?: string[]
    status?: InboxItemStatus | InboxItemStatus[]
    priority?: InboxPriority
    assignedTo?: string
    type?: string
    limit?: number
    offset?: number
  }
): Promise<{ items: InboxItem[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    let query = (supabase as any)
      .from('social_inbox_items')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .order('platform_created_at', { ascending: false })
    
    if (options?.accountIds && options.accountIds.length > 0) {
      query = query.in('account_id', options.accountIds)
    }
    
    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status)
      } else {
        query = query.eq('status', options.status)
      }
    }
    
    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }
    
    if (options?.assignedTo) {
      query = query.eq('assigned_to', options.assignedTo)
    }
    
    if (options?.type) {
      query = query.eq('item_type', options.type)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, count, error } = await query
    
    if (error) throw error
    
    return { items: mapRecords<InboxItem>(data || []), total: count || 0, error: null }
  } catch (error) {
    console.error('[Social] Error getting inbox items:', error)
    return { items: [], total: 0, error: (error as Error).message }
  }
}

/**
 * Get inbox counts by status
 */
export async function getInboxCounts(
  siteId: string,
  accountIds?: string[]
): Promise<{
  counts: {
    new: number
    read: number
    replied: number
    flagged: number
    total: number
  }
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    let baseQuery = (supabase as any)
      .from('social_inbox_items')
      .select('status', { count: 'exact' })
      .eq('site_id', siteId)
    
    if (accountIds && accountIds.length > 0) {
      baseQuery = baseQuery.in('account_id', accountIds)
    }
    
    // Get counts for each status
    const statuses = ['new', 'read', 'replied', 'flagged'] as const
    const counts: Record<string, number> = {}
    
    for (const status of statuses) {
      const { count } = await baseQuery.eq('status', status)
      counts[status] = count || 0
    }
    
    // Get total
    const { count: total } = await baseQuery.not('status', 'in', '("archived","spam")')
    
    return {
      counts: {
        new: counts.new || 0,
        read: counts.read || 0,
        replied: counts.replied || 0,
        flagged: counts.flagged || 0,
        total: total || 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('[Social] Error getting inbox counts:', error)
    return {
      counts: { new: 0, read: 0, replied: 0, flagged: 0, total: 0 },
      error: (error as Error).message,
    }
  }
}

// ============================================================================
// INBOX ACTIONS
// ============================================================================

/**
 * Mark inbox item as read
 */
export async function markAsRead(
  itemId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'read',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('status', 'new')
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error marking as read:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Reply to an inbox item
 */
export async function replyToItem(
  itemId: string,
  siteId: string,
  userId: string,
  replyText: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get the item
    const { data: item, error: fetchError } = await (supabase as any)
      .from('social_inbox_items')
      .select('*, platform_created_at')
      .eq('id', itemId)
      .single()
    
    if (fetchError) throw fetchError
    if (!item) throw new Error('Item not found')
    
    // Calculate response time
    const responseTimeSeconds = Math.floor(
      (Date.now() - new Date(item.platform_created_at).getTime()) / 1000
    )
    
    // Update item with reply
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'replied',
        response_text: replyText,
        response_at: new Date().toISOString(),
        response_by: userId,
        response_time_seconds: responseTimeSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    // Send reply to the platform API
    try {
      const { sendPlatformReply } = await import('../lib/inbox-reply-service')
      
      // Fetch account to get platform info
      const { data: account } = await (supabase as any)
        .from('social_accounts')
        .select('platform')
        .eq('id', item.account_id)
        .single()
      
      if (account) {
        const platformResult = await sendPlatformReply({
          accountId: item.account_id,
          platform: account.platform,
          platformItemId: item.platform_item_id,
          platformParentId: item.platform_parent_id,
          content: replyText,
          itemType: item.item_type,
        })
        
        if (!platformResult.success) {
          console.warn(`[Social] Platform reply failed (saved to DB): ${platformResult.error}`)
          // Reply is still saved in DB even if platform fails
          // Revalidate so user sees the reply was saved
          revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
          return { 
            success: true, 
            error: `Reply saved but platform delivery failed: ${platformResult.error}` 
          }
        }
      }
    } catch (platformError: any) {
      console.warn('[Social] Platform reply error (saved to DB):', platformError.message)
    }
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error replying to item:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Assign inbox item to a team member
 */
export async function assignItem(
  itemId: string,
  siteId: string,
  assigneeId: string | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        assigned_to: assigneeId,
        assigned_at: assigneeId ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error assigning item:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Update item priority
 */
export async function updatePriority(
  itemId: string,
  siteId: string,
  priority: InboxPriority
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        priority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error updating priority:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Archive inbox item
 */
export async function archiveItem(
  itemId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error archiving item:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Mark item as spam
 */
export async function markAsSpam(
  itemId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'spam',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error marking as spam:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Flag item for review
 */
export async function flagItem(
  itemId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'flagged',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error flagging item:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Add tags to inbox item
 */
export async function addTags(
  itemId: string,
  siteId: string,
  tags: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get current tags
    const { data: item } = await (supabase as any)
      .from('social_inbox_items')
      .select('tags')
      .eq('id', itemId)
      .single()
    
    const currentTags = item?.tags || []
    const newTags = [...new Set([...currentTags, ...tags])]
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        tags: newTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error adding tags:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// SAVED REPLIES
// ============================================================================

/**
 * Get saved replies
 */
export async function getSavedReplies(
  siteId: string,
  tenantId?: string
): Promise<{ replies: SavedReply[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_saved_replies')
      .select('*')
      .eq('site_id', siteId)
      .order('usage_count', { ascending: false })
    
    if (error) throw error
    
    return { replies: mapRecords<SavedReply>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting saved replies:', error)
    return { replies: [], error: (error as Error).message }
  }
}

/**
 * Create saved reply
 */
export async function createSavedReply(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    name: string
    content: string
    category?: string
    shortcut?: string
    isShared?: boolean
  }
): Promise<{ reply: SavedReply | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: reply, error } = await (supabase as any)
      .from('social_saved_replies')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        name: data.name,
        content: data.content,
        category: data.category,
        shortcut: data.shortcut,
        is_shared: data.isShared ?? true,
        created_by: userId,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { reply: reply ? mapRecord<SavedReply>(reply) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating saved reply:', error)
    return { reply: null, error: (error as Error).message }
  }
}

/**
 * Update saved reply usage
 */
export async function useSavedReply(
  replyId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get current count
    const { data: reply } = await (supabase as any)
      .from('social_saved_replies')
      .select('usage_count')
      .eq('id', replyId)
      .single()
    
    const { error } = await (supabase as any)
      .from('social_saved_replies')
      .update({
        usage_count: (reply?.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', replyId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error updating saved reply usage:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Delete saved reply
 */
export async function deleteSavedReply(
  replyId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_saved_replies')
      .delete()
      .eq('id', replyId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting saved reply:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk archive items
 */
export async function bulkArchive(
  siteId: string,
  itemIds: string[]
): Promise<{ successCount: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .in('id', itemIds)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { successCount: itemIds.length, error: null }
  } catch (error) {
    console.error('[Social] Error bulk archiving:', error)
    return { successCount: 0, error: (error as Error).message }
  }
}

/**
 * Bulk mark as read
 */
export async function bulkMarkAsRead(
  siteId: string,
  itemIds: string[]
): Promise<{ successCount: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_inbox_items')
      .update({
        status: 'read',
        updated_at: new Date().toISOString(),
      })
      .in('id', itemIds)
      .eq('status', 'new')
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)
    return { successCount: itemIds.length, error: null }
  } catch (error) {
    console.error('[Social] Error bulk marking as read:', error)
    return { successCount: 0, error: (error as Error).message }
  }
}

// ============================================================================
// INBOX SYNC
// ============================================================================

/**
 * Trigger inbox sync for all accounts of a site
 */
export async function syncInbox(
  siteId: string
): Promise<{ newItems: number; error: string | null }> {
  try {
    const supabase = await createClient()

    // Get all active accounts for this site
    const { data: accounts, error: accountsError } = await (supabase as any)
      .from('social_accounts')
      .select('id')
      .eq('site_id', siteId)
      .eq('status', 'active')

    if (accountsError) throw accountsError
    if (!accounts || accounts.length === 0) {
      return { newItems: 0, error: null }
    }

    const { syncAccountInbox } = await import('../lib/inbox-sync-service')

    let totalNewItems = 0
    const allErrors: string[] = []

    for (const account of accounts) {
      const result = await syncAccountInbox(account.id)
      totalNewItems += result.newItems
      allErrors.push(...result.errors)
    }

    revalidatePath(`/dashboard/sites/${siteId}/social/inbox`)

    return {
      newItems: totalNewItems,
      error: allErrors.length > 0 ? allErrors.join('; ') : null,
    }
  } catch (error) {
    console.error('[Social] Error syncing inbox:', error)
    return { newItems: 0, error: (error as Error).message }
  }
}
