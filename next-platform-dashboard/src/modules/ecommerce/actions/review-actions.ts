/**
 * Product Reviews Server Actions
 * 
 * Phase ECOM-60: Product Reviews & Ratings
 * 
 * Server-side actions for CRUD operations on product reviews.
 * Follows the pattern from ecommerce-actions.ts.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Review, ReviewInput, ReviewStats, ReviewStatus } from '../types/ecommerce-types'

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

const TABLE_PREFIX = 'mod_ecommod01'

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

function getAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any
}

// ============================================================================
// PUBLIC ACTIONS (Storefront)
// ============================================================================

/**
 * Get approved reviews for a product (public / storefront)
 */
export async function getPublicProductReviews(
  siteId: string,
  productId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' = 'newest'
): Promise<{ reviews: Review[]; total: number }> {
  const supabase = getAdminClient()

  const offset = (page - 1) * pageSize

  // Get total count
  const { count } = await supabase
    .from(`${TABLE_PREFIX}_reviews`)
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('product_id', productId)
    .eq('status', 'approved')

  // Build query with sort
  let query = supabase
    .from(`${TABLE_PREFIX}_reviews`)
    .select('*')
    .eq('site_id', siteId)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .range(offset, offset + pageSize - 1)

  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'highest':
      query = query.order('rating', { ascending: false })
      break
    case 'lowest':
      query = query.order('rating', { ascending: true })
      break
    case 'helpful':
      query = query.order('helpful_count', { ascending: false })
      break
  }

  const { data, error } = await query

  if (error) {
    console.error('[Reviews] Error fetching public reviews:', error)
    return { reviews: [], total: 0 }
  }

  return { reviews: (data || []) as Review[], total: count || 0 }
}

/**
 * Get review statistics for a product (public / storefront)
 */
export async function getProductReviewStats(
  siteId: string,
  productId: string
): Promise<ReviewStats> {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_reviews`)
    .select('rating')
    .eq('site_id', siteId)
    .eq('product_id', productId)
    .eq('status', 'approved')

  if (error || !data) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  }

  const reviews = data as { rating: number }[]
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : 0

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach(r => {
    ratingDistribution[r.rating as keyof typeof ratingDistribution]++
  })

  return { averageRating, totalReviews, ratingDistribution }
}

/**
 * Submit a new review (public / storefront)
 */
export async function submitReview(input: ReviewInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()

    // Check if user already reviewed this product
    if (input.user_id) {
      const { data: existing } = await supabase
        .from(`${TABLE_PREFIX}_reviews`)
        .select('id')
        .eq('site_id', input.site_id)
        .eq('product_id', input.product_id)
        .eq('user_id', input.user_id)
        .maybeSingle()

      if (existing) {
        return { success: false, error: 'You have already reviewed this product' }
      }
    }

    // Check if verified purchase
    let verifiedPurchase = false
    if (input.user_id) {
      const { data: orders } = await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .select('id')
        .eq('site_id', input.site_id)
        .eq('customer_email', input.reviewer_email)
        .in('status', ['delivered', 'completed'])
        .limit(1)

      if (orders && orders.length > 0) {
        // Check if any order contained this product
        const { data: orderItems } = await supabase
          .from(`${TABLE_PREFIX}_order_items`)
          .select('id')
          .in('order_id', orders.map((o: { id: string }) => o.id))
          .eq('product_id', input.product_id)
          .limit(1)

        verifiedPurchase = (orderItems && orderItems.length > 0) || false
      }
    }

    const { error } = await supabase
      .from(`${TABLE_PREFIX}_reviews`)
      .insert({
        site_id: input.site_id,
        product_id: input.product_id,
        user_id: input.user_id || null,
        reviewer_name: input.reviewer_name,
        reviewer_email: input.reviewer_email || null,
        rating: input.rating,
        title: input.title || null,
        body: input.body || null,
        status: 'pending', // Always starts as pending for moderation
        verified_purchase: verifiedPurchase,
      })

    if (error) {
      console.error('[Reviews] Error submitting review:', error)
      return { success: false, error: 'Failed to submit review' }
    }

    return { success: true }
  } catch (err) {
    console.error('[Reviews] Unexpected error submitting review:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark a review as helpful (public)
 */
export async function markReviewHelpful(reviewId: string): Promise<boolean> {
  try {
    const supabase = getAdminClient()

    const { error } = await supabase.rpc('increment_review_helpful', { review_id: reviewId })

    if (error) {
      // Fallback: manual increment
      const { data: review } = await supabase
        .from(`${TABLE_PREFIX}_reviews`)
        .select('helpful_count')
        .eq('id', reviewId)
        .single()

      if (review) {
        await supabase
          .from(`${TABLE_PREFIX}_reviews`)
          .update({ helpful_count: (review.helpful_count || 0) + 1 })
          .eq('id', reviewId)
      }
    }

    return true
  } catch {
    return false
  }
}

// ============================================================================
// ADMIN ACTIONS (Dashboard)
// ============================================================================

/**
 * Get all reviews for a site (admin dashboard)
 */
export async function getReviews(
  siteId: string,
  filters?: {
    status?: ReviewStatus | 'all'
    productId?: string
    rating?: number
    search?: string
    page?: number
    pageSize?: number
  }
): Promise<{ reviews: Review[]; total: number }> {
  const supabase = await getModuleClient()
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const offset = (page - 1) * pageSize

  // Count query
  let countQuery = supabase
    .from(`${TABLE_PREFIX}_reviews`)
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)

  if (filters?.status && filters.status !== 'all') {
    countQuery = countQuery.eq('status', filters.status)
  }
  if (filters?.productId) {
    countQuery = countQuery.eq('product_id', filters.productId)
  }
  if (filters?.rating) {
    countQuery = countQuery.eq('rating', filters.rating)
  }
  if (filters?.search) {
    countQuery = countQuery.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%,reviewer_name.ilike.%${filters.search}%`)
  }

  const { count } = await countQuery

  // Data query
  let query = supabase
    .from(`${TABLE_PREFIX}_reviews`)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.productId) {
    query = query.eq('product_id', filters.productId)
  }
  if (filters?.rating) {
    query = query.eq('rating', filters.rating)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%,reviewer_name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Reviews] Error fetching reviews:', error)
    return { reviews: [], total: 0 }
  }

  return { reviews: (data || []) as Review[], total: count || 0 }
}

/**
 * Update review status (approve, reject, flag)
 */
export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from(`${TABLE_PREFIX}_reviews`)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reviewId)

    if (error) {
      console.error('[Reviews] Error updating review status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[Reviews] Unexpected error updating review:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk update review statuses
 */
export async function bulkUpdateReviewStatus(
  reviewIds: string[],
  status: ReviewStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from(`${TABLE_PREFIX}_reviews`)
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', reviewIds)

    if (error) {
      console.error('[Reviews] Error bulk updating reviews:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[Reviews] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Add admin response to a review
 */
export async function addAdminResponse(
  reviewId: string,
  response: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from(`${TABLE_PREFIX}_reviews`)
      .update({
        admin_response: response,
        admin_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) {
      console.error('[Reviews] Error adding admin response:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[Reviews] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from(`${TABLE_PREFIX}_reviews`)
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('[Reviews] Error deleting review:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[Reviews] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get review counts by status (for dashboard badges)
 */
export async function getReviewCounts(siteId: string): Promise<Record<ReviewStatus | 'all', number>> {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_reviews`)
    .select('status')
    .eq('site_id', siteId)

  if (error || !data) {
    return { all: 0, pending: 0, approved: 0, rejected: 0, flagged: 0 }
  }

  const counts: Record<string, number> = { all: data.length, pending: 0, approved: 0, rejected: 0, flagged: 0 }
  data.forEach((r: { status: string }) => {
    counts[r.status] = (counts[r.status] || 0) + 1
  })

  return counts as Record<ReviewStatus | 'all', number>
}
