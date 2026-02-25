/**
 * CheckoutPageBlock - Complete checkout page component
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Full multi-step checkout page with responsive layout.
 * Integrates all checkout components into a cohesive experience.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckoutStepIndicator } from './CheckoutStepIndicator'
import { ShippingAddressForm, BillingAddressForm } from './AddressForm'
import { ShippingMethodSelector } from './ShippingMethodSelector'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { OrderSummaryCard } from './OrderSummaryCard'
import { CartEmptyState } from './CartEmptyState'
import { useCheckout, type CheckoutStep } from '../../hooks/useCheckout'
import { useStorefront } from '../../context/storefront-context'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutPageBlockProps {
  cartHref?: string
  successHref?: string
  onOrderComplete?: (orderId: string, orderNumber: string) => void
  className?: string
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  checkout: ReturnType<typeof useCheckout>
  formatPrice: (price: number) => string
}

// Information Step - Contact & Shipping Address
function InformationStep({ checkout, formatPrice }: StepProps) {
  return (
    <div className="space-y-6">
      <ShippingAddressForm
        title="Shipping Address"
        address={checkout.state.shippingAddress}
        onChange={checkout.setShippingAddress}
        email={checkout.state.email}
        onEmailChange={checkout.setEmail}
        phone={checkout.state.phone}
        onPhoneChange={checkout.setPhone}
        errors={checkout.validation.errors.shipping}
        disabled={checkout.isPlacingOrder}
      />
    </div>
  )
}

// Shipping Step - Shipping Method Selection
function ShippingStep({ checkout, formatPrice }: StepProps) {
  return (
    <div className="space-y-6">
      <ShippingMethodSelector
        methods={checkout.availableShippingMethods}
        selected={checkout.state.shippingMethod}
        onSelect={checkout.setShippingMethod}
        formatPrice={formatPrice}
        disabled={checkout.isPlacingOrder}
      />
    </div>
  )
}

// Payment Step - Payment Method & Billing Address
function PaymentStep({ checkout, formatPrice }: StepProps) {
  return (
    <div className="space-y-6">
      <PaymentMethodSelector
        methods={checkout.availablePaymentMethods}
        selected={checkout.state.paymentMethod}
        onSelect={checkout.setPaymentMethod}
        disabled={checkout.isPlacingOrder}
      />
      
      <BillingAddressForm
        title="Billing Address"
        address={checkout.state.billingAddress}
        onChange={checkout.setBillingAddress}
        useSameAsShipping={checkout.state.useSameAsBilling}
        onUseSameAsShippingChange={checkout.setUseSameAsBilling}
        errors={checkout.validation.errors.billing}
        disabled={checkout.isPlacingOrder}
      />
    </div>
  )
}

// Review Step - Order Review & Notes
function ReviewStep({ checkout, formatPrice }: StepProps) {
  const shippingAddress = checkout.state.shippingAddress
  const billingAddress = checkout.state.useSameAsBilling 
    ? checkout.state.shippingAddress 
    : checkout.state.billingAddress

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Review Your Order</h3>
      
      {/* Contact */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Contact</h4>
              <p className="text-sm">{checkout.state.email}</p>
              {checkout.state.phone && (
                <p className="text-sm text-muted-foreground">{checkout.state.phone}</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => checkout.goToStep('information')}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Ship to</h4>
                <p className="text-sm">
                  {shippingAddress.first_name} {shippingAddress.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {shippingAddress.address_line_1}
                  {shippingAddress.address_line_2 && `, ${shippingAddress.address_line_2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => checkout.goToStep('information')}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Bill to</h4>
                <p className="text-sm">
                  {billingAddress.first_name} {billingAddress.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {billingAddress.address_line_1}
                  {billingAddress.address_line_2 && `, ${billingAddress.address_line_2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => checkout.goToStep('payment')}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Shipping Method</h4>
                <p className="text-sm">{checkout.state.shippingMethod?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {checkout.state.shippingMethod?.estimated_days}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => checkout.goToStep('shipping')}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Payment Method</h4>
                <p className="text-sm">{checkout.state.paymentMethod?.name}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => checkout.goToStep('payment')}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Order Notes (optional)</Label>
        <Textarea
          id="notes"
          value={checkout.state.customerNotes}
          onChange={(e) => checkout.setCustomerNotes(e.target.value)}
          placeholder="Any special instructions for your order..."
          rows={3}
          disabled={checkout.isPlacingOrder}
        />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CheckoutPageBlock({
  cartHref = '/cart',
  successHref = '/order-confirmation',
  onOrderComplete,
  className
}: CheckoutPageBlockProps) {
  const { formatPrice, quotationModeEnabled, quotationRedirectUrl, quotationButtonLabel } = useStorefront()
  const checkout = useCheckout()

  // Quote mode guard — redirect away from checkout when in quotation mode
  if (quotationModeEnabled) {
    const quoteUrl = quotationRedirectUrl || '/quotes'
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Quotation Mode Active</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                This store operates in quotation mode. Instead of checking out directly,
                please submit a quote request and we&apos;ll get back to you with pricing.
              </p>
              <Button asChild>
                <a href={quoteUrl}>{quotationButtonLabel || 'Request a Quote'}</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  const [orderResult, setOrderResult] = React.useState<{
    orderId: string
    orderNumber: string
  } | null>(null)
  
  // Handle place order
  const handlePlaceOrder = async () => {
    const result = await checkout.placeOrder()
    
    if (result.success && result.order_id && result.order_number) {
      setOrderResult({
        orderId: result.order_id,
        orderNumber: result.order_number
      })
      
      if (onOrderComplete) {
        onOrderComplete(result.order_id, result.order_number)
      }
    }
  }
  
  // Render step content
  const renderStep = () => {
    switch (checkout.currentStep) {
      case 'information':
        return <InformationStep checkout={checkout} formatPrice={formatPrice} />
      case 'shipping':
        return <ShippingStep checkout={checkout} formatPrice={formatPrice} />
      case 'payment':
        return <PaymentStep checkout={checkout} formatPrice={formatPrice} />
      case 'review':
        return <ReviewStep checkout={checkout} formatPrice={formatPrice} />
      default:
        return null
    }
  }
  
  // Empty cart state
  if (checkout.items.length === 0 && !orderResult) {
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="py-0">
              <CartEmptyState
                title="Your cart is empty"
                description="Add some items to your cart before checking out."
                shopLink="/shop"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  // Order success - redirect or show confirmation
  if (orderResult) {
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
              <p className="text-muted-foreground mb-4">
                Your order #{orderResult.orderNumber} has been placed.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You will receive a confirmation email shortly.
              </p>
              <Button asChild>
                <Link href={`${successHref}?order=${orderResult.orderId}`}>
                  View Order Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('py-8 md:py-12', className)}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href={cartHref}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to cart
            </Link>
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Checkout</h1>
          
          {/* Step Indicator */}
          <CheckoutStepIndicator
            steps={checkout.steps}
            currentStep={checkout.currentStep}
            onStepClick={(step) => {
              // Only allow going to completed steps
              const targetIndex = checkout.steps.indexOf(step)
              if (targetIndex <= checkout.stepIndex) {
                checkout.goToStep(step)
              }
            }}
          />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {/* Error Alert */}
                {checkout.error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{checkout.error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Step Content */}
                {renderStep()}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={checkout.prevStep}
                    disabled={!checkout.canGoBack || checkout.isPlacingOrder}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  {checkout.currentStep === 'review' ? (
                    <Button
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={checkout.isPlacingOrder}
                    >
                      {checkout.isPlacingOrder ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={checkout.nextStep}
                      disabled={!checkout.canGoNext || checkout.isPlacingOrder}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Column - Sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <OrderSummaryCard
                items={checkout.items}
                totals={checkout.totals}
                formatPrice={formatPrice}
                shippingMethod={checkout.state.shippingMethod}
                collapsible={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
