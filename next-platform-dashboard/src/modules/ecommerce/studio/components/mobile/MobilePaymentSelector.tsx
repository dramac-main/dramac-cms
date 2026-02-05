/**
 * MobilePaymentSelector - Touch-friendly payment method selection
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Features:
 * - Large touch targets (56px minimum)
 * - Clear visual selection state
 * - Support for saved cards and new payment methods
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Wallet,
  Building2,
  Plus,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethodType = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank' | 'new'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  label: string
  description?: string
  icon?: React.ReactNode
  isDefault?: boolean
  lastFour?: string
  expiryMonth?: number
  expiryYear?: number
  brand?: string
}

export interface MobilePaymentSelectorProps {
  methods: PaymentMethod[]
  selectedMethodId: string | null
  onSelect: (methodId: string) => void
  onAddNew?: () => void
  showAddNew?: boolean
  disabled?: boolean
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getPaymentIcon(type: PaymentMethodType, brand?: string): React.ReactNode {
  switch (type) {
    case 'paypal':
      return <Wallet className="h-5 w-5" />
    case 'apple_pay':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      )
    case 'google_pay':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      )
    case 'bank':
      return <Building2 className="h-5 w-5" />
    case 'new':
      return <Plus className="h-5 w-5" />
    case 'card':
    default:
      return <CreditCard className="h-5 w-5" />
  }
}

function getCardBrandLogo(brand?: string): React.ReactNode {
  // Simple text-based brand indicator
  // Could be replaced with SVG logos
  switch (brand?.toLowerCase()) {
    case 'visa':
      return <span className="text-xs font-bold text-blue-600">VISA</span>
    case 'mastercard':
      return <span className="text-xs font-bold text-red-500">MC</span>
    case 'amex':
      return <span className="text-xs font-bold text-blue-400">AMEX</span>
    case 'discover':
      return <span className="text-xs font-bold text-orange-500">DISC</span>
    default:
      return null
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobilePaymentSelector({
  methods,
  selectedMethodId,
  onSelect,
  onAddNew,
  showAddNew = true,
  disabled = false,
  className,
}: MobilePaymentSelectorProps) {
  const { trigger } = useHapticFeedback()

  const handleSelect = (methodId: string) => {
    if (disabled) return
    trigger('selection')
    onSelect(methodId)
  }

  const handleAddNew = () => {
    if (disabled || !onAddNew) return
    trigger('light')
    onAddNew()
  }

  return (
    <div className={cn('space-y-2', className)}>
      {methods.map((method) => {
        const isSelected = method.id === selectedMethodId

        return (
          <motion.button
            key={method.id}
            type="button"
            onClick={() => handleSelect(method.id)}
            disabled={disabled}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-lg',
              'min-h-[56px]', // Touch target
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
              {method.icon || getPaymentIcon(method.type, method.brand)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  {method.label}
                </span>
                {method.brand && getCardBrandLogo(method.brand)}
                {method.isDefault && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    Default
                  </span>
                )}
              </div>
              {method.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {method.description}
                </p>
              )}
              {method.lastFour && (
                <p className="text-sm text-muted-foreground">
                  •••• {method.lastFour}
                  {method.expiryMonth && method.expiryYear && (
                    <span className="ml-2">
                      {String(method.expiryMonth).padStart(2, '0')}/{String(method.expiryYear).slice(-2)}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Selection indicator */}
            <div
              className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                'transition-colors duration-200',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
            </div>
          </motion.button>
        )
      })}

      {/* Add new payment method */}
      {showAddNew && onAddNew && (
        <motion.button
          type="button"
          onClick={handleAddNew}
          disabled={disabled}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full flex items-center gap-4 p-4 rounded-lg',
            'min-h-[56px]',
            'border-2 border-dashed border-muted-foreground/30',
            'hover:border-primary/50 transition-colors duration-200',
            'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </div>
          <span className="font-medium">Add new payment method</span>
        </motion.button>
      )}
    </div>
  )
}

export default MobilePaymentSelector
