/**
 * CollapsibleSection - Accordion section for checkout
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Collapsible section with completion status and smooth animations.
 */
'use client'

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export type SectionStatus = 'pending' | 'active' | 'complete' | 'error'

export interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  status: SectionStatus
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CollapsibleSection({
  title,
  subtitle,
  status,
  isOpen,
  onToggle,
  children,
  badge,
  disabled = false,
  className,
}: CollapsibleSectionProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Handle toggle with haptic feedback
  const handleToggle = useCallback(() => {
    if (disabled) return
    haptic.trigger('selection')
    onToggle()
  }, [disabled, haptic, onToggle])

  // Status icon
  const StatusIcon = () => {
    switch (status) {
      case 'complete':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )
      case 'active':
        return (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        )
    }
  }

  // Animation variants
  const contentVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.2 },
    },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  const reducedMotionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden',
        status === 'active' && 'border-primary',
        disabled && 'opacity-50',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-4',
          'flex items-center gap-3',
          'text-left',
          'transition-colors',
          'hover:bg-muted/50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
          'disabled:cursor-not-allowed',
          'min-h-[64px]'
        )}
        aria-expanded={isOpen}
      >
        {/* Status icon */}
        <StatusIcon />

        {/* Title and subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Content - collapsible */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={prefersReducedMotion ? reducedMotionVariants : contentVariants}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CollapsibleSection
