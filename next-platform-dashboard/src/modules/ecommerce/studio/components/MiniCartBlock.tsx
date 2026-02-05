/**
 * MiniCartBlock - Compact cart preview component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * A compact cart preview typically shown in headers or as a popover.
 * Shows item count, preview of items, and quick checkout link.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ShoppingCart, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { CartItemCard } from './CartItemCard'
import { CartEmptyState } from './CartEmptyState'
import { useStorefrontCart } from '../../hooks/useStorefrontCart'
import { useStorefront } from '../../context/storefront-context'
import type { CartTotals } from '../../types/ecommerce-types'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

interface MiniCartBlockProps {
  trigger?: React.ReactNode
  maxItems?: number
  cartHref?: string
  checkoutHref?: string
  shopLink?: string
  align?: 'start' | 'center' | 'end'
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

export function MiniCartBlock({
  trigger,
  maxItems = 3,
  cartHref = '/cart',
  checkoutHref = '/checkout',
  shopLink = '/shop',
  align = 'end',
  className
}: MiniCartBlockProps) {
  const { siteId, formatPrice, taxRate } = useStorefront()
  const {
    items,
    totals: cartTotals,
    itemCount,
    isLoading,
    isUpdating,
    updateItemQuantity,
    removeItem
  } = useStorefrontCart(siteId, undefined, taxRate)

  const [open, setOpen] = React.useState(false)
  
  // Use default totals if null
  const totals = cartTotals ?? DEFAULT_TOTALS

  // Show only first N items
  const displayItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  // Default trigger button
  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className={cn('w-80 p-0', className)}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {itemCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {itemCount}
                </Badge>
              )}
            </h4>
            {itemCount > 0 && (
              <Link
                href={cartHref}
                className="text-sm text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <CartEmptyState
              shopLink={shopLink}
              className="py-6"
              showIcon={false}
              title="Cart is empty"
              description="Add items to get started"
            />
          ) : (
            <div className="p-4 space-y-3">
              {displayItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onQuantityChange={updateItemQuantity}
                  onRemove={removeItem}
                  formatPrice={formatPrice}
                  variant="compact"
                  disabled={isUpdating}
                />
              ))}
              
              {remainingCount > 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-3">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(totals.subtotal)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href={cartHref}>
                    View Cart
                  </Link>
                </Button>
                <Button
                  className="flex-1"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href={checkoutHref}>
                    Checkout
                    <ChevronRight className="h-4 w-4 ml-1" />
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
