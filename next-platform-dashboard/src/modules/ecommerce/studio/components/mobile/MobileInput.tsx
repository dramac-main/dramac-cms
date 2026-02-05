/**
 * MobileInput - Touch-optimized input field
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Input field with large touch targets, proper autocomplete,
 * and mobile keyboard hints.
 */
'use client'

import React, { forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, Check } from 'lucide-react'
import { useKeyboardVisible } from '../../../hooks/useKeyboardVisible'

// ============================================================================
// TYPES
// ============================================================================

export interface MobileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  success?: boolean
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'md' | 'lg'
  variant?: 'default' | 'filled'
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      size = 'lg',
      variant = 'default',
      className,
      disabled,
      required,
      id,
      onFocus,
      ...props
    },
    ref
  ) => {
    const { scrollInputIntoView } = useKeyboardVisible()
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`

    // Handle focus with scroll
    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        scrollInputIntoView(e.target)
        onFocus?.(e)
      },
      [scrollInputIntoView, onFocus]
    )

    // Size classes
    const sizeClasses = {
      md: 'h-12 text-base',
      lg: 'h-14 text-lg',
    }

    // Variant classes
    const variantClasses = {
      default: 'bg-background border',
      filled: 'bg-muted border-transparent',
    }

    // State classes
    const stateClasses = error
      ? 'border-destructive focus:ring-destructive'
      : success
      ? 'border-green-500 focus:ring-green-500'
      : 'border-input focus:ring-primary'

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            onFocus={handleFocus}
            className={cn(
              'w-full rounded-lg px-4',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'placeholder:text-muted-foreground',
              sizeClasses[size],
              variantClasses[variant],
              stateClasses,
              leftIcon && 'pl-10',
              (rightIcon || error || success) && 'pr-10'
            )}
            {...props}
          />

          {/* Right icon / Status icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : success ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              rightIcon && <span className="text-muted-foreground">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Error or hint message */}
        {(error || hint) && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)

MobileInput.displayName = 'MobileInput'

export default MobileInput
