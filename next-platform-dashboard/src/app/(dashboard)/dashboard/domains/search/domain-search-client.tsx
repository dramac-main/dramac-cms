"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DomainSearch } from "@/components/domains";
import type { DomainSearchResult, DomainCartItem } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
export function DomainSearchClient() {
  const router = useRouter();
  const [cart, setCart] = useState<DomainCartItem[]>([]);

  const handleAddToCart = (domain: DomainSearchResult) => {
    // Check if already in cart
    if (cart.some(item => item.domainName === domain.domain)) {
      toast.info('Domain already in cart');
      return;
    }

    // Calculate privacy price using same markup ratio as the domain itself
    // ResellerClub charges ~$3/year wholesale for WHOIS privacy
    const wholesaleBase = Number(domain.prices.register[1] ?? domain.prices.register['1' as any]) || 1;
    const retailBase = Number(domain.retailPrices.register[1] ?? domain.retailPrices.register['1' as any]) || wholesaleBase;
    const markupRatio = wholesaleBase > 0 ? retailBase / wholesaleBase : 1;
    const privacyCostPerYear = Math.round(3 * markupRatio * 100) / 100;

    const item: DomainCartItem = {
      type: 'registration',
      domainName: domain.domain,
      years: 1,
      wholesalePrice: Number(domain.prices.register[1] ?? domain.prices.register['1' as any]) || 0,
      retailPrice: Number(domain.retailPrices.register[1] ?? domain.retailPrices.register['1' as any]) || 0,
      wholesalePrices: { ...domain.prices.register },
      retailPrices: { ...domain.retailPrices.register },
      privacy: false,  // Default OFF — let the customer opt-in on the cart page
      privacyPrice: privacyCostPerYear,
    };

    setCart(prev => [...prev, item]);
    toast.success(`${domain.domain} added to cart`);
  };

  const handleProceedToCheckout = () => {
    // Store cart in sessionStorage and navigate
    sessionStorage.setItem('domainCart', JSON.stringify(cart));
    router.push('/dashboard/domains/cart');
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

  const totalPrice = cart.reduce((sum, item) => 
    sum + getRetailForYears(item) + (item.privacy ? item.privacyPrice * item.years : 0), 
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <DomainSearch onAddToCart={handleAddToCart} />
      
      {/* Floating Cart */}
      {cart.length > 0 && (
        <Card className="fixed bottom-6 right-6 w-80 shadow-lg border-primary/50 z-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-semibold">Cart ({cart.length})</span>
              </div>
              <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
              {cart.map((item, index) => (
                <div key={item.domainName} className="flex justify-between text-sm">
                  <span className="truncate flex-1">{item.domainName}</span>
                  <button 
                    className="text-muted-foreground hover:text-destructive ml-2"
                    onClick={() => setCart(prev => prev.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <Button className="w-full gap-2" onClick={handleProceedToCheckout}>
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
