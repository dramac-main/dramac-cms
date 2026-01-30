"use client"

/**
 * E-Commerce Order Card Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Visual order cards with status badges and timeline
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  MoreHorizontal,
  Eye,
  Truck,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Package,
  CreditCard,
  User,
  ChevronRight,
  LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Order, OrderStatus, PaymentStatus, FulfillmentStatus } from "../../types/ecommerce-types"

// =============================================================================
// TYPES
// =============================================================================

export interface OrderCardProps {
  /** Order data */
  order: Order
  /** Click handler */
  onClick?: () => void
  /** View details handler */
  onView?: () => void
  /** Fulfill handler */
  onFulfill?: () => void
  /** Refund handler */
  onRefund?: () => void
  /** Cancel handler */
  onCancel?: () => void
  /** Mark as delivered handler */
  onMarkDelivered?: () => void
  /** Display variant */
  variant?: 'default' | 'compact'
  /** Currency code */
  currency?: string
  /** Additional class names */
  className?: string
  /** Animation delay */
  animationDelay?: number
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const orderStatusConfig: Record<OrderStatus, { label: string; className: string; icon: LucideIcon }> = {
  pending: { 
    label: 'Pending', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock
  },
  confirmed: { 
    label: 'Confirmed', 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle
  },
  processing: { 
    label: 'Processing', 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Package
  },
  shipped: { 
    label: 'Shipped', 
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: Truck
  },
  delivered: { 
    label: 'Delivered', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle
  },
  cancelled: { 
    label: 'Cancelled', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: XCircle
  },
  refunded: { 
    label: 'Refunded', 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: RefreshCw
  },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Unpaid', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partially_refunded: { label: 'Partial Refund', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  refunded: { label: 'Refunded', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const fulfillmentStatusConfig: Record<FulfillmentStatus, { label: string; className: string }> = {
  unfulfilled: { label: 'Unfulfilled', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  fulfilled: { label: 'Fulfilled', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeTime(date: string): string {
  const now = new Date()
  const orderDate = new Date(date)
  const diffMs = now.getTime() - orderDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

// =============================================================================
// SKELETON
// =============================================================================

export function OrderCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// ORDER TIMELINE
// =============================================================================

function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { status: 'pending', label: 'Ordered', date: order.created_at },
    { status: 'paid', label: 'Paid', date: order.payment_status === 'paid' ? order.created_at : null },
    { status: 'shipped', label: 'Shipped', date: order.shipped_at },
    { status: 'delivered', label: 'Delivered', date: order.delivered_at },
  ]

  return (
    <div className="flex items-center gap-1 mt-4">
      {steps.map((step, index) => {
        const isCompleted = step.date !== null
        const isCurrent = step.status === order.status
        
        return (
          <React.Fragment key={step.status}>
            <div className={cn(
              "flex items-center justify-center h-6 w-6 rounded-full text-xs",
              isCompleted 
                ? "bg-green-500 text-white" 
                : isCurrent
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
            )}>
              {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5",
                isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// =============================================================================
// DEFAULT CARD
// =============================================================================

function OrderDefaultCard({
  order,
  onClick,
  onView,
  onFulfill,
  onRefund,
  onCancel,
  onMarkDelivered,
  currency = 'USD',
  className,
  animationDelay = 0,
}: OrderCardProps) {
  const status = orderStatusConfig[order.status]
  const payment = paymentStatusConfig[order.payment_status]
  const fulfillment = fulfillmentStatusConfig[order.fulfillment_status]
  const StatusIcon = status.icon
  const itemCount = order.items?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card 
        className={cn(
          "group cursor-pointer transition-shadow hover:shadow-md",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(order.customer_email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">#{order.order_number}</h3>
                  <Badge className={cn("text-xs", status.className)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.customer_email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(order.created_at)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold">
                {formatPrice(order.total, currency)}
              </div>
              <div className="text-sm text-muted-foreground">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className={cn("text-xs", payment.className)}>
              <CreditCard className="h-3 w-3 mr-1" />
              {payment.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", fulfillment.className)}>
              <Package className="h-3 w-3 mr-1" />
              {fulfillment.label}
            </Badge>
            {order.tracking_number && (
              <Badge variant="outline" className="text-xs">
                <Truck className="h-3 w-3 mr-1" />
                {order.tracking_number}
              </Badge>
            )}
          </div>

          {/* Timeline */}
          <OrderTimeline order={order} />

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex gap-2">
              {onView && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onView() }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              )}
              {onFulfill && order.fulfillment_status !== 'fulfilled' && order.status !== 'cancelled' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onFulfill() }}
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Fulfill
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onMarkDelivered && order.status === 'shipped' && (
                  <DropdownMenuItem onClick={onMarkDelivered}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Delivered
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onRefund && order.payment_status === 'paid' && order.status !== 'refunded' && (
                  <DropdownMenuItem onClick={onRefund}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Issue Refund
                  </DropdownMenuItem>
                )}
                {onCancel && !['cancelled', 'delivered', 'refunded'].includes(order.status) && (
                  <DropdownMenuItem onClick={onCancel} className="text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// COMPACT CARD
// =============================================================================

function OrderCompactCard({
  order,
  onClick,
  currency = 'USD',
  className,
  animationDelay = 0,
}: OrderCardProps) {
  const status = orderStatusConfig[order.status]
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: animationDelay }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-colors hover:bg-muted/50",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center h-8 w-8 rounded-full",
              status.className
            )}>
              <StatusIcon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">#{order.order_number}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {order.customer_email}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(order.created_at)}
              </span>
            </div>

            <div className="text-right">
              <div className="font-semibold text-sm">
                {formatPrice(order.total, currency)}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function OrderCard(props: OrderCardProps) {
  if (props.variant === 'compact') {
    return <OrderCompactCard {...props} />
  }
  return <OrderDefaultCard {...props} />
}
