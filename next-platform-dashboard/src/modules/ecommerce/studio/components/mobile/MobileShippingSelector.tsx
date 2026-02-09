/**
 * MobileShippingSelector - Touch-friendly shipping option selection
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Features:
 * - Large touch targets
 * - Clear pricing and delivery estimates
 * - Visual selection state
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  Zap,
  Clock,
  Package,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export type ShippingSpeed = 'standard' | 'express' | 'overnight' | 'pickup'

export interface ShippingOption {
  id: string
  name: string
  speed: ShippingSpeed
  price: number
  estimatedDays: string
  description?: string
  isEco?: boolean
}

export interface MobileShippingSelectorProps {
  options: ShippingOption[]
  selectedOptionId: string | null
  onSelect: (optionId: string) => void
  disabled?: boolean
  className?: string
  formatPrice?: (price: number) => string
}

// ============================================================================
// HELPERS
// ============================================================================

function getShippingIcon(speed: ShippingSpeed): React.ReactNode {
  switch (speed) {
    case 'express':
      return <Zap className="h-5 w-5" />
    case 'overnight':
      return <Clock className="h-5 w-5" />
    case 'pickup':
      return <Package className="h-5 w-5" />
    case 'standard':
    default:
      return <Truck className="h-5 w-5" />
  }
}

function defaultFormatPrice(price: number): string {
  if (price === 0) return 'FREE'
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(price)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileShippingSelector({
  options,
  selectedOptionId,
  onSelect,
  disabled = false,
  className,
  formatPrice = defaultFormatPrice,
}: MobileShippingSelectorProps) {
  const { trigger } = useHapticFeedback()

  const handleSelect = (optionId: string) => {
    if (disabled) return
    trigger('selection')
    onSelect(optionId)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {options.map((option) => {
        const isSelected = option.id === selectedOptionId
        const isFree = option.price === 0

        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            disabled={disabled}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-lg',
              'min-h-[64px]', // Touch target
              'border-2 transition-colors duration-200',
              'text-left',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 bg-background',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              {getShippingIcon(option.speed)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {option.name}
                </span>
                {option.isEco && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">
                    🌱 Eco
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {option.estimatedDays}
              </p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <span
                className={cn(
                  'font-semibold',
                  isFree ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                )}
              >
                {formatPrice(option.price)}
              </span>
              {/* Selection indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  'transition-colors duration-200',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30'
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            </div>
          </motion.button>
        )
      })}

      {options.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No shipping options available</p>
        </div>
      )}
    </div>
  )
}

export default MobileShippingSelector
