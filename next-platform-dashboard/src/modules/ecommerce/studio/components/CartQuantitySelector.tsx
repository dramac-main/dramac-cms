/**
 * CartQuantitySelector - Quantity control component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Provides +/- controls for adjusting item quantities.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ============================================================================
// TYPES
// ============================================================================

interface CartQuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove?: () => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showRemove?: boolean
  disabled?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartQuantitySelector({
  quantity,
  onQuantityChange,
  onRemove,
  min = 1,
  max = 99,
  size = 'md',
  showRemove = true,
  disabled = false,
  className
}: CartQuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1)
    } else if (quantity === min && showRemove && onRemove) {
      onRemove()
    }
  }

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value)
    }
  }

  const sizeClasses = {
    sm: {
      button: 'h-7 w-7',
      input: 'h-7 w-10 text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      button: 'h-8 w-8',
      input: 'h-8 w-12 text-sm',
      icon: 'h-4 w-4'
    },
    lg: {
      button: 'h-10 w-10',
      input: 'h-10 w-14',
      icon: 'h-5 w-5'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="icon"
        className={classes.button}
        onClick={handleDecrement}
        disabled={disabled}
      >
        {quantity === min && showRemove ? (
          <Trash2 className={cn(classes.icon, 'text-destructive')} />
        ) : (
          <Minus className={classes.icon} />
        )}
      </Button>

      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className={cn(classes.input, 'text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
        disabled={disabled}
      />

      <Button
        variant="outline"
        size="icon"
        className={classes.button}
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
      >
        <Plus className={classes.icon} />
      </Button>
    </div>
  )
}
