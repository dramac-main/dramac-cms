/**
 * ProductSwipeView - Tinder-style product discovery
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * A swipeable card-based product discovery experience where users
 * can swipe right to wishlist, left to skip, or up to add to cart.
 * Inspired by dating app UX patterns for engaging product exploration.
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Heart, X, ShoppingCart, ChevronDown, Star, Undo2, Info, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { Product } from '../../../types/ecommerce-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export type SwipeAction = 'wishlist' | 'skip' | 'cart' | 'details'

export interface ProductSwipeViewProps {
  products: Product[]
  onSwipe: (product: Product, action: SwipeAction) => void
  onUndo?: () => void
  onProductClick?: (product: Product) => void
  canUndo?: boolean
  showButtons?: boolean
  className?: string
}

export interface SwipeableProductCardProps {
  product: Product
  isTopCard: boolean
  onSwipe: (action: SwipeAction) => void
  onProductClick?: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 100
const ROTATION_MULTIPLIER = 0.1
const CARD_STACK_OFFSET = 8

// Action colors
const ACTION_COLORS = {
  wishlist: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  skip: { bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' },
  cart: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(price)
}

// ============================================================================
// SWIPEABLE CARD COMPONENT
// ============================================================================

function SwipeableProductCard({
  product,
  isTopCard,
  onSwipe,
  onProductClick,
}: SwipeableProductCardProps) {
  const haptic = useHapticFeedback()
  const controls = useAnimation()
  
  // State for showing action indicators
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null)
  const [swipeProgress, setSwipeProgress] = useState(0)

  // Get primary image
  const primaryImage = product.images?.[0] || ''
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price

  // Handle drag
  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info
      const absX = Math.abs(offset.x)
      const absY = Math.abs(offset.y)
      
      // Determine primary direction
      if (offset.y < -50 && absY > absX) {
        setSwipeDirection('up')
        setSwipeProgress(Math.min(1, absY / SWIPE_THRESHOLD))
      } else if (offset.x > 30 && absX > absY) {
        setSwipeDirection('right')
        setSwipeProgress(Math.min(1, absX / SWIPE_THRESHOLD))
      } else if (offset.x < -30 && absX > absY) {
        setSwipeDirection('left')
        setSwipeProgress(Math.min(1, absX / SWIPE_THRESHOLD))
      } else {
        setSwipeDirection(null)
        setSwipeProgress(0)
      }
    },
    []
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info
      const absX = Math.abs(offset.x)
      const absY = Math.abs(offset.y)
      
      // Determine if swipe threshold met
      const isSwipeRight = offset.x > SWIPE_THRESHOLD || velocity.x > 500
      const isSwipeLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -500
      const isSwipeUp = offset.y < -SWIPE_THRESHOLD || velocity.y < -500

      if (isSwipeUp && absY > absX) {
        // Swipe up - Add to cart
        haptic.trigger('success')
        await controls.start({
          y: -window.innerHeight,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        onSwipe('cart')
      } else if (isSwipeRight && absX > absY) {
        // Swipe right - Wishlist
        haptic.trigger('medium')
        await controls.start({
          x: window.innerWidth,
          rotate: 20,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        onSwipe('wishlist')
      } else if (isSwipeLeft && absX > absY) {
        // Swipe left - Skip
        haptic.trigger('light')
        await controls.start({
          x: -window.innerWidth,
          rotate: -20,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        onSwipe('skip')
      } else {
        // Return to center
        await controls.start({
          x: 0,
          y: 0,
          rotate: 0,
          transition: { type: 'spring', stiffness: 300, damping: 25 },
        })
      }

      setSwipeDirection(null)
      setSwipeProgress(0)
    },
    [controls, haptic, onSwipe]
  )

  // Handle button clicks
  const handleButtonClick = useCallback(
    async (action: SwipeAction) => {
      haptic.trigger(action === 'skip' ? 'light' : action === 'wishlist' ? 'medium' : 'success')
      
      switch (action) {
        case 'wishlist':
          await controls.start({
            x: window.innerWidth,
            rotate: 20,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          break
        case 'skip':
          await controls.start({
            x: -window.innerWidth,
            rotate: -20,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          break
        case 'cart':
          await controls.start({
            y: -window.innerHeight,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          break
      }
      
      onSwipe(action)
    },
    [controls, haptic, onSwipe]
  )

  return (
    <motion.div
      className={cn(
        'absolute inset-x-4 top-0',
        isTopCard ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      )}
      style={{ originX: 0.5, originY: 0 }}
      animate={controls}
      drag={isTopCard}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={isTopCard ? { scale: 1.02 } : undefined}
    >
      <div className="relative bg-background rounded-2xl overflow-hidden shadow-xl border">
        {/* Image */}
        <div 
          className="relative aspect-[3/4] bg-muted"
          onClick={() => onProductClick?.()}
        >
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 400px"
              priority={isTopCard}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}

          {/* Swipe indicator overlays */}
          <AnimatePresence>
            {swipeDirection === 'right' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: swipeProgress }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
              >
                <div className={cn(
                  'p-6 rounded-full border-4',
                  ACTION_COLORS.wishlist.border,
                  ACTION_COLORS.wishlist.text
                )}>
                  <Heart className="h-16 w-16" />
                </div>
              </motion.div>
            )}
            
            {swipeDirection === 'left' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: swipeProgress }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-500/20 flex items-center justify-center"
              >
                <div className={cn(
                  'p-6 rounded-full border-4',
                  ACTION_COLORS.skip.border,
                  ACTION_COLORS.skip.text
                )}>
                  <X className="h-16 w-16" />
                </div>
              </motion.div>
            )}
            
            {swipeDirection === 'up' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: swipeProgress }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
              >
                <div className={cn(
                  'p-6 rounded-full border-4',
                  ACTION_COLORS.cart.border,
                  ACTION_COLORS.cart.text
                )}>
                  <ShoppingCart className="h-16 w-16" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {hasDiscount && (
              <Badge variant="destructive">Sale</Badge>
            )}
            {product.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="font-semibold text-xl line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {formatPrice(product.base_price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-white/70 line-through">
                  {formatPrice(product.compare_at_price!)}
                </span>
              )}
            </div>
            
            {/* Rating placeholder */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm">4.5</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {isTopCard && (
          <div className="absolute bottom-[-60px] inset-x-0 flex justify-center gap-4 pointer-events-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleButtonClick('skip')}
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <X className="h-6 w-6 text-gray-500" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleButtonClick('cart')}
              className="h-16 w-16 rounded-full shadow-lg bg-green-500 hover:bg-green-600 border-green-500"
            >
              <ShoppingCart className="h-7 w-7 text-white" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleButtonClick('wishlist')}
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <Heart className="h-6 w-6 text-red-500" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductSwipeView({
  products,
  onSwipe,
  onUndo,
  onProductClick,
  canUndo = false,
  showButtons = true,
  className,
}: ProductSwipeViewProps) {
  const haptic = useHapticFeedback()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<Array<{ product: Product; action: SwipeAction }>>([])

  // Visible products (current + next few for stack effect)
  const visibleProducts = useMemo(() => {
    return products.slice(currentIndex, currentIndex + 3)
  }, [products, currentIndex])

  // Handle swipe
  const handleSwipe = useCallback(
    (product: Product, action: SwipeAction) => {
      // Save to history for undo
      setHistory((prev) => [...prev, { product, action }])
      
      // Move to next product
      setCurrentIndex((prev) => prev + 1)
      
      // Notify parent
      onSwipe(product, action)
    },
    [onSwipe]
  )

  // Handle undo
  const handleUndo = useCallback(() => {
    if (history.length === 0 || !canUndo) return
    
    haptic.trigger('light')
    setCurrentIndex((prev) => Math.max(0, prev - 1))
    setHistory((prev) => prev.slice(0, -1))
    onUndo?.()
  }, [history.length, canUndo, haptic, onUndo])

  // Handle product click
  const handleProductClick = useCallback(
    (product: Product) => {
      haptic.trigger('selection')
      onProductClick?.(product)
    },
    [haptic, onProductClick]
  )

  // Empty state
  if (currentIndex >= products.length) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <div className="text-center p-8">
          <PartyPopper className="h-16 w-16 mb-4 text-green-500" />
          <h3 className="text-xl font-semibold mb-2">You've seen them all!</h3>
          <p className="text-muted-foreground mb-4">
            Check out your wishlist or cart
          </p>
          {canUndo && history.length > 0 && (
            <Button variant="outline" onClick={handleUndo}>
              <Undo2 className="h-4 w-4 mr-2" />
              Go back
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative h-full', className)}>
      {/* Instructions */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center gap-4 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <X className="h-3 w-3" /> Skip
        </span>
        <span className="flex items-center gap-1">
          <ChevronDown className="h-3 w-3 rotate-180" /> Cart
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" /> Wishlist
        </span>
      </div>

      {/* Card stack */}
      <div className="relative h-full pt-8 pb-20">
        {visibleProducts.map((product, index) => (
          <div
            key={product.id}
            className="absolute inset-x-0 top-8"
            style={{
              transform: `scale(${1 - index * 0.05}) translateY(${index * CARD_STACK_OFFSET}px)`,
              zIndex: visibleProducts.length - index,
              opacity: 1 - index * 0.2,
            }}
          >
            <SwipeableProductCard
              product={product}
              isTopCard={index === 0}
              onSwipe={(action) => handleSwipe(product, action)}
              onProductClick={() => handleProductClick(product)}
            />
          </div>
        ))}
      </div>

      {/* Counter and undo */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {products.length}
        </span>
        
        {canUndo && history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="min-h-[44px]"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
        )}
      </div>
    </div>
  )
}

export default ProductSwipeView
