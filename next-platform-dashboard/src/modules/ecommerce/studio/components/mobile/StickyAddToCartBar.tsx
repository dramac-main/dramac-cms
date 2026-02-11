/**
 * StickyAddToCartBar - Fixed CTA bar when main button scrolls away
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * A sticky bar that appears at the bottom of the screen when the main
 * Add to Cart button scrolls out of view. Uses IntersectionObserver
 * for efficient visibility detection.
 */
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Loader2, Check, Heart, Minus, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/locale-config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { Product } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface StickyAddToCartBarProps {
  product: Product
  selectedVariantPrice?: number | null
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void | Promise<void>
  onWishlistToggle?: () => void
  isInWishlist?: boolean
  isAddingToCart?: boolean
  addedToCart?: boolean
  disabled?: boolean
  maxQuantity?: number
  targetRef?: React.RefObject<HTMLElement | null>
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StickyAddToCartBar({
  product,
  selectedVariantPrice,
  quantity,
  onQuantityChange,
  onAddToCart,
  onWishlistToggle,
  isInWishlist = false,
  isAddingToCart = false,
  addedToCart = false,
  disabled = false,
  maxQuantity = 99,
  targetRef,
  className,
}: StickyAddToCartBarProps) {
  const haptic = useHapticFeedback()
  const [isVisible, setIsVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  // Current price (variant price or base price)
  const currentPrice = selectedVariantPrice ?? product.base_price
  const totalPrice = currentPrice ? currentPrice * quantity : 0

  // Intersection Observer to track main CTA visibility
  useEffect(() => {
    if (!targetRef?.current) {
      // If no target ref, always show (for standalone use)
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when target is NOT visible
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0.5,
        rootMargin: '-10px 0px 0px 0px',
      }
    )

    observer.observe(targetRef.current)

    return () => {
      observer.disconnect()
    }
  }, [targetRef])

  // Handle quantity decrease
  const handleDecrease = useCallback(() => {
    if (quantity > 1) {
      haptic.trigger('selection')
      onQuantityChange(quantity - 1)
    }
  }, [quantity, onQuantityChange, haptic])

  // Handle quantity increase
  const handleIncrease = useCallback(() => {
    if (quantity < maxQuantity) {
      haptic.trigger('selection')
      onQuantityChange(quantity + 1)
    }
  }, [quantity, maxQuantity, onQuantityChange, haptic])

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (disabled || isAddingToCart) return
    haptic.trigger('success')
    await onAddToCart()
  }, [disabled, isAddingToCart, onAddToCart, haptic])

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(() => {
    haptic.trigger('selection')
    onWishlistToggle?.()
  }, [onWishlistToggle, haptic])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={barRef}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40',
            'bg-background border-t shadow-lg',
            className
          )}
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="px-4 py-3">
            {/* Price and product info */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalPrice)}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {product.name}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-1 bg-muted rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || disabled}
                  className="min-h-[40px] min-w-[40px] rounded-lg"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium tabular-nums">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleIncrease}
                  disabled={quantity >= maxQuantity || disabled}
                  className="min-h-[40px] min-w-[40px] rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Wishlist button */}
              {onWishlistToggle && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWishlistToggle}
                  className="min-h-[48px] min-w-[48px] shrink-0"
                >
                  <Heart
                    className={cn(
                      'h-5 w-5 transition-all',
                      isInWishlist && 'fill-red-500 text-red-500'
                    )}
                  />
                </Button>
              )}

              {/* Add to Cart button */}
              <Button
                onClick={handleAddToCart}
                disabled={disabled || isAddingToCart}
                className={cn(
                  'flex-1 min-h-[48px] text-base font-semibold',
                  addedToCart && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// HOOK FOR TARGET REF
// ============================================================================

/**
 * Hook to create a target ref for the sticky bar observer
 */
export function useStickyAddToCartTarget() {
  const targetRef = useRef<HTMLDivElement>(null)

  const TargetComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => (
      <div ref={ref || targetRef} {...props} />
    )
  )
  TargetComponent.displayName = 'StickyAddToCartTarget'

  return { targetRef, TargetComponent }
}

export default StickyAddToCartBar
