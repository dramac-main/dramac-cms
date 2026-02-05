/**
 * CartIconWidget
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * Header cart icon that displays the current cart count.
 * Shows when e-commerce module is installed and enabled.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEcommerceStatus } from '@/modules/ecommerce/hooks/useModuleStatus';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CartIconWidgetProps {
  /** Site ID to fetch cart for */
  siteId: string;
  
  /** Custom class name */
  className?: string;
  
  /** Cart page URL (default: /shop/cart) */
  cartUrl?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show count badge even when zero */
  showZeroBadge?: boolean;
  
  /** Custom onClick handler (overrides default link behavior) */
  onClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartIconWidget({
  siteId,
  className,
  cartUrl = '/shop/cart',
  size = 'md',
  showZeroBadge = false,
  onClick,
}: CartIconWidgetProps) {
  const { isInstalled, isEnabled, isLoading: moduleLoading } = useEcommerceStatus(siteId);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart count
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
        
        // Get current user's session
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

        // Fetch from database for authenticated users
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
      .channel(`cart_updates_${siteId}`)
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

    // Also listen to local storage changes for guest cart
    function handleStorageChange(e: StorageEvent) {
      if (e.key === `cart_${siteId}`) {
        fetchCartCount();
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      mounted = false;
      channel.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [siteId, isInstalled, isEnabled]);

  // Don't render if module not installed/enabled
  if (moduleLoading || !isInstalled || !isEnabled) {
    return null;
  }

  // Size variants
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const badgeSizes = {
    sm: 'h-4 w-4 text-[10px]',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
  };

  const badgePositions = {
    sm: '-top-1 -right-1',
    md: '-top-1.5 -right-1.5',
    lg: '-top-2 -right-2',
  };

  const showBadge = cartCount > 0 || showZeroBadge;

  const content = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', sizeClasses[size], className)}
      onClick={onClick}
      disabled={isLoading}
      aria-label={`Shopping cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
    >
      <ShoppingCart size={iconSizes[size]} />
      
      {showBadge && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full',
            'bg-primary text-primary-foreground font-medium',
            badgeSizes[size],
            badgePositions[size],
            isLoading && 'animate-pulse'
          )}
        >
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Button>
  );

  // If custom onClick provided, don't wrap in Link
  if (onClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p>{cartCount === 0 ? 'Your cart is empty' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in cart`}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={cartUrl}>
          {content}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{cartCount === 0 ? 'Your cart is empty' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in cart`}</p>
      </TooltipContent>
    </Tooltip>
  );
}
