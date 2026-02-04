# PHASE-ECOM-04: Order Management Enhancement

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 10-12 hours
> **Prerequisites**: PHASE-ECOM-01 (Dashboard Redesign)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Enhance the order management system with a comprehensive order detail page, status timeline, bulk operations, invoice/packing slip generation, refund processing, and customer communication. This phase transforms basic order viewing into a professional fulfillment workflow.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-01 is complete and tested
- [ ] Review existing orders-view.tsx (`src/modules/ecommerce/components/views/orders-view.tsx`)
- [ ] Review existing order types and actions
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Orders View
├── Filters Bar
│   ├── Search (Order #, Customer)
│   ├── Status Filter
│   ├── Date Range
│   └── Payment Status
├── Bulk Actions Bar (when selected)
│   ├── Update Status
│   ├── Print Labels
│   ├── Export Selected
│   └── Archive
├── Orders Table
│   ├── Checkbox Column
│   ├── Order Number + Date
│   ├── Customer Info
│   ├── Items Summary
│   ├── Status Badge
│   ├── Payment Status
│   ├── Total
│   └── Actions Menu
└── Order Detail Dialog/Page
    ├── Header (Order #, Status, Actions)
    ├── Timeline/Activity
    ├── Customer Info Panel
    ├── Items Table
    ├── Payment Info
    ├── Shipping Info
    ├── Notes Section
    └── Documents (Invoice, Packing Slip)
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add order management types |
| `src/modules/ecommerce/actions/order-actions.ts` | Create | Order management server actions |
| `src/modules/ecommerce/components/orders/order-detail-dialog.tsx` | Create | Comprehensive order detail view |
| `src/modules/ecommerce/components/orders/order-timeline.tsx` | Create | Order status timeline |
| `src/modules/ecommerce/components/orders/order-items-table.tsx` | Create | Order line items table |
| `src/modules/ecommerce/components/orders/order-customer-panel.tsx` | Create | Customer info panel |
| `src/modules/ecommerce/components/orders/order-actions-panel.tsx` | Create | Order action buttons |
| `src/modules/ecommerce/components/orders/invoice-template.tsx` | Create | Printable invoice |
| `src/modules/ecommerce/components/orders/packing-slip-template.tsx` | Create | Printable packing slip |
| `src/modules/ecommerce/components/orders/refund-dialog.tsx` | Create | Refund processing dialog |
| `src/modules/ecommerce/components/orders/order-notes.tsx` | Create | Order notes/comments |
| `src/modules/ecommerce/components/orders/index.ts` | Create | Orders exports |
| `src/modules/ecommerce/components/views/orders-view.tsx` | Modify | Integrate new components |

---

## 📋 Implementation Tasks

### Task 4.1: Add Order Management Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end of file)

**Description**: Add comprehensive order management types

```typescript
// ============================================================================
// ORDER MANAGEMENT TYPES (Phase ECOM-04)
// ============================================================================

export type OrderEventType = 
  | 'created'
  | 'confirmed'
  | 'payment_received'
  | 'payment_failed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested'
  | 'refund_processed'
  | 'note_added'
  | 'status_changed'
  | 'email_sent'

export interface OrderTimelineEvent {
  id: string
  order_id: string
  event_type: OrderEventType
  title: string
  description?: string
  metadata?: Record<string, unknown>
  user_id?: string
  user_name?: string
  created_at: string
}

export interface OrderNote {
  id: string
  order_id: string
  content: string
  is_internal: boolean // Internal notes not visible to customer
  user_id: string
  user_name: string
  created_at: string
}

export interface OrderShipment {
  id: string
  order_id: string
  carrier: string
  tracking_number: string
  tracking_url?: string
  shipped_at: string
  delivered_at?: string
  status: 'pending' | 'in_transit' | 'delivered' | 'failed'
  items: Array<{
    order_item_id: string
    quantity: number
  }>
}

export interface OrderRefund {
  id: string
  order_id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'processed' | 'rejected'
  refund_method: 'original_payment' | 'store_credit' | 'other'
  items?: Array<{
    order_item_id: string
    quantity: number
    amount: number
  }>
  processed_at?: string
  processed_by?: string
  created_at: string
}

export interface OrderTableFilters {
  search: string
  status: OrderStatus | 'all'
  paymentStatus: PaymentStatus | 'all'
  dateFrom: string | null
  dateTo: string | null
  minTotal: number | null
  maxTotal: number | null
}

export interface OrderBulkAction {
  action: 'update_status' | 'export' | 'print_invoices' | 'print_labels' | 'archive'
  orderIds: string[]
  params?: Record<string, unknown>
}

export interface OrderDetailData extends Order {
  timeline: OrderTimelineEvent[]
  notes: OrderNote[]
  shipments: OrderShipment[]
  refunds: OrderRefund[]
}

export interface InvoiceData {
  order: Order
  store: {
    name: string
    address: string
    email: string
    phone: string
    logo?: string
  }
  invoice_number: string
  invoice_date: string
  due_date?: string
}

export interface PackingSlipData {
  order: Order
  store: {
    name: string
    address: string
  }
  packing_date: string
  notes?: string
}
```

---

### Task 4.2: Create Order Management Actions

**File**: `src/modules/ecommerce/actions/order-actions.ts`
**Action**: Create

**Description**: Server actions for order management

```typescript
/**
 * Order Management Actions
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Server actions for managing orders, shipments, refunds
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Order,
  OrderStatus,
  OrderDetailData,
  OrderTimelineEvent,
  OrderNote,
  OrderShipment,
  OrderRefund,
  OrderTableFilters,
  OrderBulkAction,
  BulkActionResult,
  OrderEventType
} from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// ORDER DETAIL
// ============================================================================

/**
 * Get complete order detail with timeline, notes, shipments, refunds
 */
export async function getOrderDetail(
  siteId: string,
  orderId: string
): Promise<OrderDetailData | null> {
  const supabase = await getModuleClient()

  // Get order
  const { data: order, error: orderError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('*')
    .eq('id', orderId)
    .eq('site_id', siteId)
    .single()

  if (orderError || !order) return null

  // Get order items
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_order_items`)
    .select('*')
    .eq('order_id', orderId)

  // Get timeline events
  const { data: timeline } = await supabase
    .from(`${TABLE_PREFIX}_order_timeline`)
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  // Get notes
  const { data: notes } = await supabase
    .from(`${TABLE_PREFIX}_order_notes`)
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  // Get shipments
  const { data: shipments } = await supabase
    .from(`${TABLE_PREFIX}_order_shipments`)
    .select('*')
    .eq('order_id', orderId)
    .order('shipped_at', { ascending: false })

  // Get refunds
  const { data: refunds } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  return {
    ...order,
    items: items || [],
    timeline: timeline || [],
    notes: notes || [],
    shipments: shipments || [],
    refunds: refunds || []
  }
}

// ============================================================================
// ORDER STATUS
// ============================================================================

/**
 * Update order status with timeline entry
 */
export async function updateOrderStatus(
  siteId: string,
  orderId: string,
  status: OrderStatus,
  userId: string,
  userName: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()

  // Update order
  const { error: orderError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('site_id', siteId)

  if (orderError) {
    return { success: false, error: orderError.message }
  }

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: 'status_changed',
    title: `Status changed to ${status}`,
    description: note,
    user_id: userId,
    user_name: userName
  })

  return { success: true }
}

/**
 * Add timeline event
 */
async function addTimelineEvent(
  orderId: string,
  event: Omit<OrderTimelineEvent, 'id' | 'order_id' | 'created_at'>
) {
  const supabase = await getModuleClient()

  await supabase
    .from(`${TABLE_PREFIX}_order_timeline`)
    .insert({
      order_id: orderId,
      ...event
    })
}

// ============================================================================
// ORDER NOTES
// ============================================================================

/**
 * Add note to order
 */
export async function addOrderNote(
  siteId: string,
  orderId: string,
  content: string,
  isInternal: boolean,
  userId: string,
  userName: string
): Promise<OrderNote | null> {
  const supabase = await getModuleClient()

  // Verify order exists for site
  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id')
    .eq('id', orderId)
    .eq('site_id', siteId)
    .single()

  if (!order) return null

  const { data: note, error } = await supabase
    .from(`${TABLE_PREFIX}_order_notes`)
    .insert({
      order_id: orderId,
      content,
      is_internal: isInternal,
      user_id: userId,
      user_name: userName
    })
    .select()
    .single()

  if (error) return null

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: 'note_added',
    title: isInternal ? 'Internal note added' : 'Note added',
    description: content.slice(0, 100),
    user_id: userId,
    user_name: userName
  })

  return note
}

/**
 * Delete order note
 */
export async function deleteOrderNote(
  noteId: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_order_notes`)
    .delete()
    .eq('id', noteId)

  return !error
}

// ============================================================================
// SHIPMENTS
// ============================================================================

/**
 * Add shipment to order
 */
export async function addOrderShipment(
  siteId: string,
  orderId: string,
  shipment: {
    carrier: string
    tracking_number: string
    tracking_url?: string
    items: Array<{ order_item_id: string; quantity: number }>
  },
  userId: string,
  userName: string
): Promise<OrderShipment | null> {
  const supabase = await getModuleClient()

  // Create shipment
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_order_shipments`)
    .insert({
      order_id: orderId,
      carrier: shipment.carrier,
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
      shipped_at: new Date().toISOString(),
      status: 'pending',
      items: shipment.items
    })
    .select()
    .single()

  if (error) return null

  // Update order status to shipped
  await updateOrderStatus(siteId, orderId, 'shipped', userId, userName)

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: 'shipped',
    title: 'Order shipped',
    description: `Shipped via ${shipment.carrier} - ${shipment.tracking_number}`,
    user_id: userId,
    user_name: userName,
    metadata: { shipment_id: data.id }
  })

  return data
}

/**
 * Update shipment status
 */
export async function updateShipmentStatus(
  shipmentId: string,
  status: 'in_transit' | 'delivered' | 'failed',
  orderId: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  const updates: Record<string, unknown> = { status }
  if (status === 'delivered') {
    updates.delivered_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_order_shipments`)
    .update(updates)
    .eq('id', shipmentId)

  if (!error && status === 'delivered') {
    await addTimelineEvent(orderId, {
      event_type: 'delivered',
      title: 'Order delivered',
      description: 'Shipment marked as delivered'
    })
  }

  return !error
}

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * Create refund request
 */
export async function createRefund(
  siteId: string,
  orderId: string,
  refund: {
    amount: number
    reason: string
    refund_method: 'original_payment' | 'store_credit' | 'other'
    items?: Array<{ order_item_id: string; quantity: number; amount: number }>
  },
  userId: string,
  userName: string
): Promise<OrderRefund | null> {
  const supabase = await getModuleClient()

  // Create refund record
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .insert({
      order_id: orderId,
      amount: refund.amount,
      reason: refund.reason,
      refund_method: refund.refund_method,
      items: refund.items,
      status: 'pending'
    })
    .select()
    .single()

  if (error) return null

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: 'refund_requested',
    title: 'Refund requested',
    description: `Amount: $${(refund.amount / 100).toFixed(2)} - ${refund.reason}`,
    user_id: userId,
    user_name: userName,
    metadata: { refund_id: data.id }
  })

  return data
}

/**
 * Process refund
 */
export async function processRefund(
  refundId: string,
  orderId: string,
  approved: boolean,
  userId: string,
  userName: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  const status = approved ? 'processed' : 'rejected'

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .update({
      status,
      processed_at: new Date().toISOString(),
      processed_by: userId
    })
    .eq('id', refundId)

  if (error) return false

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: 'refund_processed',
    title: approved ? 'Refund processed' : 'Refund rejected',
    user_id: userId,
    user_name: userName,
    metadata: { refund_id: refundId }
  })

  // If approved, update order status
  if (approved) {
    await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .update({ status: 'refunded' })
      .eq('id', orderId)
  }

  return true
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

/**
 * Execute bulk action on orders
 */
export async function executeOrderBulkAction(
  siteId: string,
  action: OrderBulkAction,
  userId: string,
  userName: string
): Promise<BulkActionResult> {
  const result: BulkActionResult = {
    success: true,
    affected: 0,
    errors: []
  }

  if (action.orderIds.length === 0) {
    return { success: false, affected: 0, errors: ['No orders selected'] }
  }

  const supabase = await getModuleClient()

  switch (action.action) {
    case 'update_status': {
      const newStatus = action.params?.status as OrderStatus
      if (!newStatus) {
        return { success: false, affected: 0, errors: ['Status is required'] }
      }

      for (const orderId of action.orderIds) {
        const updateResult = await updateOrderStatus(
          siteId, 
          orderId, 
          newStatus, 
          userId, 
          userName
        )
        if (updateResult.success) {
          result.affected++
        } else {
          result.errors.push(`Order ${orderId}: ${updateResult.error}`)
        }
      }
      break
    }

    case 'archive': {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('site_id', siteId)
        .in('id', action.orderIds)

      if (error) {
        result.success = false
        result.errors.push(error.message)
      } else {
        result.affected = action.orderIds.length
      }
      break
    }

    case 'export':
    case 'print_invoices':
    case 'print_labels':
      // These are handled client-side
      result.affected = action.orderIds.length
      break
  }

  return result
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

/**
 * Generate invoice number
 */
export async function generateInvoiceNumber(
  siteId: string,
  orderId: string
): Promise<string> {
  const supabase = await getModuleClient()

  // Get order to use order_number
  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('order_number, created_at')
    .eq('id', orderId)
    .eq('site_id', siteId)
    .single()

  if (!order) {
    return `INV-${Date.now()}`
  }

  const year = new Date(order.created_at).getFullYear()
  return `INV-${year}-${order.order_number}`
}

/**
 * Send order notification email
 */
export async function sendOrderEmail(
  orderId: string,
  emailType: 'confirmation' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
  userId: string,
  userName: string
): Promise<boolean> {
  // In production, this would integrate with email service
  // For now, just add timeline event

  const supabase = await getModuleClient()

  await supabase
    .from(`${TABLE_PREFIX}_order_timeline`)
    .insert({
      order_id: orderId,
      event_type: 'email_sent',
      title: `Email sent: ${emailType}`,
      user_id: userId,
      user_name: userName,
      metadata: { email_type: emailType }
    })

  return true
}
```

---

### Task 4.3: Create Order Timeline Component

**File**: `src/modules/ecommerce/components/orders/order-timeline.tsx`
**Action**: Create

**Description**: Visual timeline of order events

```typescript
/**
 * Order Timeline Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Visual timeline showing order events and history
 */
'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  RefreshCw,
  Mail,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderTimelineEvent, OrderEventType } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderTimelineProps {
  events: OrderTimelineEvent[]
}

interface EventConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

// ============================================================================
// EVENT CONFIG
// ============================================================================

const eventConfig: Record<OrderEventType, EventConfig> = {
  created: {
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  payment_received: {
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  payment_failed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  processing: {
    icon: RefreshCw,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  shipped: {
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  refund_requested: {
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  refund_processed: {
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  note_added: {
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  status_changed: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  email_sent: {
    icon: Mail,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events recorded yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

        {events.map((event, index) => {
          const config = eventConfig[event.event_type]
          const Icon = config.icon

          return (
            <div key={event.id} className="relative pl-10 pb-6">
              {/* Icon */}
              <div className={cn(
                'absolute left-0 p-2 rounded-full',
                config.bgColor
              )}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{event.title}</span>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time 
                    dateTime={event.created_at}
                    title={format(new Date(event.created_at), 'PPpp')}
                  >
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </time>
                  {event.user_name && (
                    <>
                      <span>•</span>
                      <span>by {event.user_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
```

---

### Task 4.4: Create Order Items Table Component

**File**: `src/modules/ecommerce/components/orders/order-items-table.tsx`
**Action**: Create

**Description**: Table displaying order line items

```typescript
/**
 * Order Items Table Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Table showing order line items with product details
 */
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { ImageOff } from 'lucide-react'
import type { OrderItem } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderItemsTableProps {
  items: OrderItem[]
  currency?: string
  showSubtotals?: boolean
  subtotal?: number
  shipping?: number
  tax?: number
  discount?: number
  total?: number
}

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

export function OrderItemsTable({
  items,
  currency = 'USD',
  showSubtotals = true,
  subtotal,
  shipping,
  tax,
  discount,
  total
}: OrderItemsTableProps) {
  // Calculate subtotal if not provided
  const calculatedSubtotal = subtotal ?? items.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity)
  }, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-center">Qty</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {item.product_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">{item.product_name}</div>
                {item.variant_name && (
                  <div className="text-sm text-muted-foreground">
                    {item.variant_name}
                  </div>
                )}
                {item.sku && (
                  <div className="text-xs text-muted-foreground font-mono">
                    SKU: {item.sku}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.unit_price, currency)}
            </TableCell>
            <TableCell className="text-center">
              {item.quantity}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(item.unit_price * item.quantity, currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      {showSubtotals && (
        <TableFooter className="bg-transparent">
          <TableRow>
            <TableCell colSpan={4} className="text-right">
              Subtotal
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(calculatedSubtotal, currency)}
            </TableCell>
          </TableRow>
          
          {(shipping !== undefined && shipping > 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-right">
                Shipping
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(shipping, currency)}
              </TableCell>
            </TableRow>
          )}

          {(tax !== undefined && tax > 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-right">
                Tax
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(tax, currency)}
              </TableCell>
            </TableRow>
          )}

          {(discount !== undefined && discount > 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-right text-green-600">
                Discount
              </TableCell>
              <TableCell className="text-right text-green-600">
                -{formatCurrency(discount, currency)}
              </TableCell>
            </TableRow>
          )}

          {(total !== undefined) && (
            <TableRow className="bg-muted/50">
              <TableCell colSpan={4} className="text-right font-bold">
                Total
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                {formatCurrency(total, currency)}
              </TableCell>
            </TableRow>
          )}
        </TableFooter>
      )}
    </Table>
  )
}
```

---

### Task 4.5: Create Order Customer Panel Component

**File**: `src/modules/ecommerce/components/orders/order-customer-panel.tsx`
**Action**: Create

**Description**: Customer information panel for order detail

```typescript
/**
 * Order Customer Panel Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Displays customer, billing, and shipping information
 */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Truck,
  ExternalLink
} from 'lucide-react'
import type { Order } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderCustomerPanelProps {
  order: Order
  onViewCustomer?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderCustomerPanel({ order, onViewCustomer }: OrderCustomerPanelProps) {
  const billingAddress = order.billing_address as Record<string, string> | null
  const shippingAddress = order.shipping_address as Record<string, string> | null

  const formatAddress = (address: Record<string, string> | null) => {
    if (!address) return null
    
    return (
      <div className="text-sm space-y-0.5">
        {address.name && <div className="font-medium">{address.name}</div>}
        {address.company && <div>{address.company}</div>}
        <div>{address.address_line_1}</div>
        {address.address_line_2 && <div>{address.address_line_2}</div>}
        <div>
          {address.city}, {address.state} {address.postal_code}
        </div>
        <div>{address.country}</div>
        {address.phone && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {address.phone}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Customer</CardTitle>
          {order.customer_id && onViewCustomer && (
            <Button variant="ghost" size="sm" onClick={onViewCustomer}>
              View Profile
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name}</span>
            {!order.customer_id && (
              <Badge variant="secondary" className="text-xs">Guest</Badge>
            )}
          </div>
          
          {order.customer_email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a 
                href={`mailto:${order.customer_email}`}
                className="hover:text-primary"
              >
                {order.customer_email}
              </a>
            </div>
          )}
          
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a 
                href={`tel:${order.customer_phone}`}
                className="hover:text-primary"
              >
                {order.customer_phone}
              </a>
            </div>
          )}
        </div>

        <Separator />

        {/* Addresses */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Billing Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Billing Address
            </div>
            {billingAddress ? (
              formatAddress(billingAddress)
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No billing address
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Truck className="h-4 w-4" />
              Shipping Address
            </div>
            {shippingAddress ? (
              formatAddress(shippingAddress)
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No shipping address
              </div>
            )}
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Order Notes
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-md">
                {order.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### Task 4.6: Create Invoice Template Component

**File**: `src/modules/ecommerce/components/orders/invoice-template.tsx`
**Action**: Create

**Description**: Printable invoice template

```typescript
/**
 * Invoice Template Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Printable invoice document
 */
'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'
import type { InvoiceData } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceTemplateProps {
  data: InvoiceData
}

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

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  function InvoiceTemplate({ data }, ref) {
    const { order, store, invoice_number, invoice_date, due_date } = data
    const billingAddress = order.billing_address as Record<string, string> | null

    // Calculate totals
    const subtotal = order.items?.reduce((sum, item) => 
      sum + (item.unit_price * item.quantity), 0
    ) || 0

    return (
      <div 
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto text-black print:p-0"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={store.logo} 
                alt={store.name} 
                className="h-12 mb-2"
              />
            ) : (
              <h1 className="text-2xl font-bold">{store.name}</h1>
            )}
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {store.address}
            </div>
            {store.email && <div className="text-sm">{store.email}</div>}
            {store.phone && <div className="text-sm">{store.phone}</div>}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <table className="text-sm ml-auto">
              <tbody>
                <tr>
                  <td className="pr-4 text-gray-600">Invoice #:</td>
                  <td className="font-medium">{invoice_number}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-600">Date:</td>
                  <td>{format(new Date(invoice_date), 'MMM dd, yyyy')}</td>
                </tr>
                {due_date && (
                  <tr>
                    <td className="pr-4 text-gray-600">Due Date:</td>
                    <td>{format(new Date(due_date), 'MMM dd, yyyy')}</td>
                  </tr>
                )}
                <tr>
                  <td className="pr-4 text-gray-600">Order #:</td>
                  <td>{order.order_number}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO</h3>
          <div className="text-sm">
            <div className="font-medium">{order.customer_name}</div>
            {billingAddress && (
              <>
                <div>{billingAddress.address_line_1}</div>
                {billingAddress.address_line_2 && (
                  <div>{billingAddress.address_line_2}</div>
                )}
                <div>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}
                </div>
                <div>{billingAddress.country}</div>
              </>
            )}
            {order.customer_email && <div>{order.customer_email}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2 text-left font-semibold">Description</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Unit Price</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3">
                  <div className="font-medium">{item.product_name}</div>
                  {item.variant_name && (
                    <div className="text-gray-500 text-xs">{item.variant_name}</div>
                  )}
                  {item.sku && (
                    <div className="text-gray-400 text-xs">SKU: {item.sku}</div>
                  )}
                </td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">
                  {formatCurrency(item.unit_price, order.currency)}
                </td>
                <td className="py-3 text-right">
                  {formatCurrency(item.unit_price * item.quantity, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="py-1">Subtotal:</td>
                <td className="py-1 text-right">
                  {formatCurrency(subtotal, order.currency)}
                </td>
              </tr>
              {order.shipping_total > 0 && (
                <tr>
                  <td className="py-1">Shipping:</td>
                  <td className="py-1 text-right">
                    {formatCurrency(order.shipping_total, order.currency)}
                  </td>
                </tr>
              )}
              {order.tax_total > 0 && (
                <tr>
                  <td className="py-1">Tax:</td>
                  <td className="py-1 text-right">
                    {formatCurrency(order.tax_total, order.currency)}
                  </td>
                </tr>
              )}
              {order.discount_total > 0 && (
                <tr className="text-green-600">
                  <td className="py-1">Discount:</td>
                  <td className="py-1 text-right">
                    -{formatCurrency(order.discount_total, order.currency)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-300 font-bold text-lg">
                <td className="py-2">Total:</td>
                <td className="py-2 text-right">
                  {formatCurrency(order.total, order.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Status */}
        <div className="mb-8 p-4 bg-gray-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Payment Status:</span>
            <span className={
              order.payment_status === 'paid' 
                ? 'text-green-600 font-semibold' 
                : 'text-orange-600 font-semibold'
            }>
              {order.payment_status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 border-t pt-4">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            If you have any questions about this invoice, please contact us at{' '}
            {store.email}
          </p>
        </div>
      </div>
    )
  }
)
```

---

### Task 4.7: Create Refund Dialog Component

**File**: `src/modules/ecommerce/components/orders/refund-dialog.tsx`
**Action**: Create

**Description**: Dialog for processing refunds

```typescript
/**
 * Refund Dialog Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Dialog for creating and processing refunds
 */
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createRefund } from '../../actions/order-actions'
import type { Order, OrderItem } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  siteId: string
  userId: string
  userName: string
  onSuccess: () => void
}

interface RefundItemState {
  order_item_id: string
  product_name: string
  quantity: number
  max_quantity: number
  unit_price: number
  selected: boolean
}

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

export function RefundDialog({
  open,
  onOpenChange,
  order,
  siteId,
  userId,
  userName,
  onSuccess
}: RefundDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [reason, setReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<'original_payment' | 'store_credit' | 'other'>('original_payment')
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [customAmount, setCustomAmount] = useState('')
  
  // Initialize item states
  const [items, setItems] = useState<RefundItemState[]>(() => 
    (order.items || []).map((item: OrderItem) => ({
      order_item_id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      max_quantity: item.quantity,
      unit_price: item.unit_price,
      selected: true
    }))
  )

  // Calculate totals
  const selectedAmount = items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

  const totalRefundAmount = refundType === 'full' 
    ? order.total 
    : (customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount)

  const maxRefundAmount = order.total // In production, subtract already refunded amount

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setItems(items.map(item => 
      item.order_item_id === itemId 
        ? { ...item, selected: !item.selected }
        : item
    ))
  }

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(items.map(item => 
      item.order_item_id === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.max_quantity) }
        : item
    ))
  }

  // Handle refund submission
  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund')
      return
    }

    if (totalRefundAmount <= 0) {
      toast.error('Refund amount must be greater than 0')
      return
    }

    if (totalRefundAmount > maxRefundAmount) {
      toast.error('Refund amount cannot exceed order total')
      return
    }

    setIsProcessing(true)

    try {
      const refundData = {
        amount: totalRefundAmount,
        reason,
        refund_method: refundMethod,
        items: refundType === 'partial' 
          ? items
              .filter(item => item.selected)
              .map(item => ({
                order_item_id: item.order_item_id,
                quantity: item.quantity,
                amount: item.unit_price * item.quantity
              }))
          : undefined
      }

      const result = await createRefund(siteId, order.id, refundData, userId, userName)
      
      if (result) {
        toast.success('Refund request created successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error('Failed to create refund request')
      }
    } catch (error) {
      console.error('Error creating refund:', error)
      toast.error('Failed to create refund request')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Refund</DialogTitle>
          <DialogDescription>
            Process a refund for order #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Refund Type */}
          <div className="space-y-2">
            <Label>Refund Type</Label>
            <Select
              value={refundType}
              onValueChange={(value) => setRefundType(value as 'full' | 'partial')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Refund ({formatCurrency(order.total)})</SelectItem>
                <SelectItem value="partial">Partial Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partial Refund Items */}
          {refundType === 'partial' && (
            <div className="space-y-2">
              <Label>Select Items to Refund</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.order_item_id}>
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleItem(item.order_item_id)}
                          />
                        </TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.order_item_id, parseInt(e.target.value))}
                            disabled={!item.selected}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2 pt-2">
                <Label>Or enter custom amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxRefundAmount / 100}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Refund Method */}
          <div className="space-y-2">
            <Label>Refund Method</Label>
            <Select
              value={refundMethod}
              onValueChange={(value) => setRefundMethod(value as typeof refundMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original_payment">Original Payment Method</SelectItem>
                <SelectItem value="store_credit">Store Credit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Refund *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for this refund..."
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Refund Amount:</span>
              <span className="text-xl font-bold">
                {formatCurrency(totalRefundAmount)}
              </span>
            </div>
          </div>

          {/* Warning */}
          {totalRefundAmount > 0 && (
            <div className="flex gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This action will create a refund request. The refund will need to be 
                processed manually through your payment provider.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || totalRefundAmount <= 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Create Refund (${formatCurrency(totalRefundAmount)})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 4.8: Create Order Detail Dialog

**File**: `src/modules/ecommerce/components/orders/order-detail-dialog.tsx`
**Action**: Create

**Description**: Comprehensive order detail view dialog

```typescript
/**
 * Order Detail Dialog Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Full order detail view with all actions
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
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
  Package,
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
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceNumber}`
  })

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
                    <DropdownMenuItem onClick={() => handlePrintInvoice()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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
                  shipping={orderData.shipping_total}
                  tax={orderData.tax_total}
                  discount={orderData.discount_total}
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
                  <Button onClick={() => handlePrintInvoice()}>
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
```

---

### Task 4.9: Create Orders Exports

**File**: `src/modules/ecommerce/components/orders/index.ts`
**Action**: Create

**Description**: Export all order components

```typescript
/**
 * E-Commerce Order Components
 * 
 * Phase ECOM-04: Order Management Enhancement
 */

export { OrderDetailDialog } from './order-detail-dialog'
export { OrderTimeline } from './order-timeline'
export { OrderItemsTable } from './order-items-table'
export { OrderCustomerPanel } from './order-customer-panel'
export { InvoiceTemplate } from './invoice-template'
export { RefundDialog } from './refund-dialog'
```

---

## 🗄️ Database Migration

**File**: `migrations/XXXX_order_management.sql`

```sql
-- Order Management Tables
-- Phase ECOM-04: Order Management Enhancement

-- Order Timeline Events
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  user_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_timeline_order ON mod_ecommod01_order_timeline(order_id);
CREATE INDEX idx_order_timeline_created ON mod_ecommod01_order_timeline(created_at DESC);

-- Order Notes
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_notes_order ON mod_ecommod01_order_notes(order_id);

-- Order Shipments
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  carrier VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(255) NOT NULL,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_shipments_order ON mod_ecommod01_order_shipments(order_id);

-- Order Refunds
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  refund_method VARCHAR(50) NOT NULL,
  items JSONB,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_refunds_order ON mod_ecommod01_order_refunds(order_id);
CREATE INDEX idx_order_refunds_status ON mod_ecommod01_order_refunds(status);

-- RLS Policies (apply to all new tables)
ALTER TABLE mod_ecommod01_order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_refunds ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Order detail dialog opens correctly
- [ ] Order timeline displays events chronologically
- [ ] Order items table shows all line items
- [ ] Customer panel displays billing/shipping addresses
- [ ] Status change updates order and adds timeline event
- [ ] Invoice renders correctly and prints
- [ ] Refund dialog calculates amounts correctly
- [ ] Refund creation adds timeline event
- [ ] Email sending logs timeline event
- [ ] Database migrations apply cleanly
- [ ] RLS policies work correctly

---

## 🔄 Rollback Plan

If issues occur:
1. Remove new order components
2. Remove order actions file
3. Revert type additions
4. Drop new database tables

```bash
rm -rf src/modules/ecommerce/components/orders/
rm src/modules/ecommerce/actions/order-actions.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add "✅ PHASE-ECOM-04: Order Management Enhancement Complete"
- `progress.md`: Update e-commerce section with order management status

---

## ✨ Success Criteria

- [ ] Order detail dialog shows complete order information
- [ ] Timeline tracks all order events
- [ ] Status changes persist and log correctly
- [ ] Invoice generation and printing works
- [ ] Refund workflow creates proper records
- [ ] Email notifications log to timeline
- [ ] All database tables created with indexes
- [ ] TypeScript compiles with zero errors
