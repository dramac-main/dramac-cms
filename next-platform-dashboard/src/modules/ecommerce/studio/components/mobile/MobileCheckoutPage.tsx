/**
 * MobileCheckoutPage - Main mobile checkout layout
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Features:
 * - Single-page checkout with collapsible sections
 * - Progress indicator
 * - Keyboard-aware layout
 * - Sticky footer with total and CTA
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartItem } from '../../../types/ecommerce-types'
import { useMobile } from '../../../hooks/useMobile'
import { useKeyboardVisible } from '../../../hooks/useKeyboardVisible'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { MobileCheckoutProgress, CheckoutStep } from './MobileCheckoutProgress'
import { CollapsibleSection, SectionStatus } from './CollapsibleSection'
import { MobileInput } from './MobileInput'
import { MobileAddressInput, Address, AddressErrors } from './MobileAddressInput'
import { MobilePaymentSelector, PaymentMethod } from './MobilePaymentSelector'
import { MobileShippingSelector, ShippingOption } from './MobileShippingSelector'
import { MobileOrderReview, OrderSummaryTotals } from './MobileOrderReview'
import { StickyCheckoutFooter } from './StickyCheckoutFooter'

// ============================================================================
// TYPES
// ============================================================================

export interface ContactInfo {
  email: string
  phone?: string
  marketingOptIn?: boolean
}

export interface ContactErrors {
  email?: string
  phone?: string
}

export interface CheckoutData {
  contact: ContactInfo
  shippingAddress: Partial<Address>
  billingAddress: Partial<Address>
  shippingMethodId: string | null
  paymentMethodId: string | null
  billingAddressSameAsShipping: boolean
}

export interface MobileCheckoutPageProps {
  items: CartItem[]
  totals: OrderSummaryTotals
  shippingOptions: ShippingOption[]
  paymentMethods: PaymentMethod[]
  initialData?: Partial<CheckoutData>
  onSubmit: (data: CheckoutData) => Promise<void>
  onBack?: () => void
  loading?: boolean
  className?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEmail(email: string): string | undefined {
  if (!email) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address'
  return undefined
}

function validatePhone(phone: string): string | undefined {
  if (phone && !/^[\d\s\-+()]+$/.test(phone)) return 'Invalid phone number'
  return undefined
}

function validateAddress(address: Partial<Address>): AddressErrors {
  const errors: AddressErrors = {}
  if (!address.firstName?.trim()) errors.firstName = 'First name is required'
  if (!address.lastName?.trim()) errors.lastName = 'Last name is required'
  if (!address.address1?.trim()) errors.address1 = 'Address is required'
  if (!address.city?.trim()) errors.city = 'City is required'
  if (!address.state?.trim()) errors.state = 'State is required'
  if (!address.postalCode?.trim()) errors.postalCode = 'ZIP code is required'
  return errors
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileCheckoutPage({
  items,
  totals,
  shippingOptions,
  paymentMethods,
  initialData,
  onSubmit,
  onBack,
  loading = false,
  className,
}: MobileCheckoutPageProps) {
  const isMobile = useMobile()
  const { isKeyboardVisible } = useKeyboardVisible()
  const { trigger } = useHapticFeedback()

  // Current step
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact')
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([])

  // Form data
  const [contact, setContact] = useState<ContactInfo>(
    initialData?.contact || { email: '', phone: '', marketingOptIn: false }
  )
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>(
    initialData?.shippingAddress || { country: 'US' }
  )
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>(
    initialData?.billingAddress || { country: 'US' }
  )
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    initialData?.shippingMethodId || null
  )
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(
    initialData?.paymentMethodId || null
  )
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(
    initialData?.billingAddressSameAsShipping ?? true
  )

  // Errors
  const [contactErrors, setContactErrors] = useState<ContactErrors>({})
  const [shippingErrors, setShippingErrors] = useState<AddressErrors>({})

  // Section statuses
  const getSectionStatus = useCallback(
    (step: CheckoutStep): SectionStatus => {
      if (completedSteps.includes(step)) return 'complete'
      if (currentStep === step) return 'active'
      return 'pending'
    },
    [currentStep, completedSteps]
  )

  // Validate and advance
  const validateContact = useCallback((): boolean => {
    const errors: ContactErrors = {
      email: validateEmail(contact.email),
      phone: contact.phone ? validatePhone(contact.phone) : undefined,
    }
    setContactErrors(errors)
    return !errors.email && !errors.phone
  }, [contact])

  const validateShipping = useCallback((): boolean => {
    const errors = validateAddress(shippingAddress)
    setShippingErrors(errors)
    return Object.keys(errors).length === 0 && !!shippingMethodId
  }, [shippingAddress, shippingMethodId])

  const validatePayment = useCallback((): boolean => {
    return !!paymentMethodId
  }, [paymentMethodId])

  // Step navigation
  const goToStep = useCallback(
    (step: CheckoutStep) => {
      trigger('selection')
      setCurrentStep(step)
    },
    [trigger]
  )

  const completeStep = useCallback(
    (step: CheckoutStep, nextStep: CheckoutStep) => {
      if (!completedSteps.includes(step)) {
        setCompletedSteps((prev) => [...prev, step])
      }
      trigger('success')
      setCurrentStep(nextStep)
    },
    [completedSteps, trigger]
  )

  // Handle section completion
  const handleContactContinue = useCallback(() => {
    if (validateContact()) {
      completeStep('contact', 'shipping')
    } else {
      trigger('error')
    }
  }, [validateContact, completeStep, trigger])

  const handleShippingContinue = useCallback(() => {
    if (validateShipping()) {
      completeStep('shipping', 'payment')
    } else {
      trigger('error')
    }
  }, [validateShipping, completeStep, trigger])

  const handlePaymentContinue = useCallback(() => {
    if (validatePayment()) {
      completeStep('payment', 'review')
    } else {
      trigger('error')
    }
  }, [validatePayment, completeStep, trigger])

  // Final submit
  const handleSubmit = useCallback(async () => {
    const data: CheckoutData = {
      contact,
      shippingAddress,
      billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
      shippingMethodId,
      paymentMethodId,
      billingAddressSameAsShipping: billingSameAsShipping,
    }
    await onSubmit(data)
  }, [contact, shippingAddress, billingAddress, billingSameAsShipping, shippingMethodId, paymentMethodId, onSubmit])

  // Button text based on step
  const buttonConfig = useMemo(() => {
    switch (currentStep) {
      case 'contact':
        return { text: 'Continue to shipping', onClick: handleContactContinue }
      case 'shipping':
        return { text: 'Continue to payment', onClick: handleShippingContinue }
      case 'payment':
        return { text: 'Review order', onClick: handlePaymentContinue }
      case 'review':
        return { text: 'Place order', onClick: handleSubmit }
      default:
        return { text: 'Continue', onClick: () => {} }
    }
  }, [currentStep, handleContactContinue, handleShippingContinue, handlePaymentContinue, handleSubmit])

  // Selected shipping method name for order review
  const selectedShippingName = useMemo(() => {
    return shippingOptions.find((o) => o.id === shippingMethodId)?.name
  }, [shippingOptions, shippingMethodId])

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center h-14 px-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="flex-1 text-lg font-semibold text-center">
            Checkout
          </h1>
          {onBack && <div className="w-9" />} {/* Spacer for centering */}
        </div>
        
        {/* Progress indicator */}
        <div className="px-4 pb-3">
          <MobileCheckoutProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            variant="segments"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="pb-32"> {/* Padding for sticky footer */}
        <div className="p-4 space-y-4">
          {/* Contact Section */}
          <CollapsibleSection
            title="Contact information"
            status={getSectionStatus('contact')}
            isOpen={currentStep === 'contact'}
            badge={contact.email || undefined}
            onToggle={() => goToStep('contact')}
          >
            <div className="space-y-4">
              <MobileInput
                label="Email"
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                error={contactErrors.email}
                autoComplete="email"
                inputMode="email"
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <MobileInput
                label="Phone (optional)"
                type="tel"
                value={contact.phone || ''}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                error={contactErrors.phone}
                autoComplete="tel"
                inputMode="tel"
                leftIcon={<Phone className="h-4 w-4" />}
              />
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={contact.marketingOptIn}
                  onChange={(e) => setContact({ ...contact, marketingOptIn: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm text-muted-foreground">
                  Email me with news and offers
                </span>
              </label>
            </div>
          </CollapsibleSection>

          {/* Shipping Section */}
          <CollapsibleSection
            title="Shipping"
            status={getSectionStatus('shipping')}
            isOpen={currentStep === 'shipping'}
            badge={shippingAddress.city ? `${shippingAddress.city}, ${shippingAddress.state}` : undefined}
            onToggle={() => completedSteps.includes('contact') && goToStep('shipping')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Shipping address
                </h3>
                <MobileAddressInput
                  address={shippingAddress}
                  onChange={setShippingAddress}
                  errors={shippingErrors}
                  showPhone
                />
              </div>

              {shippingOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Shipping method
                  </h3>
                  <MobileShippingSelector
                    options={shippingOptions}
                    selectedOptionId={shippingMethodId}
                    onSelect={setShippingMethodId}
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Payment Section */}
          <CollapsibleSection
            title="Payment"
            status={getSectionStatus('payment')}
            isOpen={currentStep === 'payment'}
            badge={paymentMethodId ? 'Selected' : undefined}
            onToggle={() => completedSteps.includes('shipping') && goToStep('payment')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Payment method
                </h3>
                <MobilePaymentSelector
                  methods={paymentMethods}
                  selectedMethodId={paymentMethodId}
                  onSelect={setPaymentMethodId}
                />
              </div>

              {/* Billing address toggle */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm text-foreground">
                    Billing address same as shipping
                  </span>
                </label>

                {/* Billing address form */}
                <AnimatePresence>
                  {!billingSameAsShipping && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <MobileAddressInput
                          address={billingAddress}
                          onChange={setBillingAddress}
                          showPhone={false}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CollapsibleSection>

          {/* Review Section */}
          <CollapsibleSection
            title="Review"
            status={getSectionStatus('review')}
            isOpen={currentStep === 'review'}
            onToggle={() => completedSteps.includes('payment') && goToStep('review')}
          >
            <div className="space-y-4">
              <MobileOrderReview
                items={items}
                totals={totals}
                shippingMethodName={selectedShippingName}
                defaultExpanded
              />
            </div>
          </CollapsibleSection>
        </div>
      </main>

      {/* Sticky footer - hide when keyboard is visible */}
      {!isKeyboardVisible && (
        <StickyCheckoutFooter
          total={totals.total}
          buttonText={buttonConfig.text}
          onClick={buttonConfig.onClick}
          loading={loading}
          showTotal={currentStep === 'review'}
        />
      )}
    </div>
  )
}

export default MobileCheckoutPage
