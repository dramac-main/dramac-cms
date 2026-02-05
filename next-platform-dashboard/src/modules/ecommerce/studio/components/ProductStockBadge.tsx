/**
 * ProductStockBadge - Stock status indicator
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Displays stock status with appropriate styling.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, X, AlertCircle, Package } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductStockBadgeProps {
  /** Current stock quantity */
  stockQuantity: number
  /** Whether inventory is tracked */
  trackInventory?: boolean
  /** Whether to show the quantity number */
  showQuantity?: boolean
  /** Low stock threshold */
  lowStockThreshold?: number
  /** Additional class name */
  className?: string
}

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'unlimited'

// ============================================================================
// HELPERS
// ============================================================================

function getStockStatus(
  quantity: number, 
  trackInventory: boolean,
  threshold: number
): { status: StockStatus; quantity: number | null } {
  if (!trackInventory) {
    return { status: 'unlimited', quantity: null }
  }

  if (quantity <= 0) {
    return { status: 'out-of-stock', quantity: 0 }
  }

  if (quantity <= threshold) {
    return { status: 'low-stock', quantity }
  }

  return { status: 'in-stock', quantity }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductStockBadge({
  stockQuantity,
  trackInventory = true,
  showQuantity = false,
  lowStockThreshold = 5,
  className
}: ProductStockBadgeProps) {
  const { status, quantity } = getStockStatus(stockQuantity, trackInventory, lowStockThreshold)

  const statusConfig = {
    'in-stock': {
      icon: Check,
      text: 'In Stock',
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-400',
      iconClass: 'text-green-600 dark:text-green-500'
    },
    'low-stock': {
      icon: AlertCircle,
      text: `Only ${quantity} left`,
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      textClass: 'text-amber-700 dark:text-amber-400',
      iconClass: 'text-amber-600 dark:text-amber-500'
    },
    'out-of-stock': {
      icon: X,
      text: 'Out of Stock',
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-400',
      iconClass: 'text-red-600 dark:text-red-500'
    },
    'unlimited': {
      icon: Package,
      text: 'Available',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-400',
      iconClass: 'text-blue-600 dark:text-blue-500'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      <span>{config.text}</span>
      {showQuantity && status === 'in-stock' && quantity && (
        <span className="text-muted-foreground">({quantity})</span>
      )}
    </div>
  )
}
