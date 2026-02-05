# PHASE-ECOM-30: Mobile Cart Experience

> **Priority**: 🟠 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: Wave 3 Complete (ECOM-20 through ECOM-25)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create mobile-optimized cart components with touch-friendly interactions including bottom sheet cart, swipe gestures for item removal, floating cart button, and haptic feedback. These components enhance the mobile shopping experience while maintaining compatibility with existing desktop components.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review Wave 3 components (`src/modules/ecommerce/studio/components/`)
- [ ] Verify all Wave 3 hooks exist (`src/modules/ecommerce/hooks/`)
- [ ] Verify `framer-motion` is installed (already in dependencies)
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Mobile Cart Architecture
├── Hooks (Device Detection & Gestures)
│   ├── useMobile.ts            → Device/breakpoint detection
│   ├── useSwipeGesture.ts      → Touch gesture handling
│   └── useHapticFeedback.ts    → Vibration feedback
│
├── Mobile Cart Components
│   ├── MobileCartBottomSheet   → Full cart in bottom sheet (replaces drawer on mobile)
│   ├── MobileCartButton        → Floating action button (FAB)
│   ├── SwipeableCartItem       → Swipe-to-delete cart item
│   ├── MobileQuantitySelector  → Touch-optimized quantity controls
│   └── CartNotification        → Toast when item added
│
└── Integration
    └── Updates to existing hooks with mobile-aware options

Gesture Patterns:
- Swipe left on item → Reveal delete action
- Swipe right on item → Reveal wishlist action  
- Swipe down on sheet → Dismiss cart
- Long press quantity → Rapid increment
- Tap FAB → Open cart sheet
```

### Touch Target Requirements
- All interactive elements: minimum 44x44px
- Spacing between targets: minimum 8px
- Clear visual/haptic feedback on interaction

### Safe Area Handling
```css
/* For notched phones (iPhone X+, Android with notches) */
padding-bottom: env(safe-area-inset-bottom);
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `hooks/useMobile.ts` | Create | Device detection and breakpoint hooks |
| `hooks/useSwipeGesture.ts` | Create | Touch gesture detection |
| `hooks/useHapticFeedback.ts` | Create | Vibration feedback |
| `studio/components/mobile/index.ts` | Create | Mobile components barrel export |
| `studio/components/mobile/MobileCartBottomSheet.tsx` | Create | Bottom sheet cart |
| `studio/components/mobile/MobileCartButton.tsx` | Create | Floating cart FAB |
| `studio/components/mobile/SwipeableCartItem.tsx` | Create | Swipeable cart item |
| `studio/components/mobile/MobileQuantitySelector.tsx` | Create | Touch quantity controls |
| `studio/components/mobile/CartNotification.tsx` | Create | Add to cart toast |
| `hooks/index.ts` | Modify | Export new hooks |

---

## 📋 Implementation Tasks

### Task 30.1: Create useMobile Hook

**File**: `src/modules/ecommerce/hooks/useMobile.ts`
**Action**: Create

**Description**: Device detection hooks for responsive behavior

```typescript
/**
 * useMobile - Device detection hooks
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Provides device type detection and breakpoint awareness
 * for responsive mobile-first components.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface BreakpointConfig {
  mobile: number    // 0-767px
  tablet: number    // 768-1023px
  desktop: number   // 1024px+
}

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: Breakpoint
  width: number
  isTouchDevice: boolean
  isIOS: boolean
  isAndroid: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Simple mobile detection hook
 * @param breakpoint - Width threshold for mobile (default 768)
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check initial value
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Run on mount
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

/**
 * Breakpoint detection hook
 * Returns current breakpoint: 'mobile' | 'tablet' | 'desktop'
 */
export function useBreakpoint(config: Partial<BreakpointConfig> = {}): Breakpoint {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...config }
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < breakpoints.tablet) {
        setBreakpoint('mobile')
      } else if (width < breakpoints.desktop) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [breakpoints.tablet, breakpoints.desktop])

  return breakpoint
}

/**
 * Comprehensive device info hook
 * Returns detailed device information including touch capability
 */
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Detect touch capability
      const isTouchDevice = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0

      // Detect OS
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)

      // Determine breakpoint
      let breakpoint: Breakpoint = 'desktop'
      let isMobile = false
      let isTablet = false
      let isDesktop = true

      if (width < DEFAULT_BREAKPOINTS.tablet) {
        breakpoint = 'mobile'
        isMobile = true
        isTablet = false
        isDesktop = false
      } else if (width < DEFAULT_BREAKPOINTS.desktop) {
        breakpoint = 'tablet'
        isMobile = false
        isTablet = true
        isDesktop = false
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint,
        width,
        isTouchDevice,
        isIOS,
        isAndroid,
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  return deviceInfo
}

/**
 * Media query hook
 * @param query - CSS media query string
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Preferred color scheme hook
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Reduced motion preference hook
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
```

---

### Task 30.2: Create useSwipeGesture Hook

**File**: `src/modules/ecommerce/hooks/useSwipeGesture.ts`
**Action**: Create

**Description**: Touch gesture detection for swipe interactions

```typescript
/**
 * useSwipeGesture - Touch gesture detection hook
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Provides swipe gesture detection for touch-enabled components.
 * Supports horizontal and vertical swipes with configurable thresholds.
 */
'use client'

import { useRef, useCallback, TouchEvent as ReactTouchEvent, useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeState {
  isSwiping: boolean
  direction: SwipeDirection | null
  deltaX: number
  deltaY: number
  velocity: number
}

export interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: () => void
  onSwipeEnd?: (direction: SwipeDirection | null) => void
  onSwiping?: (state: SwipeState) => void
  threshold?: number           // Minimum distance for swipe (default: 50px)
  velocityThreshold?: number   // Minimum velocity (default: 0.3 px/ms)
  preventScrollOnSwipe?: boolean
  trackTouch?: boolean         // Continuously track touch position
}

export interface SwipeHandlers {
  onTouchStart: (e: ReactTouchEvent) => void
  onTouchMove: (e: ReactTouchEvent) => void
  onTouchEnd: (e: ReactTouchEvent) => void
}

export interface UseSwipeGestureReturn {
  handlers: SwipeHandlers
  state: SwipeState
  reset: () => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useSwipeGesture(config: SwipeConfig = {}): UseSwipeGestureReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeStart,
    onSwipeEnd,
    onSwiping,
    threshold = 50,
    velocityThreshold = 0.3,
    preventScrollOnSwipe = false,
    trackTouch = true,
  } = config

  // Track touch state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isSwipingRef = useRef(false)

  // State for external access
  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
  })

  // Reset state
  const reset = useCallback(() => {
    touchStartRef.current = null
    isSwipingRef.current = false
    setState({
      isSwiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    })
  }, [])

  // Determine swipe direction
  const getDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection | null => {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Must meet minimum threshold
    if (absX < threshold && absY < threshold) {
      return null
    }

    // Horizontal swipe
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left'
    }

    // Vertical swipe
    return deltaY > 0 ? 'down' : 'up'
  }, [threshold])

  // Touch start handler
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    isSwipingRef.current = true
    onSwipeStart?.()

    setState(prev => ({
      ...prev,
      isSwiping: true,
      deltaX: 0,
      deltaY: 0,
      direction: null,
    }))
  }, [onSwipeStart])

  // Touch move handler
  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!touchStartRef.current || !isSwipingRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const direction = getDirection(deltaX, deltaY)

    // Prevent scroll if swiping horizontally
    if (preventScrollOnSwipe && direction && (direction === 'left' || direction === 'right')) {
      e.preventDefault()
    }

    if (trackTouch) {
      const elapsed = Date.now() - touchStartRef.current.time
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / elapsed

      const newState: SwipeState = {
        isSwiping: true,
        direction,
        deltaX,
        deltaY,
        velocity,
      }

      setState(newState)
      onSwiping?.(newState)
    }
  }, [getDirection, preventScrollOnSwipe, trackTouch, onSwiping])

  // Touch end handler
  const onTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const elapsed = Date.now() - touchStartRef.current.time
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / elapsed

    const direction = getDirection(deltaX, deltaY)

    // Check if swipe meets velocity threshold
    const isValidSwipe = direction && velocity >= velocityThreshold

    if (isValidSwipe && direction) {
      switch (direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    }

    onSwipeEnd?.(isValidSwipe ? direction : null)

    // Reset state
    touchStartRef.current = null
    isSwipingRef.current = false
    setState({
      isSwiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    })
  }, [getDirection, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    state,
    reset,
  }
}

/**
 * useSwipeToDelete - Simplified hook for swipe-to-delete pattern
 */
export function useSwipeToDelete(config: {
  onDelete: () => void
  threshold?: number
}) {
  const { onDelete, threshold = 100 } = config
  const [offset, setOffset] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const { handlers, state } = useSwipeGesture({
    threshold: threshold / 2,
    trackTouch: true,
    preventScrollOnSwipe: true,
    onSwiping: (swipeState) => {
      // Only track left swipes
      if (swipeState.deltaX < 0) {
        setOffset(Math.max(swipeState.deltaX, -threshold * 1.5))
      }
    },
    onSwipeLeft: () => {
      if (Math.abs(offset) >= threshold) {
        setIsDeleting(true)
        onDelete()
      }
    },
    onSwipeEnd: () => {
      if (Math.abs(offset) < threshold) {
        setOffset(0)
      }
    },
  })

  const reset = useCallback(() => {
    setOffset(0)
    setIsDeleting(false)
  }, [])

  return {
    handlers,
    offset,
    isDeleting,
    reset,
    isRevealed: Math.abs(offset) >= threshold * 0.5,
  }
}
```

---

### Task 30.3: Create useHapticFeedback Hook

**File**: `src/modules/ecommerce/hooks/useHapticFeedback.ts`
**Action**: Create

**Description**: Haptic feedback for mobile interactions

```typescript
/**
 * useHapticFeedback - Haptic feedback hook
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Provides vibration feedback for mobile interactions.
 * Falls back gracefully when vibration API is not available.
 */
'use client'

import { useCallback, useMemo } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export interface HapticConfig {
  enabled?: boolean
  respectReducedMotion?: boolean
}

export interface UseHapticFeedbackReturn {
  trigger: (pattern?: HapticPattern) => void
  isSupported: boolean
  isEnabled: boolean
}

// ============================================================================
// PATTERNS
// ============================================================================

// Vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [30, 50, 30],
  error: [50, 100, 50, 100, 50],
  selection: 5,
}

// ============================================================================
// HOOK
// ============================================================================

export function useHapticFeedback(config: HapticConfig = {}): UseHapticFeedbackReturn {
  const { enabled = true, respectReducedMotion = true } = config

  // Check if vibration API is supported
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'vibrate' in navigator
  }, [])

  // Check reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Determine if haptics should be active
  const isEnabled = useMemo(() => {
    if (!isSupported) return false
    if (!enabled) return false
    if (respectReducedMotion && prefersReducedMotion) return false
    return true
  }, [isSupported, enabled, respectReducedMotion, prefersReducedMotion])

  // Trigger haptic feedback
  const trigger = useCallback((pattern: HapticPattern = 'medium') => {
    if (!isEnabled) return

    try {
      const vibrationPattern = HAPTIC_PATTERNS[pattern]
      navigator.vibrate(vibrationPattern)
    } catch (error) {
      // Silently fail if vibration not available
      console.debug('Haptic feedback failed:', error)
    }
  }, [isEnabled])

  return {
    trigger,
    isSupported,
    isEnabled,
  }
}

/**
 * Utility function for one-off haptic triggers
 */
export function triggerHaptic(pattern: HapticPattern = 'medium'): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern]
    navigator.vibrate(vibrationPattern)
  } catch {
    // Silently fail
  }
}
```

---

### Task 30.4: Create MobileCartBottomSheet Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileCartBottomSheet.tsx`
**Action**: Create

**Description**: Full cart experience in a mobile bottom sheet

```typescript
/**
 * MobileCartBottomSheet - Bottom sheet cart for mobile
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Slide-up bottom sheet that replaces the cart drawer on mobile.
 * Features gesture-driven animations and swipe to dismiss.
 */
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStorefrontCart } from '../../../hooks/useStorefrontCart'
import { useMobile, usePrefersReducedMotion } from '../../../hooks/useMobile'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { SwipeableCartItem } from './SwipeableCartItem'
import { CartSummaryCard } from '../CartSummaryCard'
import { CartEmptyState } from '../CartEmptyState'

// ============================================================================
// TYPES
// ============================================================================

interface MobileCartBottomSheetProps {
  siteId: string
  userId?: string
  isOpen: boolean
  onClose: () => void
  onCheckout?: () => void
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileCartBottomSheet({
  siteId,
  userId,
  isOpen,
  onClose,
  onCheckout,
  className,
}: MobileCartBottomSheetProps) {
  const isMobile = useMobile()
  const prefersReducedMotion = usePrefersReducedMotion()
  const haptic = useHapticFeedback()
  const controls = useAnimation()

  // Cart data
  const {
    cart,
    totals,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useStorefrontCart(siteId, userId)

  // Sheet height states
  const [sheetHeight, setSheetHeight] = useState<'half' | 'full'>('half')

  // Animation variants
  const sheetVariants = {
    hidden: {
      y: '100%',
      transition: { type: 'spring', damping: 30, stiffness: 300 },
    },
    half: {
      y: '50%',
      transition: { type: 'spring', damping: 30, stiffness: 300 },
    },
    full: {
      y: 0,
      transition: { type: 'spring', damping: 30, stiffness: 300 },
    },
  }

  // Reduced motion variants
  const reducedMotionVariants = {
    hidden: { opacity: 0 },
    half: { opacity: 1 },
    full: { opacity: 1 },
  }

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { velocity, offset } = info

      // Swipe down to dismiss
      if (offset.y > 100 || velocity.y > 500) {
        haptic.trigger('light')
        onClose()
        return
      }

      // Swipe up to expand
      if (offset.y < -50 || velocity.y < -300) {
        haptic.trigger('selection')
        setSheetHeight('full')
        controls.start('full')
        return
      }

      // Swipe down to collapse (when full)
      if (sheetHeight === 'full' && (offset.y > 50 || velocity.y > 200)) {
        haptic.trigger('selection')
        setSheetHeight('half')
        controls.start('half')
        return
      }

      // Snap back
      controls.start(sheetHeight)
    },
    [controls, haptic, onClose, sheetHeight]
  )

  // Reset height when opened
  useEffect(() => {
    if (isOpen) {
      setSheetHeight('half')
      controls.start('half')
    }
  }, [isOpen, controls])

  // Handle quantity change
  const handleQuantityChange = useCallback(
    async (itemId: string, quantity: number) => {
      haptic.trigger('selection')
      await updateQuantity(itemId, quantity)
    },
    [updateQuantity, haptic]
  )

  // Handle remove
  const handleRemove = useCallback(
    async (itemId: string) => {
      haptic.trigger('medium')
      await removeItem(itemId)
    },
    [removeItem, haptic]
  )

  // Handle clear all
  const handleClearCart = useCallback(async () => {
    haptic.trigger('warning')
    await clearCart()
  }, [clearCart, haptic])

  // Handle checkout
  const handleCheckout = useCallback(() => {
    haptic.trigger('success')
    onCheckout?.()
    onClose()
  }, [onCheckout, onClose, haptic])

  // Don't render on desktop (use CartDrawer instead)
  if (!isMobile) return null

  const items = cart?.items || []
  const itemCount = totals?.itemCount || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial="hidden"
            animate={sheetHeight}
            exit="hidden"
            variants={prefersReducedMotion ? reducedMotionVariants : sheetVariants}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'bg-background rounded-t-3xl shadow-2xl',
              'flex flex-col',
              sheetHeight === 'full' ? 'h-[95vh]' : 'h-[60vh]',
              className
            )}
          >
            {/* Handle indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <span className="font-semibold text-lg">
                  Cart {itemCount > 0 && `(${itemCount})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive hover:text-destructive min-h-[44px]"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : items.length === 0 ? (
                <CartEmptyState onContinueShopping={onClose} />
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {items.map((item) => (
                      <SwipeableCartItem
                        key={item.id}
                        item={item}
                        onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                        onRemove={() => handleRemove(item.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer with summary and checkout */}
            {items.length > 0 && totals && (
              <div className="border-t p-4 pb-safe space-y-3">
                {/* Summary */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${totals.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-1 border-t">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout button */}
                <Button
                  size="lg"
                  className="w-full min-h-[52px] text-base font-semibold"
                  onClick={handleCheckout}
                >
                  Checkout • ${totals.total.toFixed(2)}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileCartBottomSheet
```

---

### Task 30.5: Create MobileCartButton Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileCartButton.tsx`
**Action**: Create

**Description**: Floating action button for cart access on mobile

```typescript
/**
 * MobileCartButton - Floating cart button (FAB)
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Floating action button that shows cart item count and opens
 * the mobile cart bottom sheet. Only visible on mobile devices.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobile, usePrefersReducedMotion } from '../../../hooks/useMobile'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { useStorefrontCart } from '../../../hooks/useStorefrontCart'
import { MobileCartBottomSheet } from './MobileCartBottomSheet'

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

interface MobileCartButtonProps {
  siteId: string
  userId?: string
  position?: ResponsiveValue<'bottom-right' | 'bottom-center' | 'bottom-left'>
  showOnMobile?: ResponsiveValue<boolean>
  showOnTablet?: boolean
  size?: ResponsiveValue<'sm' | 'md' | 'lg'>
  showBadge?: boolean
  pulseOnAdd?: boolean
  onCheckout?: () => void
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(
  value: ResponsiveValue<T> | undefined,
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  defaultValue: T
): T {
  if (value === undefined) return defaultValue
  if (typeof value !== 'object' || value === null) return value as T
  
  const responsive = value as { mobile?: T; tablet?: T; desktop?: T }
  
  switch (breakpoint) {
    case 'mobile':
      return responsive.mobile ?? defaultValue
    case 'tablet':
      return responsive.tablet ?? responsive.mobile ?? defaultValue
    case 'desktop':
      return responsive.desktop ?? responsive.tablet ?? responsive.mobile ?? defaultValue
    default:
      return defaultValue
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileCartButton({
  siteId,
  userId,
  position = 'bottom-right',
  showOnMobile = true,
  showOnTablet = false,
  size = 'lg',
  showBadge = true,
  pulseOnAdd = true,
  onCheckout,
  className,
}: MobileCartButtonProps) {
  const isMobile = useMobile()
  const isTablet = useMobile(1024) && !useMobile(768)
  const prefersReducedMotion = usePrefersReducedMotion()
  const haptic = useHapticFeedback()
  
  // State
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const [prevItemCount, setPrevItemCount] = useState(0)

  // Cart data
  const { totals } = useStorefrontCart(siteId, userId)
  const itemCount = totals?.itemCount || 0

  // Detect item added and trigger pulse
  useEffect(() => {
    if (itemCount > prevItemCount && pulseOnAdd && !prefersReducedMotion) {
      setIsPulsing(true)
      haptic.trigger('success')
      const timer = setTimeout(() => setIsPulsing(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevItemCount(itemCount)
  }, [itemCount, prevItemCount, pulseOnAdd, prefersReducedMotion, haptic])

  // Determine visibility
  const shouldShow = isMobile ? showOnMobile : isTablet ? showOnTablet : false
  if (!shouldShow) return null

  // Get responsive values
  const breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  const currentPosition = getResponsiveValue(position, breakpoint, 'bottom-right')
  const currentSize = getResponsiveValue(size, breakpoint, 'lg')

  // Position classes
  const positionClasses = {
    'bottom-right': 'right-4 bottom-4',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-4',
    'bottom-left': 'left-4 bottom-4',
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  }

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  }

  const badgeSizes = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-7 h-7 text-sm',
  }

  // Handle button click
  const handleClick = () => {
    haptic.trigger('medium')
    setIsCartOpen(true)
  }

  return (
    <>
      {/* Floating Cart Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={cn(
          'fixed z-30',
          'flex items-center justify-center',
          'bg-primary text-primary-foreground',
          'rounded-full shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-colors hover:bg-primary/90',
          positionClasses[currentPosition],
          sizeClasses[currentSize],
          className
        )}
        style={{
          // Ensure safe area padding
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label={`View cart with ${itemCount} items`}
      >
        {/* Pulse animation ring */}
        <AnimatePresence>
          {isPulsing && (
            <motion.span
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-primary"
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <ShoppingBag className={cn(iconSizes[currentSize], 'relative z-10')} />

        {/* Badge */}
        {showBadge && itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -top-1 -right-1',
              'flex items-center justify-center',
              'bg-destructive text-destructive-foreground',
              'rounded-full font-semibold',
              badgeSizes[currentSize]
            )}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </motion.button>

      {/* Cart Bottom Sheet */}
      <MobileCartBottomSheet
        siteId={siteId}
        userId={userId}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={onCheckout}
      />
    </>
  )
}

export default MobileCartButton
```

---

### Task 30.6: Create SwipeableCartItem Component

**File**: `src/modules/ecommerce/studio/components/mobile/SwipeableCartItem.tsx`
**Action**: Create

**Description**: Cart item with swipe-to-delete gesture

```typescript
/**
 * SwipeableCartItem - Swipeable cart line item
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Cart item with swipe gestures for delete and wishlist actions.
 * Swipe left to reveal delete, swipe right for wishlist.
 */
'use client'

import React, { useCallback, useState } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { Trash2, Heart, Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { CartItem } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface SwipeableCartItemProps {
  item: CartItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onMoveToWishlist?: () => void
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 80 // pixels to reveal action
const DELETE_THRESHOLD = 150 // pixels to trigger delete
const SPRING_CONFIG = { type: 'spring', stiffness: 400, damping: 30 }

// ============================================================================
// COMPONENT
// ============================================================================

export function SwipeableCartItem({
  item,
  onQuantityChange,
  onRemove,
  onMoveToWishlist,
  className,
}: SwipeableCartItemProps) {
  const haptic = useHapticFeedback()
  const controls = useAnimation()
  
  const [isRevealed, setIsRevealed] = useState<'none' | 'left' | 'right'>('none')
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle drag
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info

      // Update revealed state based on drag position
      if (offset.x < -SWIPE_THRESHOLD) {
        setIsRevealed('left')
      } else if (offset.x > SWIPE_THRESHOLD && onMoveToWishlist) {
        setIsRevealed('right')
      } else {
        setIsRevealed('none')
      }
    },
    [onMoveToWishlist]
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      // Delete on far left swipe
      if (offset.x < -DELETE_THRESHOLD || (offset.x < -SWIPE_THRESHOLD && velocity.x < -500)) {
        haptic.trigger('warning')
        setIsDeleting(true)
        controls.start({
          x: -500,
          opacity: 0,
          transition: { duration: 0.3 },
        }).then(() => {
          onRemove()
        })
        return
      }

      // Wishlist on far right swipe
      if (onMoveToWishlist && (offset.x > DELETE_THRESHOLD || (offset.x > SWIPE_THRESHOLD && velocity.x > 500))) {
        haptic.trigger('success')
        setIsDeleting(true)
        controls.start({
          x: 500,
          opacity: 0,
          transition: { duration: 0.3 },
        }).then(() => {
          onMoveToWishlist()
        })
        return
      }

      // Snap to revealed position or reset
      if (offset.x < -SWIPE_THRESHOLD / 2) {
        haptic.trigger('selection')
        setIsRevealed('left')
        controls.start({ x: -SWIPE_THRESHOLD, transition: SPRING_CONFIG })
      } else if (offset.x > SWIPE_THRESHOLD / 2 && onMoveToWishlist) {
        haptic.trigger('selection')
        setIsRevealed('right')
        controls.start({ x: SWIPE_THRESHOLD, transition: SPRING_CONFIG })
      } else {
        setIsRevealed('none')
        controls.start({ x: 0, transition: SPRING_CONFIG })
      }
    },
    [controls, haptic, onRemove, onMoveToWishlist]
  )

  // Handle action button clicks
  const handleDelete = useCallback(() => {
    haptic.trigger('warning')
    setIsDeleting(true)
    controls.start({
      x: -500,
      opacity: 0,
      transition: { duration: 0.3 },
    }).then(() => {
      onRemove()
    })
  }, [controls, haptic, onRemove])

  const handleWishlist = useCallback(() => {
    if (!onMoveToWishlist) return
    haptic.trigger('success')
    setIsDeleting(true)
    controls.start({
      x: 500,
      opacity: 0,
      transition: { duration: 0.3 },
    }).then(() => {
      onMoveToWishlist()
    })
  }, [controls, haptic, onMoveToWishlist])

  // Handle quantity changes
  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      haptic.trigger('selection')
      onQuantityChange(item.quantity - 1)
    } else {
      handleDelete()
    }
  }, [item.quantity, onQuantityChange, haptic, handleDelete])

  const handleIncrement = useCallback(() => {
    haptic.trigger('selection')
    onQuantityChange(item.quantity + 1)
  }, [item.quantity, onQuantityChange, haptic])

  // Reset position
  const resetPosition = useCallback(() => {
    setIsRevealed('none')
    controls.start({ x: 0, transition: SPRING_CONFIG })
  }, [controls])

  if (isDeleting) {
    return null
  }

  const lineTotal = item.unit_price * item.quantity

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Delete action background (left swipe) */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 w-24',
          'flex items-center justify-center',
          'bg-destructive text-destructive-foreground'
        )}
      >
        <button
          onClick={handleDelete}
          className="flex flex-col items-center gap-1 p-4 min-h-[44px] min-w-[44px]"
          aria-label="Remove item"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-xs">Remove</span>
        </button>
      </div>

      {/* Wishlist action background (right swipe) */}
      {onMoveToWishlist && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-24',
            'flex items-center justify-center',
            'bg-pink-500 text-white'
          )}
        >
          <button
            onClick={handleWishlist}
            className="flex flex-col items-center gap-1 p-4 min-h-[44px] min-w-[44px]"
            aria-label="Move to wishlist"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Wishlist</span>
          </button>
        </div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -DELETE_THRESHOLD, right: onMoveToWishlist ? DELETE_THRESHOLD : 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={cn(
          'relative bg-background',
          'flex items-center gap-3 p-3',
          'border rounded-lg',
          'touch-pan-y'
        )}
        onClick={isRevealed !== 'none' ? resetPosition : undefined}
      >
        {/* Product image */}
        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.product_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2">{item.product_name}</h4>
          
          {/* Variant info */}
          {item.variant_name && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.variant_name}
            </p>
          )}

          {/* Price */}
          <p className="text-sm font-semibold mt-1">
            ${item.unit_price.toFixed(2)}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              className="h-9 w-9 min-h-[44px] min-w-[44px]"
              aria-label="Decrease quantity"
            >
              {item.quantity === 1 ? (
                <Trash2 className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
            </Button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              className="h-9 w-9 min-h-[44px] min-w-[44px]"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Line total */}
          <p className="text-sm font-semibold">
            ${lineTotal.toFixed(2)}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SwipeableCartItem
```

---

### Task 30.7: Create MobileQuantitySelector Component

**File**: `src/modules/ecommerce/studio/components/mobile/MobileQuantitySelector.tsx`
**Action**: Create

**Description**: Touch-optimized quantity selector with large targets

```typescript
/**
 * MobileQuantitySelector - Touch-optimized quantity controls
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Large touch targets (44px+) with long-press for rapid increment.
 */
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// ============================================================================
// TYPES
// ============================================================================

interface MobileQuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove?: () => void
  min?: number
  max?: number
  variant?: 'default' | 'compact' | 'stepper'
  showRemoveOnMin?: boolean
  enableLongPress?: boolean
  longPressInterval?: number
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileQuantitySelector({
  quantity,
  onQuantityChange,
  onRemove,
  min = 1,
  max = 99,
  variant = 'default',
  showRemoveOnMin = true,
  enableLongPress = true,
  longPressInterval = 100,
  className,
}: MobileQuantitySelectorProps) {
  const haptic = useHapticFeedback()
  const [isPressed, setIsPressed] = useState<'minus' | 'plus' | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Handle decrement
  const handleDecrement = useCallback(() => {
    if (quantity > min) {
      haptic.trigger('selection')
      onQuantityChange(quantity - 1)
    } else if (quantity === min && showRemoveOnMin && onRemove) {
      haptic.trigger('warning')
      onRemove()
    }
  }, [quantity, min, showRemoveOnMin, onRemove, onQuantityChange, haptic])

  // Handle increment
  const handleIncrement = useCallback(() => {
    if (quantity < max) {
      haptic.trigger('selection')
      onQuantityChange(quantity + 1)
    } else {
      haptic.trigger('error')
    }
  }, [quantity, max, onQuantityChange, haptic])

  // Long press start
  const handlePressStart = useCallback(
    (action: 'minus' | 'plus') => {
      if (!enableLongPress) return

      setIsPressed(action)
      haptic.trigger('selection')

      // Start rapid fire after 500ms hold
      longPressTimerRef.current = setTimeout(() => {
        haptic.trigger('medium')
        intervalRef.current = setInterval(() => {
          if (action === 'minus') {
            onQuantityChange((prev) => Math.max(min, prev - 1))
          } else {
            onQuantityChange((prev) => Math.min(max, prev + 1))
          }
          haptic.trigger('light')
        }, longPressInterval)
      }, 500)
    },
    [enableLongPress, min, max, longPressInterval, onQuantityChange, haptic]
  )

  // Long press end
  const handlePressEnd = useCallback(() => {
    setIsPressed(null)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Shared button styles
  const buttonBaseClass = cn(
    'flex items-center justify-center',
    'rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    'active:scale-95',
    'touch-manipulation select-none'
  )

  // Variant-specific styles
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          onTouchStart={() => handlePressStart('minus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('minus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity <= min && !showRemoveOnMin}
          className={cn(
            buttonBaseClass,
            'w-8 h-8 min-w-[44px] min-h-[44px] -m-2',
            'bg-muted hover:bg-muted/80',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'minus' && 'bg-primary/20'
          )}
          aria-label="Decrease quantity"
        >
          {quantity === min && showRemoveOnMin ? (
            <Trash2 className="h-4 w-4 text-destructive" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </motion.button>

        <span className="w-6 text-center font-medium tabular-nums">{quantity}</span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          onTouchStart={() => handlePressStart('plus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('plus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity >= max}
          className={cn(
            buttonBaseClass,
            'w-8 h-8 min-w-[44px] min-h-[44px] -m-2',
            'bg-muted hover:bg-muted/80',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'plus' && 'bg-primary/20'
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>
    )
  }

  if (variant === 'stepper') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border bg-background',
          className
        )}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          onTouchStart={() => handlePressStart('minus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('minus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity <= min && !showRemoveOnMin}
          className={cn(
            buttonBaseClass,
            'w-12 h-12 rounded-l-full',
            'hover:bg-muted',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'minus' && 'bg-primary/20'
          )}
          aria-label="Decrease quantity"
        >
          {quantity === min && showRemoveOnMin ? (
            <Trash2 className="h-5 w-5 text-destructive" />
          ) : (
            <Minus className="h-5 w-5" />
          )}
        </motion.button>

        <span className="w-12 text-center font-semibold text-lg tabular-nums">
          {quantity}
        </span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          onTouchStart={() => handlePressStart('plus')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('plus')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={quantity >= max}
          className={cn(
            buttonBaseClass,
            'w-12 h-12 rounded-r-full',
            'hover:bg-muted',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPressed === 'plus' && 'bg-primary/20'
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border bg-background p-1',
        className
      )}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleDecrement}
        onTouchStart={() => handlePressStart('minus')}
        onTouchEnd={handlePressEnd}
        onMouseDown={() => handlePressStart('minus')}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        disabled={quantity <= min && !showRemoveOnMin}
        className={cn(
          buttonBaseClass,
          'w-11 h-11',
          'bg-muted hover:bg-muted/80',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isPressed === 'minus' && 'bg-primary/20'
        )}
        aria-label="Decrease quantity"
      >
        {quantity === min && showRemoveOnMin ? (
          <Trash2 className="h-5 w-5 text-destructive" />
        ) : (
          <Minus className="h-5 w-5" />
        )}
      </motion.button>

      <span className="w-10 text-center font-semibold text-lg tabular-nums">
        {quantity}
      </span>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleIncrement}
        onTouchStart={() => handlePressStart('plus')}
        onTouchEnd={handlePressEnd}
        onMouseDown={() => handlePressStart('plus')}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        disabled={quantity >= max}
        className={cn(
          buttonBaseClass,
          'w-11 h-11',
          'bg-muted hover:bg-muted/80',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isPressed === 'plus' && 'bg-primary/20'
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-5 w-5" />
      </motion.button>
    </div>
  )
}

export default MobileQuantitySelector
```

---

### Task 30.8: Create CartNotification Component

**File**: `src/modules/ecommerce/studio/components/mobile/CartNotification.tsx`
**Action**: Create

**Description**: Toast notification when item is added to cart

```typescript
/**
 * CartNotification - Add to cart toast notification
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Toast notification that appears when an item is added to cart.
 * Features "View Cart" quick action and auto-dismiss.
 */
'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export interface CartNotificationData {
  id: string
  productName: string
  productImage?: string | null
  variantName?: string | null
  quantity: number
  price: number
}

interface CartNotificationProps {
  notification: CartNotificationData | null
  onDismiss: () => void
  onViewCart: () => void
  autoDismissDelay?: number
  position?: 'top' | 'bottom'
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartNotification({
  notification,
  onDismiss,
  onViewCart,
  autoDismissDelay = 4000,
  position = 'bottom',
  className,
}: CartNotificationProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Auto-dismiss after delay
  useEffect(() => {
    if (!notification) return

    const timer = setTimeout(() => {
      onDismiss()
    }, autoDismissDelay)

    return () => clearTimeout(timer)
  }, [notification, autoDismissDelay, onDismiss])

  // Handle view cart click
  const handleViewCart = useCallback(() => {
    haptic.trigger('selection')
    onViewCart()
    onDismiss()
  }, [haptic, onViewCart, onDismiss])

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    haptic.trigger('light')
    onDismiss()
  }, [haptic, onDismiss])

  // Animation variants
  const variants = {
    initial: {
      opacity: 0,
      y: position === 'top' ? -100 : 100,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      y: position === 'top' ? -50 : 50,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  }

  // Reduced motion variants
  const reducedMotionVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const positionClasses = position === 'top'
    ? 'top-4 pt-safe'
    : 'bottom-4 pb-safe'

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={prefersReducedMotion ? reducedMotionVariants : variants}
          className={cn(
            'fixed left-4 right-4 z-50',
            positionClasses,
            className
          )}
        >
          <div
            className={cn(
              'bg-background border rounded-xl shadow-lg',
              'flex items-center gap-3 p-3'
            )}
          >
            {/* Success indicator */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              {/* Product image */}
              {notification.productImage && (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={notification.productImage}
                    alt={notification.productName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">
                  {notification.productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.variantName && `${notification.variantName} • `}
                  Qty: {notification.quantity}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={handleViewCart}
                className="min-h-[44px] px-4"
              >
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                View Cart
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// HOOK FOR NOTIFICATIONS
// ============================================================================

import { useState } from 'react'

export function useCartNotification() {
  const [notification, setNotification] = useState<CartNotificationData | null>(null)

  const showNotification = useCallback((data: CartNotificationData) => {
    setNotification(data)
  }, [])

  const dismissNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    showNotification,
    dismissNotification,
  }
}

export default CartNotification
```

---

### Task 30.9: Create Mobile Components Index

**File**: `src/modules/ecommerce/studio/components/mobile/index.ts`
**Action**: Create

**Description**: Barrel export for all mobile components

```typescript
/**
 * Mobile Components Index
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Exports all mobile-optimized e-commerce components.
 */

// Bottom Sheet Cart
export { MobileCartBottomSheet } from './MobileCartBottomSheet'
export { default as MobileCartBottomSheetDefault } from './MobileCartBottomSheet'

// Floating Cart Button
export { MobileCartButton } from './MobileCartButton'
export { default as MobileCartButtonDefault } from './MobileCartButton'

// Swipeable Cart Item
export { SwipeableCartItem } from './SwipeableCartItem'
export { default as SwipeableCartItemDefault } from './SwipeableCartItem'

// Mobile Quantity Selector
export { MobileQuantitySelector } from './MobileQuantitySelector'
export { default as MobileQuantitySelectorDefault } from './MobileQuantitySelector'

// Cart Notification
export { 
  CartNotification, 
  useCartNotification,
  type CartNotificationData 
} from './CartNotification'
export { default as CartNotificationDefault } from './CartNotification'
```

---

### Task 30.10: Update Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

**Description**: Export new mobile hooks

```typescript
/**
 * E-Commerce Hooks Index
 * 
 * Central export for all e-commerce hooks.
 * Updated for Phase ECOM-30: Mobile Cart Experience
 */

// === Wave 3 Hooks ===
export { useStorefrontProducts } from './useStorefrontProducts'
export { useStorefrontProduct } from './useStorefrontProduct'
export { useStorefrontCategories } from './useStorefrontCategories'
export { useStorefrontCart } from './useStorefrontCart'
export { useStorefrontWishlist } from './useStorefrontWishlist'
export { useStorefrontSearch } from './useStorefrontSearch'
export { useRecentlyViewed } from './useRecentlyViewed'
export { useCheckout } from './useCheckout'
export { useProductFilters } from './useProductFilters'
export { useQuotations } from './useQuotations'

// === Wave 4 Hooks (Mobile) ===
export { 
  useMobile,
  useBreakpoint,
  useDeviceInfo,
  useMediaQuery,
  usePrefersDarkMode,
  usePrefersReducedMotion,
  type Breakpoint,
  type BreakpointConfig,
  type DeviceInfo,
} from './useMobile'

export {
  useSwipeGesture,
  useSwipeToDelete,
  type SwipeDirection,
  type SwipeState,
  type SwipeConfig,
  type SwipeHandlers,
  type UseSwipeGestureReturn,
} from './useSwipeGesture'

export {
  useHapticFeedback,
  triggerHaptic,
  type HapticPattern,
  type HapticConfig,
  type UseHapticFeedbackReturn,
} from './useHapticFeedback'
```

---

## ✅ Testing Checklist

### TypeScript Compilation
- [ ] Run `npx tsc --noEmit` - must pass with zero errors

### Mobile Device Testing
- [ ] Test on physical iPhone (Safari)
- [ ] Test on physical Android (Chrome)
- [ ] Test on iPad (if available)

### Gesture Testing
- [ ] Swipe left on cart item reveals delete
- [ ] Swipe right on cart item reveals wishlist (if enabled)
- [ ] Swipe down on bottom sheet dismisses it
- [ ] Long press on quantity buttons triggers rapid increment

### Touch Target Testing
- [ ] All buttons are minimum 44x44px
- [ ] Spacing between touch targets is 8px+
- [ ] Buttons have visible active state

### Accessibility Testing
- [ ] All buttons have aria-labels
- [ ] Screen reader can navigate cart
- [ ] Reduced motion preference is respected

### Performance Testing
- [ ] Animations run at 60fps
- [ ] No jank during swipe gestures
- [ ] Test with Chrome DevTools mobile throttling

### Safe Area Testing
- [ ] Test on iPhone X+ (notch)
- [ ] Bottom sheet respects safe-area-inset-bottom
- [ ] FAB button respects safe-area-inset-bottom

---

## 🔄 Rollback Plan

If issues occur:

1. **Delete new files:**
   ```
   hooks/useMobile.ts
   hooks/useSwipeGesture.ts
   hooks/useHapticFeedback.ts
   studio/components/mobile/ (entire folder)
   ```

2. **Revert hooks/index.ts** to previous state (Wave 3 exports only)

3. **Wave 3 desktop components remain functional** - no changes to existing components

4. **No database migration required** - no rollback needed

---

## 📝 Memory Bank Updates

After completion, update these files:

### activeContext.md
```markdown
## Latest Session Update (ECOM-30 Complete - [DATE])

### Completed: PHASE-ECOM-30 Mobile Cart Experience

#### Files Created:
- `hooks/useMobile.ts` - Device detection hooks
- `hooks/useSwipeGesture.ts` - Touch gesture detection
- `hooks/useHapticFeedback.ts` - Vibration feedback
- `studio/components/mobile/MobileCartBottomSheet.tsx`
- `studio/components/mobile/MobileCartButton.tsx`
- `studio/components/mobile/SwipeableCartItem.tsx`
- `studio/components/mobile/MobileQuantitySelector.tsx`
- `studio/components/mobile/CartNotification.tsx`
- `studio/components/mobile/index.ts`

#### Files Modified:
- `hooks/index.ts` - Added mobile hook exports
```

### progress.md
```markdown
## 📋 E-COMMERCE WAVE 4 IN PROGRESS

| Phase | Title | Priority | Status |
|-------|-------|----------|--------|
| ECOM-30 | Mobile Cart Experience | 🟠 HIGH | ✅ Complete |
| ECOM-31 | Mobile Checkout Flow | 🟠 HIGH | 📋 Ready |
| ECOM-32 | Mobile Product Experience | 🟠 HIGH | 📋 Ready |
```

---

## ✨ Success Criteria

- [ ] `useMobile` hook correctly detects mobile devices
- [ ] `useSwipeGesture` handles swipe gestures smoothly
- [ ] `useHapticFeedback` triggers vibration on supported devices
- [ ] `MobileCartBottomSheet` opens with gesture-driven animation
- [ ] `MobileCartButton` shows item count and pulses on add
- [ ] `SwipeableCartItem` swipes to reveal delete/wishlist
- [ ] `MobileQuantitySelector` has 44px+ touch targets
- [ ] `CartNotification` appears and auto-dismisses
- [ ] All components respect `prefers-reduced-motion`
- [ ] Safe areas respected on notched phones
- [ ] TypeScript compiles with zero errors

---

**END OF PHASE-ECOM-30**
