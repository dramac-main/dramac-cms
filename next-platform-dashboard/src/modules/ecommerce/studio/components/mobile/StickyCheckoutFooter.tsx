/**
 * StickyCheckoutFooter - Fixed bottom bar with checkout button
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Features:
 * - Always visible at bottom of screen
 * - Shows total and primary action
 * - Safe area padding for notched phones
 * - Loading state support
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Lock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export interface StickyCheckoutFooterProps {
  total: number
  buttonText?: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  showSecurityBadge?: boolean
  showTotal?: boolean
  className?: string
  formatPrice?: (price: number) => string
}

// ============================================================================
// HELPERS
// ============================================================================

function defaultFormatPrice(price: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(price)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StickyCheckoutFooter({
  total,
  buttonText = 'Continue',
  onClick,
  loading = false,
  disabled = false,
  showSecurityBadge = true,
  showTotal = true,
  className,
  formatPrice = defaultFormatPrice,
}: StickyCheckoutFooterProps) {
  const { trigger } = useHapticFeedback()

  const handleClick = () => {
    if (loading || disabled) return
    trigger('medium')
    onClick()
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-background border-t shadow-lg',
        // Safe area padding for notched phones
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="p-4 space-y-3">
        {/* Security badge */}
        {showSecurityBadge && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure checkout</span>
          </div>
        )}

        {/* Main action row */}
        <div className="flex items-center gap-4">
          {/* Total */}
          {showTotal && (
            <div className="flex-shrink-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">
                {formatPrice(total)}
              </p>
            </div>
          )}

          {/* Button */}
          <motion.button
            type="button"
            onClick={handleClick}
            disabled={loading || disabled}
            whileTap={{ scale: loading || disabled ? 1 : 0.98 }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'h-14 rounded-lg font-semibold text-base',
              'transition-colors duration-200',
              loading || disabled
                ? 'bg-primary/50 text-primary-foreground/70 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{buttonText}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default StickyCheckoutFooter
