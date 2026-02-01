"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DomainSearch } from "@/components/domains";
import type { DomainSearchResult, DomainCartItem } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function DomainSearchClient() {
  const router = useRouter();
  const [cart, setCart] = useState<DomainCartItem[]>([]);

  const handleAddToCart = (domain: DomainSearchResult) => {
    // Check if already in cart
    if (cart.some(item => item.domainName === domain.domain)) {
      toast.info('Domain already in cart');
      return;
    }

    const item: DomainCartItem = {
      type: 'registration',
      domainName: domain.domain,
      years: 1,
      wholesalePrice: domain.prices.register[1] || 0,
      retailPrice: domain.retailPrices.register[1] || 0,
      privacy: true,
      privacyPrice: 0, // Free privacy
    };

    setCart(prev => [...prev, item]);
    toast.success(`${domain.domain} added to cart`);
  };

  const handleProceedToCheckout = () => {
    // Store cart in sessionStorage and navigate
    sessionStorage.setItem('domainCart', JSON.stringify(cart));
    router.push('/dashboard/domains/cart');
  };

  const totalPrice = cart.reduce((sum, item) => 
    sum + (item.retailPrice + (item.privacy ? item.privacyPrice : 0)) * item.years, 
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
