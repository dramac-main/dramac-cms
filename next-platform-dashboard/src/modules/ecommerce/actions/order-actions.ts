/**
 * Order Management Actions
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Server actions for managing orders, shipments, refunds
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/locale-config'
import type { 
  Order,
  OrderStatus,
  OrderDetailData,
  OrderTimelineEvent,
  OrderNote,
  OrderShipment,
  OrderRefund,
  OrderBulkAction,
  BulkActionResult
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
    order_notes: notes || [],
    shipments: shipments || [],
    refunds: refunds || []
  }
}

/**
 * Get orders list with filters
 */
export async function getOrders(
  siteId: string,
  filters?: {
    status?: OrderStatus | 'all'
    paymentStatus?: string | 'all'
    search?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<Order[]> {
  const supabase = await getModuleClient()

  let query = supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('*, items:mod_ecommod01_order_items(*)')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data || []
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
    actor_id: userId,
    actor_name: userName
  })

  return { success: true }
}

/**
 * Add timeline event
 */
async function addTimelineEvent(
  orderId: string,
  event: Omit<OrderTimelineEvent, 'id' | 'order_id' | 'created_at'>
): Promise<void> {
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
      author_id: userId,
      author_name: userName
    })
    .select()
    .single()

  if (error) return null

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: 'note_added',
    title: isInternal ? 'Internal note added' : 'Note added',
    description: content.slice(0, 100),
    actor_id: userId,
    actor_name: userName
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
    actor_id: userId,
    actor_name: userName,
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
    description: `Amount: ${formatCurrency(refund.amount)} - ${refund.reason}`,
    actor_id: userId,
    actor_name: userName,
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
    actor_id: userId,
    actor_name: userName,
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
