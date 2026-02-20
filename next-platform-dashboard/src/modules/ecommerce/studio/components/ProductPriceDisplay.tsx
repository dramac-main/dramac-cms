/**
 * ProductPriceDisplay - Price display utility
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Displays product prices with sale price, currency formatting, and responsive sizing.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// TYPES
// ============================================================================

interface ProductPriceDisplayProps {
  /** Current price */
  price: number
  /** Original/compare-at price (for showing discounts) */
  compareAtPrice?: number | null
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show the compare-at price */
  showCompareAt?: boolean
  /** Whether to show the savings badge */
  showSavingsBadge?: boolean
  /** Additional class name */
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateSavings(original: number, current: number): number {
  if (original <= current) return 0
  return Math.round(((original - current) / original) * 100)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductPriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  showCompareAt = true,
  showSavingsBadge = false,
  className
}: ProductPriceDisplayProps) {
  const storefront = useStorefront()
  
  // Format price helper
  const formatPrice = (amount: number) => {
    if (storefront?.formatPrice) {
      return storefront.formatPrice(amount)
    }
    return `${DEFAULT_CURRENCY_SYMBOL}${(amount / 100).toFixed(2)}`
  }

  const hasDiscount = compareAtPrice && compareAtPrice > price
  const savings = hasDiscount ? calculateSavings(compareAtPrice, price) : 0

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
    xl: 'text-2xl font-bold'
  }
  
  const compareSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Current Price */}
      <span className={cn(
        sizeClasses[size],
        hasDiscount ? 'text-red-600 dark:text-red-500' : 'text-foreground'
      )}>
        {formatPrice(price)}
      </span>
      
      {/* Compare At Price */}
      {showCompareAt && hasDiscount && (
        <span className={cn(
          compareSizeClasses[size],
          'text-muted-foreground line-through'
        )}>
          {formatPrice(compareAtPrice)}
        </span>
      )}
      
      {/* Savings Badge */}
      {showSavingsBadge && savings > 0 && (
        <Badge variant="destructive" className="text-xs">
          Save {savings}%
        </Badge>
      )}
    </div>
  )
}
