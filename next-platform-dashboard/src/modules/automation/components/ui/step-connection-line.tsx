/**
 * StepConnectionLine Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Visual flow connections between steps with animated lines,
 * conditional branch indicators, and error state highlighting.
 */

"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface StepConnectionLineProps {
  /** Type of connection */
  type?: "normal" | "conditional-true" | "conditional-false" | "loop" | "error"
  /** Whether the workflow is currently running through this connection */
  isActive?: boolean
  /** Whether this connection has an error */
  hasError?: boolean
  /** Length of the connection line */
  length?: "short" | "medium" | "long"
  /** Show arrow at the end */
  showArrow?: boolean
  /** Whether to animate the line */
  animate?: boolean
  className?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LENGTH_CONFIG = {
  short: "h-6",
  medium: "h-10",
  long: "h-14",
}

const TYPE_CONFIG = {
  normal: {
    color: "border-muted-foreground/40",
    activeColor: "border-primary",
    style: "border-dashed",
    label: null,
  },
  "conditional-true": {
    color: "border-green-500/40",
    activeColor: "border-green-500",
    style: "border-solid",
    label: "Yes",
  },
  "conditional-false": {
    color: "border-red-500/40",
    activeColor: "border-red-500",
    style: "border-solid",
    label: "No",
  },
  loop: {
    color: "border-purple-500/40",
    activeColor: "border-purple-500",
    style: "border-dotted",
    label: "Loop",
  },
  error: {
    color: "border-destructive/40",
    activeColor: "border-destructive",
    style: "border-dashed",
    label: "Error",
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StepConnectionLine({
  type = "normal",
  isActive = false,
  hasError = false,
  length = "medium",
  showArrow = true,
  animate = false,
  className,
}: StepConnectionLineProps) {
  const config = hasError ? TYPE_CONFIG.error : TYPE_CONFIG[type]
  const lengthClass = LENGTH_CONFIG[length]

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        lengthClass,
        className
      )}
    >
      {/* Main Line */}
      <motion.div
        initial={animate ? { scaleY: 0 } : undefined}
        animate={animate ? { scaleY: 1 } : undefined}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "w-0.5 flex-1 border-l-2",
          config.style,
          isActive ? config.activeColor : config.color,
          "origin-top"
        )}
      />

      {/* Active Animation */}
      {isActive && (
        <motion.div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
            hasError ? "bg-destructive" : "bg-primary"
          )}
          initial={{ top: 0, opacity: 0 }}
          animate={{
            top: ["0%", "100%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Arrow */}
      {showArrow && (
        <motion.div
          initial={animate ? { opacity: 0, y: -4 } : undefined}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2 }}
          className={cn(
            "w-0 h-0 border-l-[5px] border-l-transparent",
            "border-r-[5px] border-r-transparent",
            "border-t-[6px]",
            isActive
              ? hasError
                ? "border-t-destructive"
                : "border-t-primary"
              : hasError
              ? "border-t-destructive/40"
              : "border-t-muted-foreground/40"
          )}
        />
      )}

      {/* Label (for conditional branches) */}
      {config.label && (
        <motion.span
          initial={animate ? { opacity: 0, x: -10 } : undefined}
          animate={animate ? { opacity: 1, x: 0 } : undefined}
          transition={{ delay: 0.3 }}
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2",
            "text-[10px] font-medium px-1.5 py-0.5 rounded",
            type === "conditional-true" && "bg-green-500/10 text-green-600",
            type === "conditional-false" && "bg-red-500/10 text-red-600",
            type === "loop" && "bg-purple-500/10 text-purple-600",
            type === "error" && "bg-destructive/10 text-destructive"
          )}
        >
          {config.label}
        </motion.span>
      )}
    </div>
  )
}

// ============================================================================
// HORIZONTAL CONNECTION LINE
// ============================================================================

interface HorizontalConnectionLineProps {
  type?: "normal" | "conditional-true" | "conditional-false"
  isActive?: boolean
  width?: "short" | "medium" | "long"
  direction?: "left" | "right"
  showArrow?: boolean
  className?: string
}

export function HorizontalConnectionLine({
  type = "normal",
  isActive = false,
  width = "medium",
  direction = "right",
  showArrow = true,
  className,
}: HorizontalConnectionLineProps) {
  const config = TYPE_CONFIG[type]

  const widthClass = useMemo(() => {
    switch (width) {
      case "short":
        return "w-8"
      case "medium":
        return "w-16"
      case "long":
        return "w-24"
    }
  }, [width])

  return (
    <div
      className={cn(
        "relative flex items-center",
        widthClass,
        className
      )}
    >
      {/* Main Line */}
      <div
        className={cn(
          "h-0.5 flex-1 border-t-2",
          config.style,
          isActive ? config.activeColor : config.color
        )}
      />

      {/* Arrow */}
      {showArrow && (
        <div
          className={cn(
            "w-0 h-0 border-t-[5px] border-t-transparent",
            "border-b-[5px] border-b-transparent",
            direction === "right"
              ? "border-l-[6px]"
              : "border-r-[6px] order-first",
            isActive
              ? direction === "right"
                ? "border-l-primary"
                : "border-r-primary"
              : direction === "right"
              ? "border-l-muted-foreground/40"
              : "border-r-muted-foreground/40"
          )}
        />
      )}

      {/* Label */}
      {config.label && (
        <span
          className={cn(
            "absolute top-2 left-1/2 -translate-x-1/2",
            "text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap",
            type === "conditional-true" && "bg-green-500/10 text-green-600",
            type === "conditional-false" && "bg-red-500/10 text-red-600"
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  )
}
