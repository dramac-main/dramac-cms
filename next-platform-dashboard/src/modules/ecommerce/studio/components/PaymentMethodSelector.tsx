/**
 * PaymentMethodSelector - Payment method selection component
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Allows customers to select their preferred payment method.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { CreditCard, Landmark, Wallet } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { PaymentMethod } from '../../hooks/useCheckout'

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  disabled?: boolean
  className?: string
}

// ============================================================================
// ICON MAPPING
// ============================================================================

function getMethodIcon(methodId: string) {
  switch (methodId) {
    case 'card':
    case 'credit_card':
      return CreditCard
    case 'bank':
    case 'bank_transfer':
      return Landmark
    case 'paypal':
    case 'wallet':
    default:
      return Wallet
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentMethodSelector({
  methods,
  selected,
  onSelect,
  disabled = false,
  className
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold">Payment Method</h3>
      
      <RadioGroup
        value={selected?.id || ''}
        onValueChange={(value) => {
          const method = methods.find(m => m.id === value)
          if (method) onSelect(method)
        }}
        disabled={disabled}
        className="space-y-3"
      >
        {methods.map((method) => {
          const Icon = getMethodIcon(method.id)
          const isSelected = selected?.id === method.id
          
          return (
            <label
              key={method.id}
              className={cn(
                'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                isSelected && 'border-primary bg-primary/5',
                !isSelected && 'border-border hover:border-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
              
              <div className="flex items-center gap-3 flex-1">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <p className="font-medium">{method.name}</p>
                  {method.description && (
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  )}
                </div>
              </div>
            </label>
          )
        })}
      </RadioGroup>
      
      {/* Security note */}
      <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Your payment information is secure and encrypted
      </p>
    </div>
  )
}
