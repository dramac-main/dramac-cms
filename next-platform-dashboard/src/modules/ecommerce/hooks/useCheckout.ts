/**
 * useCheckout - Checkout process management hook
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Manages the multi-step checkout process including:
 * - Shipping address collection
 * - Billing address collection  
 * - Payment method selection
 * - Order placement
 */
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useStorefront } from '../context/storefront-context'
import { useStorefrontCart } from './useStorefrontCart'
import type { 
  Address, 
  CheckoutData, 
  CheckoutResult,
  CartTotals
} from '../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export type CheckoutStep = 'information' | 'shipping' | 'payment' | 'review'

export interface ShippingMethod {
  id: string
  name: string
  description?: string
  price: number
  estimated_days?: string
}

export interface PaymentMethod {
  id: string
  name: string
  icon?: string
  description?: string
}

export interface CheckoutState {
  step: CheckoutStep
  email: string
  phone: string
  shippingAddress: Partial<Address>
  billingAddress: Partial<Address>
  useSameAsBilling: boolean
  shippingMethod: ShippingMethod | null
  paymentMethod: PaymentMethod | null
  customerNotes: string
}

export interface CheckoutValidation {
  isEmailValid: boolean
  isShippingValid: boolean
  isBillingValid: boolean
  isShippingMethodSelected: boolean
  isPaymentMethodSelected: boolean
  canProceed: boolean
  errors: Record<string, string[]>
}

export interface UseCheckoutResult {
  // State
  state: CheckoutState
  validation: CheckoutValidation
  
  // Cart data (from useStorefrontCart)
  items: ReturnType<typeof useStorefrontCart>['items']
  totals: CartTotals
  
  // Step navigation
  currentStep: CheckoutStep
  steps: CheckoutStep[]
  stepIndex: number
  goToStep: (step: CheckoutStep) => void
  nextStep: () => void
  prevStep: () => void
  canGoBack: boolean
  canGoNext: boolean
  
  // Form setters
  setEmail: (email: string) => void
  setPhone: (phone: string) => void
  setShippingAddress: (address: Partial<Address>) => void
  setBillingAddress: (address: Partial<Address>) => void
  setUseSameAsBilling: (same: boolean) => void
  setShippingMethod: (method: ShippingMethod | null) => void
  setPaymentMethod: (method: PaymentMethod | null) => void
  setCustomerNotes: (notes: string) => void
  
  // Available options
  availableShippingMethods: ShippingMethod[]
  availablePaymentMethods: PaymentMethod[]
  
  // Actions
  placeOrder: () => Promise<CheckoutResult>
  clearCheckout: () => void
  
  // Loading states
  isLoading: boolean
  isPlacingOrder: boolean
  error: string | null
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const STEPS: CheckoutStep[] = ['information', 'shipping', 'payment', 'review']

/**
 * Fallback shipping methods — only used when no methods are configured in store settings.
 */
const FALLBACK_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered in 5-7 business days',
    price: 0,
    estimated_days: '5-7 days'
  },
]

/**
 * Build payment methods dynamically from the store's payment configuration.
 */
function buildPaymentMethods(settings: Record<string, unknown> | null | undefined): PaymentMethod[] {
  if (!settings) return FALLBACK_PAYMENT_METHODS
  
  const methods: PaymentMethod[] = []
  
  const paddleConfig = settings.paddle_config as { enabled?: boolean } | undefined
  if (paddleConfig?.enabled) {
    methods.push({
      id: 'paddle',
      name: 'Credit / Debit Card',
      icon: 'CreditCard',
      description: 'Pay securely with your card'
    })
  }
  
  const fwConfig = settings.flutterwave_config as { enabled?: boolean } | undefined
  if (fwConfig?.enabled) {
    methods.push({
      id: 'flutterwave',
      name: 'Flutterwave',
      icon: 'Wallet',
      description: 'Pay with card, mobile money, or bank transfer'
    })
  }
  
  const pesapalConfig = settings.pesapal_config as { enabled?: boolean } | undefined
  if (pesapalConfig?.enabled) {
    methods.push({
      id: 'pesapal',
      name: 'Pesapal',
      icon: 'Smartphone',
      description: 'Pay with mobile money or card'
    })
  }
  
  const dpoConfig = settings.dpo_config as { enabled?: boolean } | undefined
  if (dpoConfig?.enabled) {
    methods.push({
      id: 'dpo',
      name: 'DPO Pay',
      icon: 'CreditCard',
      description: 'Pay securely via DPO Payment Gateway'
    })
  }
  
  if (settings.manual_payment_enabled) {
    methods.push({
      id: 'manual',
      name: 'Manual Payment',
      icon: 'Banknote',
      description: (settings.manual_payment_instructions as string) || 'Pay via bank transfer or cash on delivery'
    })
  }
  
  return methods.length > 0 ? methods : FALLBACK_PAYMENT_METHODS
}

/**
 * Build shipping methods from store settings.
 */
function buildShippingMethods(settings: Record<string, unknown> | null | undefined): ShippingMethod[] {
  if (!settings) return FALLBACK_SHIPPING_METHODS
  
  const shippingZones = settings.shipping_zones as Array<{
    id: string; name: string; description?: string; rate: number; estimated_days?: string
  }> | undefined
  
  if (shippingZones && shippingZones.length > 0) {
    return shippingZones.map(zone => ({
      id: zone.id,
      name: zone.name,
      description: zone.description || '',
      price: zone.rate || 0,
      estimated_days: zone.estimated_days || '3-7 days'
    }))
  }
  
  const freeShippingThreshold = settings.freeShippingThreshold as number | null
  const flatRate = settings.flat_shipping_rate as number | undefined
  
  const methods: ShippingMethod[] = []
  
  if (flatRate !== undefined && flatRate > 0) {
    methods.push({
      id: 'flat-rate',
      name: 'Standard Shipping',
      description: freeShippingThreshold 
        ? `Free on orders over ${freeShippingThreshold}`
        : 'Flat rate shipping',
      price: flatRate,
      estimated_days: '3-7 days'
    })
  }
  
  if (freeShippingThreshold !== undefined && freeShippingThreshold !== null) {
    methods.push({
      id: 'free',
      name: 'Free Shipping',
      description: `Available on orders over ${freeShippingThreshold}`,
      price: 0,
      estimated_days: '5-10 days'
    })
  }
  
  return methods.length > 0 ? methods : FALLBACK_SHIPPING_METHODS
}

const FALLBACK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'manual',
    name: 'Manual Payment',
    description: 'Contact store for payment instructions'
  },
]

const EMPTY_ADDRESS: Address = {
  first_name: '',
  last_name: '',
  company: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: ''
}

const INITIAL_STATE: CheckoutState = {
  step: 'information',
  email: '',
  phone: '',
  shippingAddress: { ...EMPTY_ADDRESS },
  billingAddress: { ...EMPTY_ADDRESS },
  useSameAsBilling: true,
  shippingMethod: null,
  paymentMethod: null,
  customerNotes: ''
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateAddress(address: Partial<Address>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!address.first_name?.trim()) errors.push('First name is required')
  if (!address.last_name?.trim()) errors.push('Last name is required')
  if (!address.address_line_1?.trim()) errors.push('Address is required')
  if (!address.city?.trim()) errors.push('City is required')
  if (!address.state?.trim()) errors.push('State/Province is required')
  if (!address.postal_code?.trim()) errors.push('Postal code is required')
  if (!address.country?.trim()) errors.push('Country is required')
  
  return { valid: errors.length === 0, errors }
}

// ============================================================================
// DEFAULT TOTALS
// ============================================================================

const DEFAULT_TOTALS: CartTotals = {
  subtotal: 0,
  discount: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  itemCount: 0
}

// ============================================================================
// HOOK
// ============================================================================

export function useCheckout(): UseCheckoutResult {
  const { siteId, taxRate, settings: storefrontSettings } = useStorefront()
  const { items, totals: cartTotals, clearCart } = useStorefrontCart(siteId, undefined, taxRate)
  
  const [state, setState] = useState<CheckoutState>(INITIAL_STATE)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Build dynamic shipping and payment methods from store settings
  const availableShippingMethods = useMemo(
    () => buildShippingMethods(storefrontSettings as Record<string, unknown> | null),
    [storefrontSettings]
  )
  const availablePaymentMethods = useMemo(
    () => buildPaymentMethods(storefrontSettings as Record<string, unknown> | null),
    [storefrontSettings]
  )
  
  // Calculate step index
  const stepIndex = STEPS.indexOf(state.step)
  
  // Safe cart totals (default if null)
  const safeCartTotals = cartTotals ?? DEFAULT_TOTALS
  
  // Calculate totals including shipping
  const totals = useMemo((): CartTotals => {
    const shippingAmount = state.shippingMethod?.price ?? 0
    return {
      subtotal: safeCartTotals.subtotal,
      discount: safeCartTotals.discount,
      tax: safeCartTotals.tax,
      shipping: shippingAmount,
      total: safeCartTotals.subtotal - safeCartTotals.discount + safeCartTotals.tax + shippingAmount,
      itemCount: safeCartTotals.itemCount
    }
  }, [safeCartTotals, state.shippingMethod])
  
  // Validation
  const validation = useMemo((): CheckoutValidation => {
    const isEmailValid = validateEmail(state.email)
    const shippingValidation = validateAddress(state.shippingAddress)
    const billingValidation = state.useSameAsBilling 
      ? { valid: true, errors: [] }
      : validateAddress(state.billingAddress)
    
    const errors: Record<string, string[]> = {}
    if (!isEmailValid && state.email) errors.email = ['Please enter a valid email address']
    if (shippingValidation.errors.length > 0) errors.shipping = shippingValidation.errors
    if (billingValidation.errors.length > 0) errors.billing = billingValidation.errors
    
    const canProceedByStep: Record<CheckoutStep, boolean> = {
      information: isEmailValid && shippingValidation.valid,
      shipping: !!state.shippingMethod,
      payment: !!state.paymentMethod,
      review: true
    }
    
    return {
      isEmailValid,
      isShippingValid: shippingValidation.valid,
      isBillingValid: billingValidation.valid,
      isShippingMethodSelected: !!state.shippingMethod,
      isPaymentMethodSelected: !!state.paymentMethod,
      canProceed: canProceedByStep[state.step],
      errors
    }
  }, [state])
  
  // Navigation
  const canGoBack = stepIndex > 0
  const canGoNext = stepIndex < STEPS.length - 1 && validation.canProceed
  
  const goToStep = useCallback((step: CheckoutStep) => {
    setState(prev => ({ ...prev, step }))
  }, [])
  
  const nextStep = useCallback(() => {
    if (canGoNext) {
      setState(prev => ({ ...prev, step: STEPS[stepIndex + 1] }))
    }
  }, [canGoNext, stepIndex])
  
  const prevStep = useCallback(() => {
    if (canGoBack) {
      setState(prev => ({ ...prev, step: STEPS[stepIndex - 1] }))
    }
  }, [canGoBack, stepIndex])
  
  // Setters
  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email }))
    setError(null)
  }, [])
  
  const setPhone = useCallback((phone: string) => {
    setState(prev => ({ ...prev, phone }))
  }, [])
  
  const setShippingAddress = useCallback((address: Partial<Address>) => {
    setState(prev => ({ ...prev, shippingAddress: { ...prev.shippingAddress, ...address } }))
    setError(null)
  }, [])
  
  const setBillingAddress = useCallback((address: Partial<Address>) => {
    setState(prev => ({ ...prev, billingAddress: { ...prev.billingAddress, ...address } }))
    setError(null)
  }, [])
  
  const setUseSameAsBilling = useCallback((same: boolean) => {
    setState(prev => ({ ...prev, useSameAsBilling: same }))
  }, [])
  
  const setShippingMethod = useCallback((method: ShippingMethod | null) => {
    setState(prev => ({ ...prev, shippingMethod: method }))
    setError(null)
  }, [])
  
  const setPaymentMethod = useCallback((method: PaymentMethod | null) => {
    setState(prev => ({ ...prev, paymentMethod: method }))
    setError(null)
  }, [])
  
  const setCustomerNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, customerNotes: notes }))
  }, [])
  
  // Clear checkout
  const clearCheckout = useCallback(() => {
    setState(INITIAL_STATE)
    setError(null)
  }, [])
  
  // Place order
  const placeOrder = useCallback(async (): Promise<CheckoutResult> => {
    if (!siteId) {
      return { success: false, error: 'Site not configured' }
    }
    
    if (items.length === 0) {
      return { success: false, error: 'Cart is empty' }
    }
    
    // Validate all required fields
    if (!validation.isEmailValid || !validation.isShippingValid || !validation.isShippingMethodSelected || !validation.isPaymentMethodSelected) {
      return { success: false, error: 'Please complete all required fields' }
    }
    
    setIsPlacingOrder(true)
    setError(null)
    
    try {
      const checkoutData: CheckoutData = {
        email: state.email,
        phone: state.phone || undefined,
        shipping_address: state.shippingAddress as Address,
        billing_address: state.useSameAsBilling 
          ? state.shippingAddress as Address 
          : state.billingAddress as Address,
        shipping_method: state.shippingMethod?.id,
        shipping_amount: state.shippingMethod?.price,
        customer_notes: state.customerNotes || undefined,
        payment_method: state.paymentMethod?.id
      }
      
      // Call checkout API
      const response = await fetch(`/api/modules/ecommerce/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          checkout_data: checkoutData,
          items: items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            custom_options: item.custom_options
          }))
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to place order')
      }
      
      const result: CheckoutResult = await response.json()
      
      if (result.success) {
        // Clear cart and checkout state on success
        await clearCart()
        clearCheckout()
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsPlacingOrder(false)
    }
  }, [siteId, items, validation, state, clearCart, clearCheckout])
  
  return {
    // State
    state,
    validation,
    
    // Cart data
    items,
    totals,
    
    // Step navigation
    currentStep: state.step,
    steps: STEPS,
    stepIndex,
    goToStep,
    nextStep,
    prevStep,
    canGoBack,
    canGoNext,
    
    // Form setters
    setEmail,
    setPhone,
    setShippingAddress,
    setBillingAddress,
    setUseSameAsBilling,
    setShippingMethod,
    setPaymentMethod,
    setCustomerNotes,
    
    // Available options (loaded from store settings)
    availableShippingMethods,
    availablePaymentMethods,
    
    // Actions
    placeOrder,
    clearCheckout,
    
    // Loading states
    isLoading: false,
    isPlacingOrder,
    error
  }
}
