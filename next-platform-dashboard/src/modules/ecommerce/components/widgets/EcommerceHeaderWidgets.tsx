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

import React from 'react';
import { cn } from '@/lib/utils';
import { useEcommerceStatus } from '@/modules/ecommerce/hooks/useModuleStatus';
import { CartIconWidget, CartIconWidgetProps } from './CartIconWidget';

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
}: EcommerceHeaderWidgetsProps) {
  const { isInstalled, isEnabled, isLoading } = useEcommerceStatus(siteId);

  // Don't render anything if module not ready
  if (isLoading || !isInstalled || !isEnabled) {
    return null;
  }

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
      {widgets.cart && (
        <CartIconWidget
          siteId={siteId}
          {...cartProps}
        />
      )}
      
      {/* Future: Wishlist widget */}
      {widgets.wishlist && (
        <div className="hidden">
          {/* WishlistIconWidget placeholder */}
        </div>
      )}
      
      {/* Future: Search widget */}
      {widgets.search && (
        <div className="hidden">
          {/* ProductSearchWidget placeholder */}
        </div>
      )}
    </div>
  );
}
