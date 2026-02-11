'use server'

/**
 * Social Media Module - Post Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for creating, scheduling, and publishing posts
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'
import type { 
  SocialPost, 
  PostStatus, 
  PostMedia,
  PublishResult,
  SocialPlatform
} from '../types'

// ============================================================================
// POST CRUD
// ============================================================================

/**
 * Get posts for a site
 */
export async function getPosts(
  siteId: string,
  options?: {
    status?: PostStatus | PostStatus[]
    campaignId?: string
    accountIds?: string[]
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }
): Promise<{ posts: SocialPost[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    let query = (supabase as any)
      .from('social_posts')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status)
      } else {
        query = query.eq('status', options.status)
      }
    }
    
    if (options?.campaignId) {
      query = query.eq('campaign_id', options.campaignId)
    }
    
    if (options?.accountIds && options.accountIds.length > 0) {
      query = query.overlaps('target_accounts', options.accountIds)
    }
    
    if (options?.startDate) {
      query = query.gte('scheduled_at', options.startDate)
    }
    
    if (options?.endDate) {
      query = query.lte('scheduled_at', options.endDate)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }
    
    const { data, count, error } = await query
    
    if (error) throw error
    
    return { posts: data || [], total: count || 0, error: null }
  } catch (error) {
    console.error('[Social] Error getting posts:', error)
    return { posts: [], total: 0, error: (error as Error).message }
  }
}

/**
 * Get a single post
 */
export async function getPost(
  postId: string
): Promise<{ post: SocialPost | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (error) throw error
    
    return { post: data, error: null }
  } catch (error) {
    console.error('[Social] Error getting post:', error)
    return { post: null, error: (error as Error).message }
  }
}

/**
 * Create a new post
 */
export async function createPost(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    content: string
    contentHtml?: string
    media?: PostMedia[]
    linkUrl?: string
    platformContent?: Record<SocialPlatform, { content: string; media?: PostMedia[] }>
    targetAccounts: string[]
    scheduledAt?: string
    timezone?: string
    labels?: string[]
    campaignId?: string
    contentPillar?: string
    requiresApproval?: boolean
    firstComment?: string
    firstCommentDelayMinutes?: number
  }
): Promise<{ post: SocialPost | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Determine initial status
    let status: PostStatus = 'draft'
    if (data.scheduledAt) {
      status = data.requiresApproval ? 'pending_approval' : 'scheduled'
    }
    
    const { data: post, error } = await (supabase as any)
      .from('social_posts')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        content: data.content,
        content_html: data.contentHtml,
        media: data.media || [],
        link_url: data.linkUrl,
        platform_content: data.platformContent || {},
        target_accounts: data.targetAccounts,
        scheduled_at: data.scheduledAt,
        timezone: data.timezone || DEFAULT_TIMEZONE,
        status,
        labels: data.labels || [],
        campaign_id: data.campaignId,
        content_pillar: data.contentPillar,
        requires_approval: data.requiresApproval || false,
        first_comment: data.firstComment,
        first_comment_delay_minutes: data.firstCommentDelayMinutes || 0,
        created_by: userId,
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    
    return { post, error: null }
  } catch (error) {
    console.error('[Social] Error creating post:', error)
    return { post: null, error: (error as Error).message }
  }
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string,
  siteId: string,
  updates: Partial<{
    content: string
    contentHtml: string
    media: PostMedia[]
    linkUrl: string
    platformContent: Record<SocialPlatform, { content: string; media?: PostMedia[] }>
    targetAccounts: string[]
    scheduledAt: string
    timezone: string
    labels: string[]
    campaignId: string
    contentPillar: string
    firstComment: string
    firstCommentDelayMinutes: number
  }>
): Promise<{ post: SocialPost | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.contentHtml !== undefined) updateData.content_html = updates.contentHtml
    if (updates.media !== undefined) updateData.media = updates.media
    if (updates.linkUrl !== undefined) updateData.link_url = updates.linkUrl
    if (updates.platformContent !== undefined) updateData.platform_content = updates.platformContent
    if (updates.targetAccounts !== undefined) updateData.target_accounts = updates.targetAccounts
    if (updates.scheduledAt !== undefined) updateData.scheduled_at = updates.scheduledAt
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone
    if (updates.labels !== undefined) updateData.labels = updates.labels
    if (updates.campaignId !== undefined) updateData.campaign_id = updates.campaignId
    if (updates.contentPillar !== undefined) updateData.content_pillar = updates.contentPillar
    if (updates.firstComment !== undefined) updateData.first_comment = updates.firstComment
    if (updates.firstCommentDelayMinutes !== undefined) {
      updateData.first_comment_delay_minutes = updates.firstCommentDelayMinutes
    }
    
    const { data: post, error } = await (supabase as any)
      .from('social_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    revalidatePath(`/dashboard/sites/${siteId}/social/posts/${postId}`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    
    return { post, error: null }
  } catch (error) {
    console.error('[Social] Error updating post:', error)
    return { post: null, error: (error as Error).message }
  }
}

/**
 * Delete a post
 */
export async function deletePost(
  postId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_posts')
      .delete()
      .eq('id', postId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting post:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// SCHEDULING & PUBLISHING
// ============================================================================

/**
 * Schedule a post
 */
export async function schedulePost(
  postId: string,
  siteId: string,
  scheduledAt: string,
  timezone?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Check if post requires approval
    const { data: post } = await (supabase as any)
      .from('social_posts')
      .select('requires_approval')
      .eq('id', postId)
      .single()
    
    const status = post?.requires_approval ? 'pending_approval' : 'scheduled'
    
    const { error } = await (supabase as any)
      .from('social_posts')
      .update({
        scheduled_at: scheduledAt,
        timezone: timezone || DEFAULT_TIMEZONE,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error scheduling post:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Publish a post immediately
 */
export async function publishPostNow(
  postId: string,
  siteId: string
): Promise<{ 
  success: boolean
  results: Record<string, PublishResult>
  error: string | null 
}> {
  try {
    const supabase = await createClient()
    
    // Get post with accounts
    const { data: post, error: fetchError } = await (supabase as any)
      .from('social_posts')
      .select('*, target_accounts')
      .eq('id', postId)
      .single()
    
    if (fetchError) throw fetchError
    if (!post) throw new Error('Post not found')
    
    // Update status to publishing
    await (supabase as any)
      .from('social_posts')
      .update({ status: 'publishing' })
      .eq('id', postId)
    
    const results: Record<string, PublishResult> = {}
    
    // Get account details for each target account
    const { data: accounts } = await (supabase as any)
      .from('social_accounts')
      .select('*')
      .in('id', post.target_accounts)
    
    // Publish to each account using the real publish service
    const { publishToAccount } = await import('../lib/publish-service')

    for (const account of accounts || []) {
      try {
        const result = await publishToAccount(account.id, {
          content: post.content,
          media: post.media || [],
          platformContent: post.platform_content,
          firstComment: post.first_comment,
          threadContent: post.thread_content,
        })

        if (result.success) {
          results[account.id] = {
            platformPostId: result.platformPostId || '',
            url: result.postUrl || '',
            status: 'success',
            publishedAt: new Date().toISOString(),
          }

          await (supabase as any)
            .from('social_publish_log')
            .insert({
              post_id: postId,
              account_id: account.id,
              status: 'success',
              platform_post_id: result.platformPostId,
              platform_url: result.postUrl,
              completed_at: new Date().toISOString(),
            })
        } else {
          throw new Error(result.error || 'Publishing failed')
        }
      } catch (pubError) {
        results[account.id] = {
          platformPostId: '',
          url: '',
          status: 'failed',
          error: (pubError as Error).message,
        }
        
        // Log the failure
        await (supabase as any)
          .from('social_publish_log')
          .insert({
            post_id: postId,
            account_id: account.id,
            status: 'failed',
            error_message: (pubError as Error).message,
          })
      }
    }
    
    // Determine final status
    const allSucceeded = Object.values(results).every(r => r.status === 'success')
    const someSucceeded = Object.values(results).some(r => r.status === 'success')
    
    const finalStatus: PostStatus = allSucceeded 
      ? 'published' 
      : someSucceeded 
        ? 'partially_published' 
        : 'failed'
    
    // Update post with results
    await (supabase as any)
      .from('social_posts')
      .update({
        status: finalStatus,
        published_at: new Date().toISOString(),
        publish_results: results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    
    return { success: allSucceeded || someSucceeded, results, error: null }
  } catch (error) {
    console.error('[Social] Error publishing post:', error)
    return { success: false, results: {}, error: (error as Error).message }
  }
}

/**
 * Add post to queue
 */
export async function addToQueue(
  postId: string,
  queueId: string,
  siteId: string
): Promise<{ success: boolean; scheduledAt: string | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get next available slot from queue
    const { data: nextSlot } = await (supabase as any)
      .rpc('get_social_next_queue_slot', { p_queue_id: queueId })
    
    if (!nextSlot) {
      return { success: false, scheduledAt: null, error: 'No available slots in queue' }
    }
    
    // Schedule the post
    const { error } = await (supabase as any)
      .from('social_posts')
      .update({
        scheduled_at: nextSlot,
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    
    return { success: true, scheduledAt: nextSlot, error: null }
  } catch (error) {
    console.error('[Social] Error adding to queue:', error)
    return { success: false, scheduledAt: null, error: (error as Error).message }
  }
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Approve a post
 */
export async function approvePost(
  postId: string,
  siteId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get post to check if it has scheduled time
    const { data: post } = await (supabase as any)
      .from('social_posts')
      .select('scheduled_at')
      .eq('id', postId)
      .single()
    
    const newStatus: PostStatus = post?.scheduled_at ? 'scheduled' : 'approved'
    
    const { error } = await (supabase as any)
      .from('social_posts')
      .update({
        status: newStatus,
        approved_by: userId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
    
    if (error) throw error
    
    // Update approval request if exists
    await (supabase as any)
      .from('social_approval_requests')
      .update({
        status: 'approved',
        decided_by: userId,
        decided_at: new Date().toISOString(),
        decision_notes: notes,
      })
      .eq('post_id', postId)
      .eq('status', 'pending')
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error approving post:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Reject a post
 */
export async function rejectPost(
  postId: string,
  siteId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_posts')
      .update({
        status: 'draft',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
    
    if (error) throw error
    
    // Update approval request
    await (supabase as any)
      .from('social_approval_requests')
      .update({
        status: 'rejected',
        decided_by: userId,
        decided_at: new Date().toISOString(),
        decision_notes: reason,
      })
      .eq('post_id', postId)
      .eq('status', 'pending')
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error rejecting post:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk schedule posts
 */
export async function bulkSchedulePosts(
  siteId: string,
  posts: Array<{ postId: string; scheduledAt: string }>
): Promise<{ successCount: number; failCount: number; error: string | null }> {
  let successCount = 0
  let failCount = 0
  
  for (const { postId, scheduledAt } of posts) {
    const { success } = await schedulePost(postId, siteId, scheduledAt)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }
  
  return { successCount, failCount, error: null }
}

/**
 * Bulk delete posts
 */
export async function bulkDeletePosts(
  siteId: string,
  postIds: string[]
): Promise<{ successCount: number; failCount: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_posts')
      .delete()
      .in('id', postIds)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    
    return { successCount: postIds.length, failCount: 0, error: null }
  } catch (error) {
    console.error('[Social] Error bulk deleting posts:', error)
    return { successCount: 0, failCount: postIds.length, error: (error as Error).message }
  }
}

/**
 * Duplicate a post
 */
export async function duplicatePost(
  postId: string,
  siteId: string,
  tenantId: string,
  userId: string
): Promise<{ post: SocialPost | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get original post
    const { data: original, error: fetchError } = await (supabase as any)
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (fetchError) throw fetchError
    if (!original) throw new Error('Post not found')
    
    // Create duplicate
    const { data: newPost, error: insertError } = await (supabase as any)
      .from('social_posts')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        content: original.content,
        content_html: original.content_html,
        media: original.media,
        link_url: original.link_url,
        platform_content: original.platform_content,
        target_accounts: original.target_accounts,
        status: 'draft',
        labels: original.labels,
        campaign_id: original.campaign_id,
        content_pillar: original.content_pillar,
        requires_approval: original.requires_approval,
        first_comment: original.first_comment,
        first_comment_delay_minutes: original.first_comment_delay_minutes,
        created_by: userId,
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    revalidatePath(`/dashboard/sites/${siteId}/social/posts`)
    
    return { post: newPost, error: null }
  } catch (error) {
    console.error('[Social] Error duplicating post:', error)
    return { post: null, error: (error as Error).message }
  }
}
