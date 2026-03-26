/**
 * CheckoutPageBlock - Complete checkout page component
 *
 * Phase ECOM-23: Checkout Components
 *
 * Full multi-step checkout page with responsive layout.
 * Integrates all checkout components into a cohesive experience.
 */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Clock,
  Banknote,
  Copy,
  Check,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckoutStepIndicator } from "./CheckoutStepIndicator";
import { ShippingAddressForm, BillingAddressForm } from "./AddressForm";
import { ShippingMethodSelector } from "./ShippingMethodSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { CartEmptyState } from "./CartEmptyState";
import { useCheckout, type CheckoutStep } from "../../hooks/useCheckout";
import { useStorefront } from "../../context/storefront-context";
import { useStorefrontAuth } from "../../context/storefront-auth-context";

import { useMobile } from "../../hooks/useMobile";
import { MobileCheckoutPage } from "./mobile/MobileCheckoutPage";
import type { CheckoutData as MobileCheckoutData } from "./mobile/MobileCheckoutPage";
import type { ShippingOption as MobileShippingOption } from "./mobile/MobileShippingSelector";
import type {
  PaymentMethod as MobilePaymentMethod,
  PaymentMethodType as MobilePaymentMethodType,
} from "./mobile/MobilePaymentSelector";
import type { OrderSummaryTotals } from "./mobile/MobileOrderReview";
import type { Address as MobileAddress } from "./mobile/MobileAddressInput";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutPageBlockProps {
  cartHref?: string;
  successHref?: string;
  onOrderComplete?: (orderId: string, orderNumber: string) => void;
  className?: string;
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  checkout: ReturnType<typeof useCheckout>;
  formatPrice: (price: number) => string;
}

// Information Step - Contact, Shipping Address & Shipping Method (combined)
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

      <div className="border-t pt-6">
        <ShippingMethodSelector
          methods={checkout.availableShippingMethods}
          selected={checkout.state.shippingMethod}
          onSelect={checkout.setShippingMethod}
          formatPrice={formatPrice}
          disabled={checkout.isPlacingOrder}
        />
      </div>
    </div>
  );
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

      {/* Compact Review Summary */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-base font-semibold">Review</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between sm:flex-col p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Ship to</span>
            <span className="text-right sm:text-left">
              {checkout.state.shippingAddress.first_name}{" "}
              {checkout.state.shippingAddress.last_name},{" "}
              {checkout.state.shippingAddress.city}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-2 text-xs"
                onClick={() => checkout.goToStep("information")}
              >
                Edit
              </Button>
            </span>
          </div>
          <div className="flex justify-between sm:flex-col p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-right sm:text-left">
              {checkout.state.shippingMethod?.name}
              {checkout.state.shippingMethod?.price
                ? ` — ${formatPrice(checkout.state.shippingMethod.price)}`
                : " — Free"}
            </span>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Order Notes (optional)</Label>
        <Textarea
          id="notes"
          value={checkout.state.customerNotes}
          onChange={(e) => checkout.setCustomerNotes(e.target.value)}
          placeholder="Any special instructions for your order..."
          rows={2}
          disabled={checkout.isPlacingOrder}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MOBILE DATA MAPPERS
// ============================================================================

/** Map useCheckout ShippingMethod[] → mobile ShippingOption[] */
function toMobileShippingOptions(
  methods: {
    id: string;
    name: string;
    description?: string;
    price: number;
    estimated_days?: string;
  }[],
): MobileShippingOption[] {
  return methods.map((m) => ({
    id: m.id,
    name: m.name,
    speed: "standard" as const,
    price: m.price,
    estimatedDays: m.estimated_days || "3-7 days",
    description: m.description,
  }));
}

/** Map useCheckout PaymentMethod[] → mobile PaymentMethod[] */
function toMobilePaymentMethods(
  methods: { id: string; name: string; icon?: string; description?: string }[],
): MobilePaymentMethod[] {
  const typeMap: Record<string, MobilePaymentMethodType> = {
    paddle: "card",
    flutterwave: "bank",
    pesapal: "bank",
    dpo: "card",
    manual: "bank",
  };
  return methods.map((m) => ({
    id: m.id,
    type: typeMap[m.id] || "card",
    label: m.name,
    description: m.description,
  }));
}

/** Map CartTotals → mobile OrderSummaryTotals */
function toMobileTotals(t: {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}): OrderSummaryTotals {
  return {
    subtotal: t.subtotal,
    shipping: t.shipping,
    tax: t.tax,
    discount: t.discount,
    total: t.total,
  };
}

/** Map mobile camelCase Address → snake_case checkout address */
function fromMobileAddress(a: Partial<MobileAddress>): Record<string, string> {
  return {
    first_name: a.firstName || "",
    last_name: a.lastName || "",
    company: a.company || "",
    address_line_1: a.address1 || "",
    address_line_2: a.address2 || "",
    city: a.city || "",
    state: a.state || "",
    postal_code: a.postalCode || "",
    country: a.country || "",
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CheckoutPageBlock({
  cartHref = "/cart",
  successHref = "/order-confirmation",
  onOrderComplete,
  className,
}: CheckoutPageBlockProps) {
  const {
    formatPrice,
    quotationModeEnabled,
    quotationRedirectUrl,
    quotationButtonLabel,
    siteId: storefrontSiteId,
  } = useStorefront();
  const checkout = useCheckout();
  const isMobile = useMobile();

  // Auth context — works with or without StorefrontAuthProvider in the tree
  // (defaults to guest mode when provider is absent)
  const auth = useStorefrontAuth();
  const authCustomer = auth.customer;
  const authToken = auth.token;
  const openAuthDialog = auth.openAuthDialog;

  const [orderResult, setOrderResult] = React.useState<{
    orderId: string;
    orderNumber: string;
    paymentInstructions?: string;
  } | null>(null);

  // Pre-fill checkout form from logged-in customer (only once on mount / login)
  React.useEffect(() => {
    if (!authCustomer) return;
    if (!checkout.state.email && authCustomer.email) {
      checkout.setEmail(authCustomer.email);
    }
    if (!checkout.state.phone && authCustomer.phone) {
      checkout.setPhone(authCustomer.phone);
    }
    if (!checkout.state.shippingAddress.first_name && authCustomer.firstName) {
      checkout.setShippingAddress({
        ...checkout.state.shippingAddress,
        first_name: authCustomer.firstName,
        last_name: authCustomer.lastName,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCustomer?.id]);

  // Quote mode guard — redirect away from checkout when in quotation mode
  if (quotationModeEnabled) {
    const quoteUrl = quotationRedirectUrl || "/quotes";
    return (
      <div className={cn("py-12", className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Quotation Mode Active
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                This store operates in quotation mode. Instead of checking out
                directly, please submit a quote request and we&apos;ll get back
                to you with pricing.
              </p>
              <Button asChild>
                <a href={quoteUrl}>
                  {quotationButtonLabel || "Request a Quote"}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Persist order reference so customers can find their order later
  const saveOrderToStorage = (orderId: string, orderNumber: string) => {
    try {
      if (storefrontSiteId) {
        localStorage.setItem(
          `ecom_last_order_${storefrontSiteId}`,
          JSON.stringify({ orderId, orderNumber, timestamp: Date.now() }),
        );
      }
    } catch {
      // localStorage may be unavailable
    }
  };

  // Handle place order — routes to correct payment flow based on provider
  const handlePlaceOrder = async () => {
    const result = await checkout.placeOrder({
      customerToken: authToken || undefined,
    });

    if (result.success && result.order_id && result.order_number) {
      const payment = result.payment as Record<string, unknown> | undefined;
      const paymentUrl = result.payment_url as string | undefined;
      const provider = payment?.provider as string | undefined;

      // Handle redirect-based payment providers (Pesapal, DPO)
      if (paymentUrl && (provider === "pesapal" || provider === "dpo")) {
        // Save order before redirect so customer can find it later
        saveOrderToStorage(result.order_id, result.order_number);
        // Redirect to external payment page
        window.location.href = paymentUrl;
        return;
      }

      // Handle Paddle (client-side JS overlay)
      if (provider === "paddle" && payment?.checkoutData) {
        const paddleData = payment as Record<string, unknown>;
        const checkoutData = paddleData.checkoutData as Record<string, unknown>;
        // Check if Paddle.js is loaded globally
        const PaddleJS = (window as unknown as Record<string, unknown>)
          .Paddle as
          | {
              Checkout?: { open: (config: Record<string, unknown>) => void };
            }
          | undefined;

        if (PaddleJS?.Checkout?.open) {
          PaddleJS.Checkout.open({
            product: (checkoutData.product as Record<string, unknown>)?.price
              ? undefined
              : undefined,
            override: checkoutData.successUrl,
            email: (checkoutData.customer as Record<string, string>)?.email,
            passthrough: JSON.stringify({ orderId: result.order_id }),
            successCallback: () => {
              saveOrderToStorage(result.order_id!, result.order_number!);
              setOrderResult({
                orderId: result.order_id!,
                orderNumber: result.order_number!,
              });
              if (onOrderComplete) {
                onOrderComplete(result.order_id!, result.order_number!);
              }
            },
            closeCallback: () => {
              // Payment was cancelled — order still exists as pending
            },
          });
          return;
        }
        // Paddle.js not loaded — fall through to success with pending payment notice
      }

      // Handle Flutterwave (client-side inline checkout)
      if (provider === "flutterwave" && payment?.publicKey) {
        const FlutterwaveCheckout = (
          window as unknown as Record<string, unknown>
        ).FlutterwaveCheckout as
          | ((config: Record<string, unknown>) => void)
          | undefined;

        if (FlutterwaveCheckout) {
          FlutterwaveCheckout({
            public_key: payment.publicKey as string,
            tx_ref: `order_${result.order_id}_${Date.now()}`,
            amount: payment.amount as number,
            currency: payment.currency as string,
            customer: payment.customer as Record<string, unknown>,
            customizations: payment.customizations as Record<string, unknown>,
            redirect_url: payment.redirectUrl as string,
            callback: () => {
              saveOrderToStorage(result.order_id!, result.order_number!);
              setOrderResult({
                orderId: result.order_id!,
                orderNumber: result.order_number!,
              });
              if (onOrderComplete) {
                onOrderComplete(result.order_id!, result.order_number!);
              }
            },
            onclose: () => {
              // Payment modal closed — order still pending
            },
          });
          return;
        }
        // Flutterwave JS not loaded — fall through
      }

      // Manual payment or fallback — show success with instructions
      const instructions =
        provider === "manual"
          ? (payment?.instructions as string) ||
            "Please contact us for payment instructions."
          : undefined;

      saveOrderToStorage(result.order_id, result.order_number);
      setOrderResult({
        orderId: result.order_id,
        orderNumber: result.order_number,
        paymentInstructions: instructions,
      });

      if (onOrderComplete) {
        onOrderComplete(result.order_id, result.order_number);
      }
    }
  };

  // Handle mobile checkout submission — calls API directly with mobile form data
  const handleMobileSubmit = async (data: MobileCheckoutData) => {
    const shippingAddr = fromMobileAddress(data.shippingAddress);
    const billingAddr = data.billingAddressSameAsShipping
      ? shippingAddr
      : fromMobileAddress(data.billingAddress);

    const customerName =
      `${data.shippingAddress.firstName || ""} ${data.shippingAddress.lastName || ""}`.trim();

    const response = await fetch("/api/modules/ecommerce/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId: checkout.cartId,
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
        customerEmail: data.contact.email,
        customerName: customerName || undefined,
        customerPhone: data.contact.phone || undefined,
        paymentProvider: data.paymentMethodId,
        shippingMethod: data.shippingMethodId,
        customer_token: authToken || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to place order");
    }

    const result = await response.json();

    if (result.success && result.order_id && result.order_number) {
      const payment = result.payment as Record<string, unknown> | undefined;
      const paymentUrl = result.payment_url as string | undefined;
      const provider = payment?.provider as string | undefined;

      // Redirect-based payments (Pesapal, DPO)
      if (paymentUrl && (provider === "pesapal" || provider === "dpo")) {
        saveOrderToStorage(result.order_id, result.order_number);
        window.location.href = paymentUrl;
        return;
      }

      // Paddle client-side overlay
      if (provider === "paddle" && payment?.checkoutData) {
        const PaddleJS = (window as unknown as Record<string, unknown>)
          .Paddle as
          | {
              Checkout?: { open: (config: Record<string, unknown>) => void };
            }
          | undefined;

        if (PaddleJS?.Checkout?.open) {
          PaddleJS.Checkout.open({
            override: (payment.checkoutData as Record<string, unknown>)
              .successUrl,
            email: data.contact.email,
            passthrough: JSON.stringify({ orderId: result.order_id }),
            successCallback: () => {
              saveOrderToStorage(result.order_id!, result.order_number!);
              setOrderResult({
                orderId: result.order_id!,
                orderNumber: result.order_number!,
              });
              if (onOrderComplete)
                onOrderComplete(result.order_id!, result.order_number!);
            },
            closeCallback: () => {},
          });
          return;
        }
      }

      // Flutterwave inline checkout
      if (provider === "flutterwave" && payment?.publicKey) {
        const FlutterwaveCheckout = (
          window as unknown as Record<string, unknown>
        ).FlutterwaveCheckout as
          | ((config: Record<string, unknown>) => void)
          | undefined;

        if (FlutterwaveCheckout) {
          FlutterwaveCheckout({
            public_key: payment.publicKey as string,
            tx_ref: `order_${result.order_id}_${Date.now()}`,
            amount: payment.amount as number,
            currency: payment.currency as string,
            customer: payment.customer as Record<string, unknown>,
            customizations: payment.customizations as Record<string, unknown>,
            redirect_url: payment.redirectUrl as string,
            callback: () => {
              saveOrderToStorage(result.order_id!, result.order_number!);
              setOrderResult({
                orderId: result.order_id!,
                orderNumber: result.order_number!,
              });
              if (onOrderComplete)
                onOrderComplete(result.order_id!, result.order_number!);
            },
            onclose: () => {},
          });
          return;
        }
      }

      // Manual payment / fallback — clear cart, show success
      const hasClientPayment =
        provider === "paddle" || provider === "flutterwave";
      if (!hasClientPayment) {
        await checkout.resetCart();
        checkout.clearCheckout();
      }

      const instructions =
        provider === "manual"
          ? (payment?.instructions as string) ||
            "Please contact us for payment instructions."
          : undefined;

      saveOrderToStorage(result.order_id, result.order_number);
      setOrderResult({
        orderId: result.order_id,
        orderNumber: result.order_number,
        paymentInstructions: instructions,
      });

      if (onOrderComplete)
        onOrderComplete(result.order_id, result.order_number);
    } else {
      throw new Error(result.error || "Order placement failed");
    }
  };

  // Render step content
  const renderStep = () => {
    switch (checkout.currentStep) {
      case "information":
        return (
          <InformationStep checkout={checkout} formatPrice={formatPrice} />
        );
      case "payment":
        return <PaymentStep checkout={checkout} formatPrice={formatPrice} />;
      default:
        return null;
    }
  };

  // Auto-redirect to full order confirmation page on success
  // OrderConfirmationBlock has chat auto-open, payment proof upload, chat buttons, timeline
  React.useEffect(() => {
    if (orderResult) {
      window.location.href = `${successHref}?order=${orderResult.orderId}`;
    }
  }, [orderResult, successHref]);

  // Empty cart state
  if (checkout.items.length === 0 && !orderResult) {
    return (
      <div className={cn("py-12", className)}>
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
    );
  }

  // Order success - show loading while redirecting to order confirmation
  if (orderResult) {
    return (
      <div className={cn("py-12", className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Loading your order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mobile checkout — full-screen collapsible accordion layout
  if (isMobile) {
    return (
      <MobileCheckoutPage
        items={checkout.items}
        totals={toMobileTotals(checkout.totals)}
        shippingOptions={toMobileShippingOptions(
          checkout.availableShippingMethods,
        )}
        paymentMethods={toMobilePaymentMethods(
          checkout.availablePaymentMethods,
        )}
        onSubmit={handleMobileSubmit}
        onBack={() => window.history.back()}
        loading={checkout.isPlacingOrder}
        className={className}
      />
    );
  }

  return (
    <div className={cn("py-8 md:py-12", className)}>
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
              const targetIndex = checkout.steps.indexOf(step);
              if (targetIndex <= checkout.stepIndex) {
                checkout.goToStep(step);
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

                {/* Sign-in prompt — shown on information step for guests */}
                {checkout.currentStep === "information" && !authCustomer && (
                  <div className="mb-6 flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                    <span className="text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Have an account?
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => openAuthDialog("login")}
                    >
                      Sign in for faster checkout
                    </Button>
                  </div>
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

                  {checkout.currentStep === "payment" ? (
                    <Button
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={
                        !checkout.state.paymentMethod || checkout.isPlacingOrder
                      }
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
                      Continue to Payment
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
  );
}

// =============================================================================
// CheckoutSuccessCard — extracted for readability
// =============================================================================

function CheckoutSuccessCard({
  orderResult,
  isManualPayment,
  successHref,
  className,
}: {
  orderResult: {
    orderId: string;
    orderNumber: string;
    paymentInstructions?: string;
  };
  isManualPayment: boolean;
  successHref: string;
  className?: string;
}) {
  const [copiedRef, setCopiedRef] = React.useState(false);

  const copyRef = async () => {
    await navigator.clipboard.writeText(orderResult.orderNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className={cn("py-12", className)}>
      <div className="container max-w-4xl mx-auto px-4">
        <Card className="text-center py-12">
          <CardContent>
            {isManualPayment ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  Order Received — Payment Pending
                </h1>

                {/* Copyable order reference */}
                <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg mb-4">
                  <span className="text-sm text-muted-foreground">Order</span>
                  <span className="font-mono font-semibold">
                    {orderResult.orderNumber}
                  </span>
                  <button
                    onClick={copyRef}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    {copiedRef ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <p className="text-muted-foreground mb-6">
                  Please complete your payment to confirm.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6 text-left max-w-lg mx-auto">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-amber-900 mb-2">
                        Payment Instructions
                      </p>
                      <p className="text-sm text-amber-800 whitespace-pre-wrap">
                        {orderResult.paymentInstructions}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Your order will be processed once payment is confirmed. You
                  will receive a confirmation email with these details.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  Order Placed Successfully!
                </h1>

                {/* Copyable order reference */}
                <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg mb-4">
                  <span className="text-sm text-muted-foreground">Order</span>
                  <span className="font-mono font-semibold">
                    {orderResult.orderNumber}
                  </span>
                  <button
                    onClick={copyRef}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    {copiedRef ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  You will receive a confirmation email shortly.
                </p>
              </>
            )}
            <Button asChild size="lg">
              <Link href={`${successHref}?order=${orderResult.orderId}`}>
                View Full Order Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
