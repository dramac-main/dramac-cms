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
import { useMobile, usePrefersReducedMotion, useBreakpoint, type Breakpoint } from '../../../hooks/useMobile'
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
  breakpoint: Breakpoint,
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
  const breakpoint = useBreakpoint()
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
  const shouldShowMobile = getResponsiveValue(showOnMobile, breakpoint, true)
  const shouldShow = isMobile ? shouldShowMobile : isTablet ? showOnTablet : false
  if (!shouldShow) return null

  // Get responsive values
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
