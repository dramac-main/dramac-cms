/**
 * Recent Orders Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays the most recent orders with quick actions
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ShoppingCart, 
  ArrowRight,
  Clock,
  CircleCheck,
  Package,
  Truck,
  CircleX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecentOrderSummary, OrderStatus, PaymentStatus } from '../../types/ecommerce-types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface RecentOrdersWidgetProps {
  orders: RecentOrderSummary[]
  onViewOrder: (orderId: string) => void
  onViewAll: () => void
  isLoading?: boolean
}

// ============================================================================
// STATUS CONFIGS
// ============================================================================

const orderStatusConfig: Record<OrderStatus, { 
  label: string
  icon: typeof Clock
  className: string 
}> = {
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  confirmed: { 
    label: 'Confirmed', 
    icon: CircleCheck, 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  processing: { 
    label: 'Processing', 
    icon: Package, 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
  },
  shipped: { 
    label: 'Shipped', 
    icon: Truck, 
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
  },
  delivered: { 
    label: 'Delivered', 
    icon: CircleCheck, 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: CircleX, 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
  refunded: { 
    label: 'Refunded', 
    icon: CircleX, 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  }
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Unpaid', className: 'text-yellow-600' },
  paid: { label: 'Paid', className: 'text-green-600' },
  partially_refunded: { label: 'Partial Refund', className: 'text-orange-600' },
  refunded: { label: 'Refunded', className: 'text-red-600' },
  failed: { label: 'Failed', className: 'text-red-600' }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RecentOrdersWidget({
  orders,
  onViewOrder,
  onViewAll,
  isLoading = false
}: RecentOrdersWidgetProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric' })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders will appear here when customers make purchases
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
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = orderStatusConfig[order.status]
            const paymentConfig = paymentStatusConfig[order.paymentStatus]
            const StatusIcon = statusConfig.icon

            return (
              <div 
                key={order.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onViewOrder(order.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    {getInitials(order.customerName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {order.orderNumber}
                    </span>
                    <Badge className={cn('text-xs', statusConfig.className)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-muted-foreground truncate">
                      {order.customerName}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(order.total, order.currency)}
                  </div>
                  <div className={cn('text-xs', paymentConfig.className)}>
                    {paymentConfig.label}
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
