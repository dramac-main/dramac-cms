/**
 * QuoteItemCard - Display individual quote line item
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Shows product details, quantity, pricing for a quote item.
 */
'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Package, Edit2, Check, X } from 'lucide-react'
import type { QuoteItem } from '../../types/ecommerce-types'
import type { QuoteBuilderItem } from '../../hooks/useQuotations'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteItemCardProps {
  /** Quote item from submitted quote */
  item?: QuoteItem
  /** Builder item for quote builder */
  builderItem?: QuoteBuilderItem
  /** Display variant */
  variant?: 'readonly' | 'editable' | 'compact'
  /** Currency for formatting */
  currency?: string
  /** Format price function */
  formatPrice?: (price: number) => string
  /** Update quantity */
  onQuantityChange?: (quantity: number) => void
  /** Update notes */
  onNotesChange?: (notes: string) => void
  /** Update requested price */
  onRequestedPriceChange?: (price: number) => void
  /** Remove item */
  onRemove?: () => void
  /** Show discount information */
  showDiscount?: boolean
  className?: string
}

// ============================================================================
// DEFAULT FORMATTER
// ============================================================================

function defaultFormatPrice(price: number, currency = '$'): string {
  return `${currency}${price.toFixed(2)}`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteItemCard({
  item,
  builderItem,
  variant = 'readonly',
  currency = '$',
  formatPrice,
  onQuantityChange,
  onNotesChange,
  onRequestedPriceChange,
  onRemove,
  showDiscount = true,
  className
}: QuoteItemCardProps) {
  const [isEditingNotes, setIsEditingNotes] = React.useState(false)
  const [editedNotes, setEditedNotes] = React.useState('')
  
  const format = formatPrice || ((p: number) => defaultFormatPrice(p, currency))

  // Extract common fields from either item or builderItem
  const name = item?.name || builderItem?.product_name || 'Unknown Product'
  const image = item?.image_url || builderItem?.product_image
  const quantity = item?.quantity || builderItem?.quantity || 1
  const unitPrice = item?.unit_price || builderItem?.list_price || 0
  const requestedPrice = builderItem?.requested_price
  const notes = builderItem?.notes || ''
  const variantName = builderItem?.variant_name
  
  // Calculate totals
  const lineTotal = item?.line_total || (unitPrice * quantity)
  const discountPercent = item?.discount_percent || 0
  const discountAmount = discountPercent > 0 ? (unitPrice * quantity * discountPercent / 100) : 0
  const finalTotal = lineTotal - discountAmount

  // Handle notes edit
  const handleStartEditNotes = () => {
    setEditedNotes(notes)
    setIsEditingNotes(true)
  }

  const handleSaveNotes = () => {
    onNotesChange?.(editedNotes)
    setIsEditingNotes(false)
  }

  const handleCancelNotes = () => {
    setIsEditingNotes(false)
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 py-2', className)}>
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-500">Qty: {quantity}</p>
        </div>
        
        <div className="text-right text-sm font-medium">
          {format(finalTotal)}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-lg border bg-white p-4',
      className
    )}>
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-gray-900">{name}</h4>
              {variantName && (
                <p className="text-sm text-gray-500">{variantName}</p>
              )}
            </div>
            
            {variant === 'editable' && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Pricing row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-600">
              Unit: {format(unitPrice)}
            </span>
            
            {/* Quantity */}
            {variant === 'editable' && onQuantityChange ? (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Qty:</span>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                  className="h-7 w-16 text-center text-sm"
                />
              </div>
            ) : (
              <span className="text-gray-600">Qty: {quantity}</span>
            )}

            {/* Discount */}
            {showDiscount && discountPercent > 0 && (
              <span className="text-green-600">
                -{discountPercent}% ({format(discountAmount)} off)
              </span>
            )}
          </div>

          {/* Requested price for builder */}
          {variant === 'editable' && onRequestedPriceChange && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Request price:</span>
              <Input
                type="number"
                step="0.01"
                placeholder="Optional"
                value={requestedPrice || ''}
                onChange={(e) => onRequestedPriceChange(parseFloat(e.target.value) || 0)}
                className="h-7 w-24 text-sm"
              />
            </div>
          )}

          {/* Notes */}
          {variant === 'editable' ? (
            <div className="mt-2">
              {isEditingNotes ? (
                <div className="flex gap-2">
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes for this item..."
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveNotes}
                      className="h-7 w-7 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelNotes}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartEditNotes}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Edit2 className="h-3 w-3" />
                  {notes || 'Add notes...'}
                </button>
              )}
            </div>
          ) : notes ? (
            <p className="mt-2 text-sm text-gray-500 italic">
              Note: {notes}
            </p>
          ) : null}
        </div>

        {/* Line total */}
        <div className="shrink-0 text-right">
          {discountPercent > 0 && (
            <p className="text-sm text-gray-400 line-through">
              {format(lineTotal)}
            </p>
          )}
          <p className="text-lg font-semibold text-gray-900">
            {format(finalTotal)}
          </p>
        </div>
      </div>
    </div>
  )
}
