/**
 * Low Stock Alerts Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays products that are running low on inventory
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, ArrowRight, Package, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LowStockProduct } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface LowStockAlertsProps {
  products: LowStockProduct[]
  onViewProduct: (productId: string) => void
  onViewAll: () => void
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LowStockAlerts({
  products,
  onViewProduct,
  onViewAll,
  isLoading = false
}: LowStockAlertsProps) {
  const getStockPercentage = (quantity: number, threshold: number) => {
    // Calculate percentage based on threshold (100% when at threshold, 0% when at 0)
    const maxDisplay = threshold * 2 // Show full bar when at 2x threshold
    return Math.min((quantity / maxDisplay) * 100, 100)
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    }
    if (quantity <= threshold / 2) {
      return { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    }
    return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">All products are well stocked!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Products running low will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Low Stock Alerts
            <Badge variant="destructive" className="ml-2">
              {products.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.quantity, product.lowStockThreshold)
            const stockPercentage = getStockPercentage(product.quantity, product.lowStockThreshold)

            return (
              <div 
                key={product.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onViewProduct(product.id)}
              >
                {/* Product Image */}
                <div className="relative h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{product.name}</span>
                    <Badge className={cn('text-xs flex-shrink-0', stockStatus.className)}>
                      {stockStatus.label}
                    </Badge>
                  </div>
                  
                  {product.sku && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SKU: {product.sku}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <Progress 
                      value={stockPercentage} 
                      className={cn(
                        'h-1.5 flex-1',
                        product.quantity === 0 ? '[&>div]:bg-red-500' : 
                        product.quantity <= product.lowStockThreshold / 2 ? '[&>div]:bg-red-500' :
                        '[&>div]:bg-yellow-500'
                      )}
                    />
                    <span className={cn(
                      'text-xs font-medium tabular-nums',
                      product.quantity === 0 ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {product.quantity} left
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
