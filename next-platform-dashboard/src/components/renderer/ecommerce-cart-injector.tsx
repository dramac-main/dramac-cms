/**
 * Ecommerce Cart Injector
 *
 * Automatically injects the e-commerce cart widget into published sites
 * when the ecommerce module is installed and active.
 *
 * Follows the same auto-injection pattern as LiveChatWidgetInjector.
 * Renders as a floating cart button (fixed position) so it appears on
 * every page of the site without requiring a block to be placed manually.
 *
 * Industry Standard: Every major e-commerce platform (Shopify, WooCommerce,
 * BigCommerce) auto-injects a persistent cart icon into the storefront
 * whenever the cart module is active.
 *
 * @phase ECOM-52 - Navigation & Widget Auto-Setup
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { StorefrontProvider } from '@/modules/ecommerce/context/storefront-context'
import { useEcommerceStatus } from '@/modules/ecommerce/hooks/useModuleStatus'
import { CartIconWidget } from '@/modules/ecommerce/components/widgets/CartIconWidget'

// ============================================================================
// INNER WIDGET (needs to be inside StorefrontProvider)
// ============================================================================

interface CartWidgetInnerProps {
  siteId: string
  /** When true, offsets cart above the live-chat launcher (which sits at bottom:20px) */
  hasLiveChat: boolean
}

function CartWidgetInner({ siteId, hasLiveChat }: CartWidgetInnerProps) {
  const { isInstalled, isEnabled, isLoading } = useEcommerceStatus(siteId)

  // Don't render if module not active
  if (isLoading || !isInstalled || !isEnabled) return null

  return (
    <div
      className={cn(
        // Fixed position — right side. When live chat is also active we shift up by
        // 96px (bottom-24) to clear its launcher (launcher: bottom 20px + ~56px height = 76px).
        // When no live chat, sit at bottom-6 (24px).
        'fixed right-6 z-999',
        hasLiveChat ? 'bottom-24' : 'bottom-6',
        // Accessible label
        'dramac-ecom-cart-injector'
      )}
      aria-label="Shopping cart"
      role="complementary"
    >
      <CartIconWidget
        siteId={siteId}
        cartUrl="/cart"
        size="lg"
        className={cn(
          // Floating pill style
          'shadow-lg rounded-full bg-background border',
          'hover:shadow-xl transition-shadow duration-200',
          'backdrop-blur-sm'
        )}
      />
    </div>
  )
}

// ============================================================================
// PUBLIC INJECTOR (server-compatible wrapper)
// ============================================================================

export interface EcommerceCartInjectorProps {
  siteId: string
  /** Pass true when the live-chat module is also active, to prevent widget overlap */
  hasLiveChat?: boolean
}

/**
 * Drop this alongside <CraftRenderer> in the site page renderer.
 * It checks whether the ecommerce module is active for the site,
 * then floats a persistent cart icon — positioned above the live-chat
 * launcher when both modules are active.
 */
export function EcommerceCartInjector({ siteId, hasLiveChat = false }: EcommerceCartInjectorProps) {
  return (
    <StorefrontProvider siteId={siteId}>
      <CartWidgetInner siteId={siteId} hasLiveChat={hasLiveChat} />
    </StorefrontProvider>
  )
}
