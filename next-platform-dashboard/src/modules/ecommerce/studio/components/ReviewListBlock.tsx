/**
 * ReviewListBlock - Product reviews list for storefront
 * 
 * Phase ECOM-60: Product Reviews & Ratings
 * 
 * Displays product reviews with rating distribution summary,
 * sort options, helpful votes, and admin responses.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Star,
  ThumbsUp,
  ChevronDown,
  MessageSquare,
  Shield,
  BadgeCheck,
  Loader2,
} from 'lucide-react'
import type { Review, ReviewStats } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ReviewListBlockProps {
  reviews: Review[]
  stats: ReviewStats
  totalReviews: number
  isLoading: boolean
  hasMore: boolean
  sortBy: string
  onSortChange: (sort: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful') => void
  onLoadMore: () => Promise<void>
  onMarkHelpful: (reviewId: string) => Promise<boolean>
  className?: string
}

// ============================================================================
// RATING DISTRIBUTION BAR
// ============================================================================

function RatingDistribution({ stats }: { stats: ReviewStats }) {
  const maxCount = Math.max(...Object.values(stats.ratingDistribution), 1)

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

        return (
          <div key={rating} className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 w-12 text-muted-foreground">
              {rating}
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-muted-foreground text-xs">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// STAR DISPLAY
// ============================================================================

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            rating >= star
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SINGLE REVIEW CARD
// ============================================================================

function ReviewCard({
  review,
  onMarkHelpful,
}: {
  review: Review
  onMarkHelpful: (reviewId: string) => Promise<boolean>
}) {
  const [helpfulClicked, setHelpfulClicked] = useState(false)

  const handleHelpful = async () => {
    if (helpfulClicked) return
    const success = await onMarkHelpful(review.id)
    if (success) setHelpfulClicked(true)
  }

  const timeAgo = getTimeAgo(review.created_at)

  return (
    <div className="border-b last:border-0 pb-6 last:pb-0 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} />
            {review.verified_purchase && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3 w-3" />
                Verified Purchase
              </span>
            )}
          </div>
          {review.title && (
            <h4 className="font-semibold text-foreground">{review.title}</h4>
          )}
        </div>
      </div>

      {/* Body */}
      {review.body && (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {review.body}
        </p>
      )}

      {/* Admin Response */}
      {review.admin_response && (
        <div className="ml-4 pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-md p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Store Response</span>
          </div>
          <p className="text-sm text-muted-foreground">{review.admin_response}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{review.reviewer_name}</span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>

        <button
          onClick={handleHelpful}
          disabled={helpfulClicked}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors',
            helpfulClicked
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <ThumbsUp className={cn('h-3.5 w-3.5', helpfulClicked && 'fill-current')} />
          Helpful{review.helpful_count > 0 && ` (${review.helpful_count})`}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReviewListBlock({
  reviews,
  stats,
  totalReviews,
  isLoading,
  hasMore,
  sortBy,
  onSortChange,
  onLoadMore,
  onMarkHelpful,
  className,
}: ReviewListBlockProps) {
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await onLoadMore()
    setLoadingMore(false)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Overall Rating */}
        <div className="text-center md:text-left flex-shrink-0">
          <div className="text-5xl font-bold text-foreground mb-1">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(stats.averageRating)} size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Distribution */}
        <div className="flex-1 max-w-sm">
          <RatingDistribution stats={stats} />
        </div>
      </div>

      {/* Sort & Count Bar */}
      {totalReviews > 0 && (
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'newest')}
              className="appearance-none text-sm bg-transparent border rounded-md pl-3 pr-8 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading && reviews.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onMarkHelpful={onMarkHelpful}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-colors',
              'text-primary hover:bg-primary/10',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load More Reviews
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

export const reviewListDefinition = {
  type: 'EcommerceReviewList',
  label: 'Review List',
  description: 'Display product reviews with ratings, sort, and helpful votes',
  category: 'ecommerce' as const,
  icon: 'MessageSquare',
  fields: {
    showDistribution: {
      type: 'toggle' as const,
      label: 'Show Rating Distribution',
      defaultValue: true,
    },
    pageSize: {
      type: 'number' as const,
      label: 'Reviews Per Page',
      defaultValue: 10,
    },
  },
  defaultProps: {
    showDistribution: true,
    pageSize: 10,
  },
}
