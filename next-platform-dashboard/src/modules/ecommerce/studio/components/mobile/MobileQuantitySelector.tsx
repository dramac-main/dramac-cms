/**
 * MobileQuantitySelector - Touch-optimized quantity controls
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Large touch targets (44px+) with long-press for rapid increment.
 */
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// ============================================================================
// TYPES
// ============================================================================

interface MobileQuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove?: () => void
  min?: number
  max?: number
  variant?: 'default' | 'compact' | 'stepper'
  showRemoveOnMin?: boolean
  enableLongPress?: boolean
  longPressInterval?: number
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileQuantitySelector({
  quantity,
  onQuantityChange,
  onRemove,
  min = 1,
  max = 99,
  variant = 'default',
  showRemoveOnMin = true,
  enableLongPress = true,
  longPressInterval = 100,
  className,
}: MobileQuantitySelectorProps) {
  const haptic = useHapticFeedback()
  const [isPressed, setIsPressed] = useState<'minus' | 'plus' | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const quantityRef = useRef(quantity)

  // Keep ref in sync
  useEffect(() => {
    quantityRef.current = quantity
  }, [quantity])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Handle decrement
  const handleDecrement = useCallback(() => {
    if (quantity > min) {
      haptic.trigger('selection')
      onQuantityChange(quantity - 1)
    } else if (quantity === min && showRemoveOnMin && onRemove) {
      haptic.trigger('warning')
      onRemove()
    }
  }, [quantity, min, showRemoveOnMin, onRemove, onQuantityChange, haptic])

  // Handle increment
  const handleIncrement = useCallback(() => {
    if (quantity < max) {
      haptic.trigger('selection')
      onQuantityChange(quantity + 1)
    } else {
      haptic.trigger('error')
    }
  }, [quantity, max, onQuantityChange, haptic])

  // Long press start
  const handlePressStart = useCallback(
    (action: 'minus' | 'plus') => {
      if (!enableLongPress) return

      setIsPressed(action)
      haptic.trigger('selection')

      // Start rapid fire after 500ms hold
      longPressTimerRef.current = setTimeout(() => {
        haptic.trigger('medium')
        intervalRef.current = setInterval(() => {
          if (action === 'minus') {
            const newValue = Math.max(min, quantityRef.current - 1)
            if (newValue !== quantityRef.current) {
              onQuantityChange(newValue)
              haptic.trigger('light')
            }
          } else {
            const newValue = Math.min(max, quantityRef.current + 1)
            if (newValue !== quantityRef.current) {
              onQuantityChange(newValue)
              haptic.trigger('light')
            }
          }
        }, longPressInterval)
      }, 500)
    },
    [enableLongPress, min, max, longPressInterval, onQuantityChange, haptic]
  )

  // Long press end
  const handlePressEnd = useCallback(() => {
    setIsPressed(null)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Shared button styles
  const buttonBaseClass = cn(
    'flex items-center justify-center',
    'rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    'active:scale-95',
    'touch-manipulation select-none'
  )

  // Variant-specific styles
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          onTouchStart={() => handlePressStart('minus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('minus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity <= min && !showRemoveOnMin}
          className={cn(
            buttonBaseClass,
            'w-8 h-8 min-w-[44px] min-h-[44px] -m-2',
            'bg-muted hover:bg-muted/80',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'minus' && 'bg-primary/20'
          )}
          aria-label="Decrease quantity"
        >
          {quantity === min && showRemoveOnMin ? (
            <Trash2 className="h-4 w-4 text-destructive" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </motion.button>

        <span className="w-6 text-center font-medium tabular-nums">{quantity}</span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          onTouchStart={() => handlePressStart('plus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('plus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity >= max}
          className={cn(
            buttonBaseClass,
            'w-8 h-8 min-w-[44px] min-h-[44px] -m-2',
            'bg-muted hover:bg-muted/80',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'plus' && 'bg-primary/20'
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>
    )
  }

  if (variant === 'stepper') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border bg-background',
          className
        )}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          onTouchStart={() => handlePressStart('minus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('minus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity <= min && !showRemoveOnMin}
          className={cn(
            buttonBaseClass,
            'w-12 h-12 rounded-l-full',
            'hover:bg-muted',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'minus' && 'bg-primary/20'
          )}
          aria-label="Decrease quantity"
        >
          {quantity === min && showRemoveOnMin ? (
            <Trash2 className="h-5 w-5 text-destructive" />
          ) : (
            <Minus className="h-5 w-5" />
          )}
        </motion.button>

        <span className="w-12 text-center font-semibold text-lg tabular-nums">
          {quantity}
        </span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          onTouchStart={() => handlePressStart('plus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('plus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity >= max}
          className={cn(
            buttonBaseClass,
            'w-12 h-12 rounded-r-full',
            'hover:bg-muted',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'plus' && 'bg-primary/20'
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border bg-background p-1',
        className
      )}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleDecrement}
        onTouchStart={() => handlePressStart('minus')}
        onTouchEnd={handlePressEnd}
        onMouseDown={() => handlePressStart('minus')}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        disabled={quantity <= min && !showRemoveOnMin}
        className={cn(
          buttonBaseClass,
          'w-11 h-11',
          'bg-muted hover:bg-muted/80',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isPressed === 'minus' && 'bg-primary/20'
        )}
        aria-label="Decrease quantity"
      >
        {quantity === min && showRemoveOnMin ? (
          <Trash2 className="h-5 w-5 text-destructive" />
        ) : (
          <Minus className="h-5 w-5" />
        )}
      </motion.button>

      <span className="w-10 text-center font-semibold text-lg tabular-nums">
        {quantity}
      </span>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleIncrement}
        onTouchStart={() => handlePressStart('plus')}
        onTouchEnd={handlePressEnd}
        onMouseDown={() => handlePressStart('plus')}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        disabled={quantity >= max}
        className={cn(
          buttonBaseClass,
          'w-11 h-11',
          'bg-muted hover:bg-muted/80',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isPressed === 'plus' && 'bg-primary/20'
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-5 w-5" />
      </motion.button>
    </div>
  )
}

export default MobileQuantitySelector
