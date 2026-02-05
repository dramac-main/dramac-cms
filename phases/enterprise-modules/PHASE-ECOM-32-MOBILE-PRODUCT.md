# PHASE-ECOM-32: Mobile Product Experience

> **Priority**: 🟠 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-30 (Mobile Cart), Wave 3 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create mobile-optimized product viewing and interaction components including swipeable image galleries, sticky add-to-cart bars, bottom sheet variant selectors, and collapsible product details. These components enhance product discovery and purchase flow on mobile devices.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-30 hooks are implemented (`useMobile`, `useSwipeGesture`, `useHapticFeedback`)
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review Wave 3 product components (`ProductCardBlock`, `ProductImageGallery`)
- [ ] Verify `useStorefrontProduct` hook from Wave 3 is working
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Mobile Product Architecture
├── Gallery Components
│   ├── MobileProductGallery      → Full-width swipe gallery with pinch-zoom
│   └── GalleryIndicators         → Dot pagination indicators
│
├── Variant Selection
│   └── MobileVariantSelector     → Bottom sheet variant picker
│
├── Add to Cart
│   ├── StickyAddToCartBar        → Fixed bar when button scrolls out
│   └── MobileAddToCartButton     → Touch-optimized add button
│
├── Product Details
│   ├── CollapsibleProductDetails → Accordion product info
│   └── MobileProductSpecs        → Specs/attributes display
│
├── Product Cards
│   ├── MobileProductCard         → Optimized card for mobile grid
│   └── ProductSwipeView          → Tinder-style product discovery
│
└── Quick Actions
    └── MobileQuickView           → Bottom sheet quick view

Gesture Support:
- Swipe left/right on gallery → Navigate images
- Pinch on image → Zoom in/out
- Double-tap image → Toggle zoom
- Swipe down on quick view → Dismiss
- Sticky bar appears → When add button scrolls out
```

### Mobile Gallery Requirements
- Full-width images
- Smooth 60fps swipe transitions
- Pinch-to-zoom support
- Dot indicators below
- Double-tap to toggle zoom

### Sticky Bar Behavior
- Appears when main CTA scrolls out of viewport
- Uses IntersectionObserver
- Respects safe-area-inset-bottom
- Shows price + Add to Cart

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `studio/components/mobile/MobileProductGallery.tsx` | Create | Swipeable image gallery |
| `studio/components/mobile/MobileVariantSelector.tsx` | Create | Bottom sheet variant picker |
| `studio/components/mobile/StickyAddToCartBar.tsx` | Create | Fixed add-to-cart bar |
| `studio/components/mobile/MobileAddToCartButton.tsx` | Create | Touch-optimized add button |
| `studio/components/mobile/CollapsibleProductDetails.tsx` | Create | Accordion product info |
| `studio/components/mobile/MobileProductCard.tsx` | Create | Mobile-optimized product card |
| `studio/components/mobile/ProductSwipeView.tsx` | Create | Tinder-style product discovery |
| `studio/components/mobile/MobileQuickView.tsx` | Create | Quick view bottom sheet |
| `studio/components/mobile/index.ts` | Modify | Export new components |

---

## 📋 Implementation Tasks

### Task 32.1: Create MobileProductGallery Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileProductGallery.tsx`
**Action**: Create

**Description**: Full-width swipeable image gallery with zoom support

```typescript
/**
 * MobileProductGallery - Swipeable product image gallery
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Full-width image gallery with swipe navigation, pinch-to-zoom,
 * and dot indicators. Optimized for mobile viewing.
 */
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, Expand } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductImage {
  id: string
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface MobileProductGalleryProps {
  images: ProductImage[]
  productName: string
  aspectRatio?: 'square' | 'portrait' | '4:3'
  showIndicators?: boolean
  showZoomButton?: boolean
  enablePinchZoom?: boolean
  onImageClick?: (index: number) => void
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY = 500

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileProductGallery({
  images,
  productName,
  aspectRatio = 'square',
  showIndicators = true,
  showZoomButton = true,
  enablePinchZoom = true,
  onImageClick,
  className,
}: MobileProductGalleryProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<number>(0)

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
  }

  // Navigate to specific image
  const goToImage = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return
    haptic.trigger('selection')
    setCurrentIndex(index)
    setZoomScale(1)
  }, [images.length, haptic])

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    goToImage(currentIndex > 0 ? currentIndex - 1 : images.length - 1)
  }, [currentIndex, images.length, goToImage])

  // Navigate to next image
  const goToNext = useCallback(() => {
    goToImage(currentIndex < images.length - 1 ? currentIndex + 1 : 0)
  }, [currentIndex, images.length, goToImage])

  // Handle drag end (swipe)
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isZoomed) return // Don't navigate when zoomed
      
      const { offset, velocity } = info

      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
        goToNext()
      } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
        goToPrevious()
      }
    },
    [isZoomed, goToNext, goToPrevious]
  )

  // Handle double tap to zoom
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      haptic.trigger('medium')
      if (isZoomed) {
        setZoomScale(1)
        setIsZoomed(false)
      } else {
        setZoomScale(2)
        setIsZoomed(true)
      }
    }
    lastTapRef.current = now
  }, [isZoomed, haptic])

  // Handle image click
  const handleImageClick = useCallback((index: number) => {
    handleDoubleTap()
    onImageClick?.(index)
  }, [handleDoubleTap, onImageClick])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    haptic.trigger('medium')
    setIsFullscreen((prev) => !prev)
    if (!isFullscreen) {
      setZoomScale(1)
      setIsZoomed(false)
    }
  }, [haptic, isFullscreen])

  // Handle pinch zoom (simplified - for production, use gesture library)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enablePinchZoom) return
      e.preventDefault()
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoomScale((prev) => {
        const newScale = Math.max(1, Math.min(3, prev + delta))
        setIsZoomed(newScale > 1)
        return newScale
      })
    },
    [enablePinchZoom]
  )

  // Reset zoom when changing images
  useEffect(() => {
    setZoomScale(1)
    setIsZoomed(false)
  }, [currentIndex])

  // Empty state
  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center',
          aspectClasses[aspectRatio],
          className
        )}
      >
        <span className="text-muted-foreground">No images</span>
      </div>
    )
  }

  return (
    <>
      {/* Main Gallery */}
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden bg-muted', className)}
      >
        {/* Image container */}
        <motion.div
          drag={!isZoomed ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={() => handleImageClick(currentIndex)}
          onWheel={handleWheel}
          className={cn(
            'relative',
            aspectClasses[aspectRatio],
            'touch-pan-y'
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
              style={{
                scale: zoomScale,
                transformOrigin: 'center center',
              }}
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt || `${productName} - Image ${currentIndex + 1}`}
                fill
                className={cn(
                  'object-contain',
                  zoomScale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                )}
                priority={currentIndex === 0}
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Zoom button */}
        {showZoomButton && (
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-10 min-h-[44px] min-w-[44px] bg-background/80 backdrop-blur-sm"
          >
            <Expand className="h-5 w-5" />
          </Button>
        )}

        {/* Image counter */}
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Dot indicators */}
        {showIndicators && images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  'min-h-[44px] min-w-[44px] -m-5', // Touch target expansion
                  'flex items-center justify-center'
                )}
                aria-label={`Go to image ${index + 1}`}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    index === currentIndex
                      ? 'bg-primary w-4'
                      : 'bg-primary/40 hover:bg-primary/60'
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-10 min-h-[44px] min-w-[44px] text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomScale((s) => Math.max(1, s - 0.5))}
                className="min-h-[44px] min-w-[44px] text-white hover:bg-white/20"
                disabled={zoomScale <= 1}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomScale((s) => Math.min(3, s + 0.5))}
                className="min-h-[44px] min-w-[44px] text-white hover:bg-white/20"
                disabled={zoomScale >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Fullscreen image */}
            <motion.div
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
              style={{ scale: zoomScale }}
              className="relative w-full h-full"
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt || productName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full min-h-[44px] min-w-[44px]"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full min-h-[44px] min-w-[44px]"
                  aria-label="Next image"
                >
                  →
                </button>
              </>
            )}

            {/* Indicators */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MobileProductGallery
```

---

### Task 32.2: Create MobileVariantSelector Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileVariantSelector.tsx`
**Action**: Create

**Description**: Bottom sheet for selecting product variants

```typescript
/**
 * MobileVariantSelector - Bottom sheet variant picker
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Bottom sheet for selecting product variants with large touch targets
 * and visual swatches for colors.
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'
import type { ProductVariant } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface VariantOption {
  name: string // e.g., "Size", "Color"
  values: string[]
}

export interface MobileVariantSelectorProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  productPrice: number
  productImage?: string
  variants: ProductVariant[]
  selectedVariantId?: string
  onVariantSelect: (variant: ProductVariant) => void
  onAddToCart?: () => void
  currencySymbol?: string
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if a value looks like a color
function isColorValue(value: string): boolean {
  const colorKeywords = [
    'red', 'blue', 'green', 'black', 'white', 'gray', 'grey',
    'yellow', 'orange', 'purple', 'pink', 'brown', 'navy', 'teal',
    'gold', 'silver', 'beige', 'cream', 'coral', 'maroon', 'olive'
  ]
  return colorKeywords.some(color => 
    value.toLowerCase().includes(color)
  ) || value.startsWith('#')
}

// Get color for swatch
function getSwatchColor(value: string): string {
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    black: '#171717',
    white: '#ffffff',
    gray: '#6b7280',
    grey: '#6b7280',
    yellow: '#eab308',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
    brown: '#92400e',
    navy: '#1e3a5a',
    teal: '#14b8a6',
    gold: '#ca8a04',
    silver: '#9ca3af',
    beige: '#d4c4a8',
    cream: '#fffdd0',
    coral: '#ff7f50',
    maroon: '#800000',
    olive: '#808000',
  }
  
  const key = value.toLowerCase()
  if (value.startsWith('#')) return value
  return colorMap[key] || '#e5e7eb'
}

// Extract variant options from variants
function extractOptions(variants: ProductVariant[]): VariantOption[] {
  const optionsMap = new Map<string, Set<string>>()
  
  variants.forEach(variant => {
    if (variant.options) {
      Object.entries(variant.options).forEach(([name, value]) => {
        if (!optionsMap.has(name)) {
          optionsMap.set(name, new Set())
        }
        optionsMap.get(name)?.add(value as string)
      })
    }
  })
  
  return Array.from(optionsMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }))
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileVariantSelector({
  isOpen,
  onClose,
  productName,
  productPrice,
  productImage,
  variants,
  selectedVariantId,
  onVariantSelect,
  onAddToCart,
  currencySymbol = '$',
  className,
}: MobileVariantSelectorProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // Extract options from variants
  const options = useMemo(() => extractOptions(variants), [variants])
  
  // Track selected options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  
  // Find matching variant based on selected options
  const matchingVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length === 0) {
      return variants.find(v => v.id === selectedVariantId)
    }
    
    return variants.find(variant => {
      if (!variant.options) return false
      return Object.entries(selectedOptions).every(
        ([name, value]) => variant.options?.[name] === value
      )
    })
  }, [variants, selectedOptions, selectedVariantId])
  
  // Current price (use variant price if available)
  const currentPrice = matchingVariant?.price ?? productPrice
  
  // Handle option selection
  const handleOptionSelect = useCallback((optionName: string, value: string) => {
    haptic.trigger('selection')
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value,
    }))
  }, [haptic])
  
  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (matchingVariant) {
      onVariantSelect(matchingVariant)
    }
    haptic.trigger('success')
    onAddToCart?.()
  }, [matchingVariant, onVariantSelect, onAddToCart, haptic])
  
  // Handle drag to dismiss
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        haptic.trigger('light')
        onClose()
      }
    },
    [haptic, onClose]
  )
  
  // Check if variant is available
  const isOptionAvailable = useCallback(
    (optionName: string, value: string): boolean => {
      // Check if any variant with this option value is in stock
      return variants.some(variant => {
        if (!variant.options) return false
        if (variant.options[optionName] !== value) return false
        // Check other selected options match
        return Object.entries(selectedOptions)
          .filter(([name]) => name !== optionName)
          .every(([name, val]) => variant.options?.[name] === val)
      })
    },
    [variants, selectedOptions]
  )
  
  // Check if variant is in stock
  const isInStock = matchingVariant?.stock_quantity 
    ? matchingVariant.stock_quantity > 0 
    : true

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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              prefersReducedMotion
                ? { duration: 0.15 }
                : { type: 'spring', damping: 30, stiffness: 300 }
            }
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'bg-background rounded-t-3xl shadow-2xl',
              'max-h-[85vh] overflow-hidden',
              'flex flex-col',
              className
            )}
          >
            {/* Handle indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header with product info */}
            <div className="flex items-center gap-4 px-4 pb-4 border-b">
              {productImage && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-1">{productName}</h3>
                <p className="text-lg font-bold">
                  {currencySymbol}{currentPrice.toFixed(2)}
                </p>
                {matchingVariant?.sku && (
                  <p className="text-xs text-muted-foreground">
                    SKU: {matchingVariant.sku}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Options */}
            <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
              {options.map((option) => (
                <div key={option.name}>
                  <label className="block text-sm font-medium mb-3">
                    {option.name}
                    {selectedOptions[option.name] && (
                      <span className="text-muted-foreground ml-2">
                        : {selectedOptions[option.name]}
                      </span>
                    )}
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.name] === value
                      const isAvailable = isOptionAvailable(option.name, value)
                      const isColor = isColorValue(value)

                      if (isColor) {
                        // Color swatch
                        return (
                          <button
                            key={value}
                            onClick={() => handleOptionSelect(option.name, value)}
                            disabled={!isAvailable}
                            className={cn(
                              'relative w-12 h-12 rounded-full',
                              'border-2 transition-all',
                              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                              'min-h-[44px] min-w-[44px]',
                              isSelected
                                ? 'border-primary ring-2 ring-primary ring-offset-2'
                                : 'border-transparent',
                              !isAvailable && 'opacity-30 cursor-not-allowed'
                            )}
                            style={{ backgroundColor: getSwatchColor(value) }}
                            aria-label={`Select ${value}`}
                            title={value}
                          >
                            {isSelected && (
                              <Check
                                className={cn(
                                  'absolute inset-0 m-auto h-5 w-5',
                                  getSwatchColor(value) === '#ffffff' || getSwatchColor(value) === '#fffdd0'
                                    ? 'text-black'
                                    : 'text-white'
                                )}
                              />
                            )}
                            {!isAvailable && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full h-0.5 bg-muted-foreground rotate-45 absolute" />
                              </span>
                            )}
                          </button>
                        )
                      }

                      // Text option (size, etc.)
                      return (
                        <button
                          key={value}
                          onClick={() => handleOptionSelect(option.name, value)}
                          disabled={!isAvailable}
                          className={cn(
                            'px-4 py-2 rounded-lg border-2',
                            'font-medium text-sm',
                            'transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                            'min-h-[44px] min-w-[44px]',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50',
                            !isAvailable && 'opacity-30 cursor-not-allowed line-through'
                          )}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Stock status */}
              {matchingVariant && (
                <div className="text-sm">
                  {isInStock ? (
                    <span className="text-green-600">
                      ✓ In stock
                      {matchingVariant.stock_quantity && matchingVariant.stock_quantity < 10 && (
                        <span className="text-muted-foreground ml-1">
                          (Only {matchingVariant.stock_quantity} left)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-destructive">Out of stock</span>
                  )}
                </div>
              )}
            </div>

            {/* Footer with add to cart */}
            <div className="border-t p-4 pb-safe">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!matchingVariant || !isInStock}
                className="w-full min-h-[52px] text-base font-semibold"
              >
                {!isInStock
                  ? 'Out of Stock'
                  : `Add to Cart • ${currencySymbol}${currentPrice.toFixed(2)}`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileVariantSelector
```

---

### Task 32.3: Create StickyAddToCartBar Component

**File**: `src/modules/ecommerce/studio/components/mobile/StickyAddToCartBar.tsx`
**Action**: Create

**Description**: Sticky bar that appears when add-to-cart button scrolls out

```typescript
/**
 * StickyAddToCartBar - Fixed add-to-cart bar
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Appears when the main add-to-cart button scrolls out of view.
 * Uses IntersectionObserver for performance.
 */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export interface StickyAddToCartBarProps {
  productName: string
  price: number
  originalPrice?: number
  onAddToCart: () => void
  onBuyNow?: () => void
  onWishlist?: () => void
  isInWishlist?: boolean
  isLoading?: boolean
  isOutOfStock?: boolean
  currencySymbol?: string
  triggerRef?: React.RefObject<HTMLElement>
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StickyAddToCartBar({
  productName,
  price,
  originalPrice,
  onAddToCart,
  onBuyNow,
  onWishlist,
  isInWishlist = false,
  isLoading = false,
  isOutOfStock = false,
  currencySymbol = '$',
  triggerRef,
  className,
}: StickyAddToCartBarProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Set up intersection observer
  useEffect(() => {
    if (!triggerRef?.current) {
      // If no trigger ref, show bar after scrolling down
      const handleScroll = () => {
        setIsVisible(window.scrollY > 300)
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Show bar when trigger element is NOT visible
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px',
      }
    )

    observerRef.current.observe(triggerRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [triggerRef])

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return
    haptic.trigger('success')
    onAddToCart()
  }, [isOutOfStock, haptic, onAddToCart])

  // Handle buy now
  const handleBuyNow = useCallback(() => {
    if (isOutOfStock) return
    haptic.trigger('success')
    onBuyNow?.()
  }, [isOutOfStock, haptic, onBuyNow])

  // Handle wishlist
  const handleWishlist = useCallback(() => {
    haptic.trigger(isInWishlist ? 'light' : 'success')
    onWishlist?.()
  }, [haptic, isInWishlist, onWishlist])

  // Has discount
  const hasDiscount = originalPrice && originalPrice > price
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : { type: 'spring', damping: 25, stiffness: 300 }
          }
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40',
            'bg-background border-t shadow-lg',
            'px-4 py-3',
            className
          )}
          style={{
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Wishlist button */}
            {onWishlist && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlist}
                className={cn(
                  'min-h-[48px] min-w-[48px] flex-shrink-0',
                  isInWishlist && 'text-red-500 border-red-500'
                )}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className={cn('h-5 w-5', isInWishlist && 'fill-current')}
                />
              </Button>
            )}

            {/* Price */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground line-clamp-1">
                {productName}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {currencySymbol}{price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {currencySymbol}{originalPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {onBuyNow && (
                <Button
                  variant="outline"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isLoading}
                  className="min-h-[48px] px-4"
                >
                  Buy Now
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isLoading}
                className="min-h-[48px] px-4"
              >
                {isLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : isOutOfStock ? (
                  'Sold Out'
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add
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

export default StickyAddToCartBar
```

---

### Task 32.4: Create CollapsibleProductDetails Component

**File**: `src/modules/ecommerce/studio/components/mobile/CollapsibleProductDetails.tsx`
**Action**: Create

**Description**: Accordion-style product information sections

```typescript
/**
 * CollapsibleProductDetails - Accordion product info
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Collapsible sections for product description, specifications,
 * shipping info, and reviews.
 */
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, FileText, Ruler, Truck, Star, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductSection {
  id: string
  title: string
  icon?: React.ReactNode
  content: React.ReactNode
  defaultOpen?: boolean
}

export interface CollapsibleProductDetailsProps {
  sections: ProductSection[]
  allowMultiple?: boolean
  className?: string
}

export interface ProductSpecification {
  label: string
  value: string
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface CollapsibleItemProps {
  section: ProductSection
  isOpen: boolean
  onToggle: () => void
}

function CollapsibleItem({ section, isOpen, onToggle }: CollapsibleItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-4 py-4',
          'flex items-center gap-3',
          'text-left',
          'transition-colors',
          'hover:bg-muted/50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
          'min-h-[56px]'
        )}
        aria-expanded={isOpen}
      >
        {/* Icon */}
        {section.icon && (
          <span className="text-muted-foreground">{section.icon}</span>
        )}

        {/* Title */}
        <span className="flex-1 font-medium">{section.title}</span>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CollapsibleProductDetails({
  sections,
  allowMultiple = false,
  className,
}: CollapsibleProductDetailsProps) {
  const haptic = useHapticFeedback()
  
  // Track open sections
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const defaultOpen = new Set<string>()
    sections.forEach((s) => {
      if (s.defaultOpen) defaultOpen.add(s.id)
    })
    return defaultOpen
  })

  // Toggle section
  const handleToggle = useCallback(
    (sectionId: string) => {
      haptic.trigger('selection')
      
      setOpenSections((prev) => {
        const next = new Set(prev)
        
        if (next.has(sectionId)) {
          next.delete(sectionId)
        } else {
          if (!allowMultiple) {
            next.clear()
          }
          next.add(sectionId)
        }
        
        return next
      })
    },
    [allowMultiple, haptic]
  )

  return (
    <div className={cn('border rounded-xl overflow-hidden', className)}>
      {sections.map((section) => (
        <CollapsibleItem
          key={section.id}
          section={section}
          isOpen={openSections.has(section.id)}
          onToggle={() => handleToggle(section.id)}
        />
      ))}
    </div>
  )
}

// ============================================================================
// PRESET SECTIONS
// ============================================================================

/**
 * Create standard product detail sections
 */
export function createProductSections(config: {
  description?: string | React.ReactNode
  specifications?: ProductSpecification[]
  shippingInfo?: string | React.ReactNode
  returnPolicy?: string | React.ReactNode
  reviewCount?: number
  averageRating?: number
}): ProductSection[] {
  const sections: ProductSection[] = []

  if (config.description) {
    sections.push({
      id: 'description',
      title: 'Description',
      icon: <FileText className="h-5 w-5" />,
      content: typeof config.description === 'string' ? (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p>{config.description}</p>
        </div>
      ) : config.description,
      defaultOpen: true,
    })
  }

  if (config.specifications && config.specifications.length > 0) {
    sections.push({
      id: 'specifications',
      title: 'Specifications',
      icon: <Ruler className="h-5 w-5" />,
      content: (
        <div className="space-y-2">
          {config.specifications.map((spec, i) => (
            <div key={i} className="flex justify-between py-1 border-b last:border-b-0">
              <span className="text-muted-foreground">{spec.label}</span>
              <span className="font-medium text-foreground">{spec.value}</span>
            </div>
          ))}
        </div>
      ),
    })
  }

  if (config.shippingInfo) {
    sections.push({
      id: 'shipping',
      title: 'Shipping & Delivery',
      icon: <Truck className="h-5 w-5" />,
      content: typeof config.shippingInfo === 'string' ? (
        <p>{config.shippingInfo}</p>
      ) : config.shippingInfo,
    })
  }

  if (config.returnPolicy) {
    sections.push({
      id: 'returns',
      title: 'Returns & Warranty',
      icon: <Shield className="h-5 w-5" />,
      content: typeof config.returnPolicy === 'string' ? (
        <p>{config.returnPolicy}</p>
      ) : config.returnPolicy,
    })
  }

  if (config.reviewCount !== undefined) {
    sections.push({
      id: 'reviews',
      title: `Reviews (${config.reviewCount})`,
      icon: <Star className="h-5 w-5" />,
      content: (
        <div className="text-center py-4">
          {config.averageRating && (
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl font-bold">{config.averageRating.toFixed(1)}</span>
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            </div>
          )}
          <p>Based on {config.reviewCount} reviews</p>
        </div>
      ),
    })
  }

  return sections
}

export default CollapsibleProductDetails
```

---

### Task 32.5: Create MobileProductCard Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileProductCard.tsx`
**Action**: Create

**Description**: Product card optimized for mobile grid layout

```typescript
/**
 * MobileProductCard - Mobile-optimized product card
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Compact product card for 2-column mobile grid with
 * quick add button and wishlist toggle.
 */
'use client'

import React, { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, ShoppingCart, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { Product } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface MobileProductCardProps {
  product: Product
  href?: string
  onAddToCart?: () => void
  onQuickView?: () => void
  onToggleWishlist?: () => void
  isInWishlist?: boolean
  showQuickAdd?: boolean
  showWishlist?: boolean
  showRating?: boolean
  currencySymbol?: string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileProductCard({
  product,
  href,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  isInWishlist = false,
  showQuickAdd = true,
  showWishlist = true,
  showRating = false,
  currencySymbol = '$',
  className,
}: MobileProductCardProps) {
  const haptic = useHapticFeedback()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Calculate discount
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  // Check stock status
  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0

  // Handle add to cart
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isOutOfStock) return
      
      haptic.trigger('success')
      setIsAddingToCart(true)
      
      try {
        await onAddToCart?.()
      } finally {
        setTimeout(() => setIsAddingToCart(false), 500)
      }
    },
    [isOutOfStock, haptic, onAddToCart]
  )

  // Handle wishlist toggle
  const handleToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      haptic.trigger(isInWishlist ? 'light' : 'success')
      onToggleWishlist?.()
    },
    [haptic, isInWishlist, onToggleWishlist]
  )

  // Handle quick view
  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      haptic.trigger('selection')
      onQuickView?.()
    },
    [haptic, onQuickView]
  )

  // Card content
  const cardContent = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative bg-background rounded-xl overflow-hidden',
        'border border-border',
        'group',
        className
      )}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {/* Product image */}
        {product.images?.[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs font-semibold">
              -{discountPercent}%
            </Badge>
          )}
          {product.is_new && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="outline" className="text-xs bg-background">
              Sold Out
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        {showWishlist && onToggleWishlist && (
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute top-2 right-2',
              'w-9 h-9 rounded-full',
              'flex items-center justify-center',
              'bg-background/80 backdrop-blur-sm',
              'transition-colors',
              'min-h-[44px] min-w-[44px] -m-1',
              isInWishlist ? 'text-red-500' : 'text-muted-foreground'
            )}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
          </button>
        )}

        {/* Quick view button (appears on hover/tap) */}
        {onQuickView && (
          <button
            onClick={handleQuickView}
            className={cn(
              'absolute bottom-2 right-2',
              'w-9 h-9 rounded-full',
              'flex items-center justify-center',
              'bg-background/80 backdrop-blur-sm',
              'text-muted-foreground',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'min-h-[44px] min-w-[44px] -m-1'
            )}
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        {/* Name */}
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] mb-1">
          {product.name}
        </h3>

        {/* Rating (optional) */}
        {showRating && product.average_rating && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-500">★</span>
            <span className="text-xs text-muted-foreground">
              {product.average_rating.toFixed(1)}
              {product.review_count && ` (${product.review_count})`}
            </span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">
              {currencySymbol}{product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {currencySymbol}{product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Quick add button */}
          {showQuickAdd && onAddToCart && !isOutOfStock && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="h-9 w-9 min-h-[44px] min-w-[44px] -m-1 rounded-full"
              aria-label="Add to cart"
            >
              {isAddingToCart ? (
                <ShoppingCart className="h-4 w-4 text-green-500" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )

  // Wrap with link if href provided
  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export default MobileProductCard
```

---

### Task 32.6: Create MobileQuickView Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileQuickView.tsx`
**Action**: Create

**Description**: Bottom sheet quick view for product preview

```typescript
/**
 * MobileQuickView - Quick view bottom sheet
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Bottom sheet showing product preview with key info
 * and add-to-cart functionality.
 */
'use client'

import React, { useCallback, useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Heart, Minus, Plus, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'
import type { Product } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface MobileQuickViewProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onAddToCart?: (quantity: number) => void
  onViewDetails?: () => void
  onToggleWishlist?: () => void
  isInWishlist?: boolean
  productUrl?: string
  currencySymbol?: string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileQuickView({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  isInWishlist = false,
  productUrl,
  currencySymbol = '$',
  className,
}: MobileQuickViewProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  // Reset quantity when product changes
  React.useEffect(() => {
    setQuantity(1)
  }, [product?.id])

  // Handle drag to dismiss
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        haptic.trigger('light')
        onClose()
      }
    },
    [haptic, onClose]
  )

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (delta: number) => {
      haptic.trigger('selection')
      setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)))
    },
    [haptic]
  )

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!product) return
    haptic.trigger('success')
    setIsAdding(true)
    
    try {
      await onAddToCart?.(quantity)
      setTimeout(() => {
        setIsAdding(false)
        onClose()
      }, 500)
    } catch {
      setIsAdding(false)
    }
  }, [product, quantity, haptic, onAddToCart, onClose])

  // Handle wishlist
  const handleWishlist = useCallback(() => {
    haptic.trigger(isInWishlist ? 'light' : 'success')
    onToggleWishlist?.()
  }, [haptic, isInWishlist, onToggleWishlist])

  // Calculate discount
  const hasDiscount = product?.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount && product
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  // Check stock
  const isOutOfStock = product?.stock_quantity !== undefined && product.stock_quantity <= 0

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              prefersReducedMotion
                ? { duration: 0.15 }
                : { type: 'spring', damping: 30, stiffness: 300 }
            }
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'bg-background rounded-t-3xl shadow-2xl',
              'max-h-[85vh] overflow-hidden',
              'flex flex-col',
              className
            )}
          >
            {/* Handle indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 min-h-[44px] min-w-[44px]"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {/* Image */}
              <div className="relative aspect-square bg-muted mx-4 rounded-xl overflow-hidden">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {hasDiscount && (
                    <Badge variant="destructive">-{discountPercent}%</Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="outline" className="bg-background">
                      Sold Out
                    </Badge>
                  )}
                </div>

                {/* Wishlist button */}
                {onToggleWishlist && (
                  <button
                    onClick={handleWishlist}
                    className={cn(
                      'absolute top-3 right-3',
                      'w-10 h-10 rounded-full',
                      'flex items-center justify-center',
                      'bg-background/80 backdrop-blur-sm',
                      'min-h-[44px] min-w-[44px]',
                      isInWishlist ? 'text-red-500' : 'text-muted-foreground'
                    )}
                  >
                    <Heart className={cn('h-5 w-5', isInWishlist && 'fill-current')} />
                  </button>
                )}
              </div>

              {/* Product info */}
              <div className="p-4 space-y-4">
                {/* Name */}
                <h2 className="text-xl font-semibold line-clamp-2">{product.name}</h2>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {currencySymbol}{product.price.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">
                      {currencySymbol}{product.compare_at_price!.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Short description */}
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* View details link */}
                {(productUrl || onViewDetails) && (
                  <Link
                    href={productUrl || '#'}
                    onClick={(e) => {
                      if (onViewDetails) {
                        e.preventDefault()
                        onViewDetails()
                      }
                    }}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View full details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Footer with quantity and add to cart */}
            <div className="border-t p-4 pb-safe">
              <div className="flex items-center gap-4">
                {/* Quantity selector */}
                <div className="flex items-center gap-2 border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-11 w-11"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 99}
                    className="h-11 w-11"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Add to cart */}
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  className="flex-1 min-h-[52px] text-base font-semibold"
                >
                  {isAdding
                    ? 'Added!'
                    : isOutOfStock
                    ? 'Out of Stock'
                    : `Add to Cart • ${currencySymbol}${(product.price * quantity).toFixed(2)}`}
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
```

---

### Task 32.7: Create ProductSwipeView Component

**File**: `src/modules/ecommerce/studio/components/mobile/ProductSwipeView.tsx`
**Action**: Create

**Description**: Tinder-style product discovery swipe view

```typescript
/**
 * ProductSwipeView - Tinder-style product discovery
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Fun swipe-based product discovery where users can:
 * - Swipe right to add to cart
 * - Swipe left to skip
 * - Swipe up to add to wishlist
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Heart, ShoppingCart, X, RotateCcw, Info } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'
import type { Product } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export type SwipeAction = 'cart' | 'wishlist' | 'skip'

export interface ProductSwipeViewProps {
  products: Product[]
  onSwipe: (product: Product, action: SwipeAction) => void
  onViewDetails?: (product: Product) => void
  currencySymbol?: string
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 100
const ROTATION_FACTOR = 0.1

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductSwipeView({
  products,
  onSwipe,
  onViewDetails,
  currencySymbol = '$',
  className,
}: ProductSwipeViewProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()
  const controls = useAnimation()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null)
  const [history, setHistory] = useState<number[]>([])

  // Current product
  const currentProduct = products[currentIndex]
  const hasMoreProducts = currentIndex < products.length

  // Handle drag
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info
      
      // Determine swipe direction for visual feedback
      if (offset.x > 50) {
        setSwipeDirection('right')
      } else if (offset.x < -50) {
        setSwipeDirection('left')
      } else if (offset.y < -50) {
        setSwipeDirection('up')
      } else {
        setSwipeDirection(null)
      }
    },
    []
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info
      
      // Swipe right = add to cart
      if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
        haptic.trigger('success')
        await controls.start({
          x: 500,
          opacity: 0,
          rotate: 20,
          transition: { duration: 0.3 },
        })
        onSwipe(currentProduct, 'cart')
        setHistory(prev => [...prev, currentIndex])
        setCurrentIndex(prev => prev + 1)
        controls.set({ x: 0, opacity: 1, rotate: 0 })
        setSwipeDirection(null)
        return
      }

      // Swipe left = skip
      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
        haptic.trigger('light')
        await controls.start({
          x: -500,
          opacity: 0,
          rotate: -20,
          transition: { duration: 0.3 },
        })
        onSwipe(currentProduct, 'skip')
        setHistory(prev => [...prev, currentIndex])
        setCurrentIndex(prev => prev + 1)
        controls.set({ x: 0, opacity: 1, rotate: 0 })
        setSwipeDirection(null)
        return
      }

      // Swipe up = wishlist
      if (offset.y < -SWIPE_THRESHOLD || velocity.y < -500) {
        haptic.trigger('success')
        await controls.start({
          y: -500,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        onSwipe(currentProduct, 'wishlist')
        setHistory(prev => [...prev, currentIndex])
        setCurrentIndex(prev => prev + 1)
        controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 })
        setSwipeDirection(null)
        return
      }

      // Snap back
      controls.start({ x: 0, y: 0, rotate: 0 })
      setSwipeDirection(null)
    },
    [controls, currentProduct, currentIndex, haptic, onSwipe]
  )

  // Handle button actions
  const handleSkip = useCallback(async () => {
    haptic.trigger('light')
    await controls.start({
      x: -500,
      opacity: 0,
      rotate: -20,
      transition: { duration: 0.3 },
    })
    onSwipe(currentProduct, 'skip')
    setHistory(prev => [...prev, currentIndex])
    setCurrentIndex(prev => prev + 1)
    controls.set({ x: 0, opacity: 1, rotate: 0 })
  }, [controls, currentProduct, currentIndex, haptic, onSwipe])

  const handleAddToCart = useCallback(async () => {
    haptic.trigger('success')
    await controls.start({
      x: 500,
      opacity: 0,
      rotate: 20,
      transition: { duration: 0.3 },
    })
    onSwipe(currentProduct, 'cart')
    setHistory(prev => [...prev, currentIndex])
    setCurrentIndex(prev => prev + 1)
    controls.set({ x: 0, opacity: 1, rotate: 0 })
  }, [controls, currentProduct, currentIndex, haptic, onSwipe])

  const handleWishlist = useCallback(async () => {
    haptic.trigger('success')
    await controls.start({
      y: -500,
      opacity: 0,
      transition: { duration: 0.3 },
    })
    onSwipe(currentProduct, 'wishlist')
    setHistory(prev => [...prev, currentIndex])
    setCurrentIndex(prev => prev + 1)
    controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 })
  }, [controls, currentProduct, currentIndex, haptic, onSwipe])

  // Handle undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    haptic.trigger('selection')
    const lastIndex = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setCurrentIndex(lastIndex)
  }, [history, haptic])

  // No more products
  if (!hasMoreProducts) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <p className="text-lg font-medium mb-4">You've seen all products!</p>
        {history.length > 0 && (
          <Button variant="outline" onClick={handleUndo}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Undo last action
          </Button>
        )}
      </div>
    )
  }

  // Calculate discount
  const hasDiscount = currentProduct.compare_at_price && 
    currentProduct.compare_at_price > currentProduct.price
  const discountPercent = hasDiscount
    ? Math.round(((currentProduct.compare_at_price! - currentProduct.price) / 
        currentProduct.compare_at_price!) * 100)
    : 0

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Swipe hints */}
      <div className="flex justify-between w-full px-4 mb-4 text-xs text-muted-foreground">
        <span>← Skip</span>
        <span>↑ Wishlist</span>
        <span>Add to Cart →</span>
      </div>

      {/* Card stack */}
      <div className="relative w-full aspect-[3/4] max-w-sm">
        {/* Background cards (next 2) */}
        {products.slice(currentIndex + 1, currentIndex + 3).map((product, i) => (
          <div
            key={product.id}
            className={cn(
              'absolute inset-0 bg-background rounded-2xl border shadow-lg',
              'transform',
              i === 0 ? 'scale-95 -translate-y-2' : 'scale-90 -translate-y-4'
            )}
            style={{ zIndex: -i - 1 }}
          />
        ))}

        {/* Current card */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.7}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileTap={{ scale: 1.02 }}
          className={cn(
            'absolute inset-0 bg-background rounded-2xl border shadow-xl',
            'overflow-hidden cursor-grab active:cursor-grabbing',
            'touch-pan-y'
          )}
        >
          {/* Swipe indicators */}
          <AnimatePresence>
            {swipeDirection === 'right' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-green-500/20 z-10 flex items-center justify-center"
              >
                <ShoppingCart className="h-16 w-16 text-green-500" />
              </motion.div>
            )}
            {swipeDirection === 'left' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-500/20 z-10 flex items-center justify-center"
              >
                <X className="h-16 w-16 text-red-500" />
              </motion.div>
            )}
            {swipeDirection === 'up' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pink-500/20 z-10 flex items-center justify-center"
              >
                <Heart className="h-16 w-16 text-pink-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product image */}
          <div className="relative h-3/5 bg-muted">
            {currentProduct.images?.[0] ? (
              <Image
                src={currentProduct.images[0].url}
                alt={currentProduct.name}
                fill
                className="object-cover"
                sizes="100vw"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-sm font-semibold">
                -{discountPercent}%
              </div>
            )}

            {/* Details button */}
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(currentProduct)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Info className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Product info */}
          <div className="p-4 h-2/5 flex flex-col">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {currentProduct.name}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-bold">
                {currencySymbol}{currentProduct.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-muted-foreground line-through">
                  {currencySymbol}{currentProduct.compare_at_price!.toFixed(2)}
                </span>
              )}
            </div>

            {currentProduct.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {currentProduct.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        {/* Skip */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleSkip}
          className="w-14 h-14 rounded-full border-2 border-red-200 text-red-500 hover:bg-red-50"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Undo */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-10 h-10 rounded-full"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Wishlist */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleWishlist}
          className="w-14 h-14 rounded-full border-2 border-pink-200 text-pink-500 hover:bg-pink-50"
        >
          <Heart className="h-6 w-6" />
        </Button>

        {/* Add to cart */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleAddToCart}
          className="w-14 h-14 rounded-full border-2 border-green-200 text-green-500 hover:bg-green-50"
        >
          <ShoppingCart className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress indicator */}
      <p className="text-sm text-muted-foreground mt-4">
        {currentIndex + 1} of {products.length} products
      </p>
    </div>
  )
}

export default ProductSwipeView
```

---

### Task 32.8: Update Mobile Components Index

**File**: `src/modules/ecommerce/studio/components/mobile/index.ts`
**Action**: Modify

**Description**: Add exports for all product components

Add these exports to the existing index file:

```typescript
// === PHASE ECOM-32: Mobile Product Experience ===

// Product Gallery
export { MobileProductGallery, type ProductImage, type MobileProductGalleryProps } from './MobileProductGallery'
export { default as MobileProductGalleryDefault } from './MobileProductGallery'

// Variant Selector
export { MobileVariantSelector, type VariantOption, type MobileVariantSelectorProps } from './MobileVariantSelector'
export { default as MobileVariantSelectorDefault } from './MobileVariantSelector'

// Sticky Add to Cart
export { StickyAddToCartBar, type StickyAddToCartBarProps } from './StickyAddToCartBar'
export { default as StickyAddToCartBarDefault } from './StickyAddToCartBar'

// Collapsible Product Details
export { 
  CollapsibleProductDetails, 
  createProductSections,
  type ProductSection,
  type ProductSpecification,
  type CollapsibleProductDetailsProps 
} from './CollapsibleProductDetails'
export { default as CollapsibleProductDetailsDefault } from './CollapsibleProductDetails'

// Mobile Product Card
export { MobileProductCard, type MobileProductCardProps } from './MobileProductCard'
export { default as MobileProductCardDefault } from './MobileProductCard'

// Quick View
export { MobileQuickView, type MobileQuickViewProps } from './MobileQuickView'
export { default as MobileQuickViewDefault } from './MobileQuickView'

// Product Swipe View
export { ProductSwipeView, type SwipeAction, type ProductSwipeViewProps } from './ProductSwipeView'
export { default as ProductSwipeViewDefault } from './ProductSwipeView'
```

---

## ✅ Testing Checklist

### TypeScript Compilation
- [ ] Run `npx tsc --noEmit` - must pass with zero errors

### Mobile Device Testing
- [ ] Test on physical iPhone (Safari)
- [ ] Test on physical Android (Chrome)
- [ ] Test pinch-to-zoom in gallery
- [ ] Test swipe gestures in gallery
- [ ] Test double-tap zoom

### Gallery Testing
- [ ] Swipe left/right navigates images
- [ ] Dot indicators update correctly
- [ ] Fullscreen mode works
- [ ] Zoom controls work in fullscreen
- [ ] Images load progressively

### Variant Selector Testing
- [ ] Color swatches display correctly
- [ ] Size chips are touch-friendly (44px+)
- [ ] Out-of-stock variants are marked
- [ ] Price updates with variant selection
- [ ] Bottom sheet dismisses on swipe down

### Sticky Bar Testing
- [ ] Bar appears when button scrolls out
- [ ] Bar disappears when button visible
- [ ] Price displays correctly
- [ ] Add to cart button works
- [ ] Safe area is respected

### Product Card Testing
- [ ] Cards display in 2-column grid
- [ ] Quick add button works
- [ ] Wishlist toggle works
- [ ] Discount badge shows correctly
- [ ] Image loads efficiently

### Swipe View Testing
- [ ] Swipe right adds to cart
- [ ] Swipe left skips
- [ ] Swipe up adds to wishlist
- [ ] Undo button works
- [ ] Progress shows correctly

### Performance Testing
- [ ] Gallery swipes at 60fps
- [ ] No jank during animations
- [ ] Images lazy load correctly
- [ ] Memory doesn't grow with swipes

---

## 🔄 Rollback Plan

If issues occur:

1. **Delete new files:**
   ```
   studio/components/mobile/MobileProductGallery.tsx
   studio/components/mobile/MobileVariantSelector.tsx
   studio/components/mobile/StickyAddToCartBar.tsx
   studio/components/mobile/CollapsibleProductDetails.tsx
   studio/components/mobile/MobileProductCard.tsx
   studio/components/mobile/MobileQuickView.tsx
   studio/components/mobile/ProductSwipeView.tsx
   ```

2. **Revert index.ts** to ECOM-31 state

3. **Wave 3 desktop product components remain functional**

4. **No database migration required**

---

## 📝 Memory Bank Updates

After completion, update these files:

### activeContext.md
```markdown
## Latest Session Update (ECOM-32 Complete - [DATE])

### Completed: PHASE-ECOM-32 Mobile Product Experience

#### Files Created:
- `studio/components/mobile/MobileProductGallery.tsx` - Swipeable gallery
- `studio/components/mobile/MobileVariantSelector.tsx` - Bottom sheet variants
- `studio/components/mobile/StickyAddToCartBar.tsx` - Fixed add to cart
- `studio/components/mobile/CollapsibleProductDetails.tsx` - Accordion info
- `studio/components/mobile/MobileProductCard.tsx` - Mobile product card
- `studio/components/mobile/MobileQuickView.tsx` - Quick view sheet
- `studio/components/mobile/ProductSwipeView.tsx` - Tinder-style discovery

#### Files Modified:
- `studio/components/mobile/index.ts` - Added product exports

### Wave 4 Complete!
All 3 mobile optimization phases finished:
- ECOM-30 ✅ Mobile Cart Experience
- ECOM-31 ✅ Mobile Checkout Flow
- ECOM-32 ✅ Mobile Product Experience
```

### progress.md
```markdown
## 📋 E-COMMERCE WAVE 4 COMPLETE

| Phase | Title | Priority | Status |
|-------|-------|----------|--------|
| ECOM-30 | Mobile Cart Experience | 🟠 HIGH | ✅ Complete |
| ECOM-31 | Mobile Checkout Flow | 🟠 HIGH | ✅ Complete |
| ECOM-32 | Mobile Product Experience | 🟠 HIGH | ✅ Complete |

### Wave 4 Summary:
- **New Hooks**: useMobile, useSwipeGesture, useHapticFeedback, useKeyboardVisible
- **Mobile Cart**: Bottom sheet, FAB button, swipeable items, notifications
- **Mobile Checkout**: Single-page flow, touch forms, collapsible sections
- **Mobile Product**: Swipe gallery, variant selector, sticky bar, swipe view
- **Total New Components**: 20+ mobile-specific components
```

---

## ✨ Success Criteria

- [ ] `MobileProductGallery` swipes smoothly at 60fps
- [ ] Pinch-to-zoom works on gallery images
- [ ] Double-tap toggles zoom
- [ ] `MobileVariantSelector` shows in bottom sheet
- [ ] Color swatches display correctly
- [ ] Out-of-stock variants are visually distinct
- [ ] `StickyAddToCartBar` appears/disappears smoothly
- [ ] IntersectionObserver triggers correctly
- [ ] `CollapsibleProductDetails` animates accordion
- [ ] `MobileProductCard` fits 2-column grid
- [ ] Quick add works without opening product
- [ ] `MobileQuickView` shows product preview
- [ ] `ProductSwipeView` handles all swipe directions
- [ ] Undo functionality works in swipe view
- [ ] All touch targets are 44px+
- [ ] TypeScript compiles with zero errors

---

**END OF PHASE-ECOM-32**

---

## 🎉 WAVE 4 COMPLETE

With PHASE-ECOM-32 complete, the entire Wave 4 Mobile-First Optimization is finished!

### Wave 4 Summary

| Phase | Components Created | Key Features |
|-------|-------------------|--------------|
| ECOM-30 | 5 + 3 hooks | Bottom sheet cart, FAB, swipe items, haptics |
| ECOM-31 | 11 + 1 hook | Single-page checkout, accordion sections, sticky CTA |
| ECOM-32 | 7 components | Swipe gallery, variant selector, product discovery |

### Total Wave 4 Deliverables:
- **4 New Hooks**: useMobile, useSwipeGesture, useHapticFeedback, useKeyboardVisible
- **23 New Components**: Complete mobile e-commerce experience
- **Touch-first UX**: All interactions optimized for mobile

### Next Steps (Wave 5):
- ECOM-40: Inventory Management
- ECOM-41: Analytics & Reports
- ECOM-42: Marketing Features
- ECOM-43: Integrations
