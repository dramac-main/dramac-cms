# PHASE-ECOM-52: Navigation & Widget Auto-Setup

> **Priority**: 🟠 HIGH
> **Estimated Time**: 6-8 hours
> **Prerequisites**: PHASE-ECOM-50, PHASE-ECOM-51
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the CartIconWidget component that displays in the site header with real-time cart item count, and enhance the navigation auto-setup system with a module status hook. This enables sites to automatically show a functional cart icon that updates dynamically as users add items to their cart.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-50 & PHASE-ECOM-51 are complete
- [ ] Review existing cart hooks in `src/modules/ecommerce/hooks/useStorefrontCart.ts`
- [ ] Review site header/layout components
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Cart Icon Widget System                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Site Header                                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Logo    │  Main Nav    │  Utility Nav                     │    │
│  │          │  (Shop link) │  ┌─────────────────┐             │    │
│  │          │              │  │ CartIconWidget  │             │    │
│  │          │              │  │ ┌───┐           │             │    │
│  │          │              │  │ │🛒│ 3 ◄─ badge │             │    │
│  │          │              │  │ └───┘           │             │    │
│  │          │              │  └────────┬────────┘             │    │
│  └──────────┴──────────────┴───────────┼──────────────────────┘    │
│                                        │                            │
│                        ┌───────────────┘                            │
│                        ▼                                            │
│  ┌─────────────────────────────────────┐                           │
│  │        useStorefrontCart()          │                           │
│  │  - items: CartItem[]                │                           │
│  │  - itemCount: number                │                           │
│  │  - cartTotal: number                │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│  Click Actions:                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Default: Open CartDrawer (slide-out panel)                  │  │
│  │  Option: Navigate to /cart page                              │  │
│  │  Mobile: Open MobileCartSheet (bottom sheet)                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/studio/components/CartIconWidget.tsx` | Create | Main cart icon component |
| `src/modules/ecommerce/hooks/useModuleStatus.ts` | Create | Check if module is installed |
| `src/modules/ecommerce/components/widgets/FloatingCartButton.tsx` | Create | Mobile floating cart button |
| `src/modules/ecommerce/studio/components/index.ts` | Modify | Export new components |
| `src/modules/ecommerce/hooks/index.ts` | Modify | Export new hooks |

---

## 📋 Implementation Tasks

### Task 52.1: Create Module Status Hook

**File**: `src/modules/ecommerce/hooks/useModuleStatus.ts`
**Action**: Create

**Description**: Hook to check if a module is installed and enabled on a site.

```typescript
/**
 * useModuleStatus Hook
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * Hook to check the installation status of a module on a site.
 * Used by header components to conditionally render module widgets.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ModuleStatus {
  /** Whether the module is installed on the site */
  isInstalled: boolean;
  
  /** Whether the module is currently enabled */
  isEnabled: boolean;
  
  /** Module settings if available */
  settings: Record<string, unknown> | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error if any */
  error: string | null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Check if a module is installed and enabled on a site
 * 
 * @param moduleId - The module ID to check
 * @param siteId - The site ID to check for
 * @returns Module status object
 * 
 * @example
 * ```tsx
 * function SiteHeader({ siteId }) {
 *   const { isInstalled, isEnabled } = useModuleStatus('ecommerce', siteId);
 *   
 *   return (
 *     <header>
 *       {isInstalled && isEnabled && <CartIconWidget siteId={siteId} />}
 *     </header>
 *   );
 * }
 * ```
 */
export function useModuleStatus(
  moduleId: string,
  siteId: string | null | undefined
): ModuleStatus {
  const [status, setStatus] = useState<ModuleStatus>({
    isInstalled: false,
    isEnabled: false,
    settings: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!siteId || !moduleId) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: !siteId ? 'No site ID provided' : 'No module ID provided',
      }));
      return;
    }

    let mounted = true;

    async function checkModuleStatus() {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('site_module_installations')
          .select('id, is_enabled, settings')
          .eq('site_id', siteId)
          .eq('module_id', moduleId)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          setStatus({
            isInstalled: false,
            isEnabled: false,
            settings: null,
            isLoading: false,
            error: error.message,
          });
          return;
        }

        setStatus({
          isInstalled: !!data,
          isEnabled: data?.is_enabled ?? false,
          settings: data?.settings ?? null,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;
        
        setStatus({
          isInstalled: false,
          isEnabled: false,
          settings: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    checkModuleStatus();

    return () => {
      mounted = false;
    };
  }, [moduleId, siteId]);

  return status;
}

/**
 * Check if e-commerce module is installed (convenience wrapper)
 */
export function useEcommerceStatus(siteId: string | null | undefined): ModuleStatus {
  return useModuleStatus('ecommerce', siteId);
}

/**
 * Get multiple module statuses at once
 */
export function useModulesStatus(
  moduleIds: string[],
  siteId: string | null | undefined
): Record<string, ModuleStatus> {
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>(() => {
    const initial: Record<string, ModuleStatus> = {};
    for (const id of moduleIds) {
      initial[id] = {
        isInstalled: false,
        isEnabled: false,
        settings: null,
        isLoading: true,
        error: null,
      };
    }
    return initial;
  });

  useEffect(() => {
    if (!siteId || moduleIds.length === 0) {
      return;
    }

    let mounted = true;

    async function checkStatuses() {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('site_module_installations')
          .select('module_id, is_enabled, settings')
          .eq('site_id', siteId)
          .in('module_id', moduleIds);

        if (!mounted) return;

        const newStatuses: Record<string, ModuleStatus> = {};
        
        for (const id of moduleIds) {
          const installation = data?.find(d => d.module_id === id);
          
          newStatuses[id] = {
            isInstalled: !!installation,
            isEnabled: installation?.is_enabled ?? false,
            settings: installation?.settings ?? null,
            isLoading: false,
            error: error?.message ?? null,
          };
        }

        setStatuses(newStatuses);
      } catch (err) {
        if (!mounted) return;
        
        const errorStatuses: Record<string, ModuleStatus> = {};
        for (const id of moduleIds) {
          errorStatuses[id] = {
            isInstalled: false,
            isEnabled: false,
            settings: null,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
        setStatuses(errorStatuses);
      }
    }

    checkStatuses();

    return () => {
      mounted = false;
    };
  }, [moduleIds.join(','), siteId]);

  return statuses;
}
```

---

### Task 52.2: Create Cart Icon Widget

**File**: `src/modules/ecommerce/studio/components/CartIconWidget.tsx`
**Action**: Create

**Description**: The main cart icon component for the site header.

```typescript
/**
 * CartIconWidget Component
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * A header cart icon that displays the current cart item count
 * and provides access to the cart via drawer or navigation.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorefrontCart } from '../../hooks/useStorefrontCart';
import { useMobile } from '../../hooks/useMobile';

// ============================================================================
// TYPES
// ============================================================================

export interface CartIconWidgetProps {
  /** Site ID to load cart for */
  siteId: string;
  
  /** What happens when clicked */
  clickAction?: 'drawer' | 'navigate' | 'custom';
  
  /** Custom click handler (when clickAction is 'custom') */
  onClick?: () => void;
  
  /** Navigate to this URL (when clickAction is 'navigate') */
  href?: string;
  
  /** Icon to use */
  icon?: 'cart' | 'bag';
  
  /** Show item count badge */
  showBadge?: boolean;
  
  /** Show total price instead of count */
  showTotal?: boolean;
  
  /** Badge position */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right';
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Color scheme */
  variant?: 'default' | 'outline' | 'ghost';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Aria label for accessibility */
  ariaLabel?: string;
  
  /** Callback when cart drawer should open */
  onOpenDrawer?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartIconWidget({
  siteId,
  clickAction = 'drawer',
  onClick,
  href = '/cart',
  icon = 'cart',
  showBadge = true,
  showTotal = false,
  badgePosition = 'top-right',
  size = 'md',
  variant = 'ghost',
  className,
  ariaLabel,
  onOpenDrawer,
}: CartIconWidgetProps) {
  const { cart, itemCount, cartTotal } = useStorefrontCart(siteId);
  const { isMobile } = useMobile();
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate badge when count changes
  React.useEffect(() => {
    if (itemCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  // Handle click
  const handleClick = useCallback(() => {
    if (clickAction === 'custom' && onClick) {
      onClick();
    } else if (clickAction === 'navigate') {
      window.location.href = href;
    } else if (clickAction === 'drawer') {
      onOpenDrawer?.();
    }
  }, [clickAction, onClick, href, onOpenDrawer]);

  // Icon component
  const IconComponent = icon === 'bag' ? ShoppingBag : ShoppingCart;

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  // Badge position classes
  const badgePositionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  // Format display value
  const displayValue = showTotal
    ? `$${cartTotal.toFixed(0)}`
    : itemCount > 99
    ? '99+'
    : itemCount.toString();

  const accessibilityLabel = ariaLabel ||
    `Shopping cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  // Wrapper - use link for navigation, button for drawer
  const WrapperComponent = clickAction === 'navigate' ? 'a' : 'button';
  const wrapperProps = clickAction === 'navigate'
    ? { href }
    : { type: 'button' as const, onClick: handleClick };

  return (
    <WrapperComponent
      {...wrapperProps}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={accessibilityLabel}
    >
      <IconComponent className={cn(iconSizeClasses[size], 'text-current')} />
      
      {/* Badge */}
      {showBadge && itemCount > 0 && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-red-500 text-white font-medium',
            badgeSizeClasses[size],
            badgePositionClasses[badgePosition],
            isAnimating && 'animate-bounce'
          )}
          aria-hidden="true"
        >
          {displayValue}
        </span>
      )}
    </WrapperComponent>
  );
}

// ============================================================================
// CART ICON WITH DRAWER
// ============================================================================

/**
 * Cart icon widget with integrated drawer
 * This is the most common usage pattern
 */
export function CartIconWithDrawer({
  siteId,
  ...props
}: Omit<CartIconWidgetProps, 'clickAction' | 'onOpenDrawer'>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isMobile } = useMobile();

  return (
    <>
      <CartIconWidget
        siteId={siteId}
        clickAction="drawer"
        onOpenDrawer={() => setIsDrawerOpen(true)}
        {...props}
      />
      
      {/* Conditionally render drawer based on device */}
      {isDrawerOpen && (
        <CartDrawerPortal
          siteId={siteId}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          variant={isMobile ? 'sheet' : 'drawer'}
        />
      )}
    </>
  );
}

// ============================================================================
// CART DRAWER PORTAL
// ============================================================================

interface CartDrawerPortalProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
  variant: 'drawer' | 'sheet';
}

/**
 * Portal component for cart drawer/sheet
 * Lazy loads the actual drawer component
 */
function CartDrawerPortal({ siteId, isOpen, onClose, variant }: CartDrawerPortalProps) {
  const [DrawerComponent, setDrawerComponent] = useState<React.ComponentType<{
    siteId: string;
    isOpen: boolean;
    onClose: () => void;
  }> | null>(null);

  React.useEffect(() => {
    if (isOpen && !DrawerComponent) {
      // Dynamically import the drawer component
      if (variant === 'sheet') {
        import('./mobile/MobileCartSheet').then(mod => {
          setDrawerComponent(() => mod.MobileCartSheet);
        });
      } else {
        import('./CartDrawerBlock').then(mod => {
          setDrawerComponent(() => mod.CartDrawerBlock);
        });
      }
    }
  }, [isOpen, variant, DrawerComponent]);

  if (!isOpen || !DrawerComponent) {
    return null;
  }

  return <DrawerComponent siteId={siteId} isOpen={isOpen} onClose={onClose} />;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CartIconWidget;
```

---

### Task 52.3: Create Floating Cart Button (Mobile)

**File**: `src/modules/ecommerce/components/widgets/FloatingCartButton.tsx`
**Action**: Create

**Description**: A floating action button for mobile that shows cart status.

```typescript
/**
 * FloatingCartButton Component
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * A floating action button for mobile devices that displays
 * the cart item count and provides quick access to the cart.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorefrontCart } from '../../hooks/useStorefrontCart';
import { useMobile } from '../../hooks/useMobile';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

// ============================================================================
// TYPES
// ============================================================================

export interface FloatingCartButtonProps {
  /** Site ID to load cart for */
  siteId: string;
  
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  
  /** Distance from edge (in pixels) */
  offset?: number;
  
  /** Hide when cart is empty */
  hideWhenEmpty?: boolean;
  
  /** Show cart total instead of count */
  showTotal?: boolean;
  
  /** Callback when clicked */
  onClick?: () => void;
  
  /** Show mini preview of cart items */
  showPreview?: boolean;
  
  /** Auto-hide after scroll */
  hideOnScroll?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FloatingCartButton({
  siteId,
  position = 'bottom-right',
  offset = 20,
  hideWhenEmpty = false,
  showTotal = false,
  onClick,
  showPreview = false,
  hideOnScroll = false,
  className,
}: FloatingCartButtonProps) {
  const { cart, itemCount, cartTotal } = useStorefrontCart(siteId);
  const { isMobile } = useMobile();
  const { trigger } = useHapticFeedback();
  
  const [isVisible, setIsVisible] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll (optional)
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnScroll, lastScrollY]);

  // Don't render on desktop or when cart is empty (if configured)
  if (!isMobile) return null;
  if (hideWhenEmpty && itemCount === 0) return null;

  // Position classes
  const positionClasses = {
    'bottom-right': 'right-0',
    'bottom-left': 'left-0',
    'bottom-center': 'left-1/2 -translate-x-1/2',
  };

  const positionStyle = {
    bottom: offset,
    ...(position === 'bottom-right' && { right: offset }),
    ...(position === 'bottom-left' && { left: offset }),
  };

  // Handle click with haptic feedback
  const handleClick = () => {
    trigger('light');
    
    if (showPreview) {
      setIsPreviewOpen(!isPreviewOpen);
    } else {
      onClick?.();
    }
  };

  // Format display value
  const displayValue = showTotal
    ? `$${cartTotal.toFixed(0)}`
    : itemCount.toString();

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300',
        positionClasses[position],
        !isVisible && 'translate-y-24 opacity-0',
        className
      )}
      style={positionStyle}
    >
      {/* Preview Panel */}
      {showPreview && isPreviewOpen && (
        <div
          className={cn(
            'absolute bottom-full mb-3 w-72 bg-white rounded-lg shadow-lg border p-4',
            position === 'bottom-right' && 'right-0',
            position === 'bottom-left' && 'left-0',
            position === 'bottom-center' && 'left-1/2 -translate-x-1/2'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Your Cart</h4>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Cart Preview Items */}
          {cart?.items && cart.items.length > 0 ? (
            <>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product?.name || 'Product'}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              {cart.items.length > 3 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{cart.items.length - 3} more items
                </p>
              )}
              
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
              </div>
              
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  onClick?.();
                }}
                className="mt-3 w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                View Cart
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              Your cart is empty
            </p>
          )}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={handleClick}
        className={cn(
          'relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200',
          'bg-black text-white hover:bg-gray-800 active:scale-95',
          'w-14 h-14',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black'
        )}
        aria-label={`View cart with ${itemCount} items`}
      >
        <ShoppingCart className="w-6 h-6" />
        
        {/* Badge */}
        {itemCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[20px] h-5 px-1.5 rounded-full',
              'bg-red-500 text-white text-xs font-bold',
              'animate-in zoom-in-50 duration-200'
            )}
          >
            {displayValue}
          </span>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FloatingCartButton;
```

---

### Task 52.4: Create Cart Badge Animation Styles

**File**: `src/modules/ecommerce/studio/components/cart-animations.css`
**Action**: Create

**Description**: CSS animations for cart badge updates.

```css
/**
 * Cart Icon Animation Styles
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 */

/* Badge pop animation when count changes */
@keyframes badge-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.cart-badge-animate {
  animation: badge-pop 0.3s ease-out;
}

/* Shake animation for empty cart click */
@keyframes cart-shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.cart-shake {
  animation: cart-shake 0.3s ease-in-out;
}

/* Pulse animation for new items */
@keyframes cart-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.cart-badge-pulse {
  animation: cart-pulse 1s ease-out;
}

/* Slide in animation for floating button */
@keyframes slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.floating-cart-enter {
  animation: slide-in-bottom 0.3s ease-out;
}

/* Mini cart preview slide */
@keyframes preview-slide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cart-preview-enter {
  animation: preview-slide 0.2s ease-out;
}
```

---

### Task 52.5: Create Header Integration Component

**File**: `src/modules/ecommerce/studio/components/EcommerceHeaderWidgets.tsx`
**Action**: Create

**Description**: A wrapper component that adds all e-commerce widgets to the header.

```typescript
/**
 * EcommerceHeaderWidgets Component
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * Wrapper component that conditionally renders e-commerce widgets
 * in the site header based on module installation status.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { CartIconWidget } from './CartIconWidget';
import { useEcommerceStatus } from '../../hooks/useModuleStatus';
import { useStorefrontCart } from '../../hooks/useStorefrontCart';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface EcommerceHeaderWidgetsProps {
  /** Site ID to load data for */
  siteId: string;
  
  /** Show cart icon */
  showCart?: boolean;
  
  /** Show wishlist icon */
  showWishlist?: boolean;
  
  /** Show search icon (opens search modal) */
  showSearch?: boolean;
  
  /** Cart click action */
  cartAction?: 'drawer' | 'navigate';
  
  /** Cart navigation URL */
  cartHref?: string;
  
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EcommerceHeaderWidgets({
  siteId,
  showCart = true,
  showWishlist = false,
  showSearch = false,
  cartAction = 'drawer',
  cartHref = '/cart',
  className,
}: EcommerceHeaderWidgetsProps) {
  const { isInstalled, isEnabled, isLoading } = useEcommerceStatus(siteId);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Don't render anything if module is not installed or enabled
  if (isLoading) {
    // Optional: Show placeholder while loading
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!isInstalled || !isEnabled) {
    return null;
  }

  const handleOpenCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(true);
  }, []);

  const handleCloseCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
  }, []);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Search Icon */}
      {showSearch && (
        <SearchIconWidget siteId={siteId} />
      )}

      {/* Wishlist Icon */}
      {showWishlist && (
        <WishlistIconWidget siteId={siteId} />
      )}

      {/* Cart Icon */}
      {showCart && (
        <>
          <CartIconWidget
            siteId={siteId}
            clickAction={cartAction}
            href={cartHref}
            onOpenDrawer={handleOpenCartDrawer}
            size="md"
            variant="ghost"
          />
          
          {/* Cart Drawer (lazy loaded) */}
          {isCartDrawerOpen && (
            <CartDrawerLazy
              siteId={siteId}
              isOpen={isCartDrawerOpen}
              onClose={handleCloseCartDrawer}
            />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// SEARCH ICON WIDGET
// ============================================================================

interface SearchIconWidgetProps {
  siteId: string;
}

function SearchIconWidget({ siteId }: SearchIconWidgetProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsSearchOpen(true)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Search products"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Search Modal (lazy loaded) */}
      {isSearchOpen && (
        <SearchModalLazy
          siteId={siteId}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// WISHLIST ICON WIDGET
// ============================================================================

interface WishlistIconWidgetProps {
  siteId: string;
}

function WishlistIconWidget({ siteId }: WishlistIconWidgetProps) {
  // TODO: Implement wishlist count from useStorefrontWishlist
  const wishlistCount = 0;

  return (
    <a
      href="/wishlist"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label={`Wishlist with ${wishlistCount} items`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>

      {wishlistCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium">
          {wishlistCount}
        </span>
      )}
    </a>
  );
}

// ============================================================================
// LAZY LOADED COMPONENTS
// ============================================================================

interface CartDrawerLazyProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
}

function CartDrawerLazy({ siteId, isOpen, onClose }: CartDrawerLazyProps) {
  const [Component, setComponent] = useState<React.ComponentType<{
    siteId: string;
    isOpen: boolean;
    onClose: () => void;
  }> | null>(null);

  React.useEffect(() => {
    import('./CartDrawerBlock').then(mod => {
      setComponent(() => mod.CartDrawerBlock);
    });
  }, []);

  if (!Component) {
    return null;
  }

  return <Component siteId={siteId} isOpen={isOpen} onClose={onClose} />;
}

interface SearchModalLazyProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
}

function SearchModalLazy({ siteId, isOpen, onClose }: SearchModalLazyProps) {
  const [Component, setComponent] = useState<React.ComponentType<{
    siteId: string;
    isOpen: boolean;
    onClose: () => void;
  }> | null>(null);

  React.useEffect(() => {
    import('./SearchBarBlock').then(mod => {
      // Assume SearchBarBlock has a modal variant
      setComponent(() => mod.SearchModal || mod.SearchBarBlock);
    }).catch(() => {
      // Fallback if modal doesn't exist
      setComponent(null);
    });
  }, []);

  if (!Component) {
    return null;
  }

  return <Component siteId={siteId} isOpen={isOpen} onClose={onClose} />;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EcommerceHeaderWidgets;
```

---

### Task 52.6: Update Studio Components Index

**File**: `src/modules/ecommerce/studio/components/index.ts`
**Action**: Modify

**Description**: Export the new widget components.

```typescript
/**
 * E-Commerce Studio Components Index
 * 
 * Central exports for all Studio components.
 */

// ============================================================================
// PRODUCT COMPONENTS
// ============================================================================

export { default as ProductCardBlock, ProductCardBlock as ProductCard } from './product-card-block';
export { default as ProductGridBlock, ProductGridBlock as ProductGrid } from './product-grid-block';
export { ProductGridBlock as ProductGridBlockAlt } from './ProductGridBlock';
export { FeaturedProductsBlock } from './FeaturedProductsBlock';
export { ProductImageGallery } from './ProductImageGallery';
export { ProductPriceDisplay } from './ProductPriceDisplay';
export { ProductQuickView } from './ProductQuickView';
export { ProductRatingDisplay } from './ProductRatingDisplay';
export { ProductSortBlock } from './ProductSortBlock';
export { ProductStockBadge } from './ProductStockBadge';

// ============================================================================
// CART COMPONENTS
// ============================================================================

export { CartDrawerBlock } from './CartDrawerBlock';
export { CartPageBlock } from './CartPageBlock';
export { CartItemCard } from './CartItemCard';
export { CartSummaryCard } from './CartSummaryCard';
export { CartQuantitySelector } from './CartQuantitySelector';
export { CartDiscountInput } from './CartDiscountInput';
export { CartEmptyState } from './CartEmptyState';
export { MiniCartBlock } from './MiniCartBlock';

// ============================================================================
// CHECKOUT COMPONENTS
// ============================================================================

export { CheckoutPageBlock } from './CheckoutPageBlock';
export { CheckoutStepIndicator } from './CheckoutStepIndicator';
export { OrderConfirmationBlock } from './OrderConfirmationBlock';
export { OrderSummaryCard } from './OrderSummaryCard';
export { AddressForm } from './AddressForm';
export { PaymentMethodSelector } from './PaymentMethodSelector';
export { ShippingMethodSelector } from './ShippingMethodSelector';

// ============================================================================
// NAVIGATION & DISCOVERY COMPONENTS
// ============================================================================

export { CategoryNavBlock } from './CategoryNavBlock';
export { CategoryCard } from './CategoryCard';
export { BreadcrumbBlock } from './BreadcrumbBlock';
export { SearchBarBlock } from './SearchBarBlock';
export { FilterSidebarBlock } from './FilterSidebarBlock';
export { ActiveFilters } from './ActiveFilters';

// ============================================================================
// QUOTE COMPONENTS
// ============================================================================

export { QuoteRequestBlock } from './QuoteRequestBlock';
export { QuoteListBlock } from './QuoteListBlock';
export { QuoteDetailBlock } from './QuoteDetailBlock';
export { QuoteItemCard } from './QuoteItemCard';
export { QuotePriceBreakdown } from './QuotePriceBreakdown';
export { QuoteStatusBadge } from './QuoteStatusBadge';
export { QuoteActionButtons } from './QuoteActionButtons';

// ============================================================================
// HEADER WIDGETS (PHASE-ECOM-52)
// ============================================================================

export { CartIconWidget, CartIconWithDrawer } from './CartIconWidget';
export { EcommerceHeaderWidgets } from './EcommerceHeaderWidgets';

// ============================================================================
// MOBILE COMPONENTS
// ============================================================================

export * from './mobile';
```

---

### Task 52.7: Update Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

**Description**: Add the new module status hook export.

```typescript
/**
 * E-Commerce Module Hooks
 * 
 * Central exports for all e-commerce hooks.
 */

// ============================================================================
// STOREFRONT HOOKS (Existing - Waves 1-5)
// ============================================================================

export { useStorefrontProducts } from './useStorefrontProducts';
export { useStorefrontCart } from './useStorefrontCart';
export { useStorefrontCategories } from './useStorefrontCategories';
export { useStorefrontSearch } from './useStorefrontSearch';
export { useStorefrontWishlist } from './useStorefrontWishlist';
export { useCheckout } from './useCheckout';
export { useQuotations } from './useQuotations';
export { useRecentlyViewed } from './useRecentlyViewed';

// ============================================================================
// MOBILE HOOKS (Wave 4)
// ============================================================================

export { useMobile } from './useMobile';
export { useSwipeGesture } from './useSwipeGesture';
export { useHapticFeedback } from './useHapticFeedback';
export { useKeyboardVisible } from './useKeyboardVisible';

// ============================================================================
// FILTER & ANALYTICS HOOKS (Waves 3-5)
// ============================================================================

export { useProductFilters } from './useProductFilters';
export { useAnalytics } from './use-analytics';
export { useMarketing } from './use-marketing';
export { useIntegrations } from './use-integrations';

// ============================================================================
// MODULE STATUS HOOKS (Wave 6 - PHASE-ECOM-52)
// ============================================================================

export {
  useModuleStatus,
  useEcommerceStatus,
  useModulesStatus,
} from './useModuleStatus';

// ============================================================================
// INSTALLATION HOOK (Wave 6 - PHASE-ECOM-50)
// ============================================================================

export { ecommerceInstallationHook } from './installation-hook';
```

---

## 🗄️ Database Migrations

No new database tables required for this phase.

---

## 🔧 Type Definitions

All types are defined inline in the component files.

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] useModuleStatus tests:
  - [ ] Returns isLoading=true initially
  - [ ] Returns isInstalled=true when module is installed
  - [ ] Returns isEnabled correctly based on module status
  - [ ] Returns settings from module installation
  - [ ] Handles errors gracefully
- [ ] CartIconWidget tests:
  - [ ] Displays correct item count
  - [ ] Badge animates when count changes
  - [ ] Click opens drawer when clickAction='drawer'
  - [ ] Click navigates when clickAction='navigate'
  - [ ] Accessibility label is correct
- [ ] FloatingCartButton tests:
  - [ ] Only renders on mobile
  - [ ] Shows correct item count
  - [ ] Hides on scroll (when configured)
  - [ ] Preview panel opens correctly
- [ ] EcommerceHeaderWidgets tests:
  - [ ] Renders nothing when module not installed
  - [ ] Renders cart icon when module installed
  - [ ] Cart drawer opens correctly
- [ ] Integration test:
  - [ ] Install e-commerce module
  - [ ] Header shows cart icon
  - [ ] Cart icon shows correct count
  - [ ] Click opens cart drawer

---

## 🔄 Rollback Plan

If issues occur:

1. **Revert component files**:
   - Delete new widget components
   - Revert index exports

2. **Navigation items remain unchanged**:
   - The PHASE-ECOM-51 navigation setup is separate
   - Cart icon widget is additive

3. **Verify clean state**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add PHASE-ECOM-52 completion note
- `progress.md`: Update Wave 6 section

---

## ✨ Success Criteria

- [ ] `useModuleStatus` hook correctly checks installation status
- [ ] `CartIconWidget` displays real-time cart count
- [ ] Badge animates when items are added
- [ ] Cart drawer opens on click (desktop)
- [ ] Floating cart button works on mobile
- [ ] `EcommerceHeaderWidgets` conditionally renders based on module status
- [ ] Components are properly lazy-loaded
- [ ] All accessibility requirements met
- [ ] All TypeScript compiles without errors

---

## 📚 Related Phases

- **PHASE-ECOM-50**: Installation Hooks (triggers navigation setup)
- **PHASE-ECOM-51**: Auto-Page Generation (creates pages)
- **PHASE-ECOM-53**: Onboarding Wizard (guides configuration)

This phase provides the visual cart integration that users see in the header after module installation.
