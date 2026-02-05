/**
 * ShippingMethodSelector - Shipping method selection component
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Allows customers to select their preferred shipping method.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Truck, Clock, Zap } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { ShippingMethod } from '../../hooks/useCheckout'

// ============================================================================
// TYPES
// ============================================================================

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[]
  selected: ShippingMethod | null
  onSelect: (method: ShippingMethod) => void
  formatPrice: (price: number) => string
  disabled?: boolean
  className?: string
}

// ============================================================================
// ICON MAPPING
// ============================================================================

function getMethodIcon(methodId: string) {
  switch (methodId) {
    case 'overnight':
    case 'express':
      return Zap
    case 'standard':
    default:
      return Truck
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShippingMethodSelector({
  methods,
  selected,
  onSelect,
  formatPrice,
  disabled = false,
  className
}: ShippingMethodSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold">Shipping Method</h3>
      
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
              <RadioGroupItem value={method.id} id={method.id} />
              
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
                  {method.estimated_days && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {method.estimated_days}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="font-semibold">
                {method.price === 0 ? 'Free' : formatPrice(method.price)}
              </div>
            </label>
          )
        })}
      </RadioGroup>
    </div>
  )
}
