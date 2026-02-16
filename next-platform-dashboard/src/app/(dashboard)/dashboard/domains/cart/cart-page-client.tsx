"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DomainCheckout, type ContactFormData } from "@/components/domains";
import type { DomainCartItem } from "@/types/domain";
import { createDomainCartCheckout } from "@/lib/actions/domains";
import { openPaddleTransactionCheckout } from "@/lib/paddle/paddle-client";
import { toast } from "sonner";

export function CartPageClient() {
  const router = useRouter();
  const [cart, setCart] = useState<DomainCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load cart from sessionStorage
    const savedCart = sessionStorage.getItem('domainCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        console.error('Failed to parse cart');
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem('domainCart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  const handleUpdateItem = (index: number, updates: Partial<DomainCartItem>) => {
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.info('Domain removed from cart');
  };

  const handleComplete = async (contactInfo: ContactFormData): Promise<void | { checkoutUrl: string }> => {
    // Create checkout for all domains in cart
    // Helper to get the correct retail price for the selected year count
    const getRetailForYears = (item: DomainCartItem): number => {
      if (item.retailPrices?.[item.years]) return item.retailPrices[item.years];
      return Math.round((item.retailPrices?.[1] || item.retailPrice || 0) * item.years * 100) / 100;
    };
    const getWholesaleForYears = (item: DomainCartItem): number => {
      if (item.wholesalePrices?.[item.years]) return item.wholesalePrices[item.years];
      return Math.round((item.wholesalePrices?.[1] || item.wholesalePrice || 0) * item.years * 100) / 100;
    };

    const result = await createDomainCartCheckout({
      domains: cart.map(item => ({
        domainName: item.domainName,
        years: item.years,
        privacy: item.privacy,
        autoRenew: true,
        // Pass the exact prices the user saw on screen
        displayedRetailPrice: getRetailForYears(item) + (item.privacy ? item.privacyPrice * item.years : 0),
        displayedWholesalePrice: getWholesaleForYears(item) + (item.privacy ? 3 * item.years : 0),
        privacyPrice: item.privacyPrice,
      })),
      contactInfo: {
        name: contactInfo.name,
        email: contactInfo.email,
        company: contactInfo.company,
        address: contactInfo.address,
        city: contactInfo.city,
        state: contactInfo.state,
        country: contactInfo.country,
        zipcode: contactInfo.zipcode,
        phone: contactInfo.phone,
      },
    });

    if (!result.success || !result.data) {
      // Throw so checkout component catches and stays on contact step
      throw new Error(result.error || 'Failed to create checkout');
    }

    // Clear cart before opening checkout
    sessionStorage.removeItem('domainCart');
    
    // Open Paddle transaction checkout for one-time domain purchase
    const successUrl = `${window.location.origin}/dashboard/domains/success?purchase_id=${result.data.pendingPurchaseId}`;
    
    try {
      await openPaddleTransactionCheckout({
        transactionId: result.data.transactionId,
        successUrl,
      });
    } catch (paddleError) {
      console.error('[Cart] Paddle checkout error:', paddleError);
      // If Paddle overlay fails, redirect to checkout URL directly
      if (result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
        return { checkoutUrl: result.data.checkoutUrl };
      }
      throw new Error('Failed to open payment checkout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">
          Search for domains to add them to your cart
        </p>
        <button 
          className="mt-4 text-primary hover:underline"
          onClick={() => router.push('/dashboard/domains/search')}
        >
          Search for domains
        </button>
      </div>
    );
  }

  return (
    <DomainCheckout
      items={cart}
      onUpdateItem={handleUpdateItem}
      onRemoveItem={handleRemoveItem}
      onComplete={handleComplete}
    />
  );
}
