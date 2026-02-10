/**
 * ActiveFilters - Display active filter tags
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Shows active filters with remove capability.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FilterState, PriceRange } from '@/modules/ecommerce/hooks/useProductFilters'

// ============================================================================
// TYPES
// ============================================================================

interface ActiveFiltersProps {
  filters: FilterState
  onRemoveCategory: (id: string) => void
  onRemoveBrand: (brand: string) => void
  onRemovePriceRange: () => void
  onRemoveInStock: () => void
  onRemoveOnSale: () => void
  onRemoveRating: () => void
  onRemoveAttribute: (name: string, value: string) => void
  onRemoveTag: (tag: string) => void
  onClearAll: () => void
  categoryLabels?: Record<string, string>
  formatPrice?: (price: number) => string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActiveFilters({
  filters,
  onRemoveCategory,
  onRemoveBrand,
  onRemovePriceRange,
  onRemoveInStock,
  onRemoveOnSale,
  onRemoveRating,
  onRemoveAttribute,
  onRemoveTag,
  onClearAll,
  categoryLabels = {},
  formatPrice = (p) => `${DEFAULT_CURRENCY_SYMBOL}${p}`,
  className
}: ActiveFiltersProps) {
  const hasFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange.min !== null ||
    filters.priceRange.max !== null ||
    filters.inStock !== null ||
    filters.onSale !== null ||
    filters.rating !== null ||
    Object.values(filters.attributes).flat().length > 0 ||
    filters.tags.length > 0

  if (!hasFilters) return null

  const formatPriceRange = (range: PriceRange) => {
    if (range.min !== null && range.max !== null) {
      return `${formatPrice(range.min)} - ${formatPrice(range.max)}`
    }
    if (range.min !== null) {
      return `From ${formatPrice(range.min)}`
    }
    if (range.max !== null) {
      return `Up to ${formatPrice(range.max)}`
    }
    return ''
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {/* Categories */}
      {filters.categories.map(catId => (
        <Badge key={catId} variant="secondary" className="gap-1">
          {categoryLabels[catId] || catId}
          <button onClick={() => onRemoveCategory(catId)} aria-label={`Remove ${categoryLabels[catId] || catId} filter`}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Brands */}
      {filters.brands.map(brand => (
        <Badge key={brand} variant="secondary" className="gap-1">
          {brand}
          <button onClick={() => onRemoveBrand(brand)} aria-label={`Remove ${brand} filter`}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Price Range */}
      {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
        <Badge variant="secondary" className="gap-1">
          {formatPriceRange(filters.priceRange)}
          <button onClick={onRemovePriceRange} aria-label="Remove price filter">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* In Stock */}
      {filters.inStock !== null && (
        <Badge variant="secondary" className="gap-1">
          {filters.inStock ? 'In Stock' : 'Out of Stock'}
          <button onClick={onRemoveInStock} aria-label="Remove stock filter">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* On Sale */}
      {filters.onSale && (
        <Badge variant="secondary" className="gap-1">
          On Sale
          <button onClick={onRemoveOnSale} aria-label="Remove sale filter">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Rating */}
      {filters.rating !== null && (
        <Badge variant="secondary" className="gap-1">
          {filters.rating}+ Stars
          <button onClick={onRemoveRating} aria-label="Remove rating filter">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Attributes */}
      {Object.entries(filters.attributes).map(([name, values]) =>
        values.map(value => (
          <Badge key={`${name}-${value}`} variant="secondary" className="gap-1">
            {name}: {value}
            <button onClick={() => onRemoveAttribute(name, value)} aria-label={`Remove ${name}: ${value} filter`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))
      )}

      {/* Tags */}
      {filters.tags.map(tag => (
        <Badge key={tag} variant="secondary" className="gap-1">
          #{tag}
          <button onClick={() => onRemoveTag(tag)} aria-label={`Remove ${tag} tag`}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Clear All */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-destructive hover:text-destructive"
      >
        Clear all
      </Button>
    </div>
  )
}
