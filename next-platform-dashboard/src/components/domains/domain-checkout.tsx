"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DomainContactForm, type ContactFormData } from "./domain-contact-form";
import { DomainCartComponent } from "./domain-cart";
import type { DomainCartItem } from "@/types/domain";
import { cn } from "@/lib/utils";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
type CheckoutStep = 'cart' | 'contact' | 'confirmation';

interface DomainCheckoutProps {
  items: DomainCartItem[];
  onUpdateItem: (index: number, updates: Partial<DomainCartItem>) => void;
  onRemoveItem: (index: number) => void;
  onComplete: (contactInfo: ContactFormData) => Promise<void | { checkoutUrl: string }>;
  className?: string;
}

export function DomainCheckout({
  items,
  onUpdateItem,
  onRemoveItem,
  onComplete,
  className,
}: DomainCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactFormData | null>(null);

  const handleProceedToContact = () => {
    setStep('contact');
  };

  const handleContactSubmit = async (data: ContactFormData) => {
    setContactInfo(data);
    setIsSubmitting(true);
    
    try {
      const result = await onComplete(data);
      
      // Check if result contains checkout URL (Paddle redirect)
      if (result && typeof result === 'object' && 'checkoutUrl' in result) {
        // Redirect to Paddle checkout
        window.location.href = result.checkoutUrl as string;
        return;
      }
      
      // Paddle overlay opened successfully — don't advance to confirmation
      // The success page handles post-payment flow
      setIsSubmitting(false);
    } catch (error) {
      console.error('Checkout error:', error);
      setIsSubmitting(false);
      // Show error toast — user stays on contact step to retry
      const { toast } = await import('sonner');
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to process checkout. Please try again.'
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };

  // RC API register[N] = per-year rate for N-year tenure. Total = rate * years.
  const getRetailForYears = (item: DomainCartItem): number => {
    const perYearForTenure = Number(
      item.retailPrices?.[item.years] ?? item.retailPrices?.[String(item.years) as any] ?? 0
    );
    const perYear = perYearForTenure > 0
      ? perYearForTenure
      : Number(item.retailPrices?.[1] ?? item.retailPrices?.['1' as any]) || item.retailPrice || 0;
    return Math.round(perYear * item.years * 100) / 100;
  };

  const totalPrice = items.reduce((total, item) => {
    return total + getRetailForYears(item) + (item.privacy ? item.privacyPrice * item.years : 0);
  }, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {['cart', 'contact', 'confirmation'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s || ['cart', 'contact', 'confirmation'].indexOf(step) > i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span className={cn(
              "text-sm hidden sm:inline",
              step === s ? "font-medium" : "text-muted-foreground"
            )}>
              {s === 'cart' ? 'Cart' : s === 'contact' ? 'Contact Info' : 'Confirmation'}
            </span>
            {i < 2 && (
              <div className="w-12 h-px bg-muted mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Cart Step */}
      {step === 'cart' && (
        <DomainCartComponent
          items={items}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
          onCheckout={handleProceedToContact}
        />
      )}

      {/* Contact Info Step */}
      {step === 'contact' && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setStep('cart')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DomainContactForm
                onSubmit={handleContactSubmit}
                defaultValues={contactInfo || undefined}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4 sticky top-4">
                <h3 className="font-semibold">Order Summary</h3>
                
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.domainName} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.domainName} ({item.years}yr)</span>
                      <span>
                        {formatPrice(getRetailForYears(item) + (item.privacy ? item.privacyPrice * item.years : 0))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {step === 'confirmation' && (
        <div className="text-center py-12">
          {isSubmitting ? (
            <>
              <Loader2 className="h-16 w-16 mx-auto animate-spin text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">Processing your order...</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we register your domains.
              </p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold">Order Complete!</h2>
              <p className="text-muted-foreground mt-2">
                Your domains have been registered successfully.
              </p>
              <Button className="mt-6" onClick={() => window.location.href = '/dashboard/domains'}>
                View My Domains
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
