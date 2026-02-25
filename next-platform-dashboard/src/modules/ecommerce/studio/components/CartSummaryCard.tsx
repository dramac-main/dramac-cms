/**
 * CartSummaryCard - Cart totals summary card
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Displays cart totals including subtotal, discounts, tax, shipping, and total.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { CartDiscountInput } from './CartDiscountInput'
import type { CartTotals } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CartSummaryCardProps {
  totals: CartTotals
  formatPrice: (price: number) => string
  onCheckout?: () => void
  checkoutHref?: string
  checkoutText?: string
  isLoading?: boolean
  showDiscount?: boolean
  currentDiscount?: {
    code: string
    amount: number
    type: 'percentage' | 'fixed'
  } | null
  onApplyDiscount?: (code: string) => Promise<boolean>
  onRemoveDiscount?: () => void
  variant?: 'default' | 'compact' | 'drawer'
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartSummaryCard({
  totals,
  formatPrice,
  onCheckout,
  checkoutHref = '/checkout',
  checkoutText = 'Proceed to Checkout',
  isLoading = false,
  showDiscount = true,
  currentDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  variant = 'default',
  className
}: CartSummaryCardProps) {
  const hasItems = totals.itemCount > 0
  const hasDiscount = totals.discount > 0
  const hasTax = totals.tax > 0
  const hasShipping = totals.shipping > 0

  const SummaryLines = () => (
    <>
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Subtotal ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})
        </span>
        <span>{formatPrice(totals.subtotal)}</span>
      </div>

      {/* Discount */}
      {hasDiscount && (
        <div className="flex justify-between text-sm">
          <span className="text-green-600">Discount</span>
          <span className="text-green-600">
            -{formatPrice(totals.discount)}
          </span>
        </div>
      )}

      {/* Shipping */}
      {hasShipping ? (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>{formatPrice(totals.shipping)}</span>
        </div>
      ) : (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">Calculated at checkout</span>
        </div>
      )}

      {/* Tax */}
      {hasTax && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatPrice(totals.tax)}</span>
        </div>
      )}
    </>
  )

  // Compact variant - for mini cart / drawer
  if (variant === 'compact' || variant === 'drawer') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Discount Input */}
        {showDiscount && onApplyDiscount && onRemoveDiscount && (
          <CartDiscountInput
            currentDiscount={currentDiscount}
            onApplyDiscount={onApplyDiscount}
            onRemoveDiscount={onRemoveDiscount}
            formatPrice={formatPrice}
            disabled={isLoading || !hasItems}
          />
        )}

        <Separator />

        {/* Summary Lines */}
        <div className="space-y-2">
          <SummaryLines />
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold">{formatPrice(totals.total)}</span>
        </div>

        {/* Checkout Button */}
        {onCheckout ? (
          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            disabled={!hasItems || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShoppingBag className="h-4 w-4 mr-2" />
            )}
            {checkoutText}
          </Button>
        ) : (
          <Button
            asChild
            className="w-full"
            size="lg"
            disabled={!hasItems || isLoading}
          >
            <a href={checkoutHref}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              {checkoutText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </div>
    )
  }

  // Default - full card
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Discount Input */}
        {showDiscount && onApplyDiscount && onRemoveDiscount && (
          <>
            <CartDiscountInput
              currentDiscount={currentDiscount}
              onApplyDiscount={onApplyDiscount}
              onRemoveDiscount={onRemoveDiscount}
              formatPrice={formatPrice}
              disabled={isLoading || !hasItems}
            />
            <Separator />
          </>
        )}

        {/* Summary Lines */}
        <div className="space-y-3">
          <SummaryLines />
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold">{formatPrice(totals.total)}</span>
        </div>
      </CardContent>

      <CardFooter>
        {onCheckout ? (
          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            disabled={!hasItems || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShoppingBag className="h-4 w-4 mr-2" />
            )}
            {checkoutText}
          </Button>
        ) : (
          <Button
            asChild
            className="w-full"
            size="lg"
            disabled={!hasItems || isLoading}
          >
            <a href={checkoutHref}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              {checkoutText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
