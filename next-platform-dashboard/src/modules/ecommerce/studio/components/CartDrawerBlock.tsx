/**
 * CartDrawerBlock - Slide-out cart drawer
 * 
 * Phase ECOM-22: Cart Components
 * 
 * A slide-out drawer that displays the shopping cart contents.
 * Integrates with useStorefrontCart hook.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { X, ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { CartItemCard } from './CartItemCard'
import { CartEmptyState } from './CartEmptyState'
import { CartSummaryCard } from './CartSummaryCard'
import { useStorefrontCart } from '../../hooks/useStorefrontCart'
import { useStorefront } from '../../context/storefront-context'
import type { CartTotals } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CartDrawerBlockProps {
  trigger?: React.ReactNode
  side?: 'left' | 'right'
  checkoutHref?: string
  shopLink?: string
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

export function CartDrawerBlock({
  trigger,
  side = 'right',
  checkoutHref = '/checkout',
  shopLink = '/shop',
  className
}: CartDrawerBlockProps) {
  const { siteId, formatPrice, taxRate } = useStorefront()
  const {
    items,
    totals: cartTotals,
    itemCount,
    isLoading,
    isUpdating,
    updateItemQuantity,
    removeItem,
    applyDiscount,
    removeDiscount
  } = useStorefrontCart(siteId, undefined, taxRate)

  const [open, setOpen] = React.useState(false)
  
  // Use default totals if null
  const totals = cartTotals ?? DEFAULT_TOTALS

  // Current discount from totals
  const currentDiscount = totals.discount > 0
    ? { code: 'APPLIED', amount: totals.discount, type: 'fixed' as const }
    : null

  const handleApplyDiscount = async (code: string): Promise<boolean> => {
    try {
      const result = await applyDiscount(code)
      return result.success
    } catch {
      return false
    }
  }

  // Default trigger button
  const defaultTrigger = (
    <Button variant="outline" size="icon" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>

      <SheetContent 
        side={side} 
        className={cn('w-full sm:max-w-md flex flex-col', className)}
      >
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
              {itemCount > 0 && (
                <Badge variant="secondary">{itemCount}</Badge>
              )}
            </SheetTitle>
          </div>
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
              shopLink={shopLink}
              className="py-8"
            />
          </div>
        ) : (
          /* Cart Items */
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="py-4 space-y-1">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onQuantityChange={updateItemQuantity}
                    onRemove={removeItem}
                    formatPrice={formatPrice}
                    variant="drawer"
                    disabled={isUpdating}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Summary */}
            <div className="border-t pt-4 mt-auto">
              <CartSummaryCard
                totals={totals}
                formatPrice={formatPrice}
                checkoutHref={checkoutHref}
                isLoading={isUpdating}
                showDiscount={true}
                currentDiscount={currentDiscount}
                onApplyDiscount={handleApplyDiscount}
                onRemoveDiscount={removeDiscount}
                variant="drawer"
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
