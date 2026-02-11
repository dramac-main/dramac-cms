/**
 * Stock Alert Widget
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * Dashboard widget showing stock alert summary with quick actions.
 */
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Package, AlertCircle, CircleCheck, RefreshCw, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getStockAlerts } from '../../actions/inventory-actions'
import type { AlertedProduct, StockAlertLevel } from '../../types/inventory-types'

interface StockAlertWidgetProps {
  siteId: string
  onViewAll?: () => void
  onProductClick?: (productId: string) => void
  className?: string
}

const alertLevelConfig: Record<StockAlertLevel, {
  label: string
  color: string
  icon: typeof AlertTriangle
  bgColor: string
}> = {
  out: {
    label: 'Out of Stock',
    color: 'text-red-600 dark:text-red-400',
    icon: AlertCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  critical: {
    label: 'Critical',
    color: 'text-orange-600 dark:text-orange-400',
    icon: AlertTriangle,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  low: {
    label: 'Low Stock',
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: Package,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  ok: {
    label: 'In Stock',
    color: 'text-green-600 dark:text-green-400',
    icon: CircleCheck,
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  }
}

export function StockAlertWidget({
  siteId,
  onViewAll,
  onProductClick,
  className
}: StockAlertWidgetProps) {
  const [alerts, setAlerts] = useState<AlertedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAlerts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const data = await getStockAlerts(siteId, 'all')
      // Only show alerts (not 'ok' status)
      setAlerts(data.filter(a => a.alert_level !== 'ok').slice(0, 5))
    } catch (error) {
      console.error('Error fetching stock alerts:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  // Count by level
  const outCount = alerts.filter(a => a.alert_level === 'out').length
  const criticalCount = alerts.filter(a => a.alert_level === 'critical').length
  const lowCount = alerts.filter(a => a.alert_level === 'low').length

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription>
              Products needing attention
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchAlerts(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex gap-2 mb-4">
          {outCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {outCount} Out
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge className="gap-1 bg-orange-500 hover:bg-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} Critical
            </Badge>
          )}
          {lowCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {lowCount} Low
            </Badge>
          )}
          {alerts.length === 0 && (
            <Badge variant="outline" className="gap-1 text-green-600">
              <CircleCheck className="h-3 w-3" />
              All Good
            </Badge>
          )}
        </div>

        {/* Alert list */}
        {alerts.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {alerts.map(alert => {
                const config = alertLevelConfig[alert.alert_level]
                const Icon = config.icon
                
                return (
                  <div
                    key={`${alert.product_id}-${alert.variant_id}`}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      config.bgColor,
                      "hover:opacity-80"
                    )}
                    onClick={() => onProductClick?.(alert.product_id)}
                  >
                    {/* Product image or icon */}
                    <div className="h-10 w-10 rounded bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      {alert.image_url ? (
                        <img 
                          src={alert.image_url} 
                          alt={alert.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {alert.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.sku ? `SKU: ${alert.sku}` : 'No SKU'}
                      </p>
                    </div>
                    
                    {/* Stock count */}
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", config.color)}>
                        {alert.current_stock}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{alert.threshold}
                      </p>
                    </div>
                    
                    {/* Alert icon */}
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CircleCheck className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-sm font-medium">All stock levels healthy</p>
            <p className="text-xs text-muted-foreground">
              No products below threshold
            </p>
          </div>
        )}

        {/* View all link */}
        {onViewAll && alerts.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={onViewAll}
          >
            View All Inventory
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
