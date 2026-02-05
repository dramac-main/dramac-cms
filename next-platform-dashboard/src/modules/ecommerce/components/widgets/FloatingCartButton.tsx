/**
 * FloatingCartButton
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * Floating action button for mobile devices that shows cart count
 * and provides quick access to the cart page.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEcommerceStatus } from '@/modules/ecommerce/hooks/useModuleStatus';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface FloatingCartButtonProps {
  /** Site ID to fetch cart for */
  siteId: string;
  
  /** Custom class name */
  className?: string;
  
  /** Cart page URL (default: /shop/cart) */
  cartUrl?: string;
  
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  
  /** Whether to show on desktop too (default: mobile only) */
  showOnDesktop?: boolean;
  
  /** Whether button can be dismissed */
  dismissible?: boolean;
  
  /** Only show when cart has items */
  hideWhenEmpty?: boolean;
  
  /** Custom onClick handler */
  onClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FloatingCartButton({
  siteId,
  className,
  cartUrl = '/shop/cart',
  position = 'bottom-right',
  showOnDesktop = false,
  dismissible = false,
  hideWhenEmpty = false,
  onClick,
}: FloatingCartButtonProps) {
  const { isInstalled, isEnabled, isLoading: moduleLoading } = useEcommerceStatus(siteId);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch cart count (same logic as CartIconWidget)
  useEffect(() => {
    if (!siteId || !isInstalled || !isEnabled) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function fetchCartCount() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // Check local storage for guest cart
          if (typeof window !== 'undefined') {
            const guestCart = localStorage.getItem(`cart_${siteId}`);
            if (guestCart) {
              try {
                const parsed = JSON.parse(guestCart);
                if (mounted) {
                  setCartCount(parsed.items?.length ?? 0);
                }
              } catch {
                // Invalid cart data
              }
            }
          }
          if (mounted) setIsLoading(false);
          return;
        }

        const { data: cart } = await db
          .from('ecommerce_carts')
          .select('id')
          .eq('site_id', siteId)
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!cart) {
          if (mounted) {
            setCartCount(0);
            setIsLoading(false);
          }
          return;
        }

        const { count } = await db
          .from('ecommerce_cart_items')
          .select('id', { count: 'exact', head: true })
          .eq('cart_id', cart.id);

        if (mounted) {
          setCartCount(count ?? 0);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching cart count:', err);
        if (mounted) setIsLoading(false);
      }
    }

    fetchCartCount();

    // Subscribe to cart changes
    const channel = createClient()
      .channel(`floating_cart_${siteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ecommerce_cart_items',
        },
        () => {
          fetchCartCount();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [siteId, isInstalled, isEnabled]);

  // Don't render in various conditions
  if (moduleLoading || !isInstalled || !isEnabled || isDismissed) {
    return null;
  }

  if (hideWhenEmpty && cartCount === 0) {
    return null;
  }

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const visibilityClasses = showOnDesktop
    ? ''
    : 'md:hidden'; // Hide on desktop by default

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    
    // Store dismissal in session storage so it persists during session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`cart_fab_dismissed_${siteId}`, 'true');
    }
  };

  // Check if previously dismissed this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDismissed = sessionStorage.getItem(`cart_fab_dismissed_${siteId}`);
      if (wasDismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [siteId]);

  const buttonContent = (
    <div
      className={cn(
        'fixed z-50',
        positionClasses[position],
        visibilityClasses,
        className
      )}
    >
      <div className="relative">
        <Button
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'bg-primary hover:bg-primary/90',
            'transition-transform hover:scale-105 active:scale-95',
            isLoading && 'animate-pulse'
          )}
          onClick={onClick}
          aria-label={`Shopping cart with ${cartCount} items`}
        >
          <ShoppingCart className="h-6 w-6" />
        </Button>
        
        {/* Badge */}
        {cartCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1',
              'flex items-center justify-center',
              'h-6 w-6 rounded-full',
              'bg-destructive text-destructive-foreground',
              'text-xs font-bold shadow-sm'
            )}
          >
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'absolute -top-2 -left-2',
              'flex items-center justify-center',
              'h-5 w-5 rounded-full',
              'bg-muted hover:bg-muted/80',
              'text-muted-foreground',
              'shadow-sm transition-colors'
            )}
            aria-label="Dismiss cart button"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );

  // If custom onClick, don't wrap in link
  if (onClick) {
    return buttonContent;
  }

  return (
    <Link href={cartUrl} className="contents">
      {buttonContent}
    </Link>
  );
}
