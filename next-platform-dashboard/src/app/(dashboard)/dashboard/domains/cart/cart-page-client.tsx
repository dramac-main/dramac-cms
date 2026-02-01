"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DomainCheckout, type ContactFormData } from "@/components/domains";
import type { DomainCartItem } from "@/types/domain";
import { registerDomain } from "@/lib/actions/domains";
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

  const handleComplete = async (contactInfo: ContactFormData) => {
    // Register each domain
    const results = await Promise.all(
      cart.map(async (item) => {
        try {
          const result = await registerDomain({
            domainName: item.domainName,
            years: item.years,
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
            privacy: item.privacy,
            autoRenew: true,
          });
          return { domain: item.domainName, success: result.success, error: result.error };
        } catch (error) {
          return { domain: item.domainName, success: false, error: 'Registration failed' };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      toast.success(`Successfully registered ${successful.length} domain(s)`);
    }
    
    if (failed.length > 0) {
      failed.forEach(f => {
        toast.error(`Failed to register ${f.domain}: ${f.error}`);
      });
    }

    // Clear cart
    sessionStorage.removeItem('domainCart');

    // Redirect to domains list
    setTimeout(() => {
      router.push('/dashboard/domains');
    }, 2000);
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
