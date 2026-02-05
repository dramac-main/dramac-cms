# PHASE-ECOM-21: Product Display Components

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-20 (Core Data Hooks)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create Studio-compatible product display components that use real data hooks. These components replace the existing demo-data components with production-ready blocks featuring responsive design, proper loading states, and full Studio editor integration.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-20 hooks are implemented and working
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing product-card-block.tsx (will be rewritten)
- [ ] Review component-registry.ts for registration patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Product Display Components
├── ProductCardBlock         → Single product card (Studio)
├── ProductGridBlock         → Product grid with filters (Studio)
├── FeaturedProductsBlock    → Featured products carousel (Studio)
├── ProductQuickViewBlock    → Modal quick view (Studio)
├── ProductPriceDisplay      → Price with sale/variants (Utility)
├── ProductImageGallery      → Image gallery with zoom (Utility)
├── ProductStockBadge        → Stock status indicator (Utility)
└── ProductRatingDisplay     → Rating stars display (Utility)

Data Flow
[useStorefrontProducts/Product] → [Block Component] → [Studio Canvas]
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `studio/blocks/ecommerce/product-card-block.tsx` | Rewrite | Product card with real data |
| `studio/blocks/ecommerce/product-grid-block.tsx` | Create | Product grid layout |
| `studio/blocks/ecommerce/featured-products-block.tsx` | Create | Featured carousel |
| `studio/blocks/ecommerce/product-quickview-block.tsx` | Create | Quick view modal |
| `studio/components/ecommerce/ProductPriceDisplay.tsx` | Create | Price display utility |
| `studio/components/ecommerce/ProductImageGallery.tsx` | Create | Image gallery utility |
| `studio/components/ecommerce/ProductStockBadge.tsx` | Create | Stock badge utility |
| `studio/components/ecommerce/ProductRatingDisplay.tsx` | Create | Rating display utility |
| `studio/blocks/ecommerce/index.ts` | Modify | Export new blocks |
| `studio/registry/component-registry.ts` | Modify | Register new blocks |

---

## 📋 Implementation Tasks

### Task 21.1: Create Product Price Display Utility

**File**: `src/studio/components/ecommerce/ProductPriceDisplay.tsx`
**Action**: Create

**Description**: Reusable price display component with sale prices

```typescript
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
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { Product, ProductVariant } from '@/modules/ecommerce/types/ecommerce-types'
import type { ResponsiveValue } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

interface ProductPriceDisplayProps {
  product: Product
  selectedVariant?: ProductVariant | null
  size?: ResponsiveValue<'sm' | 'md' | 'lg' | 'xl'>
  showCompareAt?: boolean
  showSavings?: boolean
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

function calculateSavings(original: number, current: number): number {
  if (original <= current) return 0
  return Math.round(((original - current) / original) * 100)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductPriceDisplay({
  product,
  selectedVariant,
  size = 'md',
  showCompareAt = true,
  showSavings = true,
  className
}: ProductPriceDisplayProps) {
  const { formatPrice } = useStorefront()

  // Determine current price
  const currentPrice = selectedVariant?.price ?? product.base_price
  const comparePrice = selectedVariant?.compare_at_price ?? product.compare_at_price
  const hasDiscount = comparePrice && comparePrice > currentPrice
  const savings = hasDiscount ? calculateSavings(comparePrice, currentPrice) : 0

  // Size classes
  const sizeValue = getResponsiveValue(size, 'md')
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
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
      <span 
        className={cn(
          'font-semibold',
          sizeClasses[sizeValue],
          hasDiscount && 'text-red-600'
        )}
      >
        {formatPrice(currentPrice)}
      </span>

      {/* Compare At Price */}
      {showCompareAt && hasDiscount && (
        <span 
          className={cn(
            'text-muted-foreground line-through',
            compareSizeClasses[sizeValue]
          )}
        >
          {formatPrice(comparePrice)}
        </span>
      )}

      {/* Savings Badge */}
      {showSavings && hasDiscount && savings > 0 && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          Save {savings}%
        </span>
      )}
    </div>
  )
}
```

---

### Task 21.2: Create Product Stock Badge Utility

**File**: `src/studio/components/ecommerce/ProductStockBadge.tsx`
**Action**: Create

**Description**: Stock status indicator component

```typescript
/**
 * ProductStockBadge - Stock status indicator
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Displays stock status with appropriate styling.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, X, AlertCircle, Package } from 'lucide-react'
import type { Product, ProductVariant } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ProductStockBadgeProps {
  product: Product
  selectedVariant?: ProductVariant | null
  showQuantity?: boolean
  lowStockThreshold?: number
  className?: string
}

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'unlimited'

// ============================================================================
// HELPERS
// ============================================================================

function getStockStatus(
  product: Product, 
  variant?: ProductVariant | null,
  threshold = 5
): { status: StockStatus; quantity: number | null } {
  const trackInventory = variant?.track_inventory ?? product.track_inventory
  const quantity = variant?.inventory_quantity ?? product.inventory_quantity ?? 0

  if (!trackInventory) {
    return { status: 'unlimited', quantity: null }
  }

  if (quantity <= 0) {
    return { status: 'out-of-stock', quantity: 0 }
  }

  if (quantity <= threshold) {
    return { status: 'low-stock', quantity }
  }

  return { status: 'in-stock', quantity }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductStockBadge({
  product,
  selectedVariant,
  showQuantity = false,
  lowStockThreshold = 5,
  className
}: ProductStockBadgeProps) {
  const { status, quantity } = getStockStatus(product, selectedVariant, lowStockThreshold)

  const statusConfig = {
    'in-stock': {
      icon: Check,
      text: 'In Stock',
      bgClass: 'bg-green-100',
      textClass: 'text-green-700',
      iconClass: 'text-green-600'
    },
    'low-stock': {
      icon: AlertCircle,
      text: `Only ${quantity} left`,
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700',
      iconClass: 'text-amber-600'
    },
    'out-of-stock': {
      icon: X,
      text: 'Out of Stock',
      bgClass: 'bg-red-100',
      textClass: 'text-red-700',
      iconClass: 'text-red-600'
    },
    'unlimited': {
      icon: Package,
      text: 'Available',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-700',
      iconClass: 'text-blue-600'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      <span>{config.text}</span>
      {showQuantity && status === 'in-stock' && quantity && (
        <span className="text-muted-foreground">({quantity})</span>
      )}
    </div>
  )
}
```

---

### Task 21.3: Create Product Rating Display Utility

**File**: `src/studio/components/ecommerce/ProductRatingDisplay.tsx`
**Action**: Create

**Description**: Star rating display component

```typescript
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
import type { ResponsiveValue } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

interface ProductRatingDisplayProps {
  rating: number
  reviewCount?: number
  maxRating?: number
  size?: ResponsiveValue<'sm' | 'md' | 'lg'>
  showCount?: boolean
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
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
  const sizeValue = getResponsiveValue(size, 'md')
  
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
            className={cn(sizeClasses[sizeValue].star, 'fill-amber-400 text-amber-400')}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(sizeClasses[sizeValue].star, 'text-gray-300')}
            />
            <StarHalf
              className={cn(
                sizeClasses[sizeValue].star, 
                'absolute left-0 top-0 fill-amber-400 text-amber-400'
              )}
            />
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[sizeValue].star, 'text-gray-300')}
          />
        ))}
      </div>

      {showCount && reviewCount !== undefined && (
        <span className={cn('text-muted-foreground', sizeClasses[sizeValue].text)}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
```

---

### Task 21.4: Create Product Image Gallery Utility

**File**: `src/studio/components/ecommerce/ProductImageGallery.tsx`
**Action**: Create

**Description**: Image gallery component with thumbnails

```typescript
/**
 * ProductImageGallery - Image gallery with thumbnails
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Displays product images with thumbnail navigation.
 */
'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ProductImage } from '@/modules/ecommerce/types/ecommerce-types'
import type { ResponsiveValue } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
  layout?: ResponsiveValue<'stacked' | 'side-by-side' | 'thumbnails-bottom'>
  aspectRatio?: ResponsiveValue<'square' | '4:3' | '3:4' | '16:9'>
  showThumbnails?: boolean
  enableZoom?: boolean
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

const aspectRatioClasses = {
  'square': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '16:9': 'aspect-video'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductImageGallery({
  images,
  productName,
  layout = 'thumbnails-bottom',
  aspectRatio = 'square',
  showThumbnails = true,
  enableZoom = true,
  className
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const layoutValue = getResponsiveValue(layout, 'thumbnails-bottom')
  const aspectValue = getResponsiveValue(aspectRatio, 'square')

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const selectedImage = sortedImages[selectedIndex] || sortedImages[0]

  const goToNext = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % sortedImages.length)
  }, [sortedImages.length])

  const goToPrev = useCallback(() => {
    setSelectedIndex(prev => prev === 0 ? sortedImages.length - 1 : prev - 1)
  }, [sortedImages.length])

  if (!sortedImages.length) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          aspectRatioClasses[aspectValue],
          className
        )}
      >
        <span className="text-muted-foreground">No image</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex gap-4',
      layoutValue === 'side-by-side' && 'flex-row',
      layoutValue === 'thumbnails-bottom' && 'flex-col',
      layoutValue === 'stacked' && 'flex-col',
      className
    )}>
      {/* Main Image */}
      <div className={cn(
        'relative group overflow-hidden rounded-lg bg-muted',
        layoutValue === 'side-by-side' && 'flex-1',
        aspectRatioClasses[aspectValue]
      )}>
        {selectedImage && (
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt_text || productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Zoom Button */}
        {enableZoom && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 bg-white/80 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setIsZoomed(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && sortedImages.length > 1 && layoutValue !== 'stacked' && (
        <div className={cn(
          'flex gap-2',
          layoutValue === 'side-by-side' && 'flex-col w-20',
          layoutValue === 'thumbnails-bottom' && 'flex-row flex-wrap'
        )}>
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative overflow-hidden rounded-md border-2 transition-colors',
                layoutValue === 'side-by-side' ? 'aspect-square w-full' : 'h-16 w-16',
                selectedIndex === index
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0">
          <DialogTitle className="sr-only">{productName}</DialogTitle>
          <div className="relative aspect-square">
            {selectedImage && (
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt_text || productName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

### Task 21.5: Rewrite Product Card Block

**File**: `src/studio/blocks/ecommerce/product-card-block.tsx`
**Action**: Rewrite (Replace entire file)

**Description**: Complete rewrite of product card using real data hooks

```typescript
/**
 * ProductCardBlock - Product card for Studio
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Studio block component that displays a single product with real data.
 */
'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ShoppingCart, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductPriceDisplay } from '@/studio/components/ecommerce/ProductPriceDisplay'
import { ProductStockBadge } from '@/studio/components/ecommerce/ProductStockBadge'
import { ProductRatingDisplay } from '@/studio/components/ecommerce/ProductRatingDisplay'
import { useStorefrontProduct } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { useStorefrontWishlist, useStorefrontCart } from '@/modules/ecommerce/hooks'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductCardBlockProps extends StudioBlockProps {
  // Data Selection
  productId?: string
  productSlug?: string
  
  // Layout
  variant?: ResponsiveValue<'default' | 'horizontal' | 'minimal' | 'featured'>
  imageAspect?: ResponsiveValue<'square' | '4:3' | '3:4' | '16:9'>
  
  // Display Options
  showPrice?: boolean
  showAddToCart?: boolean
  showWishlist?: boolean
  showQuickView?: boolean
  showRating?: boolean
  showStock?: boolean
  showDescription?: boolean
  descriptionLines?: ResponsiveValue<1 | 2 | 3>
  
  // Styling
  borderRadius?: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl'>
  shadow?: ResponsiveValue<'none' | 'sm' | 'md' | 'lg'>
  hoverEffect?: ResponsiveValue<'none' | 'lift' | 'scale' | 'glow'>
  
  // Links
  linkToProduct?: boolean
  productUrlPrefix?: string
  
  // Callbacks (for Studio preview)
  onQuickView?: () => void
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

const aspectClasses = {
  'square': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '16:9': 'aspect-video'
}

const radiusClasses = {
  'none': 'rounded-none',
  'sm': 'rounded-sm',
  'md': 'rounded-md',
  'lg': 'rounded-lg',
  'xl': 'rounded-xl'
}

const shadowClasses = {
  'none': '',
  'sm': 'shadow-sm',
  'md': 'shadow-md',
  'lg': 'shadow-lg'
}

const hoverClasses = {
  'none': '',
  'lift': 'hover:-translate-y-1 hover:shadow-lg',
  'scale': 'hover:scale-[1.02]',
  'glow': 'hover:ring-2 hover:ring-primary/20'
}

// ============================================================================
// LOADING STATE
// ============================================================================

function ProductCardSkeleton({ variant }: { variant: string }) {
  if (variant === 'horizontal') {
    return (
      <Card className="flex overflow-hidden">
        <Skeleton className="h-40 w-40 shrink-0" />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-9 w-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductCardBlock({
  productId,
  productSlug,
  variant = 'default',
  imageAspect = 'square',
  showPrice = true,
  showAddToCart = true,
  showWishlist = true,
  showQuickView = false,
  showRating = true,
  showStock = false,
  showDescription = false,
  descriptionLines = 2,
  borderRadius = 'lg',
  shadow = 'sm',
  hoverEffect = 'lift',
  linkToProduct = true,
  productUrlPrefix = '/products',
  onQuickView,
  className,
  __studioMeta
}: ProductCardBlockProps) {
  const { siteId } = useStorefront()
  const idOrSlug = productId || productSlug || ''
  
  const { product, isLoading, error } = useStorefrontProduct(siteId, idOrSlug)
  const { addItem, isUpdating } = useStorefrontCart(siteId)
  const { toggleItem, isInWishlist } = useStorefrontWishlist(siteId)

  // Responsive values
  const variantValue = getResponsiveValue(variant, 'default')
  const aspectValue = getResponsiveValue(imageAspect, 'square')
  const radiusValue = getResponsiveValue(borderRadius, 'lg')
  const shadowValue = getResponsiveValue(shadow, 'sm')
  const hoverValue = getResponsiveValue(hoverEffect, 'lift')
  const descLinesValue = getResponsiveValue(descriptionLines, 2)

  // Wishlist state
  const isWishlisted = useMemo(() => {
    if (!product) return false
    return isInWishlist(product.id)
  }, [product, isInWishlist])

  // Get primary image
  const primaryImage = useMemo(() => {
    if (!product?.images?.length) return null
    return product.images.find(img => img.is_primary) || product.images[0]
  }, [product?.images])

  // Product URL
  const productUrl = product 
    ? `${productUrlPrefix}/${product.slug || product.id}`
    : '#'

  // Handlers
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product) return
    await addItem(product.id, null, 1)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product) return
    toggleItem(product.id)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.()
  }

  // Loading state
  if (isLoading) {
    return <ProductCardSkeleton variant={variantValue} />
  }

  // Error state
  if (error || !product) {
    return (
      <Card className={cn(
        'flex items-center justify-center p-8',
        radiusClasses[radiusValue],
        shadowClasses[shadowValue],
        className
      )}>
        <span className="text-muted-foreground text-sm">
          {error || 'Product not found'}
        </span>
      </Card>
    )
  }

  // Horizontal variant
  if (variantValue === 'horizontal') {
    return (
      <Card className={cn(
        'flex overflow-hidden transition-all duration-200',
        radiusClasses[radiusValue],
        shadowClasses[shadowValue],
        hoverClasses[hoverValue],
        className
      )}>
        {/* Image */}
        <div className="relative h-40 w-40 shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <MaybeLink href={productUrl} enabled={linkToProduct}>
              <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                {product.name}
              </h3>
            </MaybeLink>
            
            {showRating && product.rating && (
              <ProductRatingDisplay 
                rating={product.rating} 
                reviewCount={product.review_count}
                size="sm" 
                className="mt-1"
              />
            )}
            
            {showDescription && product.description && (
              <p className={cn(
                'mt-2 text-sm text-muted-foreground',
                `line-clamp-${descLinesValue}`
              )}>
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            {showPrice && (
              <ProductPriceDisplay product={product} size="lg" />
            )}
            
            {showAddToCart && (
              <Button 
                size="sm" 
                onClick={handleAddToCart}
                disabled={isUpdating}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Minimal variant
  if (variantValue === 'minimal') {
    return (
      <div className={cn('group', className)}>
        <MaybeLink href={productUrl} enabled={linkToProduct}>
          <div className={cn(
            'relative overflow-hidden',
            aspectClasses[aspectValue],
            radiusClasses[radiusValue]
          )}>
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {showPrice && <ProductPriceDisplay product={product} size="sm" />}
          </div>
        </MaybeLink>
      </div>
    )
  }

  // Featured variant
  if (variantValue === 'featured') {
    return (
      <Card className={cn(
        'overflow-hidden transition-all duration-200',
        radiusClasses[radiusValue],
        shadowClasses[shadowValue],
        hoverClasses[hoverValue],
        className
      )}>
        <div className="relative">
          <div className={cn('relative', aspectClasses[aspectValue])}>
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.compare_at_price && product.compare_at_price > product.base_price && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                SALE
              </span>
            )}
            {product.featured && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                FEATURED
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {showWishlist && (
              <Button 
                size="icon" 
                variant="secondary" 
                onClick={handleWishlistToggle}
                className="h-9 w-9"
              >
                <Heart className={cn('h-4 w-4', isWishlisted && 'fill-red-500 text-red-500')} />
              </Button>
            )}
            {showQuickView && (
              <Button 
                size="icon" 
                variant="secondary" 
                onClick={handleQuickView}
                className="h-9 w-9"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          <MaybeLink href={productUrl} enabled={linkToProduct}>
            <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </MaybeLink>

          {showRating && product.rating && (
            <ProductRatingDisplay 
              rating={product.rating} 
              reviewCount={product.review_count}
              size="md"
              className="mt-2"
            />
          )}

          {showDescription && product.description && (
            <p className={cn(
              'mt-3 text-muted-foreground',
              `line-clamp-${descLinesValue}`
            )}>
              {product.description}
            </p>
          )}

          {showStock && (
            <ProductStockBadge product={product} className="mt-3" />
          )}
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-0 flex items-center justify-between">
          {showPrice && <ProductPriceDisplay product={product} size="xl" />}
          
          {showAddToCart && (
            <Button onClick={handleAddToCart} disabled={isUpdating}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn(
      'group overflow-hidden transition-all duration-200',
      radiusClasses[radiusValue],
      shadowClasses[shadowValue],
      hoverClasses[hoverValue],
      className
    )}>
      {/* Image */}
      <div className="relative">
        <div className={cn('relative', aspectClasses[aspectValue])}>
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          {showWishlist && (
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={handleWishlistToggle}
              className="h-8 w-8"
            >
              <Heart className={cn('h-4 w-4', isWishlisted && 'fill-red-500 text-red-500')} />
            </Button>
          )}
          {showQuickView && (
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={handleQuickView}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sale badge */}
        {product.compare_at_price && product.compare_at_price > product.base_price && (
          <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            SALE
          </span>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <MaybeLink href={productUrl} enabled={linkToProduct}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </MaybeLink>

        {showRating && product.rating && (
          <ProductRatingDisplay 
            rating={product.rating} 
            reviewCount={product.review_count}
            size="sm"
            className="mt-1.5"
          />
        )}

        {showStock && (
          <ProductStockBadge product={product} className="mt-2" />
        )}

        {showPrice && (
          <ProductPriceDisplay product={product} className="mt-3" />
        )}
      </CardContent>

      {/* Footer */}
      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={isUpdating}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MaybeLink({ 
  href, 
  enabled, 
  children 
}: { 
  href: string
  enabled: boolean
  children: React.ReactNode 
}) {
  if (enabled) {
    return <Link href={href}>{children}</Link>
  }
  return <>{children}</>
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const productCardBlockConfig = {
  type: 'product-card',
  label: 'Product Card',
  category: 'e-commerce',
  icon: 'ShoppingBag',
  defaultProps: {
    variant: 'default',
    imageAspect: 'square',
    showPrice: true,
    showAddToCart: true,
    showWishlist: true,
    showQuickView: false,
    showRating: true,
    showStock: false,
    showDescription: false,
    descriptionLines: 2,
    borderRadius: 'lg',
    shadow: 'sm',
    hoverEffect: 'lift',
    linkToProduct: true,
    productUrlPrefix: '/products'
  },
  fields: [
    {
      name: 'productId',
      label: 'Product',
      type: 'product-selector',
      description: 'Select the product to display'
    },
    {
      name: 'variant',
      label: 'Card Variant',
      type: 'select',
      options: [
        { value: 'default', label: 'Default Card' },
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'featured', label: 'Featured' }
      ],
      responsive: true
    },
    {
      name: 'imageAspect',
      label: 'Image Aspect Ratio',
      type: 'select',
      options: [
        { value: 'square', label: '1:1 Square' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4 Portrait' },
        { value: '16:9', label: '16:9 Wide' }
      ],
      responsive: true
    },
    {
      name: 'showPrice',
      label: 'Show Price',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showAddToCart',
      label: 'Show Add to Cart',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showWishlist',
      label: 'Show Wishlist Button',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showQuickView',
      label: 'Show Quick View',
      type: 'toggle',
      defaultValue: false
    },
    {
      name: 'showRating',
      label: 'Show Rating',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showStock',
      label: 'Show Stock Status',
      type: 'toggle',
      defaultValue: false
    },
    {
      name: 'showDescription',
      label: 'Show Description',
      type: 'toggle',
      defaultValue: false
    },
    {
      name: 'borderRadius',
      label: 'Border Radius',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'xl', label: 'Extra Large' }
      ],
      responsive: true
    },
    {
      name: 'shadow',
      label: 'Shadow',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' }
      ],
      responsive: true
    },
    {
      name: 'hoverEffect',
      label: 'Hover Effect',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'lift', label: 'Lift' },
        { value: 'scale', label: 'Scale' },
        { value: 'glow', label: 'Glow' }
      ],
      responsive: true
    },
    {
      name: 'linkToProduct',
      label: 'Link to Product Page',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'productUrlPrefix',
      label: 'Product URL Prefix',
      type: 'text',
      defaultValue: '/products'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Display a single product with customizable card layout',
    contextHints: ['product display', 'e-commerce', 'shop', 'buy']
  }
}
```

---

### Task 21.6: Create Product Grid Block

**File**: `src/studio/blocks/ecommerce/product-grid-block.tsx`
**Action**: Create

**Description**: Grid layout for displaying multiple products

```typescript
/**
 * ProductGridBlock - Product grid for Studio
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Studio block component that displays a grid of products.
 */
'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ProductCardBlock } from './product-card-block'
import { useStorefrontProducts } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductGridBlockProps extends StudioBlockProps {
  // Data Options
  categoryId?: string
  categorySlug?: string
  featured?: boolean
  maxProducts?: number
  sortBy?: 'name' | 'price-asc' | 'price-desc' | 'newest' | 'popularity'
  
  // Grid Layout
  columns?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6>
  gap?: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl'>
  
  // Card Options
  cardVariant?: ResponsiveValue<'default' | 'horizontal' | 'minimal' | 'featured'>
  imageAspect?: ResponsiveValue<'square' | '4:3' | '3:4' | '16:9'>
  showPrice?: boolean
  showAddToCart?: boolean
  showWishlist?: boolean
  showRating?: boolean
  
  // Pagination
  showLoadMore?: boolean
  loadMoreText?: string
  
  // Empty State
  emptyTitle?: string
  emptyDescription?: string
  
  // Links
  productUrlPrefix?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

const gapClasses = {
  'none': 'gap-0',
  'sm': 'gap-2',
  'md': 'gap-4',
  'lg': 'gap-6',
  'xl': 'gap-8'
}

// ============================================================================
// LOADING STATE
// ============================================================================

function ProductGridSkeleton({ 
  columns, 
  count 
}: { 
  columns: number
  count: number 
}) {
  return (
    <div 
      className="grid"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ 
  title, 
  description 
}: { 
  title: string
  description: string 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductGridBlock({
  categoryId,
  categorySlug,
  featured,
  maxProducts = 12,
  sortBy = 'newest',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 'md',
  cardVariant = 'default',
  imageAspect = 'square',
  showPrice = true,
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  showLoadMore = true,
  loadMoreText = 'Load More Products',
  emptyTitle = 'No Products Found',
  emptyDescription = 'Check back later for new arrivals.',
  productUrlPrefix = '/products',
  className,
  __studioMeta
}: ProductGridBlockProps) {
  const { siteId } = useStorefront()
  
  const [page, setPage] = React.useState(1)
  const [allProducts, setAllProducts] = React.useState<typeof products>([])

  const { products, pagination, isLoading, refetch } = useStorefrontProducts(siteId, {
    categoryId,
    categorySlug,
    featured,
    sortBy,
    limit: maxProducts,
    page
  })

  // Accumulate products for load more
  React.useEffect(() => {
    if (page === 1) {
      setAllProducts(products)
    } else {
      setAllProducts(prev => [...prev, ...products])
    }
  }, [products, page])

  // Responsive values
  const columnsValue = getResponsiveValue(columns, 4)
  const gapValue = getResponsiveValue(gap, 'md')

  const handleLoadMore = () => {
    if (pagination.hasNext) {
      setPage(prev => prev + 1)
    }
  }

  // Grid styles with responsive columns
  const gridStyles = useMemo(() => {
    if (typeof columns === 'object') {
      return {
        '--grid-cols-mobile': columns.mobile || 2,
        '--grid-cols-tablet': columns.tablet || 3,
        '--grid-cols-desktop': columns.desktop || 4
      } as React.CSSProperties
    }
    return {
      '--grid-cols-mobile': columns,
      '--grid-cols-tablet': columns,
      '--grid-cols-desktop': columns
    } as React.CSSProperties
  }, [columns])

  // Loading state (first load only)
  if (isLoading && page === 1) {
    return (
      <div className={cn(gapClasses[gapValue], className)}>
        <ProductGridSkeleton columns={columnsValue} count={maxProducts} />
      </div>
    )
  }

  // Empty state
  if (!isLoading && allProducts.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Product Grid */}
      <div 
        className={cn(
          'grid',
          gapClasses[gapValue],
          // Responsive columns using CSS custom properties
          'grid-cols-[repeat(var(--grid-cols-mobile),minmax(0,1fr))]',
          'md:grid-cols-[repeat(var(--grid-cols-tablet),minmax(0,1fr))]',
          'lg:grid-cols-[repeat(var(--grid-cols-desktop),minmax(0,1fr))]'
        )}
        style={gridStyles}
      >
        {allProducts.map(product => (
          <ProductCardBlock
            key={product.id}
            productId={product.id}
            variant={cardVariant}
            imageAspect={imageAspect}
            showPrice={showPrice}
            showAddToCart={showAddToCart}
            showWishlist={showWishlist}
            showRating={showRating}
            productUrlPrefix={productUrlPrefix}
          />
        ))}
      </div>

      {/* Load More */}
      {showLoadMore && pagination.hasNext && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              loadMoreText
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const productGridBlockConfig = {
  type: 'product-grid',
  label: 'Product Grid',
  category: 'e-commerce',
  icon: 'LayoutGrid',
  defaultProps: {
    maxProducts: 12,
    sortBy: 'newest',
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    gap: 'md',
    cardVariant: 'default',
    imageAspect: 'square',
    showPrice: true,
    showAddToCart: true,
    showWishlist: true,
    showRating: true,
    showLoadMore: true,
    loadMoreText: 'Load More Products',
    emptyTitle: 'No Products Found',
    emptyDescription: 'Check back later for new arrivals.',
    productUrlPrefix: '/products'
  },
  fields: [
    {
      name: 'categoryId',
      label: 'Category',
      type: 'category-selector',
      description: 'Filter by category (optional)'
    },
    {
      name: 'featured',
      label: 'Featured Only',
      type: 'toggle',
      description: 'Show only featured products'
    },
    {
      name: 'maxProducts',
      label: 'Max Products',
      type: 'number',
      min: 1,
      max: 50,
      defaultValue: 12
    },
    {
      name: 'sortBy',
      label: 'Sort By',
      type: 'select',
      options: [
        { value: 'newest', label: 'Newest' },
        { value: 'name', label: 'Name A-Z' },
        { value: 'price-asc', label: 'Price: Low to High' },
        { value: 'price-desc', label: 'Price: High to Low' },
        { value: 'popularity', label: 'Popularity' }
      ]
    },
    {
      name: 'columns',
      label: 'Columns',
      type: 'select',
      options: [
        { value: 1, label: '1 Column' },
        { value: 2, label: '2 Columns' },
        { value: 3, label: '3 Columns' },
        { value: 4, label: '4 Columns' },
        { value: 5, label: '5 Columns' },
        { value: 6, label: '6 Columns' }
      ],
      responsive: true
    },
    {
      name: 'gap',
      label: 'Gap',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'xl', label: 'Extra Large' }
      ],
      responsive: true
    },
    {
      name: 'cardVariant',
      label: 'Card Style',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'featured', label: 'Featured' }
      ],
      responsive: true
    },
    {
      name: 'showPrice',
      label: 'Show Prices',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showAddToCart',
      label: 'Show Add to Cart',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showLoadMore',
      label: 'Show Load More',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'loadMoreText',
      label: 'Load More Button Text',
      type: 'text',
      defaultValue: 'Load More Products'
    },
    {
      name: 'emptyTitle',
      label: 'Empty State Title',
      type: 'text',
      defaultValue: 'No Products Found'
    },
    {
      name: 'emptyDescription',
      label: 'Empty State Description',
      type: 'textarea',
      defaultValue: 'Check back later for new arrivals.'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Display a grid of products with filtering and pagination',
    contextHints: ['product listing', 'shop', 'catalog', 'collection']
  }
}
```

---

### Task 21.7: Create Featured Products Block

**File**: `src/studio/blocks/ecommerce/featured-products-block.tsx`
**Action**: Create

**Description**: Carousel block for featured products

```typescript
/**
 * FeaturedProductsBlock - Featured products carousel for Studio
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Studio block component that displays featured products in a carousel.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCardBlock } from './product-card-block'
import { useStorefrontProducts } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { Skeleton } from '@/components/ui/skeleton'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface FeaturedProductsBlockProps extends StudioBlockProps {
  // Content
  title?: string
  subtitle?: string
  
  // Data Options
  categoryId?: string
  maxProducts?: number
  
  // Carousel Options
  visibleSlides?: ResponsiveValue<1 | 2 | 3 | 4 | 5>
  autoPlay?: boolean
  autoPlayInterval?: number
  showArrows?: boolean
  showDots?: boolean
  gap?: ResponsiveValue<'none' | 'sm' | 'md' | 'lg'>
  
  // Card Options
  cardVariant?: ResponsiveValue<'default' | 'minimal' | 'featured'>
  imageAspect?: ResponsiveValue<'square' | '4:3' | '3:4'>
  showPrice?: boolean
  showAddToCart?: boolean
  
  // Links
  productUrlPrefix?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

const gapClasses = {
  'none': 'gap-0',
  'sm': 'gap-2',
  'md': 'gap-4',
  'lg': 'gap-6'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FeaturedProductsBlock({
  title = 'Featured Products',
  subtitle,
  categoryId,
  maxProducts = 8,
  visibleSlides = { mobile: 1, tablet: 3, desktop: 4 },
  autoPlay = false,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  gap = 'md',
  cardVariant = 'default',
  imageAspect = 'square',
  showPrice = true,
  showAddToCart = true,
  productUrlPrefix = '/products',
  className,
  __studioMeta
}: FeaturedProductsBlockProps) {
  const { siteId } = useStorefront()
  const [currentIndex, setCurrentIndex] = useState(0)

  const { products, isLoading } = useStorefrontProducts(siteId, {
    categoryId,
    featured: true,
    limit: maxProducts,
    sortBy: 'newest'
  })

  const slidesValue = getResponsiveValue(visibleSlides, 4)
  const gapValue = getResponsiveValue(gap, 'md')
  
  const totalSlides = products.length
  const maxIndex = Math.max(0, totalSlides - slidesValue)

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  // Auto play
  useEffect(() => {
    if (!autoPlay || totalSlides <= slidesValue) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, goToNext, totalSlides, slidesValue])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {title && <Skeleton className="h-8 w-48" />}
        <div className="flex gap-4">
          {Array.from({ length: slidesValue }).map((_, i) => (
            <div key={i} className="flex-1 space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="flex items-end justify-between">
          <div>
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          </div>
          
          {/* Arrow controls in header for desktop */}
          {showArrows && totalSlides > slidesValue && (
            <div className="hidden md:flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={goToPrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden">
          <div 
            className={cn('flex transition-transform duration-300', gapClasses[gapValue])}
            style={{
              transform: `translateX(-${currentIndex * (100 / slidesValue)}%)`,
              width: `${(totalSlides / slidesValue) * 100}%`
            }}
          >
            {products.map(product => (
              <div
                key={product.id}
                style={{ width: `${100 / totalSlides}%` }}
                className="shrink-0"
              >
                <ProductCardBlock
                  productId={product.id}
                  variant={cardVariant}
                  imageAspect={imageAspect}
                  showPrice={showPrice}
                  showAddToCart={showAddToCart}
                  productUrlPrefix={productUrlPrefix}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile arrow controls */}
        {showArrows && totalSlides > slidesValue && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:hidden"
              onClick={goToPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:hidden"
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Dots */}
      {showDots && totalSlides > slidesValue && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                currentIndex === i 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const featuredProductsBlockConfig = {
  type: 'featured-products',
  label: 'Featured Products',
  category: 'e-commerce',
  icon: 'Star',
  defaultProps: {
    title: 'Featured Products',
    maxProducts: 8,
    visibleSlides: { mobile: 1, tablet: 3, desktop: 4 },
    autoPlay: false,
    autoPlayInterval: 5000,
    showArrows: true,
    showDots: true,
    gap: 'md',
    cardVariant: 'default',
    imageAspect: 'square',
    showPrice: true,
    showAddToCart: true,
    productUrlPrefix: '/products'
  },
  fields: [
    {
      name: 'title',
      label: 'Section Title',
      type: 'text',
      defaultValue: 'Featured Products'
    },
    {
      name: 'subtitle',
      label: 'Subtitle',
      type: 'text'
    },
    {
      name: 'categoryId',
      label: 'Category Filter',
      type: 'category-selector',
      description: 'Optional: limit to a specific category'
    },
    {
      name: 'maxProducts',
      label: 'Max Products',
      type: 'number',
      min: 1,
      max: 20,
      defaultValue: 8
    },
    {
      name: 'visibleSlides',
      label: 'Visible Products',
      type: 'select',
      options: [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' }
      ],
      responsive: true
    },
    {
      name: 'autoPlay',
      label: 'Auto Play',
      type: 'toggle',
      defaultValue: false
    },
    {
      name: 'autoPlayInterval',
      label: 'Auto Play Interval (ms)',
      type: 'number',
      min: 1000,
      max: 10000,
      defaultValue: 5000,
      showIf: { autoPlay: true }
    },
    {
      name: 'showArrows',
      label: 'Show Arrows',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showDots',
      label: 'Show Dots',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'cardVariant',
      label: 'Card Style',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'featured', label: 'Featured' }
      ]
    }
  ],
  ai: {
    suggestable: true,
    description: 'Display featured products in a carousel slider',
    contextHints: ['featured', 'carousel', 'slider', 'bestsellers', 'new arrivals']
  }
}
```

---

### Task 21.8: Create Product Quick View Block

**File**: `src/studio/blocks/ecommerce/product-quickview-block.tsx`
**Action**: Create

**Description**: Modal quick view component for products

```typescript
/**
 * ProductQuickViewBlock - Quick view modal for Studio
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Modal component for quick product preview without leaving the page.
 */
'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { X, Minus, Plus, ShoppingCart, Heart, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductPriceDisplay } from '@/studio/components/ecommerce/ProductPriceDisplay'
import { ProductStockBadge } from '@/studio/components/ecommerce/ProductStockBadge'
import { ProductRatingDisplay } from '@/studio/components/ecommerce/ProductRatingDisplay'
import { useStorefrontProduct, useStorefrontCart, useStorefrontWishlist } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProductVariant } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductQuickViewProps {
  productId: string
  isOpen: boolean
  onClose: () => void
  productUrlPrefix?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductQuickView({
  productId,
  isOpen,
  onClose,
  productUrlPrefix = '/products'
}: ProductQuickViewProps) {
  const { siteId } = useStorefront()
  const { product, variants, isLoading } = useStorefrontProduct(siteId, productId)
  const { addItem, isUpdating } = useStorefrontCart(siteId)
  const { toggleItem, isInWishlist } = useStorefrontWishlist(siteId)

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const isWishlisted = useMemo(() => {
    if (!product) return false
    return isInWishlist(product.id, selectedVariant?.id)
  }, [product, selectedVariant, isInWishlist])

  const images = useMemo(() => {
    if (!product?.images?.length) return []
    return [...product.images].sort((a, b) => a.sort_order - b.sort_order)
  }, [product?.images])

  const currentPrice = selectedVariant?.price ?? product?.base_price ?? 0
  const comparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price

  const handleAddToCart = async () => {
    if (!product) return
    const success = await addItem(product.id, selectedVariant?.id ?? null, quantity)
    if (success) {
      onClose()
    }
  }

  const handleWishlistToggle = () => {
    if (!product) return
    toggleItem(product.id, selectedVariant?.id)
  }

  const productUrl = product 
    ? `${productUrlPrefix}/${product.slug || product.id}`
    : '#'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{product?.name || 'Product'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : product ? (
          <div className="grid md:grid-cols-2">
            {/* Images */}
            <div className="relative bg-muted p-6">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                {images[selectedImage] ? (
                  <Image
                    src={images[selectedImage].url}
                    alt={images[selectedImage].alt_text || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                  {comparePrice && comparePrice > currentPrice && (
                    <Badge variant="destructive">SALE</Badge>
                  )}
                  {product.featured && (
                    <Badge>FEATURED</Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2',
                        selectedImage === idx ? 'border-primary' : 'border-transparent'
                      )}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt_text || `${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col p-6">
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-bold">{product.name}</h2>

                {product.rating && (
                  <ProductRatingDisplay 
                    rating={product.rating} 
                    reviewCount={product.review_count}
                  />
                )}

                <ProductPriceDisplay 
                  product={product} 
                  selectedVariant={selectedVariant}
                  size="xl"
                />

                <ProductStockBadge product={product} selectedVariant={selectedVariant} />

                {product.short_description && (
                  <p className="text-muted-foreground">{product.short_description}</p>
                )}

                {/* Variants */}
                {variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <div className="flex flex-wrap gap-2">
                      {variants.map(variant => (
                        <Button
                          key={variant.id}
                          variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedVariant(variant)}
                        >
                          {variant.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(q => q + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleAddToCart}
                    disabled={isUpdating}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleWishlistToggle}
                  >
                    <Heart className={cn('h-4 w-4', isWishlisted && 'fill-red-500 text-red-500')} />
                  </Button>
                </div>

                <Button variant="ghost" className="w-full" asChild>
                  <Link href={productUrl}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Full Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Product not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 21.9: Create E-Commerce Blocks Index

**File**: `src/studio/blocks/ecommerce/index.ts`
**Action**: Create (or Modify)

**Description**: Export all e-commerce blocks

```typescript
/**
 * E-Commerce Studio Blocks Index
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Exports all e-commerce blocks and their configurations.
 */

// Product Display Blocks
export { ProductCardBlock, productCardBlockConfig } from './product-card-block'
export { ProductGridBlock, productGridBlockConfig } from './product-grid-block'
export { FeaturedProductsBlock, featuredProductsBlockConfig } from './featured-products-block'
export { ProductQuickView } from './product-quickview-block'

// Utility Components
export { ProductPriceDisplay } from '@/studio/components/ecommerce/ProductPriceDisplay'
export { ProductStockBadge } from '@/studio/components/ecommerce/ProductStockBadge'
export { ProductRatingDisplay } from '@/studio/components/ecommerce/ProductRatingDisplay'
export { ProductImageGallery } from '@/studio/components/ecommerce/ProductImageGallery'
```

---

### Task 21.10: Register E-Commerce Blocks

**File**: `src/studio/registry/component-registry.ts`
**Action**: Modify

**Description**: Register new e-commerce blocks with the Studio registry

Add after existing imports:

```typescript
// E-Commerce Blocks (Phase ECOM-21)
import { 
  productCardBlockConfig,
  productGridBlockConfig,
  featuredProductsBlockConfig
} from '@/studio/blocks/ecommerce'
```

Add to the `ecommerceBlocks` section in the registry:

```typescript
// ============================================================================
// E-COMMERCE BLOCKS (Phase ECOM-21)
// ============================================================================

export const ecommerceBlockConfigs = [
  productCardBlockConfig,
  productGridBlockConfig,
  featuredProductsBlockConfig
]

// Register e-commerce blocks
ecommerceBlockConfigs.forEach(config => {
  registerComponent(config)
})
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] `ProductCardBlock` displays real product data
- [ ] `ProductCardBlock` variants render correctly (default, horizontal, minimal, featured)
- [ ] `ProductGridBlock` displays product grid with pagination
- [ ] `FeaturedProductsBlock` carousel navigates correctly
- [ ] `ProductQuickView` modal opens and closes properly
- [ ] Add to cart functionality works
- [ ] Wishlist toggle works with localStorage persistence
- [ ] Loading skeletons display during data fetch
- [ ] Empty states display when no products found
- [ ] ResponsiveValue props work across breakpoints
- [ ] All blocks registered in component registry

---

## 🔄 Rollback Plan

If issues occur:
1. Revert product-card-block.tsx to previous version
2. Remove new block files:
   - `product-grid-block.tsx`
   - `featured-products-block.tsx`
   - `product-quickview-block.tsx`
3. Remove utility components from `studio/components/ecommerce/`
4. Revert component-registry.ts changes
5. Run `npx tsc --noEmit` to verify clean state

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add "✅ PHASE-ECOM-21: Product Display Components Complete"
- `progress.md`: Update e-commerce section with Wave 3 progress

---

## ✨ Success Criteria

- [ ] All 4 product display blocks work with real data
- [ ] All 4 utility components render correctly
- [ ] Blocks properly integrate with ECOM-20 hooks
- [ ] Studio registration complete
- [ ] All variants and responsive options work
- [ ] TypeScript compiles with zero errors
