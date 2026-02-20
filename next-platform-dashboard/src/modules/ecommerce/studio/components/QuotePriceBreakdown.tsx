/**
 * QuotePriceBreakdown - Display quote pricing summary
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Shows subtotal, discounts, tax, and total for a quote.
 */
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { Quote, QuoteItem } from '../../types/ecommerce-types'
import type { QuoteBuilderItem } from '../../hooks/useQuotations'

import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export interface QuotePriceBreakdownProps {
  /** Full quote object */
  quote?: Quote
  /** Or builder items */
  builderItems?: QuoteBuilderItem[]
  /** Currency symbol */
  currency?: string
  /** Format price function */
  formatPrice?: (price: number) => string
  /** Tax rate (decimal, e.g., 0.1 for 10%) */
  taxRate?: number
  /** Discount percent */
  discountPercent?: number
  /** Fixed discount amount */
  discountAmount?: number
  /** Shipping cost */
  shippingCost?: number
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed'
  /** Show breakdown details */
  showDetails?: boolean
  className?: string
}

// ============================================================================
// DEFAULT FORMATTER
// ============================================================================

function defaultFormatPrice(price: number, currency = DEFAULT_CURRENCY_SYMBOL): string {
  return `${currency}${(price / 100).toFixed(2)}`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuotePriceBreakdown({
  quote,
  builderItems,
  currency = DEFAULT_CURRENCY_SYMBOL,
  formatPrice,
  taxRate = 0,
  discountPercent = 0,
  discountAmount = 0,
  shippingCost = 0,
  variant = 'default',
  showDetails = true,
  className
}: QuotePriceBreakdownProps) {
  const format = formatPrice || ((p: number) => defaultFormatPrice(p, currency))

  // Calculate from quote
  const quoteSubtotal = quote?.subtotal ?? 0
  const quoteDiscountAmount = quote?.discount_amount ?? 0
  const quoteTaxAmount = quote?.tax_amount ?? 0
  const quoteShipping = quote?.shipping_amount ?? 0
  const quoteTotal = quote?.total ?? 0

  // Calculate from builder items
  const builderSubtotal = React.useMemo(() => {
    if (!builderItems) return 0
    return builderItems.reduce((sum, item) => {
      const price = item.requested_price || item.list_price
      return sum + (price * item.quantity)
    }, 0)
  }, [builderItems])

  // Use quote values if available, otherwise calculate
  const subtotal = quote ? quoteSubtotal : builderSubtotal
  
  // Calculate discount
  const calculatedDiscount = quote 
    ? quoteDiscountAmount 
    : discountAmount || (subtotal * discountPercent / 100)
  
  // Calculate tax
  const afterDiscount = subtotal - calculatedDiscount
  const calculatedTax = quote 
    ? quoteTaxAmount 
    : (afterDiscount * taxRate)
  
  // Shipping
  const calculatedShipping = quote ? quoteShipping : shippingCost
  
  // Total
  const total = quote 
    ? quoteTotal 
    : (afterDiscount + calculatedTax + calculatedShipping)

  // Item count
  const itemCount = quote?.items?.length ?? builderItems?.length ?? 0

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <span className="text-sm text-gray-600">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
        <span className="text-lg font-semibold">{format(total)}</span>
      </div>
    )
  }

  // Line item component
  const LineItem = ({ 
    label, 
    value, 
    isNegative, 
    isBold,
    isLarge 
  }: { 
    label: string
    value: number
    isNegative?: boolean
    isBold?: boolean
    isLarge?: boolean
  }) => (
    <div className={cn(
      'flex justify-between',
      isBold && 'font-semibold',
      isLarge && 'text-lg'
    )}>
      <span className={cn(
        'text-gray-600',
        isBold && 'text-gray-900'
      )}>
        {label}
      </span>
      <span className={cn(
        isNegative && 'text-green-600',
        isBold && 'text-gray-900'
      )}>
        {isNegative ? '-' : ''}{format(Math.abs(value))}
      </span>
    </div>
  )

  return (
    <div className={cn('space-y-2', className)}>
      {/* Subtotal */}
      <LineItem label={`Subtotal (${itemCount} items)`} value={subtotal} />

      {/* Discount */}
      {showDetails && calculatedDiscount > 0 && (
        <LineItem 
          label={
            quote?.discount_value && quote.discount_type === 'percentage'
              ? `Discount (${quote.discount_value}%)` 
              : discountPercent > 0 
                ? `Discount (${discountPercent}%)`
                : 'Discount'
          } 
          value={calculatedDiscount} 
          isNegative 
        />
      )}

      {/* Tax */}
      {showDetails && calculatedTax > 0 && (
        <LineItem 
          label={
            taxRate > 0 
              ? `Tax (${(taxRate * 100).toFixed(0)}%)` 
              : 'Tax'
          } 
          value={calculatedTax} 
        />
      )}

      {/* Shipping */}
      {showDetails && calculatedShipping > 0 && (
        <LineItem label="Shipping" value={calculatedShipping} />
      )}

      {/* Separator */}
      {variant === 'detailed' && (
        <Separator className="my-2" />
      )}

      {/* Total */}
      <LineItem label="Total" value={total} isBold isLarge />

      {/* Additional details for detailed variant */}
      {variant === 'detailed' && quote && (
        <>
          <Separator className="my-2" />
          
          {quote.valid_until && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Valid Until</span>
              <span>{new Date(quote.valid_until).toLocaleDateString()}</span>
            </div>
          )}
          
          {quote.terms_and_conditions && (
            <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700">Terms & Conditions</p>
              <p className="mt-1">{quote.terms_and_conditions}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// SAVINGS DISPLAY COMPONENT
// ============================================================================

export interface QuoteSavingsDisplayProps {
  originalTotal: number
  quotedTotal: number
  formatPrice?: (price: number) => string
  currency?: string
  className?: string
}

export function QuoteSavingsDisplay({
  originalTotal,
  quotedTotal,
  formatPrice,
  currency = DEFAULT_CURRENCY_SYMBOL,
  className
}: QuoteSavingsDisplayProps) {
  const format = formatPrice || ((p: number) => defaultFormatPrice(p, currency))
  const savings = originalTotal - quotedTotal
  const savingsPercent = originalTotal > 0 ? (savings / originalTotal * 100) : 0

  if (savings <= 0) return null

  return (
    <div className={cn(
      'rounded-lg bg-green-50 border border-green-200 p-4 text-center',
      className
    )}>
      <p className="text-sm text-green-700">Your Savings</p>
      <p className="text-2xl font-bold text-green-600">
        {format(savings)}
      </p>
      <p className="text-sm text-green-600">
        {savingsPercent.toFixed(0)}% off retail price
      </p>
    </div>
  )
}
