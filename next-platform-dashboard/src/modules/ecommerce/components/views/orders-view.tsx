/**
 * Orders View Component
 * 
 * Phase EM-52: E-Commerce Module
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Displays orders with filtering and status management
 */
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useEcommerce } from '../../context/ecommerce-context'
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign
} from 'lucide-react'
import { OrderDetailDialog } from '../orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus, PaymentStatus } from '../../types/ecommerce-types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
interface OrdersViewProps {
  searchQuery?: string
  userId?: string
  userName?: string
}

const orderStatusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Processing', icon: Package, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  refunded: { label: 'Refunded', icon: DollarSign, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partially_refunded: { label: 'Partial Refund', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  refunded: { label: 'Refunded', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function OrdersView({ searchQuery = '', userId = '', userName = 'Store Manager' }: OrdersViewProps) {
  const router = useRouter()
  const { orders, isLoading, changeOrderStatus, siteId, settings } = useEcommerce()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  
  // Get store info from settings
  const storeName = settings?.store_name || 'My Store'
  const storeAddress = settings?.store_address 
    ? `${settings.store_address.address_line_1}, ${settings.store_address.city}, ${settings.store_address.state} ${settings.store_address.postal_code}`
    : ''
  const storeEmail = settings?.store_email || ''

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      
      // Payment filter
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !order.order_number.toLowerCase().includes(query) &&
          !order.customer_email.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      
      return true
    })
  }, [orders, statusFilter, paymentFilter, searchQuery])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await changeOrderStatus(orderId, newStatus)
  }

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId)
    setDetailDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDetailDialogOpen(open)
    if (!open) {
      setSelectedOrderId(null)
      router.refresh()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(orderStatusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentStatus | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {Object.entries(paymentStatusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No orders found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try adjusting your search or filters' : 'Orders will appear here when customers make purchases'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => {
                const statusConfig = orderStatusConfig[order.status]
                const paymentConfig = paymentStatusConfig[order.payment_status]
                const StatusIcon = statusConfig.icon
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">#{order.order_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.items?.length || 0} items
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(order.created_at)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customer_email}</div>
                      {order.customer_phone && (
                        <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal gap-1', statusConfig.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', paymentConfig.className)}>
                        {paymentConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">${(order.total / 100).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">{order.currency}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'processing')}>
                            <Package className="h-4 w-4 mr-2" />
                            Mark Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                            <Truck className="h-4 w-4 mr-2" />
                            Mark Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Delivered
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          siteId={siteId}
          userId={userId}
          userName={userName}
          storeName={storeName}
          storeAddress={storeAddress}
          storeEmail={storeEmail}
          open={detailDialogOpen}
          onOpenChange={handleDialogClose}
        />
      )}
    </div>
  )
}
