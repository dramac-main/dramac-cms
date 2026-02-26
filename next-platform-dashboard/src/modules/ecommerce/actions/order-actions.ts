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
import { sendBrandedEmail } from '@/lib/email/send-branded-email'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Get refund details
  const { data: refundData } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .select('amount, reason')
    .eq('id', refundId)
    .single()

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

  // If approved, update order status and send notification
  if (approved) {
    const { data: order } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .update({ status: 'refunded' })
      .eq('id', orderId)
      .select()
      .single()

    // Send refund notification to customer
    if (order?.customer_email && refundData) {
      const { notifyRefundIssued } = await import('@/lib/services/business-notifications')
      notifyRefundIssued(
        order.site_id,
        order.order_number,
        order.customer_email,
        order.customer_name || 'Customer',
        formatCurrency(refundData.amount, order.currency || 'USD'),
        refundData.reason || undefined,
      ).catch(err => console.error('[OrderActions] Refund notification error:', err))
    }
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
 * Send order notification email via Resend
 * 
 * Fetches full order data and sends the appropriate branded email
 * to the customer and/or owner based on the email type.
 */
export async function sendOrderEmail(
  orderId: string,
  emailType: 'confirmation' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
  userId: string,
  userName: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  try {
    // Fetch the order with site info
    const { data: order } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('*, site_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('[sendOrderEmail] Order not found:', orderId)
      return false
    }

    // Get site and agency info for branding
    const adminClient = createAdminClient()
    const { data: site } = await adminClient
      .from('sites')
      .select('name, agency_id')
      .eq('id', order.site_id)
      .single()

    const agencyId = site?.agency_id || null
    const businessName = site?.name || 'Our Store'
    const currency = order.currency || 'USD'

    // Get order items for confirmation emails
    const { data: orderItems } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select('product_name, quantity, unit_price, total_price')
      .eq('order_id', orderId)

    const formattedItems = (orderItems || []).map((item: { product_name: string; quantity: number; unit_price: number; total_price: number }) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: formatCurrency(item.total_price, currency),
    }))

    // Map emailType to the branded email type and send
    switch (emailType) {
      case 'confirmation': {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: { email: order.customer_email, name: order.customer_name || undefined },
            emailType: 'order_confirmation_customer',
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || 'Customer',
              orderNumber: order.order_number,
              items: formattedItems,
              subtotal: formatCurrency(order.subtotal || 0, currency),
              shipping: formatCurrency(order.shipping_amount || 0, currency),
              tax: formatCurrency(order.tax_amount || 0, currency),
              total: formatCurrency(order.total, currency),
              shippingAddress: order.shipping_address
                ? `${order.shipping_address.address_line_1 || ''}${order.shipping_address.city ? `, ${order.shipping_address.city}` : ''}${order.shipping_address.country ? `, ${order.shipping_address.country}` : ''}`
                : '',
              businessName,
            },
          })
        }
        break
      }
      case 'shipped': {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: { email: order.customer_email, name: order.customer_name || undefined },
            emailType: 'order_shipped_customer',
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || 'Customer',
              orderNumber: order.order_number,
              trackingNumber: order.tracking_number || '',
              trackingUrl: order.tracking_url || '',
              businessName,
            },
          })
        }
        break
      }
      case 'delivered': {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: { email: order.customer_email, name: order.customer_name || undefined },
            emailType: 'order_delivered_customer',
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || 'Customer',
              orderNumber: order.order_number,
              businessName,
            },
          })
        }
        break
      }
      case 'cancelled': {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: { email: order.customer_email, name: order.customer_name || undefined },
            emailType: 'order_cancelled_customer',
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || 'Customer',
              orderNumber: order.order_number,
              businessName,
            },
          })
        }
        break
      }
      case 'refunded': {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: { email: order.customer_email, name: order.customer_name || undefined },
            emailType: 'refund_issued_customer',
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || 'Customer',
              orderNumber: order.order_number,
              refundAmount: formatCurrency(order.total, currency),
              businessName,
            },
          })
        }
        break
      }
    }

    // Add timeline event
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

    console.log(`[sendOrderEmail] ${emailType} email sent for order ${order.order_number}`)
    return true
  } catch (error) {
    console.error('[sendOrderEmail] Error sending email:', error)
    
    // Still log the timeline event even if email fails
    await supabase
      .from(`${TABLE_PREFIX}_order_timeline`)
      .insert({
        order_id: orderId,
        event_type: 'email_failed',
        title: `Email failed: ${emailType}`,
        user_id: userId,
        user_name: userName,
        metadata: { email_type: emailType, error: error instanceof Error ? error.message : 'Unknown error' }
      })

    return false
  }
}
