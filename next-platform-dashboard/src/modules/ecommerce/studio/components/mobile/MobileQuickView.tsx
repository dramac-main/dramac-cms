/**
 * MobileQuickView - Bottom sheet product quick view
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * A mobile-optimized quick view that shows product details
 * in a bottom sheet without navigating to the full product page.
 * Includes image gallery, variant selection, and add to cart.
 */
'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Heart, Share2, ChevronRight, Minus, Plus, ShoppingCart, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { useSwipeGesture } from '../../../hooks/useSwipeGesture'
import type { Product, ProductVariant } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface VariantOption {
  name: string
  values: string[]
  type?: 'color' | 'size' | 'text'
}

export interface MobileQuickViewProps {
  product: Product | null
  variants?: ProductVariant[]
  options?: VariantOption[]
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, variant: ProductVariant | null, quantity: number) => void | Promise<void>
  onWishlistToggle?: (product: Product) => void
  onShare?: (product: Product) => void
  onViewFullDetails?: (product: Product) => void
  isInWishlist?: boolean
  isAddingToCart?: boolean
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  black: '#171717',
  white: '#ffffff',
  gray: '#6b7280',
  grey: '#6b7280',
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function getColorHex(colorName: string): string | null {
  if (!colorName) return null
  return COLOR_MAP[colorName.toLowerCase()] || null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileQuickView({
  product,
  variants = [],
  options = [],
  isOpen,
  onClose,
  onAddToCart,
  onWishlistToggle,
  onShare,
  onViewFullDetails,
  isInWishlist = false,
  isAddingToCart = false,
  className,
}: MobileQuickViewProps) {
  const haptic = useHapticFeedback()
  
  // State
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1)
      setSelectedOptions({})
      setCurrentImageIndex(0)
      setAddedToCart(false)
    }
  }, [product?.id])

  // Swipe gesture for closing
  const { handlers: swipeHandlers } = useSwipeGesture({
    onSwipeDown: () => {
      haptic.trigger('selection')
      onClose()
    },
    threshold: 100,
  })

  // Find selected variant
  const selectedVariant = useMemo(() => {
    if (!variants.length || Object.keys(selectedOptions).length !== options.length) {
      return null
    }
    
    return variants.find((variant) => {
      if (!variant.options) return false
      for (const [key, value] of Object.entries(selectedOptions)) {
        if (variant.options[key] !== value) return false
      }
      return true
    }) || null
  }, [variants, selectedOptions, options.length])

  // Calculate current price
  const currentPrice = selectedVariant?.price ?? product?.base_price ?? 0
  const hasDiscount = product?.compare_at_price && product.compare_at_price > (product?.base_price ?? 0)

  // Handle option change
  const handleOptionChange = useCallback((optionName: string, value: string) => {
    haptic.trigger('selection')
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }))
  }, [haptic])

  // Handle quantity change
  const handleQuantityChange = useCallback((delta: number) => {
    haptic.trigger('selection')
    setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)))
  }, [haptic])

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!product || isAddingToCart) return
    
    haptic.trigger('success')
    await onAddToCart(product, selectedVariant, quantity)
    setAddedToCart(true)
    
    // Reset after 2 seconds
    setTimeout(() => setAddedToCart(false), 2000)
  }, [product, selectedVariant, quantity, isAddingToCart, onAddToCart, haptic])

  // Handle wishlist
  const handleWishlistToggle = useCallback(() => {
    if (!product) return
    haptic.trigger('selection')
    onWishlistToggle?.(product)
  }, [product, onWishlistToggle, haptic])

  // Handle share
  const handleShare = useCallback(async () => {
    if (!product) return
    haptic.trigger('selection')
    
    if (onShare) {
      onShare(product)
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || '',
          url: `/store/products/${product.slug}`,
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }, [product, onShare, haptic])

  // Handle view full details
  const handleViewFullDetails = useCallback(() => {
    if (!product) return
    haptic.trigger('selection')
    onViewFullDetails?.(product)
    onClose()
  }, [product, onViewFullDetails, onClose, haptic])

  // Check if can add to cart
  const canAddToCart = product && !isAddingToCart && (
    options.length === 0 || Object.keys(selectedOptions).length === options.length
  )

  // Is out of stock
  const isOutOfStock = selectedVariant 
    ? (selectedVariant.quantity !== null && selectedVariant.quantity <= 0)
    : (product?.quantity !== null && (product?.quantity ?? 0) <= 0)

  if (!product) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
              if (info.offset.y > 100) {
                onClose()
              }
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-3xl',
              'max-h-[85vh] overflow-hidden flex flex-col',
              className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            {...swipeHandlers}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
              <h2 className="text-lg font-semibold">Quick View</h2>
              <div className="flex items-center gap-1">
                {onShare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                )}
                {onWishlistToggle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleWishlistToggle}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5 transition-all',
                        isInWishlist && 'fill-red-500 text-red-500'
                      )}
                    />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4">
              {/* Product images */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-4">
                {product.images && product.images.length > 0 ? (
                  <>
                    <Image
                      src={product.images[currentImageIndex]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    
                    {/* Image indicators */}
                    {product.images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className="p-1.5"
                          >
                            <span
                              className={cn(
                                'block w-2 h-2 rounded-full transition-all',
                                index === currentImageIndex
                                  ? 'bg-primary w-4'
                                  : 'bg-primary/40'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}

                {/* Badges */}
                {hasDiscount && (
                  <Badge variant="destructive" className="absolute top-3 left-3">
                    Sale
                  </Badge>
                )}
              </div>

              {/* Product info */}
              <div className="space-y-4 pb-4">
                {/* Name and price */}
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {formatPrice(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-muted-foreground line-through">
                        {formatPrice(product.compare_at_price!)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* Variant options */}
                {options.length > 0 && (
                  <div className="space-y-4">
                    {options.map((option) => (
                      <div key={option.name}>
                        <label className="text-sm font-medium mb-2 block">
                          {option.name}: {selectedOptions[option.name] && (
                            <span className="font-normal text-muted-foreground">
                              {selectedOptions[option.name]}
                            </span>
                          )}
                        </label>
                        
                        {option.type === 'color' ? (
                          // Color swatches
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value) => {
                              const colorHex = getColorHex(value)
                              const isSelected = selectedOptions[option.name] === value
                              
                              return (
                                <button
                                  key={value}
                                  onClick={() => handleOptionChange(option.name, value)}
                                  className={cn(
                                    'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                                    isSelected ? 'border-primary' : 'border-border'
                                  )}
                                  style={colorHex ? { backgroundColor: colorHex } : undefined}
                                  title={value}
                                >
                                  {isSelected && (
                                    <Check className={cn(
                                      'h-4 w-4',
                                      colorHex === '#ffffff' ? 'text-black' : 'text-white'
                                    )} />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          // Size/text options
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value) => (
                              <button
                                key={value}
                                onClick={() => handleOptionChange(option.name, value)}
                                className={cn(
                                  'px-4 h-10 rounded-lg border-2 font-medium text-sm transition-all',
                                  'min-h-[44px]',
                                  selectedOptions[option.name] === value
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border hover:border-primary/50'
                                )}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="min-h-[44px] min-w-[44px] rounded-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium tabular-nums">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= 99}
                        className="min-h-[44px] min-w-[44px] rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Stock indicator */}
                    {selectedVariant && selectedVariant.quantity !== null && selectedVariant.quantity > 0 && selectedVariant.quantity <= 5 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        Only {selectedVariant.quantity} left
                      </Badge>
                    )}
                  </div>
                </div>

                {/* View full details link */}
                {onViewFullDetails && (
                  <Button
                    variant="link"
                    onClick={handleViewFullDetails}
                    className="p-0 h-auto text-sm"
                  >
                    View Full Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Footer with Add to Cart */}
            <div className="flex-shrink-0 border-t p-4 bg-background">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-lg font-bold">
                    {formatPrice(currentPrice * quantity)}
                  </div>
                </div>
                
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || isOutOfStock}
                  className={cn(
                    'min-h-[48px] px-8',
                    addedToCart && 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : isOutOfStock ? (
                    'Out of Stock'
                  ) : addedToCart ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Added!
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
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileQuickView
