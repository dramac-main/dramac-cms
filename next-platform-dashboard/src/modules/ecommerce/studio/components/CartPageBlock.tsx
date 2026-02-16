/**
 * CartPageBlock - Full cart page component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Complete shopping cart page with items list, quantity editing,
 * discount codes, and order summary. Responsive two-column layout.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ShoppingCart, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CartItemCard } from './CartItemCard'
import { CartEmptyState } from './CartEmptyState'
import { CartSummaryCard } from './CartSummaryCard'
import { useStorefrontCart } from '../../hooks/useStorefrontCart'
import { useStorefront } from '../../context/storefront-context'
import type { CartTotals } from '../../types/ecommerce-types'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

interface CartPageBlockProps {
  title?: string
  shopLink?: string
  shopLinkText?: string
  checkoutHref?: string
  checkoutText?: string
  showClearCart?: boolean
  className?: string
}

// ============================================================================
// DEFAULT TOTALS
// ============================================================================

const DEFAULT_TOTALS: CartTotals = {
  subtotal: 0,
  discount: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  itemCount: 0
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartPageBlock({
  title = 'Shopping Cart',
  shopLink = '/shop',
  shopLinkText = 'Continue Shopping',
  checkoutHref = '/checkout',
  checkoutText = 'Proceed to Checkout',
  showClearCart = true,
  className
}: CartPageBlockProps) {
  const { siteId, formatPrice, taxRate } = useStorefront()
  const {
    cart,
    items,
    totals: cartTotals,
    itemCount,
    isLoading,
    isUpdating,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    removeDiscount
  } = useStorefrontCart(siteId, undefined, taxRate)

  const [isClearing, setIsClearing] = React.useState(false)
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  
  // Use default totals if null
  const totals = cartTotals ?? DEFAULT_TOTALS

  // Current discount from cart data (use actual discount code, not hardcoded 'APPLIED')
  const currentDiscount = totals.discount > 0
    ? { code: cart?.discount_code || 'DISCOUNT', amount: totals.discount, type: 'fixed' as const }
    : null

  const handleApplyDiscount = async (code: string): Promise<boolean> => {
    try {
      const result = await applyDiscount(code)
      return result.success
    } catch {
      return false
    }
  }

  const handleClearCart = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true)
      // Auto-dismiss confirmation after 5 seconds
      setTimeout(() => setShowClearConfirm(false), 5000)
      return
    }
    setShowClearConfirm(false)
    setIsClearing(true)
    try {
      await clearCart()
    } finally {
      setIsClearing(false)
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty State
  if (items.length === 0) {
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              {title}
            </h1>
          </div>

          {/* Empty State */}
          <Card>
            <CardContent className="py-0">
              <CartEmptyState
                shopLink={shopLink}
                shopLinkText={shopLinkText}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Cart with items
  return (
    <div className={cn('py-8 md:py-12', className)}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 md:h-8 md:w-8" />
            {title}
            <span className="text-lg font-normal text-muted-foreground">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          </h1>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={shopLink}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {shopLinkText}
              </Link>
            </Button>

            {showClearCart && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                disabled={isClearing || isUpdating}
                className="text-destructive hover:text-destructive"
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cart Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onQuantityChange={updateItemQuantity}
                    onRemove={removeItem}
                    formatPrice={formatPrice}
                    variant="default"
                    disabled={isUpdating}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Column - Sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <CartSummaryCard
                totals={totals}
                formatPrice={formatPrice}
                checkoutHref={checkoutHref}
                checkoutText={checkoutText}
                isLoading={isUpdating}
                showDiscount={true}
                currentDiscount={currentDiscount}
                onApplyDiscount={handleApplyDiscount}
                onRemoveDiscount={removeDiscount}
                variant="default"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
