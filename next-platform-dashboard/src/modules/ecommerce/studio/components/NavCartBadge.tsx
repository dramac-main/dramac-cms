/**
 * NavCartBadge — Live cart item count badge for the published site navbar
 *
 * This client component renders a small badge overlay with the current cart
 * item count. It listens to the `cart-updated` CustomEvent so it stays in
 * sync whenever items are added/removed from any component on the page.
 *
 * Usage: Wrap the static cart icon `<a>` in the navbar with this component,
 * or render it as a sibling positioned absolutely on top.
 *
 * Phase ECOM-PRODUCTION-READY — Bug 4 fix
 */
'use client'

import { useEffect, useState, useCallback } from 'react'

interface NavCartBadgeProps {
  siteId: string
  /** Background color for the badge (defaults to red) */
  badgeBg?: string
  /** Text color for the badge (defaults to white) */
  badgeText?: string
}

/**
 * Reads the session cart item count from localStorage event cache,
 * or fetches it from the server on mount.
 */
function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('ecom_session_id') || localStorage.getItem('storefront_session_id') || null
  } catch {
    return null
  }
}

export function NavCartBadge({ siteId, badgeBg, badgeText }: NavCartBadgeProps) {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const sessionId = getSessionId()
      if (!sessionId || !siteId) return

      // Call the public cart API to get the count
      const res = await fetch(`/api/modules/ecommerce/cart?siteId=${siteId}&sessionId=${sessionId}`, {
        method: 'GET',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        const items = data?.items || data?.cart?.items || []
        const total = Array.isArray(items)
          ? items.reduce((sum: number, item: { quantity?: number }) => sum + (item?.quantity || 1), 0)
          : 0
        setCount(total)
      }
    } catch {
      // Silently fail — badge just won't show
    }
  }, [siteId])

  useEffect(() => {
    // Initial fetch
    fetchCount()

    // Listen for cart-updated events from useStorefrontCart and other components
    const handleCartUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.itemCount !== undefined) {
        setCount(detail.itemCount)
      } else {
        // Refetch if no count in detail
        fetchCount()
      }
    }

    window.addEventListener('cart-updated', handleCartUpdated)
    return () => window.removeEventListener('cart-updated', handleCartUpdated)
  }, [fetchCount])

  if (count <= 0) return null

  return (
    <span
      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full pointer-events-none z-10 animate-in zoom-in-75 duration-200"
      style={{
        backgroundColor: badgeBg || '#ef4444',
        color: badgeText || '#ffffff',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
