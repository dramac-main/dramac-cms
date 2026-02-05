/**
 * ProductRatingDisplay - Rating stars display
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Displays product rating with stars and review count.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Star, StarHalf } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ProductRatingDisplayProps {
  /** Rating value (0-5) */
  rating: number
  /** Number of reviews */
  reviewCount?: number
  /** Maximum rating value */
  maxRating?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the review count */
  showCount?: boolean
  /** Additional class name */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductRatingDisplay({
  rating,
  reviewCount,
  maxRating = 5,
  size = 'md',
  showCount = true,
  className
}: ProductRatingDisplayProps) {
  const sizeClasses = {
    sm: { star: 'h-3.5 w-3.5', text: 'text-xs' },
    md: { star: 'h-4 w-4', text: 'text-sm' },
    lg: { star: 'h-5 w-5', text: 'text-base' }
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size].star, 'fill-amber-400 text-amber-400')}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(sizeClasses[size].star, 'text-gray-300 dark:text-gray-600')}
            />
            <StarHalf
              className={cn(
                sizeClasses[size].star, 
                'absolute left-0 top-0 fill-amber-400 text-amber-400'
              )}
            />
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size].star, 'text-gray-300 dark:text-gray-600')}
          />
        ))}
      </div>

      {showCount && reviewCount !== undefined && (
        <span className={cn('text-muted-foreground', sizeClasses[size].text)}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
