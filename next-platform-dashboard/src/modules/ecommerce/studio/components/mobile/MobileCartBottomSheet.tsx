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
import { formatCurrency } from '@/lib/locale-config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStorefrontCart } from '../../../hooks/useStorefrontCart'
import { useMobile, usePrefersReducedMotion } from '../../../hooks/useMobile'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { SwipeableCartItem } from './SwipeableCartItem'
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
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useStorefrontCart(siteId, userId)

  // Sheet height states
  const [sheetHeight, setSheetHeight] = useState<'half' | 'full'>('half')

  // Animation variants
  const sheetVariants = {
    hidden: {
      y: '100%',
      transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
    },
    half: {
      y: '50%',
      transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
    },
    full: {
      y: 0,
      transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
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
      await updateItemQuantity(itemId, quantity)
    },
    [updateItemQuantity, haptic]
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
                <CartEmptyState />
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
              <div 
                className="border-t p-4 space-y-3"
                style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
              >
                {/* Summary */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(totals.subtotal / 100)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(totals.discount / 100)}</span>
                    </div>
                  )}
                  {totals.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(totals.tax / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-1 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total / 100)}</span>
                  </div>
                </div>

                {/* Checkout button */}
                <Button
                  size="lg"
                  className="w-full min-h-[52px] text-base font-semibold"
                  onClick={handleCheckout}
                >
                  Checkout • {formatCurrency(totals.total / 100)}
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
