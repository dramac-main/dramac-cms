/**
 * EcommerceHeaderWidgets
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * Composite widget that renders all e-commerce header elements.
 * Use this component in site headers to automatically show/hide
 * e-commerce widgets based on module installation status.
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Heart, Search, X } from 'lucide-react';
import { useEcommerceStatus } from '@/modules/ecommerce/hooks/useModuleStatus';
import { CartIconWidget, CartIconWidgetProps } from './CartIconWidget';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStorefrontWishlist } from '@/modules/ecommerce/hooks/useStorefrontWishlist';

// ============================================================================
// TYPES
// ============================================================================

export interface EcommerceHeaderWidgetsProps {
  /** Site ID */
  siteId: string;
  
  /** Custom class name for the container */
  className?: string;
  
  /** Cart widget props override */
  cartProps?: Partial<Omit<CartIconWidgetProps, 'siteId'>>;
  
  /** Which widgets to show */
  widgets?: {
    cart?: boolean;
    wishlist?: boolean; // Future feature
    search?: boolean;   // Future feature
  };
  
  /** Wishlist page URL (default: /shop/wishlist) */
  wishlistUrl?: string;
  
  /** Search page URL (default: /shop/search) */
  searchUrl?: string;
  
  /** Gap between widgets */
  gap?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EcommerceHeaderWidgets({
  siteId,
  className,
  cartProps,
  widgets = { cart: true },
  gap = 'sm',
  wishlistUrl = '/shop/wishlist',
  searchUrl = '/shop/search',
}: EcommerceHeaderWidgetsProps) {
  const { isInstalled, isEnabled, isLoading } = useEcommerceStatus(siteId);
  const wishlist = widgets.wishlist ? useStorefrontWishlist(siteId) : null;
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Don't render anything if module not ready
  if (isLoading || !isInstalled || !isEnabled) {
    return null;
  }

  const wishlistCount = wishlist?.items?.length ?? 0;

  // Gap classes
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-4',
  };

  return (
    <div
      className={cn(
        'flex items-center',
        gapClasses[gap],
        className
      )}
    >
      {/* Search widget */}
      {widgets.search && (
        showSearchInput ? (
          <div className="flex items-center gap-1">
            <form action={searchUrl} method="get" className="flex items-center">
              <input
                type="text"
                name="q"
                placeholder="Search products..."
                autoFocus
                className="h-8 w-32 sm:w-48 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSearchInput(false)}
              aria-label="Close search"
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowSearchInput(true)}
                aria-label="Search products"
              >
                <Search size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search products</p>
            </TooltipContent>
          </Tooltip>
        )
      )}

      {/* Wishlist widget */}
      {widgets.wishlist && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              asChild
            >
              <a href={wishlistUrl} aria-label={`Wishlist${wishlistCount > 0 ? ` with ${wishlistCount} items` : ''}`}>
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{wishlistCount === 0 ? 'Wishlist is empty' : `${wishlistCount} item${wishlistCount !== 1 ? 's' : ''} in wishlist`}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Cart widget */}
      {widgets.cart && (
        <CartIconWidget
          siteId={siteId}
          {...cartProps}
        />
      )}
    </div>
  );
}
