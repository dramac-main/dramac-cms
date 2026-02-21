/**
 * ReviewFormBlock - Review submission form for storefront
 * 
 * Phase ECOM-60: Product Reviews & Ratings
 * 
 * Allows customers to submit product reviews with star rating,
 * title, and body text. Handles validation and submission state.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Star, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { ReviewInput } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ReviewFormBlockProps {
  siteId: string
  productId: string
  userId?: string | null
  userName?: string
  userEmail?: string
  onSubmit: (input: Omit<ReviewInput, 'site_id' | 'product_id'>) => Promise<{ success: boolean; error?: string }>
  className?: string
}

// ============================================================================
// INTERACTIVE STAR RATING
// ============================================================================

function StarRatingInput({
  value,
  onChange,
  size = 'lg',
}: {
  value: number
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              (hoverRating || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-muted-foreground/40'
            )}
          />
        </button>
      ))}
      {(hoverRating || value) > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {hoverRating || value} / 5
        </span>
      )}
    </div>
  )
}

// ============================================================================
// REVIEW FORM COMPONENT
// ============================================================================

export function ReviewFormBlock({
  siteId,
  productId,
  userId,
  userName = '',
  userEmail = '',
  onSubmit,
  className,
}: ReviewFormBlockProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [name, setName] = useState(userName)
  const [email, setEmail] = useState(userEmail)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onSubmit({
        user_id: userId,
        reviewer_name: name.trim(),
        reviewer_email: email.trim() || undefined,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      })

      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Failed to submit review')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={cn(
        'rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-6 text-center',
        className
      )}>
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
          Thank You for Your Review!
        </h3>
        <p className="text-sm text-green-600 dark:text-green-500">
          Your review has been submitted and will be visible after moderation.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('rounded-lg border bg-card p-6 space-y-5', className)}
    >
      <h3 className="text-lg font-semibold">Write a Review</h3>

      {/* Star Rating */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      {/* Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="review-name" className="text-sm font-medium text-foreground mb-1.5 block">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="review-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label htmlFor="review-email" className="text-sm font-medium text-foreground mb-1.5 block">
            Email <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="review-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="text-sm font-medium text-foreground mb-1.5 block">
          Review Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={120}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="review-body" className="text-sm font-medium text-foreground mb-1.5 block">
          Your Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell others about your experience with this product..."
          rows={4}
          maxLength={2000}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">{body.length}/2000</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Review
          </>
        )}
      </button>
    </form>
  )
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

export const reviewFormDefinition = {
  type: 'EcommerceReviewForm',
  label: 'Review Form',
  description: 'Form for customers to submit product reviews with star ratings',
  category: 'ecommerce',
  icon: 'MessageSquarePlus',
  fields: {
    requireEmail: {
      type: 'toggle' as const,
      label: 'Require Email',
      defaultValue: false,
    },
  },
  defaultProps: {
    requireEmail: false,
  },
}
