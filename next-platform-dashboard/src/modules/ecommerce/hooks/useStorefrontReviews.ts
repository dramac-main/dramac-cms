/**
 * useStorefrontReviews - Product reviews hook
 * 
 * Phase ECOM-60: Product Reviews & Ratings
 * 
 * Fetches and manages product reviews for the storefront.
 * Provides review listing, stats, submission, and helpful votes.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getPublicProductReviews,
  getProductReviewStats,
  submitReview as submitReviewAction,
  markReviewHelpful,
} from '../actions/review-actions'
import type {
  Review,
  ReviewInput,
  ReviewStats,
  StorefrontReviewsResult,
} from '../types/ecommerce-types'

const PAGE_SIZE = 10

export function useStorefrontReviews(
  siteId: string,
  productId: string
): StorefrontReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })
  const [totalReviews, setTotalReviews] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest')
  const [hasMore, setHasMore] = useState(false)

  // Fetch reviews and stats
  const fetchReviews = useCallback(async (page: number = 1, sort: string = sortBy, append: boolean = false) => {
    if (!siteId || !productId) return

    setIsLoading(true)
    setError(null)

    try {
      const [reviewsResult, statsResult] = await Promise.all([
        getPublicProductReviews(siteId, productId, page, PAGE_SIZE, sort as 'newest'),
        page === 1 ? getProductReviewStats(siteId, productId) : Promise.resolve(stats),
      ])

      if (append) {
        setReviews(prev => [...prev, ...reviewsResult.reviews])
      } else {
        setReviews(reviewsResult.reviews)
      }

      setTotalReviews(reviewsResult.total)
      setHasMore(page * PAGE_SIZE < reviewsResult.total)

      if (page === 1) {
        setStats(statsResult)
      }
    } catch (err) {
      console.error('[useStorefrontReviews] Error:', err)
      setError('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, productId, sortBy, stats])

  // Initial fetch
  useEffect(() => {
    setCurrentPage(1)
    fetchReviews(1, sortBy, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, productId, sortBy])

  // Load more
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    await fetchReviews(nextPage, sortBy, true)
  }, [currentPage, sortBy, fetchReviews])

  // Submit review
  const submitReview = useCallback(async (
    input: Omit<ReviewInput, 'site_id' | 'product_id'>
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await submitReviewAction({
      ...input,
      site_id: siteId,
      product_id: productId,
    })

    if (result.success) {
      // Refresh reviews after submission
      await fetchReviews(1, sortBy, false)
      setCurrentPage(1)
    }

    return result
  }, [siteId, productId, sortBy, fetchReviews])

  // Mark helpful
  const markHelpful = useCallback(async (reviewId: string): Promise<boolean> => {
    const result = await markReviewHelpful(reviewId)
    if (result) {
      // Optimistic update
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ))
    }
    return result
  }, [])

  // Handle sort change
  const handleSetSortBy = useCallback((sort: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful') => {
    setSortBy(sort)
  }, [])

  return {
    reviews,
    stats,
    totalReviews,
    currentPage,
    isLoading,
    error,
    sortBy,
    setSortBy: handleSetSortBy,
    loadMore,
    submitReview,
    markHelpful,
    hasMore,
  }
}
