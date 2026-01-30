"use client"

/**
 * E-Commerce Quick Actions Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Quick action buttons grid for common operations
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Plus,
  Package,
  ShoppingCart,
  Percent,
  BarChart3,
  Settings,
  Upload,
  Download,
  Tag,
  Truck,
  RefreshCw,
  FileText,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// =============================================================================
// TYPES
// =============================================================================

export interface QuickAction {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  badge?: string
  disabled?: boolean
}

export interface EcommerceQuickActionsProps {
  /** Actions to display */
  actions?: QuickAction[]
  /** Title */
  title?: string
  /** Show title */
  showTitle?: boolean
  /** Compact variant */
  compact?: boolean
  /** Columns (for grid layout) */
  columns?: 2 | 3 | 4
  /** Additional class names */
  className?: string
}

// =============================================================================
// DEFAULT ACTIONS
// =============================================================================

export function getDefaultEcommerceActions(handlers: {
  onAddProduct?: () => void
  onViewOrders?: () => void
  onCreateDiscount?: () => void
  onViewAnalytics?: () => void
  onImportProducts?: () => void
  onExportProducts?: () => void
  onManageCategories?: () => void
  onProcessShipments?: () => void
  onSettings?: () => void
}): QuickAction[] {
  return [
    {
      id: 'add-product',
      label: 'Add Product',
      description: 'Create a new product listing',
      icon: Plus,
      onClick: handlers.onAddProduct || (() => {}),
      variant: 'primary',
    },
    {
      id: 'view-orders',
      label: 'View Orders',
      description: 'Manage pending orders',
      icon: ShoppingCart,
      onClick: handlers.onViewOrders || (() => {}),
    },
    {
      id: 'create-discount',
      label: 'Create Discount',
      description: 'Set up a promotion',
      icon: Percent,
      onClick: handlers.onCreateDiscount || (() => {}),
    },
    {
      id: 'view-analytics',
      label: 'Analytics',
      description: 'View sales reports',
      icon: BarChart3,
      onClick: handlers.onViewAnalytics || (() => {}),
    },
    {
      id: 'import-products',
      label: 'Import',
      description: 'Bulk import products',
      icon: Upload,
      onClick: handlers.onImportProducts || (() => {}),
    },
    {
      id: 'export-products',
      label: 'Export',
      description: 'Export product data',
      icon: Download,
      onClick: handlers.onExportProducts || (() => {}),
    },
    {
      id: 'categories',
      label: 'Categories',
      description: 'Manage categories',
      icon: Tag,
      onClick: handlers.onManageCategories || (() => {}),
    },
    {
      id: 'shipments',
      label: 'Shipments',
      description: 'Process shipments',
      icon: Truck,
      onClick: handlers.onProcessShipments || (() => {}),
    },
  ]
}

// =============================================================================
// ACTION BUTTON
// =============================================================================

interface ActionButtonProps {
  action: QuickAction
  compact?: boolean
  animationDelay?: number
}

function ActionButton({ action, compact = false, animationDelay = 0 }: ActionButtonProps) {
  const Icon = action.icon

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: animationDelay }}
      >
        <Button
          variant={action.variant === 'primary' ? 'default' : 'outline'}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          className="w-full justify-start gap-2"
        >
          <Icon className="h-4 w-4" />
          {action.label}
          {action.badge && (
            <span className="ml-auto text-xs bg-primary/20 px-1.5 py-0.5 rounded">
              {action.badge}
            </span>
          )}
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={action.onClick}
        disabled={action.disabled}
        className={cn(
          "w-full p-4 rounded-lg border text-left transition-all",
          "hover:shadow-md hover:border-primary/50",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          action.disabled && "opacity-50 cursor-not-allowed",
          action.variant === 'primary' 
            ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
            : "bg-card hover:bg-muted/50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex items-center justify-center h-10 w-10 rounded-lg",
            action.variant === 'primary' 
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{action.label}</h4>
              {action.badge && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  {action.badge}
                </span>
              )}
            </div>
            {action.description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {action.description}
              </p>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EcommerceQuickActions({
  actions,
  title = "Quick Actions",
  showTitle = true,
  compact = false,
  columns = 4,
  className,
}: EcommerceQuickActionsProps) {
  const displayActions = actions || getDefaultEcommerceActions({})

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }

  if (compact) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn(!showTitle && "pt-6")}>
          <div className="space-y-2">
            {displayActions.slice(0, 6).map((action, i) => (
              <ActionButton 
                key={action.id} 
                action={action} 
                compact 
                animationDelay={i * 0.05}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!showTitle && "pt-6")}>
        <div className={cn("grid gap-3", gridCols[columns])}>
          {displayActions.map((action, i) => (
            <ActionButton 
              key={action.id} 
              action={action} 
              animationDelay={i * 0.05}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export function EcommerceQuickActionsCompact(
  props: Omit<EcommerceQuickActionsProps, 'compact'>
) {
  return <EcommerceQuickActions {...props} compact />
}
