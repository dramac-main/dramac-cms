/**
 * SwipeableCartItem - Swipeable cart line item
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Cart item with swipe gestures for delete and wishlist actions.
 * Swipe left to reveal delete, swipe right for wishlist.
 */
'use client'

import React, { useCallback, useState } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { Trash2, Heart, Minus, Plus, Package } from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/locale-config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { CartItem } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface SwipeableCartItemProps {
  item: CartItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onMoveToWishlist?: () => void
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 80 // pixels to reveal action
const DELETE_THRESHOLD = 150 // pixels to trigger delete
const SPRING_CONFIG = { type: 'spring' as const, stiffness: 400, damping: 30 }

// ============================================================================
// HELPERS
// ============================================================================

function getItemImage(item: CartItem): string | null {
  if (item.product?.images && item.product.images.length > 0) {
    return item.product.images[0]
  }
  return null
}

function getItemName(item: CartItem): string {
  if (item.product?.name) {
    return item.product.name
  }
  return 'Product'
}

function getVariantName(item: CartItem): string | null {
  if (item.variant?.options) {
    const options = item.variant.options as Record<string, string>
    const values = Object.values(options)
    if (values.length > 0) {
      return values.join(' / ')
    }
  }
  return null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SwipeableCartItem({
  item,
  onQuantityChange,
  onRemove,
  onMoveToWishlist,
  className,
}: SwipeableCartItemProps) {
  const haptic = useHapticFeedback()
  const controls = useAnimation()
  
  const [isRevealed, setIsRevealed] = useState<'none' | 'left' | 'right'>('none')
  const [isDeleting, setIsDeleting] = useState(false)

  const imageUrl = getItemImage(item)
  const itemName = getItemName(item)
  const variantName = getVariantName(item)
  const lineTotal = item.unit_price * item.quantity

  // Handle drag
  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info

      // Update revealed state based on drag position
      if (offset.x < -SWIPE_THRESHOLD) {
        setIsRevealed('left')
      } else if (offset.x > SWIPE_THRESHOLD && onMoveToWishlist) {
        setIsRevealed('right')
      } else {
        setIsRevealed('none')
      }
    },
    [onMoveToWishlist]
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      // Delete on far left swipe
      if (offset.x < -DELETE_THRESHOLD || (offset.x < -SWIPE_THRESHOLD && velocity.x < -500)) {
        haptic.trigger('warning')
        setIsDeleting(true)
        controls.start({
          x: -500,
          opacity: 0,
          transition: { duration: 0.3 },
        }).then(() => {
          onRemove()
        })
        return
      }

      // Wishlist on far right swipe
      if (onMoveToWishlist && (offset.x > DELETE_THRESHOLD || (offset.x > SWIPE_THRESHOLD && velocity.x > 500))) {
        haptic.trigger('success')
        setIsDeleting(true)
        controls.start({
          x: 500,
          opacity: 0,
          transition: { duration: 0.3 },
        }).then(() => {
          onMoveToWishlist()
        })
        return
      }

      // Snap to revealed position or reset
      if (offset.x < -SWIPE_THRESHOLD / 2) {
        haptic.trigger('selection')
        setIsRevealed('left')
        controls.start({ x: -SWIPE_THRESHOLD, transition: SPRING_CONFIG })
      } else if (offset.x > SWIPE_THRESHOLD / 2 && onMoveToWishlist) {
        haptic.trigger('selection')
        setIsRevealed('right')
        controls.start({ x: SWIPE_THRESHOLD, transition: SPRING_CONFIG })
      } else {
        setIsRevealed('none')
        controls.start({ x: 0, transition: SPRING_CONFIG })
      }
    },
    [controls, haptic, onRemove, onMoveToWishlist]
  )

  // Handle action button clicks
  const handleDelete = useCallback(() => {
    haptic.trigger('warning')
    setIsDeleting(true)
    controls.start({
      x: -500,
      opacity: 0,
      transition: { duration: 0.3 },
    }).then(() => {
      onRemove()
    })
  }, [controls, haptic, onRemove])

  const handleWishlist = useCallback(() => {
    if (!onMoveToWishlist) return
    haptic.trigger('success')
    setIsDeleting(true)
    controls.start({
      x: 500,
      opacity: 0,
      transition: { duration: 0.3 },
    }).then(() => {
      onMoveToWishlist()
    })
  }, [controls, haptic, onMoveToWishlist])

  // Handle quantity changes
  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      haptic.trigger('selection')
      onQuantityChange(item.quantity - 1)
    } else {
      handleDelete()
    }
  }, [item.quantity, onQuantityChange, haptic, handleDelete])

  const handleIncrement = useCallback(() => {
    haptic.trigger('selection')
    onQuantityChange(item.quantity + 1)
  }, [item.quantity, onQuantityChange, haptic])

  // Reset position
  const resetPosition = useCallback(() => {
    setIsRevealed('none')
    controls.start({ x: 0, transition: SPRING_CONFIG })
  }, [controls])

  if (isDeleting) {
    return null
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Delete action background (left swipe) */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 w-24',
          'flex items-center justify-center',
          'bg-destructive text-destructive-foreground'
        )}
      >
        <button
          onClick={handleDelete}
          className="flex flex-col items-center gap-1 p-4 min-h-[44px] min-w-[44px]"
          aria-label="Remove item"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-xs">Remove</span>
        </button>
      </div>

      {/* Wishlist action background (right swipe) */}
      {onMoveToWishlist && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-24',
            'flex items-center justify-center',
            'bg-pink-500 text-white'
          )}
        >
          <button
            onClick={handleWishlist}
            className="flex flex-col items-center gap-1 p-4 min-h-[44px] min-w-[44px]"
            aria-label="Move to wishlist"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Wishlist</span>
          </button>
        </div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -DELETE_THRESHOLD, right: onMoveToWishlist ? DELETE_THRESHOLD : 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={cn(
          'relative bg-background',
          'flex items-center gap-3 p-3',
          'border rounded-lg',
          'touch-pan-y'
        )}
        onClick={isRevealed !== 'none' ? resetPosition : undefined}
      >
        {/* Product image */}
        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={itemName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2">{itemName}</h4>
          
          {/* Variant info */}
          {variantName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {variantName}
            </p>
          )}

          {/* Price */}
          <p className="text-sm font-semibold mt-1">
            {formatCurrency(item.unit_price / 100)}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              className="h-9 w-9 min-h-[44px] min-w-[44px]"
              aria-label="Decrease quantity"
            >
              {item.quantity === 1 ? (
                <Trash2 className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
            </Button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              className="h-9 w-9 min-h-[44px] min-w-[44px]"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Line total */}
          <p className="text-sm font-semibold">
            {formatCurrency(lineTotal / 100)}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SwipeableCartItem
