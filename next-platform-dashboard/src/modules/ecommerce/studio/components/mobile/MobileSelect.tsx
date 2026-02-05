/**
 * MobileSelect - Touch-optimized select field
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Uses native <select> for best mobile UX (native picker on iOS/Android).
 * Large touch target with clear visual feedback.
 */
'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, ChevronDown } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface MobileSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MobileSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string
  options: MobileSelectOption[]
  error?: string
  hint?: string
  placeholder?: string
  size?: 'md' | 'lg'
  variant?: 'default' | 'filled'
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  (
    {
      label,
      options,
      error,
      hint,
      placeholder = 'Select an option',
      size = 'lg',
      variant = 'default',
      className,
      disabled,
      required,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`

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
      : 'border-input focus:ring-primary'

    // Check if placeholder is selected
    const isPlaceholder = !value || value === ''

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        <label
          htmlFor={selectId}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>

        {/* Select container */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            value={value}
            className={cn(
              'w-full rounded-lg px-4 pr-10',
              'appearance-none cursor-pointer',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeClasses[size],
              variantClasses[variant],
              stateClasses,
              isPlaceholder && 'text-muted-foreground'
            )}
            {...props}
          >
            {/* Placeholder option */}
            <option value="" disabled>
              {placeholder}
            </option>
            
            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {error ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
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

MobileSelect.displayName = 'MobileSelect'

export default MobileSelect
