/**
 * OrderSummaryCard - Checkout order summary component
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays a summary of the order during checkout including
 * items, shipping, discount, tax, and total.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CartItem, CartTotals } from '../../types/ecommerce-types'
import type { ShippingMethod } from '../../hooks/useCheckout'
import Image from 'next/image'

// ============================================================================
// TYPES
// ============================================================================

interface OrderSummaryCardProps {
  items: CartItem[]
  totals: CartTotals
  formatPrice: (price: number) => string
  shippingMethod?: ShippingMethod | null
  maxHeight?: string
  collapsible?: boolean
  className?: string
}

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
  // Try to get variant display name from options
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

export function OrderSummaryCard({
  items,
  totals,
  formatPrice,
  shippingMethod,
  maxHeight = '300px',
  collapsible = true,
  className
}: OrderSummaryCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(!collapsible)
  
  const hasDiscount = totals.discount > 0
  const hasTax = totals.tax > 0
  const shippingAmount = shippingMethod?.price ?? totals.shipping

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Order Summary</span>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-normal text-primary hover:underline"
            >
              {isExpanded ? 'Hide' : `Show (${totals.itemCount} items)`}
            </button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items List */}
        {(isExpanded || !collapsible) && (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-3">
              {items.map((item) => {
                const imageUrl = getItemImage(item)
                const itemName = getItemName(item)
                const variantName = getVariantName(item)
                const lineTotal = item.unit_price * item.quantity

                return (
                  <div key={item.id} className="flex gap-3">
                    {/* Image */}
                    <div className="relative w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={itemName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {/* Quantity badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {item.quantity}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{itemName}</p>
                      {variantName && (
                        <p className="text-xs text-muted-foreground">{variantName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} × {item.quantity}
                      </p>
                    </div>

                    {/* Line Total */}
                    <div className="text-sm font-medium">
                      {formatPrice(lineTotal)}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>

          {/* Discount */}
          {hasDiscount && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Discount</span>
              <span className="text-green-600 dark:text-green-400">
                -{formatPrice(totals.discount)}
              </span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Shipping
              {shippingMethod && (
                <span className="text-xs ml-1">({shippingMethod.name})</span>
              )}
            </span>
            <span>
              {shippingAmount > 0 ? formatPrice(shippingAmount) : 'Free'}
            </span>
          </div>

          {/* Tax */}
          {hasTax && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(totals.tax)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold">{formatPrice(totals.total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
