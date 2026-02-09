/**
 * MobileOrderReview - Expandable order summary for mobile checkout
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Features:
 * - Collapsed view showing total
 * - Expandable to show full order details
 * - Touch-friendly accordion behavior
 */
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartItem } from '../../../types/ecommerce-types'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export interface OrderSummaryTotals {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

export interface MobileOrderReviewProps {
  items: CartItem[]
  totals: OrderSummaryTotals
  shippingMethodName?: string
  discountCode?: string
  defaultExpanded?: boolean
  className?: string
  formatPrice?: (price: number) => string
  getItemName?: (item: CartItem) => string
  getItemVariant?: (item: CartItem) => string | null
  getItemImage?: (item: CartItem) => string | null
}

// ============================================================================
// HELPERS
// ============================================================================

function defaultFormatPrice(price: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(price)
}

function defaultGetItemName(item: CartItem): string {
  // Try to get name from product relation
  const product = item.product as { name?: string } | undefined
  return product?.name || 'Product'
}

function defaultGetItemVariant(item: CartItem): string | null {
  if (!item.variant_id) return null
  // Try to get variant name from product variants
  const product = item.product as { variants?: Array<{ id: string; name?: string }> } | undefined
  const variant = product?.variants?.find((v) => v.id === item.variant_id)
  return variant?.name || null
}

function defaultGetItemImage(item: CartItem): string | null {
  // Try to get image from product
  const product = item.product as { images?: string[] } | undefined
  return product?.images?.[0] || null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileOrderReview({
  items,
  totals,
  shippingMethodName,
  discountCode,
  defaultExpanded = false,
  className,
  formatPrice = defaultFormatPrice,
  getItemName = defaultGetItemName,
  getItemVariant = defaultGetItemVariant,
  getItemImage = defaultGetItemImage,
}: MobileOrderReviewProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { trigger } = useHapticFeedback()

  const toggleExpanded = () => {
    trigger('light')
    setIsExpanded(!isExpanded)
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'bg-muted/50 hover:bg-muted transition-colors',
          'min-h-[56px]'
        )}
      >
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <div className="text-left">
            <span className="font-medium text-foreground">
              Order summary
            </span>
            <span className="text-sm text-muted-foreground ml-2">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {formatPrice(totals.total)}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t">
              {/* Items list */}
              <div className="space-y-3">
                {items.map((item) => {
                  const name = getItemName(item)
                  const variant = getItemVariant(item)
                  const image = getItemImage(item)
                  const itemTotal = (item.unit_price || 0) * item.quantity

                  return (
                    <div key={item.id} className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-14 h-14 bg-muted rounded-lg overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {name}
                        </p>
                        {variant && (
                          <p className="text-xs text-muted-foreground">
                            {variant}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        <p className="font-medium text-sm text-foreground">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals breakdown */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Shipping
                    {shippingMethodName && (
                      <span className="text-xs ml-1">({shippingMethodName})</span>
                    )}
                  </span>
                  <span className="text-foreground">
                    {totals.shipping === 0 ? 'FREE' : formatPrice(totals.shipping)}
                  </span>
                </div>

                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {discountCode && (
                        <span className="text-xs ml-1">({discountCode})</span>
                      )}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatPrice(totals.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">{formatPrice(totals.tax)}</span>
                </div>

                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileOrderReview
