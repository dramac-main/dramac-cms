"use client"

/**
 * Inventory Alert Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Low stock warning and inventory status display
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  AlertTriangle,
  Package,
  X,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Product } from "../../types/ecommerce-types"

// =============================================================================
// TYPES
// =============================================================================

export interface InventoryAlertProps {
  /** Products with low stock */
  lowStockProducts: Product[]
  /** Products out of stock */
  outOfStockProducts?: Product[]
  /** Title */
  title?: string
  /** Maximum items to show */
  maxItems?: number
  /** Click handler for product */
  onProductClick?: (product: Product) => void
  /** Click handler for "View All" */
  onViewAll?: () => void
  /** Dismissible */
  dismissible?: boolean
  /** On dismiss handler */
  onDismiss?: () => void
  /** Compact variant */
  compact?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function getStockLevel(product: Product): 'critical' | 'low' | 'medium' | 'good' {
  if (product.quantity <= 0) return 'critical'
  if (product.quantity <= product.low_stock_threshold * 0.5) return 'critical'
  if (product.quantity <= product.low_stock_threshold) return 'low'
  if (product.quantity <= product.low_stock_threshold * 2) return 'medium'
  return 'good'
}

function getStockColor(level: ReturnType<typeof getStockLevel>): string {
  const colors = {
    critical: 'bg-red-500',
    low: 'bg-yellow-500',
    medium: 'bg-blue-500',
    good: 'bg-green-500',
  }
  return colors[level]
}

function getStockTextColor(level: ReturnType<typeof getStockLevel>): string {
  const colors = {
    critical: 'text-red-600 dark:text-red-400',
    low: 'text-yellow-600 dark:text-yellow-400',
    medium: 'text-blue-600 dark:text-blue-400',
    good: 'text-green-600 dark:text-green-400',
  }
  return colors[level]
}

// =============================================================================
// PRODUCT ROW
// =============================================================================

interface ProductRowProps {
  product: Product
  onClick?: () => void
  compact?: boolean
}

function ProductRow({ product, onClick, compact = false }: ProductRowProps) {
  const stockLevel = getStockLevel(product)
  const stockPercent = product.low_stock_threshold > 0 
    ? Math.min((product.quantity / (product.low_stock_threshold * 3)) * 100, 100)
    : 50

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
      >
        <div className={cn(
          "h-2 w-2 rounded-full",
          getStockColor(stockLevel)
        )} />
        <span className="flex-1 text-sm truncate">{product.name}</span>
        <span className={cn(
          "text-xs font-medium",
          getStockTextColor(stockLevel)
        )}>
          {product.quantity} left
        </span>
      </button>
    )
  }

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left border"
      whileHover={{ x: 4 }}
    >
      {/* Product Image */}
      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
          {stockLevel === 'critical' && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">
              Critical
            </Badge>
          )}
        </div>
        {product.sku && (
          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
        )}
        
        {/* Stock Progress */}
        <div className="flex items-center gap-2 mt-1.5">
          <Progress 
            value={stockPercent} 
            className="h-1.5 flex-1"
          />
          <span className={cn(
            "text-xs font-medium",
            getStockTextColor(stockLevel)
          )}>
            {product.quantity} / {product.low_stock_threshold * 3}
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </motion.button>
  )
}

// =============================================================================
// BANNER VARIANT
// =============================================================================

export function InventoryAlertBanner({
  count,
  onViewAll,
  onDismiss,
  className,
}: {
  count: number
  onViewAll?: () => void
  onDismiss?: () => void
  className?: string
}) {
  if (count === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800",
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          {count} product{count !== 1 ? 's' : ''} {count !== 1 ? 'are' : 'is'} running low on stock
        </p>
      </div>
      {onViewAll && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewAll}
          className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
        >
          View All
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-6 w-6 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InventoryAlert({
  lowStockProducts,
  outOfStockProducts = [],
  title = "Inventory Alerts",
  maxItems = 5,
  onProductClick,
  onViewAll,
  dismissible = false,
  onDismiss,
  compact = false,
  className,
}: InventoryAlertProps) {
  const [dismissed, setDismissed] = React.useState(false)

  const allAlertProducts = React.useMemo(() => {
    // Combine and sort by severity (out of stock first, then by quantity)
    return [...outOfStockProducts, ...lowStockProducts]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, maxItems)
  }, [lowStockProducts, outOfStockProducts, maxItems])

  const totalAlerts = lowStockProducts.length + outOfStockProducts.length

  if (dismissed || totalAlerts === 0) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (compact) {
    return (
      <Card className={cn("border-yellow-200 dark:border-yellow-800", className)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              {title}
              <Badge variant="secondary" className="text-xs">
                {totalAlerts}
              </Badge>
            </CardTitle>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-1">
            {allAlertProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onClick={() => onProductClick?.(product)}
                compact
              />
            ))}
          </div>
          {totalAlerts > maxItems && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={onViewAll}
            >
              View all {totalAlerts} alerts
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-yellow-200 dark:border-yellow-800", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <span>{title}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {outOfStockProducts.length > 0 && (
                  <span className="text-red-600">{outOfStockProducts.length} out of stock</span>
                )}
                {outOfStockProducts.length > 0 && lowStockProducts.length > 0 && ', '}
                {lowStockProducts.length > 0 && (
                  <span className="text-yellow-600">{lowStockProducts.length} low stock</span>
                )}
              </p>
            </div>
          </CardTitle>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={allAlertProducts.length > 3 ? "h-[280px]" : ""}>
          <div className="space-y-2">
            <AnimatePresence>
              {allAlertProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductRow
                    product={product}
                    onClick={() => onProductClick?.(product)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {totalAlerts > maxItems && onViewAll && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onViewAll}
          >
            View all {totalAlerts} inventory alerts
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
