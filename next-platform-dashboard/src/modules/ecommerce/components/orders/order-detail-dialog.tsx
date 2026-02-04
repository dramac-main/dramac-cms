/**
 * Order Detail Dialog Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Full order detail view with all actions
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Loader2, 
  MoreHorizontal, 
  Printer, 
  Mail, 
  RefreshCw,
  FileText,
  Truck
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { OrderTimeline } from './order-timeline'
import { OrderItemsTable } from './order-items-table'
import { OrderCustomerPanel } from './order-customer-panel'
import { InvoiceTemplate } from './invoice-template'
import { RefundDialog } from './refund-dialog'
import { 
  getOrderDetail, 
  updateOrderStatus, 
  generateInvoiceNumber,
  sendOrderEmail
} from '../../actions/order-actions'
import type { OrderDetailData, OrderStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  siteId: string
  userId: string
  userName: string
  storeName: string
  storeAddress: string
  storeEmail: string
  storePhone?: string
  storeLogo?: string
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { 
    label: 'Pending', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  confirmed: { 
    label: 'Confirmed', 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  processing: { 
    label: 'Processing', 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
  },
  shipped: { 
    label: 'Shipped', 
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
  },
  delivered: { 
    label: 'Delivered', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  cancelled: { 
    label: 'Cancelled', 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  },
  refunded: { 
    label: 'Refunded', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  }
}

const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount / 100)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderDetailDialog({
  open,
  onOpenChange,
  orderId,
  siteId,
  userId,
  userName,
  storeName,
  storeAddress,
  storeEmail,
  storePhone,
  storeLogo
}: OrderDetailDialogProps) {
  const [orderData, setOrderData] = useState<OrderDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Load order data
  useEffect(() => {
    if (!open || !orderId) return

    async function loadOrder() {
      setIsLoading(true)
      try {
        const data = await getOrderDetail(siteId, orderId)
        setOrderData(data)
        
        if (data) {
          const invNum = await generateInvoiceNumber(siteId, orderId)
          setInvoiceNumber(invNum)
        }
      } catch (error) {
        console.error('Error loading order:', error)
        toast.error('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [open, orderId, siteId])

  // Print invoice handler
  const handlePrintInvoice = useCallback(() => {
    if (!invoiceRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to print the invoice')
      return
    }

    const invoiceHtml = invoiceRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 8px; text-align: left; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${invoiceHtml}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }, [invoiceNumber])

  // Status change handler
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!orderData) return

    setIsUpdatingStatus(true)
    try {
      const result = await updateOrderStatus(siteId, orderId, newStatus, userId, userName)
      
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`)
        // Refresh order data
        const data = await getOrderDetail(siteId, orderId)
        setOrderData(data)
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Send email handler
  const handleSendEmail = async (type: 'confirmation' | 'shipped' | 'delivered') => {
    try {
      await sendOrderEmail(orderId, type, userId, userName)
      toast.success('Email sent successfully')
      // Refresh to show new timeline event
      const data = await getOrderDetail(siteId, orderId)
      setOrderData(data)
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    }
  }

  if (isLoading || !orderData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const statusInfo = statusConfig[orderData.status]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  Order #{orderData.order_number}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(orderData.created_at), 'PPpp')}
                </p>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                <Badge className={cn('text-sm', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>

                <Select
                  value={orderData.status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusConfig[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePrintInvoice}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrintInvoice}>
                      <FileText className="h-4 w-4 mr-2" />
                      Print Packing Slip
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSendEmail('confirmation')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Confirmation
                    </DropdownMenuItem>
                    {orderData.status === 'shipped' && (
                      <DropdownMenuItem onClick={() => handleSendEmail('shipped')}>
                        <Truck className="h-4 w-4 mr-2" />
                        Send Shipping Update
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowRefundDialog(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Process Refund
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Summary Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(orderData.total, orderData.currency)}
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Items</div>
                  <div className="text-2xl font-bold">
                    {orderData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Payment</div>
                  <div className="text-xl font-bold capitalize">
                    {orderData.payment_status}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-lg border">
                <OrderItemsTable
                  items={orderData.items || []}
                  currency={orderData.currency}
                  subtotal={orderData.subtotal}
                  shipping={orderData.shipping_total || orderData.shipping_amount}
                  tax={orderData.tax_total || orderData.tax_amount}
                  discount={orderData.discount_total || orderData.discount_amount}
                  total={orderData.total}
                />
              </div>

              {/* Customer Panel */}
              <OrderCustomerPanel order={orderData} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <OrderTimeline events={orderData.timeline} />
            </TabsContent>

            <TabsContent value="invoice" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handlePrintInvoice}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <InvoiceTemplate
                    ref={invoiceRef}
                    data={{
                      order: orderData,
                      store: {
                        name: storeName,
                        address: storeAddress,
                        email: storeEmail,
                        phone: storePhone,
                        logo: storeLogo
                      },
                      invoice_number: invoiceNumber,
                      invoice_date: orderData.created_at
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <RefundDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        order={orderData}
        siteId={siteId}
        userId={userId}
        userName={userName}
        onSuccess={async () => {
          const data = await getOrderDetail(siteId, orderId)
          setOrderData(data)
        }}
      />
    </>
  )
}
