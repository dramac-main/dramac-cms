/**
 * CartDiscountInput - Discount/promo code input component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Allows customers to enter and apply discount codes.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tag, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// TYPES
// ============================================================================

interface CartDiscountInputProps {
  currentDiscount?: {
    code: string
    amount: number
    type: 'percentage' | 'fixed'
  } | null
  onApplyDiscount: (code: string) => Promise<boolean>
  onRemoveDiscount: () => void
  formatPrice: (price: number) => string
  disabled?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartDiscountInput({
  currentDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  formatPrice,
  disabled = false,
  className
}: CartDiscountInputProps) {
  const [code, setCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) return

    setIsApplying(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await onApplyDiscount(code.trim().toUpperCase())
      if (result) {
        setSuccess(true)
        setCode('')
        setTimeout(() => setSuccess(false), 2000)
      } else {
        setError('Invalid or expired discount code')
      }
    } catch (err) {
      setError('Failed to apply discount code')
    } finally {
      setIsApplying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isApplying && code.trim()) {
      e.preventDefault()
      handleApply()
    }
  }

  // If discount is already applied, show it
  if (currentDiscount) {
    const discountDisplay = currentDiscount.type === 'percentage'
      ? `${currentDiscount.amount}% off`
      : `${formatPrice(currentDiscount.amount)} off`

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <Badge variant="secondary" className="mr-2">
                {currentDiscount.code}
              </Badge>
              <span className="text-sm text-green-700 dark:text-green-300">
                {discountDisplay}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRemoveDiscount}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Discount code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 uppercase"
            disabled={disabled || isApplying}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={disabled || isApplying || !code.trim()}
          variant={success ? 'default' : 'secondary'}
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <Check className="h-4 w-4" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
