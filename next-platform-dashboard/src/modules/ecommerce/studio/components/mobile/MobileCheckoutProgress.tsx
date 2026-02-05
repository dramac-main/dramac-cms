/**
 * MobileCheckoutProgress - Compact checkout progress indicator
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Minimal progress indicator showing checkout steps as dots or segments.
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review'

export interface CheckoutStepConfig {
  id: CheckoutStep
  label: string
  shortLabel: string
}

export interface MobileCheckoutProgressProps {
  currentStep: CheckoutStep
  completedSteps: CheckoutStep[]
  variant?: 'dots' | 'segments' | 'labels'
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS: CheckoutStepConfig[] = [
  { id: 'contact', label: 'Contact', shortLabel: '1' },
  { id: 'shipping', label: 'Shipping', shortLabel: '2' },
  { id: 'payment', label: 'Payment', shortLabel: '3' },
  { id: 'review', label: 'Review', shortLabel: '4' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileCheckoutProgress({
  currentStep,
  completedSteps,
  variant = 'dots',
  className,
}: MobileCheckoutProgressProps) {
  // Dots variant
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep

          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isCompleted
                    ? 'hsl(var(--primary))'
                    : isCurrent
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted))',
                }}
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  'transition-colors duration-200'
                )}
              />
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-6 h-0.5 mx-1',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Segments variant
  if (variant === 'segments') {
    return (
      <div className={cn('flex gap-1', className)}>
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep

          return (
            <motion.div
              key={step.id}
              initial={false}
              animate={{
                backgroundColor:
                  isCompleted || isCurrent
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted))',
              }}
              className={cn(
                'flex-1 h-1 rounded-full',
                'transition-colors duration-200'
              )}
            />
          )
        })}
      </div>
    )
  }

  // Labels variant
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isPending = !isCompleted && !isCurrent

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'text-sm font-medium',
                  'transition-colors duration-200',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isPending && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.shortLabel
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1',
                  isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
                style={{ minWidth: '24px' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MobileCheckoutProgress
