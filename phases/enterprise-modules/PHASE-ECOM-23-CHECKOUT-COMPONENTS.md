# PHASE-ECOM-23: Checkout Components

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 10-12 hours
> **Prerequisites**: PHASE-ECOM-20 (Core Hooks), PHASE-ECOM-22 (Cart Components)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create comprehensive checkout components for the Studio editor including multi-step checkout flow, shipping address forms, payment method selection, order review, and confirmation pages. These components integrate with the existing cart and payment systems.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-20 hooks are implemented
- [ ] PHASE-ECOM-22 cart components are complete
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing StorefrontWidget.tsx checkout patterns
- [ ] Review payment gateway integrations
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Checkout Components
├── CheckoutPageBlock         → Complete checkout page (Studio)
├── CheckoutStepsBlock        → Multi-step indicator (Studio)
├── ShippingAddressForm       → Address collection
├── BillingAddressForm        → Billing address (with same-as-shipping)
├── ShippingMethodSelector    → Shipping options
├── PaymentMethodSelector     → Payment method selection
├── OrderReviewSection        → Order summary before payment
├── OrderConfirmationBlock    → Post-purchase confirmation (Studio)
├── CheckoutSummary           → Sidebar order summary
└── GuestCheckoutPrompt       → Guest/login choice

Checkout Flow
[Cart] → [Info] → [Shipping] → [Payment] → [Review] → [Confirm]
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `studio/blocks/ecommerce/checkout-page-block.tsx` | Create | Full checkout page |
| `studio/blocks/ecommerce/checkout-steps-block.tsx` | Create | Step indicator |
| `studio/blocks/ecommerce/order-confirmation-block.tsx` | Create | Confirmation page |
| `studio/components/ecommerce/ShippingAddressForm.tsx` | Create | Shipping form |
| `studio/components/ecommerce/BillingAddressForm.tsx` | Create | Billing form |
| `studio/components/ecommerce/ShippingMethodSelector.tsx` | Create | Shipping selection |
| `studio/components/ecommerce/PaymentMethodSelector.tsx` | Create | Payment selection |
| `studio/components/ecommerce/OrderReviewSection.tsx` | Create | Order review |
| `studio/components/ecommerce/CheckoutSummary.tsx` | Create | Order summary sidebar |
| `studio/components/ecommerce/GuestCheckoutPrompt.tsx` | Create | Guest checkout |
| `modules/ecommerce/hooks/useCheckout.ts` | Create | Checkout state hook |
| `studio/blocks/ecommerce/index.ts` | Modify | Export checkout blocks |

---

## 📋 Implementation Tasks

### Task 23.1: Create useCheckout Hook

**File**: `src/modules/ecommerce/hooks/useCheckout.ts`
**Action**: Create

**Description**: Hook for managing checkout state and flow

```typescript
/**
 * useCheckout - Checkout state management hook
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Manages checkout flow state, validation, and order submission.
 */
'use client'

import { useState, useCallback, useMemo } from 'react'
import { 
  createOrder, 
  processPayment,
  getShippingMethods,
  calculateShipping
} from '../actions/ecommerce-actions'
import type { 
  Cart,
  CartTotals,
  Order,
  ShippingAddress,
  BillingAddress,
  ShippingMethod,
  PaymentMethod
} from '../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export type CheckoutStep = 'information' | 'shipping' | 'payment' | 'review' | 'confirmation'

export interface CheckoutState {
  step: CheckoutStep
  email: string
  phone: string
  shippingAddress: ShippingAddress | null
  billingAddress: BillingAddress | null
  sameAsShipping: boolean
  shippingMethod: ShippingMethod | null
  paymentMethod: PaymentMethod | null
  notes: string
  acceptedTerms: boolean
}

export interface CheckoutResult {
  // State
  state: CheckoutState
  steps: CheckoutStep[]
  currentStepIndex: number
  isFirstStep: boolean
  isLastStep: boolean
  
  // Available options
  shippingMethods: ShippingMethod[]
  isLoadingShipping: boolean
  
  // Calculated values
  shippingCost: number
  canProceed: boolean
  
  // Actions
  setStep: (step: CheckoutStep) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
  
  // Form updates
  setEmail: (email: string) => void
  setPhone: (phone: string) => void
  setShippingAddress: (address: ShippingAddress) => void
  setBillingAddress: (address: BillingAddress | null) => void
  setSameAsShipping: (same: boolean) => void
  setShippingMethod: (method: ShippingMethod) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setNotes: (notes: string) => void
  setAcceptedTerms: (accepted: boolean) => void
  
  // Submit
  submitOrder: () => Promise<{ success: boolean; order?: Order; error?: string }>
  isSubmitting: boolean
  error: string | null
}

// ============================================================================
// VALIDATION
// ============================================================================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isAddressComplete(address: ShippingAddress | BillingAddress | null): boolean {
  if (!address) return false
  return !!(
    address.first_name &&
    address.last_name &&
    address.address_line1 &&
    address.city &&
    address.country
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useCheckout(
  siteId: string,
  cart: Cart | null,
  totals: CartTotals | null,
  userId?: string
): CheckoutResult {
  const steps: CheckoutStep[] = ['information', 'shipping', 'payment', 'review', 'confirmation']

  const [state, setState] = useState<CheckoutState>({
    step: 'information',
    email: '',
    phone: '',
    shippingAddress: null,
    billingAddress: null,
    sameAsShipping: true,
    shippingMethod: null,
    paymentMethod: null,
    notes: '',
    acceptedTerms: false
  })

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentStepIndex = steps.indexOf(state.step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = state.step === 'review'

  // Calculate shipping cost
  const shippingCost = useMemo(() => {
    return state.shippingMethod?.price || 0
  }, [state.shippingMethod])

  // Validate current step
  const canProceed = useMemo(() => {
    switch (state.step) {
      case 'information':
        return isValidEmail(state.email) && isAddressComplete(state.shippingAddress)
      case 'shipping':
        return !!state.shippingMethod
      case 'payment':
        return !!state.paymentMethod
      case 'review':
        return state.acceptedTerms
      default:
        return false
    }
  }, [state])

  // Load shipping methods when address changes
  const loadShippingMethods = useCallback(async () => {
    if (!state.shippingAddress || !siteId) return

    setIsLoadingShipping(true)
    try {
      const methods = await getShippingMethods(siteId, state.shippingAddress)
      setShippingMethods(methods)
      
      // Auto-select first method if none selected
      if (methods.length > 0 && !state.shippingMethod) {
        setState(prev => ({ ...prev, shippingMethod: methods[0] }))
      }
    } catch (err) {
      console.error('Error loading shipping methods:', err)
    } finally {
      setIsLoadingShipping(false)
    }
  }, [siteId, state.shippingAddress])

  // Navigation
  const setStep = useCallback((step: CheckoutStep) => {
    setState(prev => ({ ...prev, step }))
  }, [])

  const nextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length - 1) { // Don't auto-advance to confirmation
      setState(prev => ({ ...prev, step: steps[nextIndex] }))
    }
    
    // Load shipping methods when entering shipping step
    if (steps[nextIndex] === 'shipping') {
      loadShippingMethods()
    }
  }, [currentStepIndex, steps, loadShippingMethods])

  const prevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setState(prev => ({ ...prev, step: steps[prevIndex] }))
    }
  }, [currentStepIndex, steps])

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setState(prev => ({ ...prev, step: steps[index] }))
    }
  }, [steps])

  // Form updates
  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email }))
  }, [])

  const setPhone = useCallback((phone: string) => {
    setState(prev => ({ ...prev, phone }))
  }, [])

  const setShippingAddress = useCallback((address: ShippingAddress) => {
    setState(prev => ({ ...prev, shippingAddress: address }))
  }, [])

  const setBillingAddress = useCallback((address: BillingAddress | null) => {
    setState(prev => ({ ...prev, billingAddress: address }))
  }, [])

  const setSameAsShipping = useCallback((same: boolean) => {
    setState(prev => ({ ...prev, sameAsShipping: same }))
  }, [])

  const setShippingMethod = useCallback((method: ShippingMethod) => {
    setState(prev => ({ ...prev, shippingMethod: method }))
  }, [])

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setState(prev => ({ ...prev, paymentMethod: method }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, notes }))
  }, [])

  const setAcceptedTerms = useCallback((accepted: boolean) => {
    setState(prev => ({ ...prev, acceptedTerms: accepted }))
  }, [])

  // Submit order
  const submitOrder = useCallback(async (): Promise<{ success: boolean; order?: Order; error?: string }> => {
    if (!cart || !totals) {
      return { success: false, error: 'Cart not found' }
    }

    if (!canProceed) {
      return { success: false, error: 'Please complete all required fields' }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create order
      const orderData = {
        site_id: siteId,
        user_id: userId,
        cart_id: cart.id,
        email: state.email,
        phone: state.phone,
        shipping_address: state.shippingAddress!,
        billing_address: state.sameAsShipping 
          ? state.shippingAddress as BillingAddress
          : state.billingAddress!,
        shipping_method_id: state.shippingMethod?.id,
        shipping_cost: shippingCost,
        payment_method: state.paymentMethod?.type,
        notes: state.notes,
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        tax_total: totals.taxTotal,
        grand_total: totals.grandTotal + shippingCost
      }

      const order = await createOrder(orderData)

      // Process payment (if not COD)
      if (state.paymentMethod?.type !== 'cod') {
        const paymentResult = await processPayment(order.id, state.paymentMethod!)
        if (!paymentResult.success) {
          return { success: false, error: paymentResult.error || 'Payment failed' }
        }
      }

      // Move to confirmation
      setState(prev => ({ ...prev, step: 'confirmation' }))

      return { success: true, order }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }, [cart, totals, canProceed, siteId, userId, state, shippingCost])

  return {
    state,
    steps,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    shippingMethods,
    isLoadingShipping,
    shippingCost,
    canProceed,
    setStep,
    nextStep,
    prevStep,
    goToStep,
    setEmail,
    setPhone,
    setShippingAddress,
    setBillingAddress,
    setSameAsShipping,
    setShippingMethod,
    setPaymentMethod,
    setNotes,
    setAcceptedTerms,
    submitOrder,
    isSubmitting,
    error
  }
}
```

---

### Task 23.2: Add Checkout Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end)

**Description**: Add checkout-specific types

```typescript
// ============================================================================
// CHECKOUT TYPES (Phase ECOM-23)
// ============================================================================

export interface ShippingAddress {
  first_name: string
  last_name: string
  company?: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
  phone?: string
}

export interface BillingAddress extends ShippingAddress {}

export interface ShippingMethod {
  id: string
  name: string
  description?: string
  price: number
  estimated_days?: number
  carrier?: string
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'bank_transfer' | 'cod' | 'mobile_money'
  name: string
  description?: string
  icon?: string
  processorData?: Record<string, unknown>
}

export interface CheckoutFormData {
  email: string
  phone: string
  shippingAddress: ShippingAddress
  billingAddress?: BillingAddress
  sameAsShipping: boolean
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  notes?: string
}
```

---

### Task 23.3: Create Checkout Steps Block

**File**: `src/studio/blocks/ecommerce/checkout-steps-block.tsx`
**Action**: Create

**Description**: Visual step indicator for checkout flow

```typescript
/**
 * CheckoutStepsBlock - Step indicator for checkout
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays checkout progress with clickable steps.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, User, Truck, CreditCard, ClipboardCheck } from 'lucide-react'
import type { ResponsiveValue } from '@/types/studio'
import type { CheckoutStep } from '@/modules/ecommerce/hooks/useCheckout'

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutStepsBlockProps {
  currentStep: CheckoutStep
  onStepClick?: (step: CheckoutStep) => void
  completedSteps?: CheckoutStep[]
  variant?: ResponsiveValue<'default' | 'compact' | 'minimal'>
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_CONFIG: Record<CheckoutStep, { label: string; icon: React.ElementType }> = {
  information: { label: 'Information', icon: User },
  shipping: { label: 'Shipping', icon: Truck },
  payment: { label: 'Payment', icon: CreditCard },
  review: { label: 'Review', icon: ClipboardCheck },
  confirmation: { label: 'Done', icon: Check }
}

const STEP_ORDER: CheckoutStep[] = ['information', 'shipping', 'payment', 'review']

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutStepsBlock({
  currentStep,
  onStepClick,
  completedSteps = [],
  variant = 'default',
  className
}: CheckoutStepsBlockProps) {
  const variantValue = getResponsiveValue(variant, 'default')
  const currentIndex = STEP_ORDER.indexOf(currentStep)

  const isStepCompleted = (step: CheckoutStep) => completedSteps.includes(step)
  const isStepAccessible = (step: CheckoutStep) => {
    const stepIndex = STEP_ORDER.indexOf(step)
    return stepIndex <= currentIndex || isStepCompleted(step)
  }

  // Minimal variant - just text
  if (variantValue === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        {STEP_ORDER.map((step, index) => (
          <React.Fragment key={step}>
            {index > 0 && <span className="text-muted-foreground">/</span>}
            <button
              onClick={() => isStepAccessible(step) && onStepClick?.(step)}
              disabled={!isStepAccessible(step)}
              className={cn(
                'transition-colors',
                currentStep === step
                  ? 'font-semibold text-primary'
                  : isStepCompleted(step)
                  ? 'text-green-600 hover:text-green-700'
                  : isStepAccessible(step)
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'text-muted-foreground/50 cursor-not-allowed'
              )}
            >
              {STEP_CONFIG[step].label}
            </button>
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Compact variant
  if (variantValue === 'compact') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        {STEP_ORDER.map((step, index) => {
          const config = STEP_CONFIG[step]
          const Icon = config.icon
          const isCurrent = currentStep === step
          const isCompleted = isStepCompleted(step)
          const isAccessible = isStepAccessible(step)

          return (
            <React.Fragment key={step}>
              <button
                onClick={() => isAccessible && onStepClick?.(step)}
                disabled={!isAccessible}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-green-600',
                  !isAccessible && 'text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isCompleted && 'border-green-600 bg-green-600 text-white',
                  !isCurrent && !isCompleted && 'border-muted-foreground/30'
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {config.label}
                </span>
              </button>

              {index < STEP_ORDER.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-4',
                  index < currentIndex || isCompleted
                    ? 'bg-green-600'
                    : 'bg-muted-foreground/20'
                )} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('', className)}>
      <nav aria-label="Checkout progress">
        <ol className="flex items-center justify-between">
          {STEP_ORDER.map((step, index) => {
            const config = STEP_CONFIG[step]
            const Icon = config.icon
            const isCurrent = currentStep === step
            const isCompleted = isStepCompleted(step)
            const isAccessible = isStepAccessible(step)

            return (
              <li key={step} className="flex-1 relative">
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={cn(
                      'absolute top-5 left-0 right-1/2 h-0.5 -translate-y-1/2',
                      index <= currentIndex || isStepCompleted(STEP_ORDER[index - 1])
                        ? 'bg-primary'
                        : 'bg-muted-foreground/20'
                    )}
                  />
                )}
                {index < STEP_ORDER.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 left-1/2 right-0 h-0.5 -translate-y-1/2',
                      index < currentIndex
                        ? 'bg-primary'
                        : 'bg-muted-foreground/20'
                    )}
                  />
                )}

                {/* Step content */}
                <button
                  onClick={() => isAccessible && onStepClick?.(step)}
                  disabled={!isAccessible}
                  className={cn(
                    'relative flex flex-col items-center w-full',
                    !isAccessible && 'cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background z-10 transition-colors',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    isCompleted && 'border-green-600 bg-green-600 text-white',
                    !isCurrent && !isCompleted && 'border-muted-foreground/30'
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    'mt-2 text-sm font-medium',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-green-600',
                    !isCurrent && !isCompleted && 'text-muted-foreground'
                  )}>
                    {config.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
```

---

### Task 23.4: Create Shipping Address Form

**File**: `src/studio/components/ecommerce/ShippingAddressForm.tsx`
**Action**: Create

**Description**: Shipping address collection form

```typescript
/**
 * ShippingAddressForm - Address collection form
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Collects shipping address with validation.
 */
'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { ShippingAddress } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// VALIDATION
// ============================================================================

const addressSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional()
})

type AddressFormData = z.infer<typeof addressSchema>

// ============================================================================
// TYPES
// ============================================================================

interface ShippingAddressFormProps {
  address?: ShippingAddress | null
  onChange: (address: ShippingAddress) => void
  showPhone?: boolean
  showCompany?: boolean
  countries?: Array<{ code: string; name: string }>
  className?: string
}

// ============================================================================
// DEFAULT COUNTRIES
// ============================================================================

const DEFAULT_COUNTRIES = [
  { code: 'ZM', name: 'Zambia' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' }
]

// ============================================================================
// COMPONENT
// ============================================================================

export function ShippingAddressForm({
  address,
  onChange,
  showPhone = true,
  showCompany = true,
  countries = DEFAULT_COUNTRIES,
  className
}: ShippingAddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      first_name: address?.first_name || '',
      last_name: address?.last_name || '',
      company: address?.company || '',
      address_line1: address?.address_line1 || '',
      address_line2: address?.address_line2 || '',
      city: address?.city || '',
      state: address?.state || '',
      postal_code: address?.postal_code || '',
      country: address?.country || '',
      phone: address?.phone || ''
    }
  })

  // Watch all fields and notify parent
  const formValues = watch()
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(formValues as ShippingAddress)
    }, 300)
    return () => clearTimeout(timeout)
  }, [formValues, onChange])

  return (
    <form className={cn('space-y-4', className)}>
      {/* Name Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name *</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            placeholder="John"
            className={cn(errors.first_name && 'border-destructive')}
          />
          {errors.first_name && (
            <p className="text-xs text-destructive">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name *</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            placeholder="Doe"
            className={cn(errors.last_name && 'border-destructive')}
          />
          {errors.last_name && (
            <p className="text-xs text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Company */}
      {showCompany && (
        <div className="space-y-2">
          <Label htmlFor="company">Company (optional)</Label>
          <Input
            id="company"
            {...register('company')}
            placeholder="Company name"
          />
        </div>
      )}

      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="address_line1">Address *</Label>
        <Input
          id="address_line1"
          {...register('address_line1')}
          placeholder="123 Main Street"
          className={cn(errors.address_line1 && 'border-destructive')}
        />
        {errors.address_line1 && (
          <p className="text-xs text-destructive">{errors.address_line1.message}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="address_line2">Apartment, suite, etc. (optional)</Label>
        <Input
          id="address_line2"
          {...register('address_line2')}
          placeholder="Apt 4B"
        />
      </div>

      {/* City, State, Postal */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Lusaka"
            className={cn(errors.city && 'border-destructive')}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code</Label>
          <Input
            id="postal_code"
            {...register('postal_code')}
            placeholder="10101"
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <Select
          value={formValues.country}
          onValueChange={(value) => setValue('country', value)}
        >
          <SelectTrigger className={cn(errors.country && 'border-destructive')}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && (
          <p className="text-xs text-destructive">{errors.country.message}</p>
        )}
      </div>

      {/* Phone */}
      {showPhone && (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="+260 97X XXX XXX"
          />
        </div>
      )}
    </form>
  )
}
```

---

### Task 23.5: Create Shipping Method Selector

**File**: `src/studio/components/ecommerce/ShippingMethodSelector.tsx`
**Action**: Create

**Description**: Shipping method selection component

```typescript
/**
 * ShippingMethodSelector - Shipping options selection
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays available shipping methods for selection.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Truck, Clock, Loader2 } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { ShippingMethod } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[]
  selected: ShippingMethod | null
  onSelect: (method: ShippingMethod) => void
  isLoading?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShippingMethodSelector({
  methods,
  selected,
  onSelect,
  isLoading = false,
  className
}: ShippingMethodSelectorProps) {
  const { formatPrice } = useStorefront()

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading shipping options...</span>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed p-6 text-center', className)}>
        <Truck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          No shipping methods available for this address.
        </p>
      </div>
    )
  }

  return (
    <RadioGroup
      value={selected?.id || ''}
      onValueChange={(value) => {
        const method = methods.find(m => m.id === value)
        if (method) onSelect(method)
      }}
      className={cn('space-y-3', className)}
    >
      {methods.map((method) => (
        <Label
          key={method.id}
          htmlFor={method.id}
          className={cn(
            'flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors',
            selected?.id === method.id
              ? 'border-primary bg-primary/5'
              : 'hover:border-muted-foreground/50'
          )}
        >
          <div className="flex items-center gap-4">
            <RadioGroupItem value={method.id} id={method.id} />
            <div>
              <p className="font-medium">{method.name}</p>
              {method.description && (
                <p className="text-sm text-muted-foreground">{method.description}</p>
              )}
              {method.estimated_days && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {method.estimated_days} business days
                </p>
              )}
            </div>
          </div>
          <span className="font-semibold">
            {method.price === 0 ? 'Free' : formatPrice(method.price)}
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}
```

---

### Task 23.6: Create Payment Method Selector

**File**: `src/studio/components/ecommerce/PaymentMethodSelector.tsx`
**Action**: Create

**Description**: Payment method selection component

```typescript
/**
 * PaymentMethodSelector - Payment method selection
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays available payment methods for selection.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  Truck, 
  Smartphone,
  Lock
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { PaymentMethod } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  className?: string
}

// ============================================================================
// ICONS MAP
// ============================================================================

const PAYMENT_ICONS: Record<PaymentMethod['type'], React.ElementType> = {
  card: CreditCard,
  paypal: Wallet,
  bank_transfer: Building2,
  cod: Truck,
  mobile_money: Smartphone
}

// ============================================================================
// DEFAULT METHODS
// ============================================================================

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    type: 'card',
    name: 'Credit / Debit Card',
    description: 'Pay securely with your card'
  },
  {
    type: 'mobile_money',
    name: 'Mobile Money',
    description: 'MTN, Airtel Money, Zamtel'
  },
  {
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer'
  },
  {
    type: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order'
  }
]

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentMethodSelector({
  methods = DEFAULT_PAYMENT_METHODS,
  selected,
  onSelect,
  className
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <RadioGroup
        value={selected?.type || ''}
        onValueChange={(value) => {
          const method = methods.find(m => m.type === value)
          if (method) onSelect(method)
        }}
        className="space-y-3"
      >
        {methods.map((method) => {
          const Icon = PAYMENT_ICONS[method.type] || CreditCard

          return (
            <Label
              key={method.type}
              htmlFor={method.type}
              className={cn(
                'flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors',
                selected?.type === method.type
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value={method.type} id={method.type} />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{method.name}</p>
                {method.description && (
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                )}
              </div>
            </Label>
          )
        })}
      </RadioGroup>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Your payment information is encrypted and secure</span>
      </div>
    </div>
  )
}
```

---

### Task 23.7: Create Order Review Section

**File**: `src/studio/components/ecommerce/OrderReviewSection.tsx`
**Action**: Create

**Description**: Order review before final submission

```typescript
/**
 * OrderReviewSection - Order review before payment
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays complete order details for review.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { MapPin, Truck, CreditCard, FileText, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CartItemCard } from './CartItemCard'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { 
  CartItem, 
  ShippingAddress, 
  ShippingMethod, 
  PaymentMethod 
} from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderReviewSectionProps {
  items: CartItem[]
  email: string
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress | null
  sameAsShipping: boolean
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  notes: string
  acceptedTerms: boolean
  onNotesChange: (notes: string) => void
  onAcceptTermsChange: (accepted: boolean) => void
  onEditStep: (step: string) => void
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderReviewSection({
  items,
  email,
  shippingAddress,
  billingAddress,
  sameAsShipping,
  shippingMethod,
  paymentMethod,
  notes,
  acceptedTerms,
  onNotesChange,
  onAcceptTermsChange,
  onEditStep,
  className
}: OrderReviewSectionProps) {
  const { formatPrice } = useStorefront()

  const formatAddress = (address: ShippingAddress) => {
    const parts = [
      `${address.first_name} ${address.last_name}`,
      address.company,
      address.address_line1,
      address.address_line2,
      `${address.city}${address.state ? `, ${address.state}` : ''}${address.postal_code ? ` ${address.postal_code}` : ''}`,
      address.country
    ].filter(Boolean)
    return parts
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Contact & Shipping */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Contact & Shipping
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditStep('information')}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{email}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Ship to</p>
            {formatAddress(shippingAddress).map((line, i) => (
              <p key={i} className={i === 0 ? 'font-medium' : ''}>{line}</p>
            ))}
          </div>
          {!sameAsShipping && billingAddress && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Bill to</p>
                {formatAddress(billingAddress).map((line, i) => (
                  <p key={i} className={i === 0 ? 'font-medium' : ''}>{line}</p>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipping Method */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Shipping Method
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditStep('shipping')}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{shippingMethod.name}</p>
              {shippingMethod.estimated_days && (
                <p className="text-sm text-muted-foreground">
                  {shippingMethod.estimated_days} business days
                </p>
              )}
            </div>
            <span className="font-semibold">
              {shippingMethod.price === 0 ? 'Free' : formatPrice(shippingMethod.price)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditStep('payment')}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{paymentMethod.name}</p>
          {paymentMethod.description && (
            <p className="text-sm text-muted-foreground">{paymentMethod.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Order Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.map(item => (
            <CartItemCard
              key={item.id}
              item={item}
              variant="minimal"
              onUpdateQuantity={() => Promise.resolve(false)}
              onRemove={() => Promise.resolve(false)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Order Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Special instructions for your order..."
          rows={3}
        />
      </div>

      {/* Terms Acceptance */}
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => onAcceptTermsChange(!!checked)}
        />
        <Label htmlFor="terms" className="text-sm leading-normal cursor-pointer">
          I agree to the{' '}
          <a href="/terms" className="text-primary hover:underline" target="_blank">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:underline" target="_blank">
            Privacy Policy
          </a>
          . I understand that my order cannot be cancelled once placed.
        </Label>
      </div>
    </div>
  )
}
```

---

### Task 23.8: Create Checkout Summary

**File**: `src/studio/components/ecommerce/CheckoutSummary.tsx`
**Action**: Create

**Description**: Sidebar order summary for checkout

```typescript
/**
 * CheckoutSummary - Order summary sidebar
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays order summary during checkout.
 */
'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { CartItem, CartTotals, Discount } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutSummaryProps {
  items: CartItem[]
  totals: CartTotals | null
  shippingCost?: number
  discount?: Discount | null
  showItems?: boolean
  collapsible?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutSummary({
  items,
  totals,
  shippingCost = 0,
  discount,
  showItems = true,
  collapsible = false,
  className
}: CheckoutSummaryProps) {
  const { formatPrice } = useStorefront()
  const [isOpen, setIsOpen] = React.useState(!collapsible)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const grandTotal = (totals?.grandTotal || 0) + shippingCost

  const content = (
    <>
      {/* Items */}
      {showItems && (
        <>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 rounded border bg-muted">
                  {item.product_image ? (
                    <Image
                      src={item.product_image}
                      alt={item.product_name || 'Product'}
                      fill
                      className="object-cover rounded"
                      sizes="64px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {item.quantity}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {item.product_name || 'Product'}
                  </p>
                  {item.variant_name && (
                    <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {formatPrice(item.line_total || item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
        </>
      )}

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(totals?.subtotal || 0)}</span>
        </div>

        {discount && totals && totals.discountTotal > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({discount.code})</span>
            <span>-{formatPrice(totals.discountTotal)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shippingCost === 0 ? 'Calculated next' : formatPrice(shippingCost)}
          </span>
        </div>

        {totals && totals.taxTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(totals.taxTotal)}</span>
          </div>
        )}

        <Separator className="my-2" />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </div>
    </>
  )

  if (collapsible) {
    return (
      <Card className={className}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  Order Summary
                  <span className="text-muted-foreground font-normal">
                    ({itemCount} items)
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatPrice(grandTotal)}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>{content}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">
          Order Summary ({itemCount} items)
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
```

---

### Task 23.9: Create Checkout Page Block

**File**: `src/studio/blocks/ecommerce/checkout-page-block.tsx`
**Action**: Create

**Description**: Complete multi-step checkout page

```typescript
/**
 * CheckoutPageBlock - Complete checkout page
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Multi-step checkout flow with all components.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckoutStepsBlock } from './checkout-steps-block'
import { ShippingAddressForm } from '@/studio/components/ecommerce/ShippingAddressForm'
import { ShippingMethodSelector } from '@/studio/components/ecommerce/ShippingMethodSelector'
import { PaymentMethodSelector, DEFAULT_PAYMENT_METHODS } from '@/studio/components/ecommerce/PaymentMethodSelector'
import { OrderReviewSection } from '@/studio/components/ecommerce/OrderReviewSection'
import { CheckoutSummary } from '@/studio/components/ecommerce/CheckoutSummary'
import { CartEmptyState } from '@/studio/components/ecommerce/CartEmptyState'
import { useStorefrontCart } from '@/modules/ecommerce/hooks'
import { useCheckout } from '@/modules/ecommerce/hooks/useCheckout'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface CheckoutPageBlockProps extends StudioBlockProps {
  // Layout
  layout?: ResponsiveValue<'side-by-side' | 'stacked'>
  stepsVariant?: ResponsiveValue<'default' | 'compact' | 'minimal'>
  
  // Content
  title?: string
  
  // URLs
  cartUrl?: string
  shopUrl?: string
  confirmationUrl?: string
  termsUrl?: string
  privacyUrl?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutPageBlock({
  layout = { mobile: 'stacked', desktop: 'side-by-side' },
  stepsVariant = 'default',
  title = 'Checkout',
  cartUrl = '/cart',
  shopUrl = '/shop',
  confirmationUrl = '/order-confirmation',
  className,
  __studioMeta
}: CheckoutPageBlockProps) {
  const { siteId } = useStorefront()
  const { cart, items, totals, isLoading: isCartLoading } = useStorefrontCart(siteId)
  
  const checkout = useCheckout(siteId, cart, totals)
  const layoutValue = getResponsiveValue(layout, 'side-by-side')

  // Empty cart
  if (!isCartLoading && items.length === 0) {
    return (
      <CartEmptyState
        title="Your cart is empty"
        description="Add items to your cart before checking out."
        continueShoppingUrl={shopUrl}
        className={className}
      />
    )
  }

  // Handle step submission
  const handleContinue = async () => {
    if (checkout.isLastStep) {
      const result = await checkout.submitOrder()
      if (result.success && result.order) {
        // Redirect to confirmation or show inline
        window.location.href = `${confirmationUrl}?order=${result.order.id}`
      }
    } else {
      checkout.nextStep()
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      </div>

      {/* Steps Indicator */}
      <CheckoutStepsBlock
        currentStep={checkout.state.step}
        onStepClick={(step) => checkout.setStep(step)}
        variant={stepsVariant}
        className="mb-8"
      />

      {/* Error Alert */}
      {checkout.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{checkout.error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className={cn(
        'grid gap-8',
        layoutValue === 'side-by-side' ? 'lg:grid-cols-3' : 'grid-cols-1'
      )}>
        {/* Form Area */}
        <div className={layoutValue === 'side-by-side' ? 'lg:col-span-2' : ''}>
          <Card>
            <CardContent className="p-6">
              {/* Information Step */}
              {checkout.state.step === 'information' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Contact Information</h2>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkout.state.email}
                        onChange={(e) => checkout.setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Shipping Address</h2>
                    <ShippingAddressForm
                      address={checkout.state.shippingAddress}
                      onChange={checkout.setShippingAddress}
                    />
                  </div>
                </div>
              )}

              {/* Shipping Step */}
              {checkout.state.step === 'shipping' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Shipping Method</h2>
                  <ShippingMethodSelector
                    methods={checkout.shippingMethods}
                    selected={checkout.state.shippingMethod}
                    onSelect={checkout.setShippingMethod}
                    isLoading={checkout.isLoadingShipping}
                  />
                </div>
              )}

              {/* Payment Step */}
              {checkout.state.step === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                  <PaymentMethodSelector
                    methods={DEFAULT_PAYMENT_METHODS}
                    selected={checkout.state.paymentMethod}
                    onSelect={checkout.setPaymentMethod}
                  />
                </div>
              )}

              {/* Review Step */}
              {checkout.state.step === 'review' && (
                <OrderReviewSection
                  items={items}
                  email={checkout.state.email}
                  shippingAddress={checkout.state.shippingAddress!}
                  billingAddress={checkout.state.billingAddress}
                  sameAsShipping={checkout.state.sameAsShipping}
                  shippingMethod={checkout.state.shippingMethod!}
                  paymentMethod={checkout.state.paymentMethod!}
                  notes={checkout.state.notes}
                  acceptedTerms={checkout.state.acceptedTerms}
                  onNotesChange={checkout.setNotes}
                  onAcceptTermsChange={checkout.setAcceptedTerms}
                  onEditStep={(step) => checkout.setStep(step as any)}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {checkout.isFirstStep ? (
              <Button variant="ghost" asChild>
                <a href={cartUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Cart
                </a>
              </Button>
            ) : (
              <Button variant="ghost" onClick={checkout.prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            <Button
              onClick={handleContinue}
              disabled={!checkout.canProceed || checkout.isSubmitting}
              size="lg"
            >
              {checkout.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : checkout.isLastStep ? (
                'Place Order'
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className={layoutValue === 'side-by-side' ? 'lg:col-span-1' : ''}>
          <div className="sticky top-4">
            <CheckoutSummary
              items={items}
              totals={totals}
              shippingCost={checkout.shippingCost}
              discount={cart?.discount}
              collapsible={layoutValue === 'stacked'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const checkoutPageBlockConfig = {
  type: 'checkout-page',
  label: 'Checkout Page',
  category: 'e-commerce',
  icon: 'CreditCard',
  defaultProps: {
    layout: { mobile: 'stacked', desktop: 'side-by-side' },
    stepsVariant: 'default',
    title: 'Checkout',
    cartUrl: '/cart',
    shopUrl: '/shop',
    confirmationUrl: '/order-confirmation'
  },
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      defaultValue: 'Checkout'
    },
    {
      name: 'layout',
      label: 'Layout',
      type: 'select',
      options: [
        { value: 'side-by-side', label: 'Side by Side' },
        { value: 'stacked', label: 'Stacked' }
      ],
      responsive: true
    },
    {
      name: 'stepsVariant',
      label: 'Steps Style',
      type: 'select',
      options: [
        { value: 'default', label: 'Full' },
        { value: 'compact', label: 'Compact' },
        { value: 'minimal', label: 'Minimal' }
      ],
      responsive: true
    },
    {
      name: 'cartUrl',
      label: 'Cart Page URL',
      type: 'text',
      defaultValue: '/cart'
    },
    {
      name: 'confirmationUrl',
      label: 'Confirmation Page URL',
      type: 'text',
      defaultValue: '/order-confirmation'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Multi-step checkout page with forms and payment',
    contextHints: ['checkout', 'payment', 'purchase', 'buy now']
  }
}
```

---

### Task 23.10: Create Order Confirmation Block

**File**: `src/studio/blocks/ecommerce/order-confirmation-block.tsx`
**Action**: Create

**Description**: Post-purchase confirmation page

```typescript
/**
 * OrderConfirmationBlock - Order confirmation page
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays order confirmation after successful purchase.
 */
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Mail, 
  Download, 
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CartItemCard } from '@/studio/components/ecommerce/CartItemCard'
import { getOrder } from '@/modules/ecommerce/actions/ecommerce-actions'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { Order } from '@/modules/ecommerce/types/ecommerce-types'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface OrderConfirmationBlockProps extends StudioBlockProps {
  // Order (can be passed or fetched from URL)
  orderId?: string
  
  // Display
  showOrderDetails?: boolean
  showItems?: boolean
  showShipping?: boolean
  showContinueShopping?: boolean
  
  // Content
  title?: string
  subtitle?: string
  continueShoppingUrl?: string
  continueShoppingText?: string
  
  // Download
  showDownloadReceipt?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderConfirmationBlock({
  orderId,
  showOrderDetails = true,
  showItems = true,
  showShipping = true,
  showContinueShopping = true,
  title = 'Thank you for your order!',
  subtitle = 'Your order has been placed successfully.',
  continueShoppingUrl = '/shop',
  continueShoppingText = 'Continue Shopping',
  showDownloadReceipt = true,
  className,
  __studioMeta
}: OrderConfirmationBlockProps) {
  const { formatPrice, siteId } = useStorefront()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get order ID from props or URL
  useEffect(() => {
    async function loadOrder() {
      const id = orderId || new URLSearchParams(window.location.search).get('order')
      
      if (!id) {
        setIsLoading(false)
        return
      }

      try {
        const orderData = await getOrder(id)
        setOrder(orderData)
      } catch (err) {
        console.error('Error loading order:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-24', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className={cn('text-center py-12', className)}>
        <h2 className="text-xl font-semibold">Order not found</h2>
        <p className="mt-2 text-muted-foreground">
          We couldn't find the order you're looking for.
        </p>
        <Button asChild className="mt-6">
          <Link href={continueShoppingUrl}>{continueShoppingText}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <p className="mt-4 text-lg">
          Order number: <span className="font-mono font-semibold">{order.order_number}</span>
        </p>
      </div>

      {/* Confirmation Email Notice */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-4">
          <Mail className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Confirmation email sent</p>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation to {order.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      {showOrderDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{order.status.replace('_', ' ')}</p>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(order.shipping_cost || 0)}</span>
              </div>
              {order.tax_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.tax_total)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.grand_total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      {showItems && order.items && order.items.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Items Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            {order.items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                variant="minimal"
                onUpdateQuantity={() => Promise.resolve(false)}
                onRemove={() => Promise.resolve(false)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shipping Address */}
      {showShipping && order.shipping_address && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping To
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {order.shipping_address.first_name} {order.shipping_address.last_name}
            </p>
            <p>{order.shipping_address.address_line1}</p>
            {order.shipping_address.address_line2 && (
              <p>{order.shipping_address.address_line2}</p>
            )}
            <p>
              {order.shipping_address.city}
              {order.shipping_address.state && `, ${order.shipping_address.state}`}
              {order.shipping_address.postal_code && ` ${order.shipping_address.postal_code}`}
            </p>
            <p>{order.shipping_address.country}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {showDownloadReceipt && (
          <Button variant="outline" asChild>
            <Link href={`/api/orders/${order.id}/receipt`}>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Link>
          </Button>
        )}
        
        {showContinueShopping && (
          <Button asChild>
            <Link href={continueShoppingUrl}>
              {continueShoppingText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const orderConfirmationBlockConfig = {
  type: 'order-confirmation',
  label: 'Order Confirmation',
  category: 'e-commerce',
  icon: 'CheckCircle',
  defaultProps: {
    showOrderDetails: true,
    showItems: true,
    showShipping: true,
    showContinueShopping: true,
    title: 'Thank you for your order!',
    subtitle: 'Your order has been placed successfully.',
    continueShoppingUrl: '/shop',
    continueShoppingText: 'Continue Shopping',
    showDownloadReceipt: true
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Thank you for your order!'
    },
    {
      name: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      defaultValue: 'Your order has been placed successfully.'
    },
    {
      name: 'showOrderDetails',
      label: 'Show Order Details',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showItems',
      label: 'Show Order Items',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showShipping',
      label: 'Show Shipping Address',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showDownloadReceipt',
      label: 'Show Download Receipt',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'continueShoppingUrl',
      label: 'Continue Shopping URL',
      type: 'text',
      defaultValue: '/shop'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Order confirmation page after successful purchase',
    contextHints: ['confirmation', 'thank you', 'order complete', 'receipt']
  }
}
```

---

### Task 23.11: Update Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

Add checkout hook export:

```typescript
export { useCheckout } from './useCheckout'
```

---

### Task 23.12: Update E-Commerce Blocks Index

**File**: `src/studio/blocks/ecommerce/index.ts`
**Action**: Modify

Add checkout block exports:

```typescript
// Checkout Blocks (Phase ECOM-23)
export { CheckoutStepsBlock } from './checkout-steps-block'
export { CheckoutPageBlock, checkoutPageBlockConfig } from './checkout-page-block'
export { OrderConfirmationBlock, orderConfirmationBlockConfig } from './order-confirmation-block'

// Checkout Utility Components
export { ShippingAddressForm } from '@/studio/components/ecommerce/ShippingAddressForm'
export { ShippingMethodSelector } from '@/studio/components/ecommerce/ShippingMethodSelector'
export { PaymentMethodSelector, DEFAULT_PAYMENT_METHODS } from '@/studio/components/ecommerce/PaymentMethodSelector'
export { OrderReviewSection } from '@/studio/components/ecommerce/OrderReviewSection'
export { CheckoutSummary } from '@/studio/components/ecommerce/CheckoutSummary'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] `useCheckout` hook manages state correctly
- [ ] `CheckoutStepsBlock` navigation works
- [ ] `ShippingAddressForm` validates input
- [ ] `ShippingMethodSelector` loads and selects methods
- [ ] `PaymentMethodSelector` displays options
- [ ] `OrderReviewSection` shows complete order
- [ ] `CheckoutSummary` calculates totals correctly
- [ ] `CheckoutPageBlock` flows through all steps
- [ ] `OrderConfirmationBlock` displays order details
- [ ] Form validation prevents invalid submissions
- [ ] All components integrate with cart hooks

---

## 🔄 Rollback Plan

If issues occur:
1. Remove checkout hook: `rm src/modules/ecommerce/hooks/useCheckout.ts`
2. Remove checkout blocks from `studio/blocks/ecommerce/`
3. Remove checkout components from `studio/components/ecommerce/`
4. Revert type additions
5. Revert index.ts changes
6. Run `npx tsc --noEmit` to verify

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add "✅ PHASE-ECOM-23: Checkout Components Complete"
- `progress.md`: Update e-commerce section with Wave 3 progress

---

## ✨ Success Criteria

- [ ] Complete checkout flow works end-to-end
- [ ] All 8 checkout components render correctly
- [ ] useCheckout hook manages all state
- [ ] Multi-step navigation works
- [ ] Form validation works
- [ ] Order submission creates order
- [ ] Confirmation page displays order
- [ ] TypeScript compiles with zero errors
