/**
 * CheckoutStepIndicator - Step progress indicator
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Visual indicator showing the current step in the checkout process.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { CheckoutStep } from '../../hooks/useCheckout'

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutStepIndicatorProps {
  steps: CheckoutStep[]
  currentStep: CheckoutStep
  onStepClick?: (step: CheckoutStep) => void
  className?: string
}

interface StepConfig {
  label: string
  description?: string
}

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

const STEP_CONFIG: Record<CheckoutStep, StepConfig> = {
  information: {
    label: 'Information',
    description: 'Contact & shipping'
  },
  shipping: {
    label: 'Shipping',
    description: 'Delivery method'
  },
  payment: {
    label: 'Payment',
    description: 'Payment method'
  },
  review: {
    label: 'Review',
    description: 'Confirm order'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutStepIndicator({
  steps,
  currentStep,
  onStepClick,
  className
}: CheckoutStepIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep)

  return (
    <nav className={cn('', className)}>
      {/* Desktop View */}
      <ol className="hidden sm:flex items-center">
        {steps.map((step, index) => {
          const config = STEP_CONFIG[step]
          const isActive = step === currentStep
          const isCompleted = index < currentIndex
          const isClickable = onStepClick && (isCompleted || isActive)
          
          return (
            <li key={step} className="flex items-center">
              {/* Step indicator */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-3 group',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground',
                    isClickable && !isActive && 'group-hover:bg-primary/80'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label & Description */}
                <div className="hidden md:block text-left">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      (isActive || isCompleted) ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {config.label}
                  </p>
                  {config.description && (
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  )}
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 lg:w-20 h-0.5 mx-2',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile View - Simplified */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {STEP_CONFIG[currentStep].label}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => {
            const isActive = step === currentStep
            const isCompleted = index < currentIndex
            
            return (
              <button
                key={step}
                type="button"
                onClick={() => onStepClick && (isCompleted || isActive) && onStepClick(step)}
                disabled={!onStepClick || (!isCompleted && !isActive)}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground',
                  !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
