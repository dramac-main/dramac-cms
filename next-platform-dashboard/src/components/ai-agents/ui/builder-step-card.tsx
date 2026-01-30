"use client"

/**
 * Builder Step Card Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Step indicator with completion status and navigation
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Check, 
  ChevronDown, 
  ChevronUp,
  Circle,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// =============================================================================
// TYPES
// =============================================================================

export type StepStatus = 'pending' | 'active' | 'completed' | 'error'

export interface BuilderStep {
  id: string
  number: number
  title: string
  description?: string
  status: StepStatus
  isOptional?: boolean
  errorMessage?: string
}

export interface BuilderStepCardProps {
  step: BuilderStep
  children: React.ReactNode
  className?: string
  onStatusChange?: (status: StepStatus) => void
  defaultOpen?: boolean
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const statusConfig: Record<StepStatus, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
}> = {
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
  },
  active: {
    icon: Circle,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary",
  },
  completed: {
    icon: Check,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
}

// =============================================================================
// STEP NUMBER INDICATOR
// =============================================================================

interface StepNumberProps {
  number: number
  status: StepStatus
}

function StepNumber({ number, status }: StepNumberProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center h-8 w-8 rounded-full border-2 text-sm font-semibold transition-colors",
        config.bgColor,
        config.borderColor,
        config.color
      )}
      initial={false}
      animate={status === 'active' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {status === 'completed' ? (
        <Check className="h-4 w-4" />
      ) : status === 'error' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        number
      )}
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuilderStepCard({
  step,
  children,
  className,
  defaultOpen = false,
}: BuilderStepCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen || step.status === 'active')
  const config = statusConfig[step.status]

  // Auto-open when step becomes active
  React.useEffect(() => {
    if (step.status === 'active') {
      setIsOpen(true)
    }
  }, [step.status])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step.number * 0.05 }}
    >
      <Card className={cn(
        "overflow-hidden transition-colors",
        step.status === 'active' && "ring-2 ring-primary/50",
        className
      )}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className={cn(
              "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
              step.status === 'active' && "bg-primary/5"
            )}>
              {/* Step Number */}
              <StepNumber number={step.number} status={step.status} />

              {/* Title & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    "font-semibold",
                    step.status === 'completed' && "text-muted-foreground"
                  )}>
                    {step.title}
                  </h3>
                  {step.isOptional && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {step.description}
                  </p>
                )}
                {step.errorMessage && (
                  <p className="text-sm text-red-600 mt-0.5">
                    {step.errorMessage}
                  </p>
                )}
              </div>

              {/* Expand/Collapse */}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 pb-4">
                    <div className="ml-12 border-l-2 border-muted pl-4">
                      {children}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// STEP PROGRESS INDICATOR
// =============================================================================

interface StepProgressProps {
  steps: BuilderStep[]
  currentStep: number
  onStepClick?: (stepId: string) => void
}

export function BuilderStepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <button
            className="flex items-center gap-2"
            onClick={() => onStepClick?.(step.id)}
            disabled={step.status === 'pending'}
          >
            <StepNumber number={step.number} status={step.status} />
            <span className={cn(
              "text-sm font-medium hidden sm:inline",
              step.status === 'active' && "text-primary",
              step.status === 'completed' && "text-muted-foreground",
              step.status === 'pending' && "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </button>
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 min-w-4 max-w-12",
              index < currentStep - 1 ? "bg-green-500" : "bg-muted"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default BuilderStepCard
