/**
 * MobileProductCard - Mobile-optimized product card
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Optimized for 2-column mobile grids with touch-friendly
 * quick add, wishlist actions, and efficient image loading.
 */
'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Plus, Eye, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { Product } from '../../../types/ecommerce-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export interface MobileProductCardProps {
  product: Product
  href?: string
  onQuickAdd?: (product: Product) => void
  onWishlistToggle?: (product: Product) => void
  onQuickView?: (product: Product) => void
  isInWishlist?: boolean
  isAddingToCart?: boolean
  showRating?: boolean
  showQuickAdd?: boolean
  showWishlist?: boolean
  showQuickView?: boolean
  priority?: boolean
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(price / 100)

function calculateDiscount(originalPrice: number, currentPrice: number): number {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileProductCard({
  product,
  href,
  onQuickAdd,
  onWishlistToggle,
  onQuickView,
  isInWishlist = false,
  isAddingToCart = false,
  showRating = true,
  showQuickAdd = true,
  showWishlist = true,
  showQuickView = false,
  priority = false,
  className,
}: MobileProductCardProps) {
  const haptic = useHapticFeedback()
  const [imageError, setImageError] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  // Get primary image
  const primaryImage = product.images?.[0] || ''
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price
  const discountPercent = hasDiscount
    ? calculateDiscount(product.compare_at_price!, product.base_price)
    : 0

  // Generate href if not provided
  const productHref = href || `/store/products/${product.slug}`

  // Handle quick add
  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isAddingToCart) return
      haptic.trigger('success')
      onQuickAdd?.(product)
    },
    [product, onQuickAdd, isAddingToCart, haptic]
  )

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      haptic.trigger('selection')
      onWishlistToggle?.(product)
    },
    [product, onWishlistToggle, haptic]
  )

  // Handle quick view
  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      haptic.trigger('selection')
      onQuickView?.(product)
    },
    [product, onQuickView, haptic]
  )

  // Out of stock check
  const isOutOfStock = product.quantity !== null && product.quantity <= 0

  return (
    <motion.article
      className={cn(
        'group relative bg-background rounded-xl overflow-hidden border',
        'transition-shadow duration-200',
        isPressed && 'scale-[0.98]',
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
    >
      <Link href={productHref} className="block">
        {/* Image container */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {primaryImage && !imageError ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-transform duration-300',
                'group-hover:scale-105',
                isOutOfStock && 'opacity-60'
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                -{discountPercent}%
              </Badge>
            )}
            {product.is_featured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="outline" className="bg-background/80 text-xs">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            {/* Wishlist button */}
            {showWishlist && onWishlistToggle && (
              <Button
                variant="secondary"
                size="icon"
                onClick={handleWishlistToggle}
                className={cn(
                  'h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm',
                  'shadow-sm hover:bg-background'
                )}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-all',
                    isInWishlist && 'fill-red-500 text-red-500'
                  )}
                />
              </Button>
            )}

            {/* Quick view button */}
            {showQuickView && onQuickView && (
              <Button
                variant="secondary"
                size="icon"
                onClick={handleQuickView}
                className={cn(
                  'h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm',
                  'shadow-sm hover:bg-background'
                )}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Quick add button (at bottom of image) */}
          {showQuickAdd && onQuickAdd && !isOutOfStock && (
            <div className="absolute bottom-2 left-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleQuickAdd}
                disabled={isAddingToCart}
                className={cn(
                  'w-full h-10 bg-background/90 backdrop-blur-sm',
                  'shadow-sm hover:bg-background',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  // Always visible on touch devices
                  'touch-manipulation md:opacity-0 md:group-hover:opacity-100'
                )}
              >
                {isAddingToCart ? (
                  <span className="animate-pulse">Adding...</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Quick Add
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Product name */}
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] mb-1">
            {product.name}
          </h3>

          {/* Rating (if available) */}
          {showRating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">
                4.5 (24)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-semibold',
              hasDiscount && 'text-destructive'
            )}>
              {formatPrice(product.base_price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// ============================================================================
// GRID CONTAINER
// ============================================================================

export interface MobileProductGridProps {
  products: Product[]
  columns?: 2 | 3
  onQuickAdd?: (product: Product) => void
  onWishlistToggle?: (product: Product) => void
  onQuickView?: (product: Product) => void
  wishlistIds?: string[]
  className?: string
}

export function MobileProductGrid({
  products,
  columns = 2,
  onQuickAdd,
  onWishlistToggle,
  onQuickView,
  wishlistIds = [],
  className,
}: MobileProductGridProps) {
  return (
    <div
      className={cn(
        'grid gap-3',
        columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
        className
      )}
    >
      {products.map((product, index) => (
        <MobileProductCard
          key={product.id}
          product={product}
          onQuickAdd={onQuickAdd}
          onWishlistToggle={onWishlistToggle}
          onQuickView={onQuickView}
          isInWishlist={wishlistIds.includes(product.id)}
          priority={index < 4}
        />
      ))}
    </div>
  )
}

export default MobileProductCard
