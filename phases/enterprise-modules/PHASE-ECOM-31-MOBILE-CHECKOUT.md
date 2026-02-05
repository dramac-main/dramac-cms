# PHASE-ECOM-31: Mobile Checkout Flow

> **Priority**: 🟠 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: PHASE-ECOM-30 (Mobile Cart Experience), Wave 3 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a mobile-optimized checkout experience with single-page scrolling checkout, touch-friendly forms, accordion sections, express checkout placeholders, and sticky order summary. The checkout flow is designed to complete in under 3 minutes on mobile with minimal friction.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-30 hooks are implemented (`useMobile`, `useHapticFeedback`)
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review Wave 3 checkout components (`CheckoutPageBlock`, `AddressForm`)
- [ ] Verify `useCheckout` hook from Wave 3 is working
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Mobile Checkout Architecture
├── Main Component
│   └── MobileCheckoutPage        → Single-page checkout layout
│
├── Form Components
│   ├── MobileAddressInput        → Touch-optimized address form
│   ├── MobilePaymentSelector     → Payment method cards
│   ├── MobileShippingSelector    → Shipping method selection
│   └── MobileInput/Select/etc    → Base form components
│
├── UX Components
│   ├── MobileCheckoutProgress    → Compact progress indicator
│   ├── CollapsibleSection        → Accordion sections
│   ├── MobileOrderReview         → Expandable order summary
│   └── StickyCheckoutFooter      → Fixed checkout button
│
└── Hooks
    └── useKeyboardVisible        → Keyboard state detection

Mobile Checkout Flow:
1. Express Checkout (Apple Pay/Google Pay - placeholders)
2. Contact Information (email)
3. Shipping Address (collapsible)
4. Shipping Method (collapsible)
5. Payment (collapsible)
6. Order Review (sticky footer)
7. Place Order (sticky button)
```

### Form Optimization
- Large input fields (48px height minimum)
- Proper `inputMode` for numeric fields
- Autofill support (autocomplete attributes)
- Error states that don't obscure fields
- Country/region as native selects (better mobile UX)

### Keyboard Handling
```typescript
// Scroll input into view when focused
input.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `hooks/useKeyboardVisible.ts` | Create | Keyboard visibility detection |
| `studio/components/mobile/MobileCheckoutPage.tsx` | Create | Main checkout layout |
| `studio/components/mobile/MobileAddressInput.tsx` | Create | Touch-optimized address form |
| `studio/components/mobile/MobilePaymentSelector.tsx` | Create | Payment method selection |
| `studio/components/mobile/MobileShippingSelector.tsx` | Create | Shipping method selection |
| `studio/components/mobile/MobileCheckoutProgress.tsx` | Create | Progress indicator |
| `studio/components/mobile/MobileOrderReview.tsx` | Create | Order summary |
| `studio/components/mobile/CollapsibleSection.tsx` | Create | Accordion section wrapper |
| `studio/components/mobile/StickyCheckoutFooter.tsx` | Create | Fixed checkout button |
| `studio/components/mobile/MobileInput.tsx` | Create | Touch-optimized input |
| `studio/components/mobile/MobileSelect.tsx` | Create | Touch-optimized select |
| `studio/components/mobile/index.ts` | Modify | Export new components |
| `hooks/index.ts` | Modify | Export useKeyboardVisible |

---

## 📋 Implementation Tasks

### Task 31.1: Create useKeyboardVisible Hook

**File**: `src/modules/ecommerce/hooks/useKeyboardVisible.ts`
**Action**: Create

**Description**: Detects when mobile keyboard is open for UI adjustments

```typescript
/**
 * useKeyboardVisible - Keyboard visibility detection hook
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Detects when the virtual keyboard is open on mobile devices.
 * Useful for adjusting UI elements that might be obscured.
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface KeyboardState {
  isVisible: boolean
  height: number
}

export interface UseKeyboardVisibleReturn {
  isKeyboardVisible: boolean
  keyboardHeight: number
  scrollInputIntoView: (element: HTMLElement | null) => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useKeyboardVisible(): UseKeyboardVisibleReturn {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  })
  
  const initialViewportHeight = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Store initial viewport height
    initialViewportHeight.current = window.innerHeight

    // Detect keyboard via viewport resize
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDiff = initialViewportHeight.current - currentHeight
      
      // Keyboard is likely visible if viewport shrunk significantly
      // (typically 150px+ for mobile keyboards)
      const isVisible = heightDiff > 150
      
      setKeyboardState({
        isVisible,
        height: isVisible ? heightDiff : 0,
      })
    }

    // Also detect via visualViewport API (more reliable on modern browsers)
    const handleVisualViewportResize = () => {
      if (!window.visualViewport) return
      
      const heightDiff = initialViewportHeight.current - window.visualViewport.height
      const isVisible = heightDiff > 150
      
      setKeyboardState({
        isVisible,
        height: isVisible ? heightDiff : 0,
      })
    }

    // Use visualViewport if available (better accuracy)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportResize)
      }
    }

    // Fallback to window resize
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Utility to scroll an input into view when keyboard opens
  const scrollInputIntoView = useCallback((element: HTMLElement | null) => {
    if (!element) return

    // Small delay to let keyboard animation complete
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)
  }, [])

  return {
    isKeyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    scrollInputIntoView,
  }
}

/**
 * Hook to automatically scroll focused input into view
 */
export function useAutoScrollOnFocus() {
  const { scrollInputIntoView } = useKeyboardVisible()

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    scrollInputIntoView(e.target)
  }, [scrollInputIntoView])

  return { handleFocus }
}
```

---

### Task 31.2: Create MobileInput Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileInput.tsx`
**Action**: Create

**Description**: Touch-optimized input field for mobile forms

```typescript
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
```

---

### Task 31.3: Create MobileSelect Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileSelect.tsx`
**Action**: Create

**Description**: Touch-optimized select field using native select for best mobile UX

```typescript
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
```

---

### Task 31.4: Create CollapsibleSection Component

**File**: `src/modules/ecommerce/studio/components/mobile/CollapsibleSection.tsx`
**Action**: Create

**Description**: Accordion section for mobile checkout steps

```typescript
/**
 * CollapsibleSection - Accordion section for checkout
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Collapsible section with completion status and smooth animations.
 */
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export type SectionStatus = 'pending' | 'active' | 'complete' | 'error'

export interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  status: SectionStatus
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CollapsibleSection({
  title,
  subtitle,
  status,
  isOpen,
  onToggle,
  children,
  badge,
  disabled = false,
  className,
}: CollapsibleSectionProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Handle toggle with haptic feedback
  const handleToggle = useCallback(() => {
    if (disabled) return
    haptic.trigger('selection')
    onToggle()
  }, [disabled, haptic, onToggle])

  // Status icon
  const StatusIcon = () => {
    switch (status) {
      case 'complete':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )
      case 'active':
        return (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        )
    }
  }

  // Animation variants
  const contentVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.2 },
    },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  const reducedMotionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden',
        status === 'active' && 'border-primary',
        disabled && 'opacity-50',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-4',
          'flex items-center gap-3',
          'text-left',
          'transition-colors',
          'hover:bg-muted/50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
          'disabled:cursor-not-allowed',
          'min-h-[64px]'
        )}
        aria-expanded={isOpen}
      >
        {/* Status icon */}
        <StatusIcon />

        {/* Title and subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Content - collapsible */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={prefersReducedMotion ? reducedMotionVariants : contentVariants}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CollapsibleSection
```

---

### Task 31.5: Create MobileCheckoutProgress Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileCheckoutProgress.tsx`
**Action**: Create

**Description**: Compact progress indicator for checkout steps

```typescript
/**
 * MobileCheckoutProgress - Compact checkout progress indicator
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Minimal progress indicator showing checkout steps as dots or segments.
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review'

export interface CheckoutStepConfig {
  id: CheckoutStep
  label: string
  shortLabel: string
}

export interface MobileCheckoutProgressProps {
  currentStep: CheckoutStep
  completedSteps: CheckoutStep[]
  variant?: 'dots' | 'segments' | 'labels'
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS: CheckoutStepConfig[] = [
  { id: 'contact', label: 'Contact', shortLabel: '1' },
  { id: 'shipping', label: 'Shipping', shortLabel: '2' },
  { id: 'payment', label: 'Payment', shortLabel: '3' },
  { id: 'review', label: 'Review', shortLabel: '4' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileCheckoutProgress({
  currentStep,
  completedSteps,
  variant = 'dots',
  className,
}: MobileCheckoutProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  // Dots variant
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep

          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isCompleted
                    ? 'hsl(var(--primary))'
                    : isCurrent
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted))',
                }}
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  'transition-colors duration-200'
                )}
              />
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-6 h-0.5 mx-1',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Segments variant
  if (variant === 'segments') {
    return (
      <div className={cn('flex gap-1', className)}>
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep

          return (
            <motion.div
              key={step.id}
              initial={false}
              animate={{
                backgroundColor:
                  isCompleted || isCurrent
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted))',
              }}
              className={cn(
                'flex-1 h-1 rounded-full',
                'transition-colors duration-200'
              )}
            />
          )
        })}
      </div>
    )
  }

  // Labels variant
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isPending = !isCompleted && !isCurrent

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'text-sm font-medium',
                  'transition-colors duration-200',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isPending && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.shortLabel
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1',
                  isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
                style={{ minWidth: '24px' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MobileCheckoutProgress
```

---

### Task 31.6: Create MobileAddressInput Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileAddressInput.tsx`
**Action**: Create

**Description**: Complete address form optimized for mobile

```typescript
/**
 * MobileAddressInput - Touch-optimized address form
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Complete address entry with proper autocomplete attributes,
 * country/region selects, and field validation.
 */
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MobileInput } from './MobileInput'
import { MobileSelect, type MobileSelectOption } from './MobileSelect'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// ============================================================================
// TYPES
// ============================================================================

export interface AddressData {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

export interface AddressErrors {
  firstName?: string
  lastName?: string
  address1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
}

export interface MobileAddressInputProps {
  address: AddressData
  onChange: (address: AddressData) => void
  errors?: AddressErrors
  showCompany?: boolean
  showPhone?: boolean
  saveAddressOption?: boolean
  onSaveAddressChange?: (save: boolean) => void
  type?: 'shipping' | 'billing'
  className?: string
}

// ============================================================================
// COUNTRY DATA
// ============================================================================

const COUNTRIES: MobileSelectOption[] = [
  { value: 'KE', label: 'Kenya' },
  { value: 'UG', label: 'Uganda' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  // Add more as needed
]

// Example states/regions for Kenya
const KENYA_REGIONS: MobileSelectOption[] = [
  { value: 'NRB', label: 'Nairobi' },
  { value: 'MBA', label: 'Mombasa' },
  { value: 'KSM', label: 'Kisumu' },
  { value: 'NKR', label: 'Nakuru' },
  { value: 'ELD', label: 'Eldoret' },
  { value: 'OTHER', label: 'Other' },
]

// Get regions based on country (simplified)
function getRegionsForCountry(countryCode: string): MobileSelectOption[] {
  switch (countryCode) {
    case 'KE':
      return KENYA_REGIONS
    default:
      return []
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileAddressInput({
  address,
  onChange,
  errors = {},
  showCompany = false,
  showPhone = true,
  saveAddressOption = false,
  onSaveAddressChange,
  type = 'shipping',
  className,
}: MobileAddressInputProps) {
  const [saveAddress, setSaveAddress] = useState(false)
  const [regions, setRegions] = useState<MobileSelectOption[]>([])

  // Update regions when country changes
  useEffect(() => {
    const countryRegions = getRegionsForCountry(address.country)
    setRegions(countryRegions)
  }, [address.country])

  // Handle field change
  const handleChange = useCallback(
    (field: keyof AddressData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      onChange({
        ...address,
        [field]: e.target.value,
      })
    },
    [address, onChange]
  )

  // Handle save address toggle
  const handleSaveAddressChange = useCallback(
    (checked: boolean) => {
      setSaveAddress(checked)
      onSaveAddressChange?.(checked)
    },
    [onSaveAddressChange]
  )

  // Autocomplete prefix based on type
  const autocompletePrefix = type === 'shipping' ? 'shipping' : 'billing'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <MobileInput
          label="First name"
          value={address.firstName}
          onChange={handleChange('firstName')}
          error={errors.firstName}
          required
          autoComplete={`${autocompletePrefix} given-name`}
          inputMode="text"
        />
        <MobileInput
          label="Last name"
          value={address.lastName}
          onChange={handleChange('lastName')}
          error={errors.lastName}
          required
          autoComplete={`${autocompletePrefix} family-name`}
          inputMode="text"
        />
      </div>

      {/* Company (optional) */}
      {showCompany && (
        <MobileInput
          label="Company"
          value={address.company || ''}
          onChange={handleChange('company')}
          autoComplete={`${autocompletePrefix} organization`}
          inputMode="text"
        />
      )}

      {/* Address line 1 */}
      <MobileInput
        label="Address"
        value={address.address1}
        onChange={handleChange('address1')}
        error={errors.address1}
        required
        placeholder="Street address"
        autoComplete={`${autocompletePrefix} address-line1`}
        inputMode="text"
      />

      {/* Address line 2 */}
      <MobileInput
        label="Apartment, suite, etc."
        value={address.address2 || ''}
        onChange={handleChange('address2')}
        autoComplete={`${autocompletePrefix} address-line2`}
        inputMode="text"
      />

      {/* City */}
      <MobileInput
        label="City"
        value={address.city}
        onChange={handleChange('city')}
        error={errors.city}
        required
        autoComplete={`${autocompletePrefix} address-level2`}
        inputMode="text"
      />

      {/* Country */}
      <MobileSelect
        label="Country"
        value={address.country}
        onChange={handleChange('country')}
        options={COUNTRIES}
        error={errors.country}
        required
      />

      {/* State/Region and Postal code row */}
      <div className="grid grid-cols-2 gap-3">
        {regions.length > 0 ? (
          <MobileSelect
            label="Region"
            value={address.state}
            onChange={handleChange('state')}
            options={regions}
            error={errors.state}
            required
          />
        ) : (
          <MobileInput
            label="State/Province"
            value={address.state}
            onChange={handleChange('state')}
            error={errors.state}
            autoComplete={`${autocompletePrefix} address-level1`}
            inputMode="text"
          />
        )}
        <MobileInput
          label="Postal code"
          value={address.postalCode}
          onChange={handleChange('postalCode')}
          error={errors.postalCode}
          required
          autoComplete={`${autocompletePrefix} postal-code`}
          inputMode="text"
        />
      </div>

      {/* Phone */}
      {showPhone && (
        <MobileInput
          label="Phone number"
          value={address.phone}
          onChange={handleChange('phone')}
          error={errors.phone}
          required
          type="tel"
          autoComplete={`${autocompletePrefix} tel`}
          inputMode="tel"
          placeholder="+254 700 000 000"
        />
      )}

      {/* Save address option */}
      {saveAddressOption && (
        <div className="flex items-center space-x-3 pt-2">
          <Checkbox
            id="save-address"
            checked={saveAddress}
            onCheckedChange={handleSaveAddressChange}
            className="h-5 w-5"
          />
          <Label
            htmlFor="save-address"
            className="text-sm cursor-pointer min-h-[44px] flex items-center"
          >
            Save this address for future orders
          </Label>
        </div>
      )}
    </div>
  )
}

export default MobileAddressInput
```

---

### Task 31.7: Create MobilePaymentSelector Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobilePaymentSelector.tsx`
**Action**: Create

**Description**: Payment method selection with large touch targets

```typescript
/**
 * MobilePaymentSelector - Touch-optimized payment method selection
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Large card-style payment method selection with mobile wallet support.
 */
'use client'

import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Smartphone, Building2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethod = 'card' | 'mobile_money' | 'bank_transfer' | 'apple_pay' | 'google_pay'

export interface PaymentOption {
  id: PaymentMethod
  label: string
  description?: string
  icon: React.ReactNode
  disabled?: boolean
  comingSoon?: boolean
}

export interface MobilePaymentSelectorProps {
  selectedMethod: PaymentMethod | null
  onMethodSelect: (method: PaymentMethod) => void
  availableMethods?: PaymentMethod[]
  className?: string
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'card',
    label: 'Credit/Debit Card',
    description: 'Visa, Mastercard, Amex',
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    description: 'M-Pesa, Airtel Money',
    icon: <Smartphone className="h-6 w-6" />,
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Direct bank payment',
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    description: 'Pay with Apple Pay',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
    comingSoon: true,
  },
  {
    id: 'google_pay',
    label: 'Google Pay',
    description: 'Pay with Google Pay',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
      </svg>
    ),
    comingSoon: true,
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function MobilePaymentSelector({
  selectedMethod,
  onMethodSelect,
  availableMethods,
  className,
}: MobilePaymentSelectorProps) {
  const haptic = useHapticFeedback()

  // Filter available methods
  const options = availableMethods
    ? DEFAULT_PAYMENT_OPTIONS.filter((opt) => availableMethods.includes(opt.id))
    : DEFAULT_PAYMENT_OPTIONS

  // Handle selection
  const handleSelect = useCallback(
    (method: PaymentMethod, disabled?: boolean, comingSoon?: boolean) => {
      if (disabled || comingSoon) return
      haptic.trigger('selection')
      onMethodSelect(method)
    },
    [haptic, onMethodSelect]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option) => {
        const isSelected = selectedMethod === option.id
        const isDisabled = option.disabled || option.comingSoon

        return (
          <motion.button
            key={option.id}
            type="button"
            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            onClick={() => handleSelect(option.id, option.disabled, option.comingSoon)}
            disabled={isDisabled}
            className={cn(
              'w-full p-4 rounded-xl border-2',
              'flex items-center gap-4',
              'text-left transition-colors',
              'min-h-[72px]',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected && !isDisabled
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted'
              )}
            >
              {option.icon}
            </div>

            {/* Label and description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                {option.comingSoon && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>

            {/* Selected indicator */}
            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                'transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className="h-4 w-4" />}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default MobilePaymentSelector
```

---

### Task 31.8: Create MobileShippingSelector Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileShippingSelector.tsx`
**Action**: Create

**Description**: Shipping method selection optimized for mobile

```typescript
/**
 * MobileShippingSelector - Touch-optimized shipping method selection
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Large card-style shipping option selection with delivery estimates.
 */
'use client'

import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Truck, Zap, Package, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// ============================================================================
// TYPES
// ============================================================================

export interface ShippingOption {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  icon?: React.ReactNode
}

export interface MobileShippingSelectorProps {
  options: ShippingOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  currencySymbol?: string
  className?: string
}

// ============================================================================
// DEFAULT ICONS
// ============================================================================

const getDefaultIcon = (index: number) => {
  const icons = [
    <Truck key="truck" className="h-5 w-5" />,
    <Zap key="zap" className="h-5 w-5" />,
    <Package key="package" className="h-5 w-5" />,
  ]
  return icons[index % icons.length]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileShippingSelector({
  options,
  selectedId,
  onSelect,
  currencySymbol = '$',
  className,
}: MobileShippingSelectorProps) {
  const haptic = useHapticFeedback()

  // Handle selection
  const handleSelect = useCallback(
    (id: string) => {
      haptic.trigger('selection')
      onSelect(id)
    },
    [haptic, onSelect]
  )

  if (options.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        No shipping options available for your location.
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option, index) => {
        const isSelected = selectedId === option.id

        return (
          <motion.button
            key={option.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(option.id)}
            className={cn(
              'w-full p-4 rounded-xl border-2',
              'flex items-center gap-4',
              'text-left transition-colors',
              'min-h-[72px]',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted'
              )}
            >
              {option.icon || getDefaultIcon(index)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{option.name}</span>
                <span className="font-semibold">
                  {option.price === 0
                    ? 'Free'
                    : `${currencySymbol}${option.price.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {option.estimatedDays}
                </p>
              </div>
            </div>

            {/* Selected indicator */}
            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                'transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className="h-4 w-4" />}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default MobileShippingSelector
```

---

### Task 31.9: Create MobileOrderReview Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileOrderReview.tsx`
**Action**: Create

**Description**: Compact expandable order summary

```typescript
/**
 * MobileOrderReview - Compact order summary for mobile checkout
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Expandable order summary showing items and totals.
 */
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Package } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { CartItem, CartTotals } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface MobileOrderReviewProps {
  items: CartItem[]
  totals: CartTotals
  currencySymbol?: string
  defaultExpanded?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileOrderReview({
  items,
  totals,
  currencySymbol = '$',
  defaultExpanded = false,
  className,
}: MobileOrderReviewProps) {
  const haptic = useHapticFeedback()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = useCallback(() => {
    haptic.trigger('selection')
    setIsExpanded((prev) => !prev)
  }, [haptic])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden bg-muted/30',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={cn(
          'w-full px-4 py-4',
          'flex items-center justify-between',
          'hover:bg-muted/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
          'min-h-[56px]'
        )}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">
            Order summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {currencySymbol}{totals.total.toFixed(2)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t">
              {/* Items list */}
              <div className="space-y-3 pt-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {/* Image */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                      {/* Quantity badge */}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-xs text-muted-foreground">
                          {item.variant_name}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <span className="font-medium text-sm">
                      {currencySymbol}{(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-3 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{currencySymbol}{totals.subtotal.toFixed(2)}</span>
                </div>
                
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{currencySymbol}{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                
                {totals.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{currencySymbol}{totals.shipping.toFixed(2)}</span>
                  </div>
                )}
                
                {totals.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{currencySymbol}{totals.tax.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{currencySymbol}{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileOrderReview
```

---

### Task 31.10: Create StickyCheckoutFooter Component

**File**: `src/modules/ecommerce/studio/components/mobile/StickyCheckoutFooter.tsx`
**Action**: Create

**Description**: Fixed checkout button at bottom of screen

```typescript
/**
 * StickyCheckoutFooter - Fixed checkout button for mobile
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Sticky footer with total and place order button.
 * Respects safe-area-inset-bottom for notched phones.
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ============================================================================
// TYPES
// ============================================================================

export interface StickyCheckoutFooterProps {
  total: number
  currencySymbol?: string
  onPlaceOrder: () => void
  isProcessing?: boolean
  isDisabled?: boolean
  buttonText?: string
  showSecurityBadge?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StickyCheckoutFooter({
  total,
  currencySymbol = '$',
  onPlaceOrder,
  isProcessing = false,
  isDisabled = false,
  buttonText = 'Place Order',
  showSecurityBadge = true,
  className,
}: StickyCheckoutFooterProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-background border-t shadow-lg',
        'px-4 pt-3',
        className
      )}
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Security badge */}
      {showSecurityBadge && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure checkout</span>
        </div>
      )}

      {/* Total and button */}
      <div className="flex items-center gap-4">
        {/* Total */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold">
            {currencySymbol}{total.toFixed(2)}
          </p>
        </div>

        {/* Place order button */}
        <Button
          size="lg"
          onClick={onPlaceOrder}
          disabled={isDisabled || isProcessing}
          className={cn(
            'flex-1 max-w-[200px]',
            'min-h-[52px] text-base font-semibold'
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

export default StickyCheckoutFooter
```

---

### Task 31.11: Create MobileCheckoutPage Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileCheckoutPage.tsx`
**Action**: Create

**Description**: Main mobile checkout layout combining all components

```typescript
/**
 * MobileCheckoutPage - Complete mobile checkout experience
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Single-page scrolling checkout with collapsible sections,
 * touch-optimized forms, and sticky checkout button.
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useStorefrontCart } from '../../../hooks/useStorefrontCart'
import { useCheckout } from '../../../hooks/useCheckout'
import { useMobile, usePrefersReducedMotion } from '../../../hooks/useMobile'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// Import mobile components
import { MobileCheckoutProgress, type CheckoutStep } from './MobileCheckoutProgress'
import { CollapsibleSection, type SectionStatus } from './CollapsibleSection'
import { MobileInput } from './MobileInput'
import { MobileAddressInput, type AddressData, type AddressErrors } from './MobileAddressInput'
import { MobilePaymentSelector, type PaymentMethod } from './MobilePaymentSelector'
import { MobileShippingSelector, type ShippingOption } from './MobileShippingSelector'
import { MobileOrderReview } from './MobileOrderReview'
import { StickyCheckoutFooter } from './StickyCheckoutFooter'

// ============================================================================
// TYPES
// ============================================================================

interface MobileCheckoutPageProps {
  siteId: string
  userId?: string
  onBack?: () => void
  onComplete?: (orderId: string) => void
  className?: string
}

type OpenSection = 'contact' | 'shipping' | 'delivery' | 'payment' | null

// ============================================================================
// MOCK SHIPPING OPTIONS
// ============================================================================

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered by local courier',
    price: 5.99,
    estimatedDays: '5-7 business days',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Priority delivery',
    price: 12.99,
    estimatedDays: '2-3 business days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day',
    price: 24.99,
    estimatedDays: '1 business day',
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileCheckoutPage({
  siteId,
  userId,
  onBack,
  onComplete,
  className,
}: MobileCheckoutPageProps) {
  const isMobile = useMobile()
  const prefersReducedMotion = usePrefersReducedMotion()
  const haptic = useHapticFeedback()

  // Cart data
  const { cart, totals, isLoading: cartLoading } = useStorefrontCart(siteId, userId)

  // Checkout state from hook
  const {
    step,
    shippingAddress,
    setShippingAddress,
    paymentMethod,
    setPaymentMethod,
    placeOrder,
    isProcessing,
  } = useCheckout(siteId)

  // Local state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<OpenSection>('contact')
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([])

  // Current checkout step for progress indicator
  const currentStep = useMemo((): CheckoutStep => {
    if (!email) return 'contact'
    if (!shippingAddress?.address1) return 'shipping'
    if (!paymentMethod) return 'payment'
    return 'review'
  }, [email, shippingAddress, paymentMethod])

  // Calculate section statuses
  const getSectionStatus = useCallback((section: OpenSection): SectionStatus => {
    if (openSection === section) return 'active'
    
    switch (section) {
      case 'contact':
        return email ? 'complete' : 'pending'
      case 'shipping':
        return shippingAddress?.address1 ? 'complete' : 'pending'
      case 'delivery':
        return selectedShipping ? 'complete' : 'pending'
      case 'payment':
        return paymentMethod ? 'complete' : 'pending'
      default:
        return 'pending'
    }
  }, [openSection, email, shippingAddress, selectedShipping, paymentMethod])

  // Toggle section
  const toggleSection = useCallback((section: OpenSection) => {
    setOpenSection((prev) => (prev === section ? null : section))
  }, [])

  // Validate email
  const validateEmail = useCallback((value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email')
      return false
    }
    setEmailError(undefined)
    return true
  }, [])

  // Handle email submit
  const handleEmailContinue = useCallback(() => {
    if (validateEmail(email)) {
      haptic.trigger('success')
      setCompletedSteps((prev) => [...prev.filter((s) => s !== 'contact'), 'contact'])
      setOpenSection('shipping')
    }
  }, [email, validateEmail, haptic])

  // Validate address
  const validateAddress = useCallback((address: AddressData): boolean => {
    const errors: AddressErrors = {}
    
    if (!address.firstName) errors.firstName = 'First name is required'
    if (!address.lastName) errors.lastName = 'Last name is required'
    if (!address.address1) errors.address1 = 'Address is required'
    if (!address.city) errors.city = 'City is required'
    if (!address.country) errors.country = 'Country is required'
    if (!address.phone) errors.phone = 'Phone is required'
    
    setAddressErrors(errors)
    return Object.keys(errors).length === 0
  }, [])

  // Handle address submit
  const handleAddressContinue = useCallback(() => {
    if (shippingAddress && validateAddress(shippingAddress)) {
      haptic.trigger('success')
      setCompletedSteps((prev) => [...prev.filter((s) => s !== 'shipping'), 'shipping'])
      setOpenSection('delivery')
    }
  }, [shippingAddress, validateAddress, haptic])

  // Handle shipping selection
  const handleShippingSelect = useCallback((id: string) => {
    setSelectedShipping(id)
    haptic.trigger('success')
    setOpenSection('payment')
  }, [haptic])

  // Handle payment selection
  const handlePaymentSelect = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method)
    haptic.trigger('success')
    setCompletedSteps((prev) => [...prev.filter((s) => s !== 'payment'), 'payment'])
    setOpenSection(null) // Close all, ready for review
  }, [setPaymentMethod, haptic])

  // Handle place order
  const handlePlaceOrder = useCallback(async () => {
    try {
      haptic.trigger('medium')
      const orderId = await placeOrder()
      if (orderId) {
        haptic.trigger('success')
        onComplete?.(orderId)
      }
    } catch (error) {
      haptic.trigger('error')
      console.error('Order failed:', error)
    }
  }, [placeOrder, haptic, onComplete])

  // Check if ready to place order
  const canPlaceOrder = useMemo(() => {
    return (
      email &&
      shippingAddress?.address1 &&
      selectedShipping &&
      paymentMethod &&
      !isProcessing
    )
  }, [email, shippingAddress, selectedShipping, paymentMethod, isProcessing])

  // Loading state
  if (cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Empty cart
  if (!cart?.items?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-lg font-medium mb-4">Your cart is empty</p>
        <Button onClick={onBack}>Continue Shopping</Button>
      </div>
    )
  }

  // Calculate total with shipping
  const shippingCost = selectedShipping
    ? SHIPPING_OPTIONS.find((o) => o.id === selectedShipping)?.price || 0
    : 0
  const finalTotal = (totals?.total || 0) + shippingCost

  return (
    <div className={cn('min-h-screen bg-muted/30 pb-36', className)}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-semibold text-lg">Checkout</h1>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-3">
          <MobileCheckoutProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            variant="segments"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-4">
        {/* Order Summary (collapsible) */}
        <MobileOrderReview
          items={cart.items}
          totals={{ ...totals!, shipping: shippingCost, total: finalTotal }}
        />

        {/* Contact Information */}
        <CollapsibleSection
          title="Contact"
          subtitle={email || undefined}
          status={getSectionStatus('contact')}
          isOpen={openSection === 'contact'}
          onToggle={() => toggleSection('contact')}
        >
          <div className="space-y-4">
            <MobileInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              required
              autoComplete="email"
              inputMode="email"
              placeholder="your@email.com"
              leftIcon={<Mail className="h-5 w-5" />}
            />
            <Button
              onClick={handleEmailContinue}
              className="w-full min-h-[48px]"
            >
              Continue to Shipping
            </Button>
          </div>
        </CollapsibleSection>

        {/* Shipping Address */}
        <CollapsibleSection
          title="Shipping Address"
          subtitle={
            shippingAddress?.address1
              ? `${shippingAddress.address1}, ${shippingAddress.city}`
              : undefined
          }
          status={getSectionStatus('shipping')}
          isOpen={openSection === 'shipping'}
          onToggle={() => toggleSection('shipping')}
          disabled={!email}
        >
          <div className="space-y-4">
            <MobileAddressInput
              address={shippingAddress || {
                firstName: '',
                lastName: '',
                address1: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'KE',
                phone: '',
              }}
              onChange={(addr) => setShippingAddress(addr)}
              errors={addressErrors}
              showPhone
              type="shipping"
            />
            <Button
              onClick={handleAddressContinue}
              className="w-full min-h-[48px]"
            >
              Continue to Delivery
            </Button>
          </div>
        </CollapsibleSection>

        {/* Delivery Method */}
        <CollapsibleSection
          title="Delivery Method"
          subtitle={
            selectedShipping
              ? SHIPPING_OPTIONS.find((o) => o.id === selectedShipping)?.name
              : undefined
          }
          status={getSectionStatus('delivery')}
          isOpen={openSection === 'delivery'}
          onToggle={() => toggleSection('delivery')}
          disabled={!shippingAddress?.address1}
        >
          <MobileShippingSelector
            options={SHIPPING_OPTIONS}
            selectedId={selectedShipping}
            onSelect={handleShippingSelect}
          />
        </CollapsibleSection>

        {/* Payment Method */}
        <CollapsibleSection
          title="Payment"
          subtitle={
            paymentMethod
              ? paymentMethod === 'card'
                ? 'Credit/Debit Card'
                : paymentMethod === 'mobile_money'
                ? 'Mobile Money'
                : 'Bank Transfer'
              : undefined
          }
          status={getSectionStatus('payment')}
          isOpen={openSection === 'payment'}
          onToggle={() => toggleSection('payment')}
          disabled={!selectedShipping}
        >
          <MobilePaymentSelector
            selectedMethod={paymentMethod as PaymentMethod | null}
            onMethodSelect={handlePaymentSelect}
            availableMethods={['card', 'mobile_money', 'bank_transfer']}
          />
        </CollapsibleSection>
      </div>

      {/* Sticky Footer */}
      <StickyCheckoutFooter
        total={finalTotal}
        onPlaceOrder={handlePlaceOrder}
        isProcessing={isProcessing}
        isDisabled={!canPlaceOrder}
      />
    </div>
  )
}

export default MobileCheckoutPage
```

---

### Task 31.12: Update Mobile Components Index

**File**: `src/modules/ecommerce/studio/components/mobile/index.ts`
**Action**: Modify

**Description**: Add exports for all checkout components

Add these exports to the existing index file:

```typescript
/**
 * Mobile Components Index
 * 
 * Phase ECOM-30 & ECOM-31: Mobile Cart & Checkout
 * 
 * Exports all mobile-optimized e-commerce components.
 */

// === PHASE ECOM-30: Mobile Cart ===

// Bottom Sheet Cart
export { MobileCartBottomSheet } from './MobileCartBottomSheet'
export { default as MobileCartBottomSheetDefault } from './MobileCartBottomSheet'

// Floating Cart Button
export { MobileCartButton } from './MobileCartButton'
export { default as MobileCartButtonDefault } from './MobileCartButton'

// Swipeable Cart Item
export { SwipeableCartItem } from './SwipeableCartItem'
export { default as SwipeableCartItemDefault } from './SwipeableCartItem'

// Mobile Quantity Selector
export { MobileQuantitySelector } from './MobileQuantitySelector'
export { default as MobileQuantitySelectorDefault } from './MobileQuantitySelector'

// Cart Notification
export { 
  CartNotification, 
  useCartNotification,
  type CartNotificationData 
} from './CartNotification'
export { default as CartNotificationDefault } from './CartNotification'

// === PHASE ECOM-31: Mobile Checkout ===

// Form Components
export { MobileInput, type MobileInputProps } from './MobileInput'
export { MobileSelect, type MobileSelectProps, type MobileSelectOption } from './MobileSelect'

// Address Input
export { 
  MobileAddressInput, 
  type AddressData, 
  type AddressErrors,
  type MobileAddressInputProps 
} from './MobileAddressInput'

// Payment Selector
export { 
  MobilePaymentSelector, 
  type PaymentMethod,
  type PaymentOption,
  type MobilePaymentSelectorProps 
} from './MobilePaymentSelector'

// Shipping Selector
export { 
  MobileShippingSelector, 
  type ShippingOption,
  type MobileShippingSelectorProps 
} from './MobileShippingSelector'

// Checkout Progress
export { 
  MobileCheckoutProgress, 
  type CheckoutStep,
  type CheckoutStepConfig,
  type MobileCheckoutProgressProps 
} from './MobileCheckoutProgress'

// Collapsible Section
export { 
  CollapsibleSection, 
  type SectionStatus,
  type CollapsibleSectionProps 
} from './CollapsibleSection'

// Order Review
export { MobileOrderReview, type MobileOrderReviewProps } from './MobileOrderReview'

// Sticky Footer
export { StickyCheckoutFooter, type StickyCheckoutFooterProps } from './StickyCheckoutFooter'

// Main Checkout Page
export { MobileCheckoutPage } from './MobileCheckoutPage'
export { default as MobileCheckoutPageDefault } from './MobileCheckoutPage'
```

---

### Task 31.13: Update Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

Add the new keyboard visibility hook export:

```typescript
// Add to existing exports:

export {
  useKeyboardVisible,
  useAutoScrollOnFocus,
  type KeyboardState,
  type UseKeyboardVisibleReturn,
} from './useKeyboardVisible'
```

---

## ✅ Testing Checklist

### TypeScript Compilation
- [ ] Run `npx tsc --noEmit` - must pass with zero errors

### Mobile Device Testing
- [ ] Test on physical iPhone (Safari)
- [ ] Test on physical Android (Chrome)
- [ ] Test keyboard behavior (fields scroll into view)
- [ ] Test autofill (email, address, card)

### Form Testing
- [ ] All inputs have 48px+ height
- [ ] Country select opens native picker
- [ ] Phone field uses tel keyboard
- [ ] Email field uses email keyboard
- [ ] Error states visible without obscuring field

### Checkout Flow Testing
- [ ] Progress indicator updates correctly
- [ ] Sections collapse/expand smoothly
- [ ] Can complete checkout in <3 minutes
- [ ] Place order button respects safe area

### Accessibility Testing
- [ ] Screen reader navigates all sections
- [ ] Form labels are associated correctly
- [ ] Required fields are announced
- [ ] Error messages are announced

### Performance Testing
- [ ] Smooth accordion animations
- [ ] No layout shifts during typing
- [ ] Keyboard doesn't cause jank

---

## 🔄 Rollback Plan

If issues occur:

1. **Delete new files:**
   ```
   hooks/useKeyboardVisible.ts
   studio/components/mobile/MobileCheckoutPage.tsx
   studio/components/mobile/MobileAddressInput.tsx
   studio/components/mobile/MobilePaymentSelector.tsx
   studio/components/mobile/MobileShippingSelector.tsx
   studio/components/mobile/MobileCheckoutProgress.tsx
   studio/components/mobile/MobileOrderReview.tsx
   studio/components/mobile/CollapsibleSection.tsx
   studio/components/mobile/StickyCheckoutFooter.tsx
   studio/components/mobile/MobileInput.tsx
   studio/components/mobile/MobileSelect.tsx
   ```

2. **Revert index files** to ECOM-30 state

3. **Wave 3 desktop checkout remains functional**

4. **No database migration required**

---

## 📝 Memory Bank Updates

After completion, update these files:

### activeContext.md
```markdown
## Latest Session Update (ECOM-31 Complete - [DATE])

### Completed: PHASE-ECOM-31 Mobile Checkout Flow

#### Files Created:
- `hooks/useKeyboardVisible.ts` - Keyboard detection hook
- `studio/components/mobile/MobileInput.tsx` - Touch-optimized input
- `studio/components/mobile/MobileSelect.tsx` - Native select wrapper
- `studio/components/mobile/CollapsibleSection.tsx` - Accordion section
- `studio/components/mobile/MobileCheckoutProgress.tsx` - Progress indicator
- `studio/components/mobile/MobileAddressInput.tsx` - Address form
- `studio/components/mobile/MobilePaymentSelector.tsx` - Payment selection
- `studio/components/mobile/MobileShippingSelector.tsx` - Shipping selection
- `studio/components/mobile/MobileOrderReview.tsx` - Order summary
- `studio/components/mobile/StickyCheckoutFooter.tsx` - Fixed CTA
- `studio/components/mobile/MobileCheckoutPage.tsx` - Main checkout

#### Files Modified:
- `hooks/index.ts` - Added useKeyboardVisible export
- `studio/components/mobile/index.ts` - Added checkout exports
```

### progress.md
```markdown
## 📋 E-COMMERCE WAVE 4 IN PROGRESS

| Phase | Title | Priority | Status |
|-------|-------|----------|--------|
| ECOM-30 | Mobile Cart Experience | 🟠 HIGH | ✅ Complete |
| ECOM-31 | Mobile Checkout Flow | 🟠 HIGH | ✅ Complete |
| ECOM-32 | Mobile Product Experience | 🟠 HIGH | 📋 Ready |
```

---

## ✨ Success Criteria

- [ ] `useKeyboardVisible` detects mobile keyboard state
- [ ] All form inputs are 48px+ height
- [ ] `MobileInput` scrolls into view on focus
- [ ] `MobileSelect` uses native picker on mobile
- [ ] `CollapsibleSection` animates smoothly
- [ ] `MobileCheckoutProgress` shows correct state
- [ ] `MobileAddressInput` has proper autocomplete
- [ ] `MobilePaymentSelector` has 44px+ touch targets
- [ ] `MobileShippingSelector` shows delivery estimates
- [ ] `MobileOrderReview` expands/collapses smoothly
- [ ] `StickyCheckoutFooter` respects safe area
- [ ] `MobileCheckoutPage` completes in <3 minutes
- [ ] TypeScript compiles with zero errors

---

**END OF PHASE-ECOM-31**
