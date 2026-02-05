# PHASE-ECOM-22: Cart Components

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 6-8 hours
> **Prerequisites**: PHASE-ECOM-20 (Core Data Hooks), PHASE-ECOM-21 (Product Display)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create Studio-compatible cart components for displaying, managing, and interacting with the shopping cart. Components include cart drawer, mini cart, cart page, and cart item displays with full functionality for quantity updates, item removal, and discount codes.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-20 hooks are implemented (useStorefrontCart)
- [ ] PHASE-ECOM-21 product display components are complete
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing StorefrontWidget.tsx for cart patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Cart Components
├── CartDrawerBlock          → Slide-out cart drawer (Studio)
├── MiniCartBlock            → Header mini cart dropdown (Studio)
├── CartPageBlock            → Full cart page layout (Studio)
├── CartItemCard             → Individual cart item display
├── CartSummaryCard          → Order summary with totals
├── CartDiscountInput        → Discount code input
├── CartEmptyState           → Empty cart display
└── CartQuantitySelector     → Quantity +/- controls

Data Flow
[useStorefrontCart] → [Cart Components] → [User Actions] → [Server Actions]
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `studio/blocks/ecommerce/cart-drawer-block.tsx` | Create | Slide-out cart drawer |
| `studio/blocks/ecommerce/mini-cart-block.tsx` | Create | Header mini cart |
| `studio/blocks/ecommerce/cart-page-block.tsx` | Create | Full cart page |
| `studio/components/ecommerce/CartItemCard.tsx` | Create | Cart item display |
| `studio/components/ecommerce/CartSummaryCard.tsx` | Create | Order summary |
| `studio/components/ecommerce/CartDiscountInput.tsx` | Create | Discount input |
| `studio/components/ecommerce/CartEmptyState.tsx` | Create | Empty state |
| `studio/components/ecommerce/CartQuantitySelector.tsx` | Create | Quantity controls |
| `studio/blocks/ecommerce/index.ts` | Modify | Export cart blocks |

---

## 📋 Implementation Tasks

### Task 22.1: Create Cart Quantity Selector

**File**: `src/studio/components/ecommerce/CartQuantitySelector.tsx`
**Action**: Create

**Description**: Reusable quantity selector with +/- controls

```typescript
/**
 * CartQuantitySelector - Quantity control component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Provides +/- controls for adjusting item quantities.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ============================================================================
// TYPES
// ============================================================================

interface CartQuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove?: () => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showRemove?: boolean
  disabled?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartQuantitySelector({
  quantity,
  onQuantityChange,
  onRemove,
  min = 1,
  max = 99,
  size = 'md',
  showRemove = true,
  disabled = false,
  className
}: CartQuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1)
    } else if (quantity === min && showRemove && onRemove) {
      onRemove()
    }
  }

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value)
    }
  }

  const sizeClasses = {
    sm: {
      button: 'h-7 w-7',
      input: 'h-7 w-10 text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      button: 'h-8 w-8',
      input: 'h-8 w-12 text-sm',
      icon: 'h-4 w-4'
    },
    lg: {
      button: 'h-10 w-10',
      input: 'h-10 w-14',
      icon: 'h-5 w-5'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="icon"
        className={classes.button}
        onClick={handleDecrement}
        disabled={disabled}
      >
        {quantity === min && showRemove ? (
          <Trash2 className={cn(classes.icon, 'text-destructive')} />
        ) : (
          <Minus className={classes.icon} />
        )}
      </Button>

      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className={cn(classes.input, 'text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
        disabled={disabled}
      />

      <Button
        variant="outline"
        size="icon"
        className={classes.button}
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
      >
        <Plus className={classes.icon} />
      </Button>
    </div>
  )
}
```

---

### Task 22.2: Create Cart Empty State

**File**: `src/studio/components/ecommerce/CartEmptyState.tsx`
**Action**: Create

**Description**: Empty cart state component

```typescript
/**
 * CartEmptyState - Empty cart display
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Displays when cart is empty with call to action.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ResponsiveValue } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

interface CartEmptyStateProps {
  title?: string
  description?: string
  showContinueShopping?: boolean
  continueShoppingUrl?: string
  continueShoppingText?: string
  variant?: ResponsiveValue<'default' | 'compact' | 'minimal'>
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

export function CartEmptyState({
  title = 'Your cart is empty',
  description = "Looks like you haven't added anything to your cart yet.",
  showContinueShopping = true,
  continueShoppingUrl = '/shop',
  continueShoppingText = 'Continue Shopping',
  variant = 'default',
  className
}: CartEmptyStateProps) {
  const variantValue = getResponsiveValue(variant, 'default')

  if (variantValue === 'minimal') {
    return (
      <div className={cn('text-center py-6', className)}>
        <p className="text-muted-foreground text-sm">{title}</p>
        {showContinueShopping && (
          <Button variant="link" size="sm" asChild className="mt-2">
            <Link href={continueShoppingUrl}>{continueShoppingText}</Link>
          </Button>
        )}
      </div>
    )
  }

  if (variantValue === 'compact') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <ShoppingBag className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="font-medium">{title}</p>
        {showContinueShopping && (
          <Button variant="outline" size="sm" asChild className="mt-3">
            <Link href={continueShoppingUrl}>{continueShoppingText}</Link>
          </Button>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-6 mb-6">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground max-w-sm">{description}</p>
      {showContinueShopping && (
        <Button asChild className="mt-6">
          <Link href={continueShoppingUrl}>{continueShoppingText}</Link>
        </Button>
      )}
    </div>
  )
}
```

---

### Task 22.3: Create Cart Item Card

**File**: `src/studio/components/ecommerce/CartItemCard.tsx`
**Action**: Create

**Description**: Individual cart item display with controls

```typescript
/**
 * CartItemCard - Cart item display component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Displays a single cart item with image, details, and quantity controls.
 */
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartQuantitySelector } from './CartQuantitySelector'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { CartItem, Product } from '@/modules/ecommerce/types/ecommerce-types'
import type { ResponsiveValue } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

interface CartItemCardProps {
  item: CartItem
  product?: Product
  variant?: ResponsiveValue<'default' | 'compact' | 'minimal'>
  onUpdateQuantity: (quantity: number) => Promise<boolean>
  onRemove: () => Promise<boolean>
  productUrlPrefix?: string
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

export function CartItemCard({
  item,
  product,
  variant = 'default',
  onUpdateQuantity,
  onRemove,
  productUrlPrefix = '/products',
  className
}: CartItemCardProps) {
  const { formatPrice } = useStorefront()
  const [isUpdating, setIsUpdating] = useState(false)

  const variantValue = getResponsiveValue(variant, 'default')

  // Item details
  const name = product?.name || item.product_name || 'Unknown Product'
  const imageUrl = product?.images?.[0]?.url || item.product_image
  const slug = product?.slug || item.product_id
  const productUrl = `${productUrlPrefix}/${slug}`
  const unitPrice = item.unit_price
  const lineTotal = item.line_total || unitPrice * item.quantity

  const handleQuantityChange = async (quantity: number) => {
    setIsUpdating(true)
    try {
      await onUpdateQuantity(quantity)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async () => {
    setIsUpdating(true)
    try {
      await onRemove()
    } finally {
      setIsUpdating(false)
    }
  }

  // Minimal variant - single line
  if (variantValue === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3 py-2', className)}>
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-sm text-muted-foreground">
            {item.quantity} × {formatPrice(unitPrice)}
          </p>
        </div>
        <span className="font-medium text-sm">{formatPrice(lineTotal)}</span>
      </div>
    )
  }

  // Compact variant
  if (variantValue === 'compact') {
    return (
      <div className={cn('flex gap-3 py-3', isUpdating && 'opacity-50', className)}>
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={productUrl} className="font-medium text-sm hover:text-primary line-clamp-1">
            {name}
          </Link>
          {item.variant_name && (
            <p className="text-xs text-muted-foreground">{item.variant_name}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <CartQuantitySelector
              quantity={item.quantity}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              size="sm"
              disabled={isUpdating}
            />
            <span className="font-medium text-sm">{formatPrice(lineTotal)}</span>
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn(
      'flex gap-4 py-4 border-b border-border last:border-0',
      isUpdating && 'opacity-50',
      className
    )}>
      {/* Image */}
      <Link href={productUrl} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={name} 
            fill 
            className="object-cover transition-transform hover:scale-105" 
            sizes="96px" 
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={productUrl} className="font-medium hover:text-primary line-clamp-2">
              {name}
            </Link>
            {item.variant_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{item.variant_name}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(unitPrice)} each
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <CartQuantitySelector
            quantity={item.quantity}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            size="md"
            showRemove={false}
            disabled={isUpdating}
          />
          <span className="font-semibold">{formatPrice(lineTotal)}</span>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 22.4: Create Cart Discount Input

**File**: `src/studio/components/ecommerce/CartDiscountInput.tsx`
**Action**: Create

**Description**: Discount/coupon code input component

```typescript
/**
 * CartDiscountInput - Discount code input
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Input for applying discount codes to cart.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tag, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { Discount } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CartDiscountInputProps {
  appliedDiscount?: Discount | null
  discountAmount?: number
  onApply: (code: string) => Promise<{ success: boolean; message: string }>
  onRemove: () => Promise<boolean>
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartDiscountInput({
  appliedDiscount,
  discountAmount = 0,
  onApply,
  onRemove,
  className
}: CartDiscountInputProps) {
  const { formatPrice } = useStorefront()
  const [code, setCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return

    setIsApplying(true)
    setFeedback(null)

    try {
      const result = await onApply(code.trim().toUpperCase())
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
        setCode('')
      } else {
        setFeedback({ type: 'error', message: result.message })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to apply discount' })
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemove = async () => {
    setIsRemoving(true)
    setFeedback(null)

    try {
      await onRemove()
    } finally {
      setIsRemoving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  // Applied discount display
  if (appliedDiscount) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">
                {appliedDiscount.code}
              </p>
              <p className="text-xs text-green-600">
                {discountAmount > 0 && `Saving ${formatPrice(discountAmount)}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-100"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter discount code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="pl-10 uppercase"
            disabled={isApplying}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || isApplying}
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm',
            feedback.type === 'success' ? 'text-green-600' : 'text-destructive'
          )}
        >
          {feedback.type === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}
    </div>
  )
}
```

---

### Task 22.5: Create Cart Summary Card

**File**: `src/studio/components/ecommerce/CartSummaryCard.tsx`
**Action**: Create

**Description**: Order summary component with totals

```typescript
/**
 * CartSummaryCard - Order summary component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Displays cart totals, discounts, and checkout button.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CartDiscountInput } from './CartDiscountInput'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { CartTotals, Discount } from '@/modules/ecommerce/types/ecommerce-types'
import type { ResponsiveValue } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

interface CartSummaryCardProps {
  totals: CartTotals | null
  appliedDiscount?: Discount | null
  onApplyDiscount: (code: string) => Promise<{ success: boolean; message: string }>
  onRemoveDiscount: () => Promise<boolean>
  showDiscount?: boolean
  showBenefits?: boolean
  checkoutUrl?: string
  checkoutText?: string
  variant?: ResponsiveValue<'default' | 'compact'>
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

export function CartSummaryCard({
  totals,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  showDiscount = true,
  showBenefits = true,
  checkoutUrl = '/checkout',
  checkoutText = 'Proceed to Checkout',
  variant = 'default',
  className
}: CartSummaryCardProps) {
  const { formatPrice } = useStorefront()
  const variantValue = getResponsiveValue(variant, 'default')

  if (!totals) {
    return null
  }

  // Compact variant
  if (variantValue === 'compact') {
    return (
      <div className={cn('space-y-4', className)}>
        {showDiscount && (
          <CartDiscountInput
            appliedDiscount={appliedDiscount}
            discountAmount={totals.discountTotal}
            onApply={onApplyDiscount}
            onRemove={onRemoveDiscount}
          />
        )}

        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg">{formatPrice(totals.grandTotal)}</span>
        </div>

        <Button asChild className="w-full">
          <Link href={checkoutUrl}>
            {checkoutText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  // Default variant
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>

        {/* Discount */}
        {totals.discountTotal > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(totals.discountTotal)}</span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {totals.shippingTotal > 0 
              ? formatPrice(totals.shippingTotal) 
              : 'Calculated at checkout'
            }
          </span>
        </div>

        {/* Tax */}
        {totals.taxTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(totals.taxTotal)}</span>
          </div>
        )}

        <Separator />

        {/* Grand Total */}
        <div className="flex items-center justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(totals.grandTotal)}</span>
        </div>

        {/* Discount Input */}
        {showDiscount && (
          <>
            <Separator />
            <CartDiscountInput
              appliedDiscount={appliedDiscount}
              discountAmount={totals.discountTotal}
              onApply={onApplyDiscount}
              onRemove={onRemoveDiscount}
            />
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button asChild size="lg" className="w-full">
          <Link href={checkoutUrl}>
            {checkoutText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        {/* Trust Badges */}
        {showBenefits && (
          <div className="grid grid-cols-3 gap-2 w-full text-center">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Truck className="h-5 w-5" />
              <span className="text-xs">Fast Ship</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <RotateCcw className="h-5 w-5" />
              <span className="text-xs">Easy Return</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
```

---

### Task 22.6: Create Cart Drawer Block

**File**: `src/studio/blocks/ecommerce/cart-drawer-block.tsx`
**Action**: Create

**Description**: Slide-out cart drawer component

```typescript
/**
 * CartDrawerBlock - Slide-out cart drawer
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Studio block for slide-out cart drawer.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { X, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CartItemCard } from '@/studio/components/ecommerce/CartItemCard'
import { CartEmptyState } from '@/studio/components/ecommerce/CartEmptyState'
import { useStorefrontCart } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface CartDrawerBlockProps extends StudioBlockProps {
  // Trigger
  triggerVariant?: 'icon' | 'button' | 'text'
  showItemCount?: boolean
  triggerText?: string
  
  // Drawer Options
  drawerSide?: 'left' | 'right'
  drawerTitle?: string
  
  // Display Options
  showSubtotal?: boolean
  showCheckoutButton?: boolean
  checkoutUrl?: string
  checkoutText?: string
  viewCartUrl?: string
  viewCartText?: string
  
  // Empty State
  emptyTitle?: string
  emptyDescription?: string
  continueShoppingUrl?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartDrawerBlock({
  triggerVariant = 'icon',
  showItemCount = true,
  triggerText = 'Cart',
  drawerSide = 'right',
  drawerTitle = 'Shopping Cart',
  showSubtotal = true,
  showCheckoutButton = true,
  checkoutUrl = '/checkout',
  checkoutText = 'Checkout',
  viewCartUrl = '/cart',
  viewCartText = 'View Cart',
  emptyTitle = 'Your cart is empty',
  emptyDescription = 'Add items to get started.',
  continueShoppingUrl = '/shop',
  className,
  __studioMeta
}: CartDrawerBlockProps) {
  const { siteId } = useStorefront()
  const { formatPrice } = useStorefront()
  const [isOpen, setIsOpen] = React.useState(false)
  
  const {
    items,
    totals,
    itemCount,
    isLoading,
    isUpdating,
    updateItemQuantity,
    removeItem
  } = useStorefrontCart(siteId)

  // Trigger button
  const renderTrigger = () => {
    const countBadge = showItemCount && itemCount > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {itemCount > 99 ? '99+' : itemCount}
      </span>
    )

    if (triggerVariant === 'icon') {
      return (
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {countBadge}
        </Button>
      )
    }

    if (triggerVariant === 'button') {
      return (
        <Button 
          variant="outline" 
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {triggerText}
          {showItemCount && itemCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Button>
      )
    }

    // Text variant
    return (
      <button 
        className="relative inline-flex items-center gap-2 text-sm hover:text-primary transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-4 w-4" />
        {triggerText}
        {showItemCount && itemCount > 0 && (
          <span className="text-muted-foreground">({itemCount})</span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Trigger */}
      <div className={className}>
        {renderTrigger()}
      </div>

      {/* Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side={drawerSide} className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {drawerTitle}
              {itemCount > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <CartEmptyState
                title={emptyTitle}
                description={emptyDescription}
                continueShoppingUrl={continueShoppingUrl}
                variant="compact"
              />
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className={cn('py-4', isUpdating && 'opacity-50 pointer-events-none')}>
                  {items.map(item => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      variant="compact"
                      onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <SheetFooter className="flex-col gap-4 border-t pt-4 sm:flex-col">
                {/* Subtotal */}
                {showSubtotal && totals && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-semibold">
                      {formatPrice(totals.subtotal)}
                    </span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2 w-full">
                  {showCheckoutButton && (
                    <Button asChild size="lg" className="w-full">
                      <Link href={checkoutUrl} onClick={() => setIsOpen(false)}>
                        {checkoutText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}

                  <Button variant="outline" asChild className="w-full">
                    <Link href={viewCartUrl} onClick={() => setIsOpen(false)}>
                      {viewCartText}
                    </Link>
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const cartDrawerBlockConfig = {
  type: 'cart-drawer',
  label: 'Cart Drawer',
  category: 'e-commerce',
  icon: 'ShoppingCart',
  defaultProps: {
    triggerVariant: 'icon',
    showItemCount: true,
    triggerText: 'Cart',
    drawerSide: 'right',
    drawerTitle: 'Shopping Cart',
    showSubtotal: true,
    showCheckoutButton: true,
    checkoutUrl: '/checkout',
    checkoutText: 'Checkout',
    viewCartUrl: '/cart',
    viewCartText: 'View Cart',
    emptyTitle: 'Your cart is empty',
    emptyDescription: 'Add items to get started.',
    continueShoppingUrl: '/shop'
  },
  fields: [
    {
      name: 'triggerVariant',
      label: 'Trigger Style',
      type: 'select',
      options: [
        { value: 'icon', label: 'Icon Only' },
        { value: 'button', label: 'Button' },
        { value: 'text', label: 'Text Link' }
      ]
    },
    {
      name: 'showItemCount',
      label: 'Show Item Count',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'triggerText',
      label: 'Trigger Text',
      type: 'text',
      defaultValue: 'Cart'
    },
    {
      name: 'drawerSide',
      label: 'Drawer Side',
      type: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' }
      ]
    },
    {
      name: 'drawerTitle',
      label: 'Drawer Title',
      type: 'text',
      defaultValue: 'Shopping Cart'
    },
    {
      name: 'showSubtotal',
      label: 'Show Subtotal',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showCheckoutButton',
      label: 'Show Checkout Button',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'checkoutUrl',
      label: 'Checkout URL',
      type: 'text',
      defaultValue: '/checkout'
    },
    {
      name: 'checkoutText',
      label: 'Checkout Button Text',
      type: 'text',
      defaultValue: 'Checkout'
    },
    {
      name: 'viewCartUrl',
      label: 'View Cart URL',
      type: 'text',
      defaultValue: '/cart'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Slide-out cart drawer for quick cart access',
    contextHints: ['cart', 'shopping', 'drawer', 'sidebar']
  }
}
```

---

### Task 22.7: Create Mini Cart Block

**File**: `src/studio/blocks/ecommerce/mini-cart-block.tsx`
**Action**: Create

**Description**: Header mini cart dropdown component

```typescript
/**
 * MiniCartBlock - Header mini cart dropdown
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Compact cart dropdown for header integration.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CartItemCard } from '@/studio/components/ecommerce/CartItemCard'
import { CartEmptyState } from '@/studio/components/ecommerce/CartEmptyState'
import { useStorefrontCart } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface MiniCartBlockProps extends StudioBlockProps {
  // Display
  maxVisibleItems?: number
  showSubtotal?: boolean
  
  // Actions
  checkoutUrl?: string
  viewCartUrl?: string
  continueShoppingUrl?: string
  
  // Styling
  popoverWidth?: number
  popoverAlign?: 'start' | 'center' | 'end'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MiniCartBlock({
  maxVisibleItems = 3,
  showSubtotal = true,
  checkoutUrl = '/checkout',
  viewCartUrl = '/cart',
  continueShoppingUrl = '/shop',
  popoverWidth = 360,
  popoverAlign = 'end',
  className,
  __studioMeta
}: MiniCartBlockProps) {
  const { siteId, formatPrice } = useStorefront()
  const {
    items,
    totals,
    itemCount,
    isLoading,
    isUpdating,
    updateItemQuantity,
    removeItem
  } = useStorefrontCart(siteId)

  const [isOpen, setIsOpen] = React.useState(false)
  const visibleItems = items.slice(0, maxVisibleItems)
  const hiddenItemsCount = items.length - maxVisibleItems

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="p-0" 
        style={{ width: popoverWidth }}
        align={popoverAlign}
      >
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">
            Shopping Cart
            {itemCount > 0 && (
              <span className="ml-2 text-muted-foreground font-normal">
                ({itemCount})
              </span>
            )}
          </h3>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <CartEmptyState
            title="Cart is empty"
            continueShoppingUrl={continueShoppingUrl}
            variant="compact"
          />
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className={cn('px-4', isUpdating && 'opacity-50 pointer-events-none')}>
                {visibleItems.map(item => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    variant="minimal"
                    onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            {hiddenItemsCount > 0 && (
              <div className="border-t px-4 py-2">
                <Link 
                  href={viewCartUrl}
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  +{hiddenItemsCount} more {hiddenItemsCount === 1 ? 'item' : 'items'}
                </Link>
              </div>
            )}

            {/* Footer */}
            <div className="border-t p-4 space-y-3">
              {showSubtotal && totals && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(totals.subtotal)}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={viewCartUrl}>View Cart</Link>
                </Button>
                <Button 
                  className="flex-1"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={checkoutUrl}>
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const miniCartBlockConfig = {
  type: 'mini-cart',
  label: 'Mini Cart',
  category: 'e-commerce',
  icon: 'ShoppingBag',
  defaultProps: {
    maxVisibleItems: 3,
    showSubtotal: true,
    checkoutUrl: '/checkout',
    viewCartUrl: '/cart',
    continueShoppingUrl: '/shop',
    popoverWidth: 360,
    popoverAlign: 'end'
  },
  fields: [
    {
      name: 'maxVisibleItems',
      label: 'Max Visible Items',
      type: 'number',
      min: 1,
      max: 10,
      defaultValue: 3
    },
    {
      name: 'showSubtotal',
      label: 'Show Subtotal',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'checkoutUrl',
      label: 'Checkout URL',
      type: 'text',
      defaultValue: '/checkout'
    },
    {
      name: 'viewCartUrl',
      label: 'View Cart URL',
      type: 'text',
      defaultValue: '/cart'
    },
    {
      name: 'popoverWidth',
      label: 'Popup Width (px)',
      type: 'number',
      min: 280,
      max: 500,
      defaultValue: 360
    },
    {
      name: 'popoverAlign',
      label: 'Popup Alignment',
      type: 'select',
      options: [
        { value: 'start', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'Right' }
      ]
    }
  ],
  ai: {
    suggestable: true,
    description: 'Compact cart dropdown for header navigation',
    contextHints: ['mini cart', 'header', 'dropdown', 'quick cart']
  }
}
```

---

### Task 22.8: Create Cart Page Block

**File**: `src/studio/blocks/ecommerce/cart-page-block.tsx`
**Action**: Create

**Description**: Full cart page layout component

```typescript
/**
 * CartPageBlock - Full cart page layout
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Complete cart page with items, summary, and discount input.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItemCard } from '@/studio/components/ecommerce/CartItemCard'
import { CartSummaryCard } from '@/studio/components/ecommerce/CartSummaryCard'
import { CartEmptyState } from '@/studio/components/ecommerce/CartEmptyState'
import { useStorefrontCart } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface CartPageBlockProps extends StudioBlockProps {
  // Layout
  layout?: ResponsiveValue<'side-by-side' | 'stacked'>
  
  // Display Options
  showContinueShopping?: boolean
  showClearCart?: boolean
  showUpdateCart?: boolean
  showItemImages?: boolean
  
  // Labels
  title?: string
  continueShoppingText?: string
  continueShoppingUrl?: string
  clearCartText?: string
  
  // Summary Options
  showDiscount?: boolean
  showBenefits?: boolean
  checkoutUrl?: string
  checkoutText?: string
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

export function CartPageBlock({
  layout = { mobile: 'stacked', desktop: 'side-by-side' },
  showContinueShopping = true,
  showClearCart = true,
  showUpdateCart = false,
  showItemImages = true,
  title = 'Shopping Cart',
  continueShoppingText = 'Continue Shopping',
  continueShoppingUrl = '/shop',
  clearCartText = 'Clear Cart',
  showDiscount = true,
  showBenefits = true,
  checkoutUrl = '/checkout',
  checkoutText = 'Proceed to Checkout',
  className,
  __studioMeta
}: CartPageBlockProps) {
  const { siteId } = useStorefront()
  const {
    items,
    cart,
    totals,
    itemCount,
    isLoading,
    isUpdating,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    removeDiscount,
    refresh
  } = useStorefrontCart(siteId)

  const layoutValue = getResponsiveValue(layout, 'side-by-side')

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-24', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={className}>
        <CartEmptyState
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet. Start shopping to fill it up!"
          continueShoppingUrl={continueShoppingUrl}
          continueShoppingText={continueShoppingText}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showContinueShopping && (
            <Button variant="ghost" asChild>
              <Link href={continueShoppingUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {continueShoppingText}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        'grid gap-8',
        layoutValue === 'side-by-side' 
          ? 'lg:grid-cols-3' 
          : 'grid-cols-1'
      )}>
        {/* Cart Items */}
        <div className={cn(
          layoutValue === 'side-by-side' ? 'lg:col-span-2' : ''
        )}>
          <div className={cn(
            'rounded-lg border bg-card',
            isUpdating && 'opacity-50 pointer-events-none'
          )}>
            <div className="p-6">
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <div className="my-4 border-t" />}
                  <CartItemCard
                    item={item}
                    variant="default"
                    onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
                    onRemove={() => removeItem(item.id)}
                  />
                </React.Fragment>
              ))}
            </div>

            {/* Cart Actions */}
            {(showClearCart || showUpdateCart) && (
              <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/50">
                {showClearCart && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => clearCart()}
                    disabled={isUpdating}
                  >
                    {clearCartText}
                  </Button>
                )}
                
                {showUpdateCart && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refresh()}
                    disabled={isUpdating}
                  >
                    <RefreshCw className={cn(
                      'mr-2 h-4 w-4',
                      isUpdating && 'animate-spin'
                    )} />
                    Update Cart
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className={cn(
          layoutValue === 'side-by-side' ? 'lg:col-span-1' : ''
        )}>
          <div className="sticky top-4">
            <CartSummaryCard
              totals={totals}
              appliedDiscount={cart?.discount}
              onApplyDiscount={applyDiscount}
              onRemoveDiscount={removeDiscount}
              showDiscount={showDiscount}
              showBenefits={showBenefits}
              checkoutUrl={checkoutUrl}
              checkoutText={checkoutText}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const cartPageBlockConfig = {
  type: 'cart-page',
  label: 'Cart Page',
  category: 'e-commerce',
  icon: 'ShoppingCart',
  defaultProps: {
    layout: { mobile: 'stacked', desktop: 'side-by-side' },
    showContinueShopping: true,
    showClearCart: true,
    showUpdateCart: false,
    showItemImages: true,
    title: 'Shopping Cart',
    continueShoppingText: 'Continue Shopping',
    continueShoppingUrl: '/shop',
    clearCartText: 'Clear Cart',
    showDiscount: true,
    showBenefits: true,
    checkoutUrl: '/checkout',
    checkoutText: 'Proceed to Checkout'
  },
  fields: [
    {
      name: 'layout',
      label: 'Layout',
      type: 'select',
      options: [
        { value: 'side-by-side', label: 'Side by Side' },
        { value: 'stacked', label: 'Stacked' }
      ],
      responsive: true
    },
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      defaultValue: 'Shopping Cart'
    },
    {
      name: 'showContinueShopping',
      label: 'Show Continue Shopping',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'continueShoppingUrl',
      label: 'Continue Shopping URL',
      type: 'text',
      defaultValue: '/shop'
    },
    {
      name: 'showClearCart',
      label: 'Show Clear Cart Button',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showDiscount',
      label: 'Show Discount Input',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showBenefits',
      label: 'Show Trust Badges',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'checkoutUrl',
      label: 'Checkout URL',
      type: 'text',
      defaultValue: '/checkout'
    },
    {
      name: 'checkoutText',
      label: 'Checkout Button Text',
      type: 'text',
      defaultValue: 'Proceed to Checkout'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Full cart page with items and order summary',
    contextHints: ['cart page', 'shopping cart', 'order summary']
  }
}
```

---

### Task 22.9: Update E-Commerce Blocks Index

**File**: `src/studio/blocks/ecommerce/index.ts`
**Action**: Modify

**Description**: Add cart block exports

Add to existing file:

```typescript
// Cart Blocks (Phase ECOM-22)
export { CartDrawerBlock, cartDrawerBlockConfig } from './cart-drawer-block'
export { MiniCartBlock, miniCartBlockConfig } from './mini-cart-block'
export { CartPageBlock, cartPageBlockConfig } from './cart-page-block'

// Cart Utility Components
export { CartItemCard } from '@/studio/components/ecommerce/CartItemCard'
export { CartSummaryCard } from '@/studio/components/ecommerce/CartSummaryCard'
export { CartDiscountInput } from '@/studio/components/ecommerce/CartDiscountInput'
export { CartEmptyState } from '@/studio/components/ecommerce/CartEmptyState'
export { CartQuantitySelector } from '@/studio/components/ecommerce/CartQuantitySelector'
```

---

### Task 22.10: Register Cart Blocks

**File**: `src/studio/registry/component-registry.ts`
**Action**: Modify

Add cart block registrations:

```typescript
// Cart Blocks (Phase ECOM-22)
import { 
  cartDrawerBlockConfig,
  miniCartBlockConfig,
  cartPageBlockConfig
} from '@/studio/blocks/ecommerce'

// Add to ecommerceBlockConfigs array
export const cartBlockConfigs = [
  cartDrawerBlockConfig,
  miniCartBlockConfig,
  cartPageBlockConfig
]

// Register cart blocks
cartBlockConfigs.forEach(config => {
  registerComponent(config)
})
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] `CartQuantitySelector` increments/decrements correctly
- [ ] `CartItemCard` displays item info and handles updates
- [ ] `CartSummaryCard` shows correct totals
- [ ] `CartDiscountInput` applies and removes discounts
- [ ] `CartEmptyState` displays correctly
- [ ] `CartDrawerBlock` opens/closes and shows items
- [ ] `MiniCartBlock` dropdown works correctly
- [ ] `CartPageBlock` layout renders properly
- [ ] All cart operations persist to server
- [ ] Loading and updating states display
- [ ] All blocks registered in component registry

---

## 🔄 Rollback Plan

If issues occur:
1. Remove cart block files from `studio/blocks/ecommerce/`
2. Remove cart component files from `studio/components/ecommerce/`
3. Revert component-registry.ts changes
4. Revert index.ts changes
5. Run `npx tsc --noEmit` to verify

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add "✅ PHASE-ECOM-22: Cart Components Complete"
- `progress.md`: Update e-commerce section with Wave 3 progress

---

## ✨ Success Criteria

- [ ] All 3 cart blocks work with real data
- [ ] All 5 cart utility components render correctly
- [ ] Cart operations (add, update, remove) work
- [ ] Discount code functionality works
- [ ] Studio registration complete
- [ ] TypeScript compiles with zero errors
