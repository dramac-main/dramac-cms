/**
 * CartNotification - Add to cart toast notification
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Toast notification that appears when an item is added to cart.
 * Features "View Cart" quick action and auto-dismiss.
 */
'use client'

import React, { useEffect, useCallback, useState } from 'react'
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
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
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
