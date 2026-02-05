/**
 * CartItemCard - Individual cart item display
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Displays a single cart item with image, name, price, quantity controls.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CartQuantitySelector } from './CartQuantitySelector'
import type { CartItem } from '../../types/ecommerce-types'
import Image from 'next/image'

// ============================================================================
// TYPES
// ============================================================================

interface CartItemCardProps {
  item: CartItem
  onQuantityChange: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  formatPrice: (price: number) => string
  variant?: 'default' | 'compact' | 'drawer'
  disabled?: boolean
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getItemImage(item: CartItem): string | null {
  // Try to get image from product relation
  if (item.product?.images && item.product.images.length > 0) {
    return item.product.images[0]
  }
  return null
}

function getItemName(item: CartItem): string {
  // Try to get name from product relation
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

function getLineTotal(item: CartItem): number {
  return item.unit_price * item.quantity
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  formatPrice,
  variant = 'default',
  disabled = false,
  className
}: CartItemCardProps) {
  const imageUrl = getItemImage(item)
  const itemName = getItemName(item)
  const variantName = getVariantName(item)
  const lineTotal = getLineTotal(item)

  // Custom options display
  const customOptions = item.custom_options as Record<string, string> | null

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 py-3', className)}>
        {/* Image */}
        <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={itemName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{itemName}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(item.unit_price)} × {item.quantity}
          </p>
        </div>

        {/* Total */}
        <div className="text-sm font-semibold">
          {formatPrice(lineTotal)}
        </div>
      </div>
    )
  }

  if (variant === 'drawer') {
    return (
      <div className={cn('flex gap-3 py-4 border-b last:border-0', className)}>
        {/* Image */}
        <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={itemName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{itemName}</p>
              {variantName && (
                <p className="text-xs text-muted-foreground">{variantName}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <CartQuantitySelector
              quantity={item.quantity}
              onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
              onRemove={() => onRemove(item.id)}
              size="sm"
              showRemove={false}
              disabled={disabled}
            />
            <p className="text-sm font-semibold">
              {formatPrice(lineTotal)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default variant - full card
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 rounded-md bg-muted flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={itemName}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium truncate">{itemName}</h4>
              {variantName && (
                <p className="text-sm text-muted-foreground">{variantName}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {formatPrice(item.unit_price)} each
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Custom Options */}
          {customOptions && Object.keys(customOptions).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(customOptions).map(([key, value]) => (
                <p key={key} className="text-xs text-muted-foreground">
                  {key}: {value}
                </p>
              ))}
            </div>
          )}

          {/* Quantity & Total */}
          <div className="flex items-center justify-between mt-4">
            <CartQuantitySelector
              quantity={item.quantity}
              onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
              onRemove={() => onRemove(item.id)}
              disabled={disabled}
            />
            <p className="text-lg font-semibold">
              {formatPrice(lineTotal)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
