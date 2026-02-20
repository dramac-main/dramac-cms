/**
 * Business Notifications Service
 * 
 * Handles sending notifications AND emails for business-critical events:
 * - New bookings → notify business owner + email customer
 * - New orders → notify business owner + email customer
 * - Booking/order status changes → email customer
 * 
 * This ensures the business owner NEVER misses a booking or order.
 */
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendBrandedEmail } from '@/lib/email/send-branded-email'
import { createNotification } from '@/lib/services/notifications'
import { formatCurrency, formatDate, formatTime } from '@/lib/locale-config'

// =============================================================================
// TYPES
// =============================================================================

interface BookingNotificationData {
  siteId: string
  appointmentId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  staffName?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  startTime: Date
  endTime: Date
  status: 'pending' | 'confirmed'
  currency?: string
  timezone?: string
}

interface BookingCancellationData {
  siteId: string
  appointmentId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  staffName?: string
  customerName: string
  customerEmail: string
  startTime: Date
  cancelledBy: 'customer' | 'staff' | 'system'
  reason?: string
  currency?: string
}

interface OrderNotificationData {
  siteId: string
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
  paymentStatus: string
  shippingAddress?: string
}

// =============================================================================
// BOOKING NOTIFICATIONS
// =============================================================================

/**
 * Send all notifications for a new booking:
 * 1. In-app notification to business owner
 * 2. Email to business owner  
 * 3. Email to customer (confirmation/pending)
 * 
 * Runs async - does not block the booking creation response
 */
export async function notifyNewBooking(data: BookingNotificationData): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    // Get site info and owner
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', data.siteId)
      .single()
    
    if (!site) {
      console.error('[BusinessNotify] Site not found:', data.siteId)
      return
    }

    // Get the agency owner (business owner) 
    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site.agency_id)
      .single()
    
    if (!agency?.owner_id) {
      console.error('[BusinessNotify] Agency owner not found for site:', data.siteId)
      return
    }

    // Get owner profile for email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single()

    const businessName = site.name || 'Our Business'
    const currency = data.currency || 'USD'
    const dateStr = formatDate(data.startTime)
    const timeStr = formatTime(data.startTime)
    const priceStr = formatCurrency(data.servicePrice, currency)
    const durationStr = data.serviceDuration >= 60 
      ? `${Math.floor(data.serviceDuration / 60)}h ${data.serviceDuration % 60 > 0 ? `${data.serviceDuration % 60}m` : ''}`
      : `${data.serviceDuration}m`
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${data.siteId}/booking`

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
      type: 'new_booking',
      title: `New Booking: ${data.serviceName}`,
      message: `${data.customerName} booked ${data.serviceName} for ${dateStr} at ${timeStr} (${priceStr})`,
      link: dashboardUrl,
      metadata: {
        appointmentId: data.appointmentId,
        siteId: data.siteId,
        customerEmail: data.customerEmail,
      },
    })

    // 2. Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        emailType: 'booking_confirmation_owner',
        recipientUserId: agency.owner_id,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || '',
          serviceName: data.serviceName,
          staffName: data.staffName || '',
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          status: data.status,
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      })
    }

    // 3. Email to customer
    if (data.customerEmail) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: 'booking_confirmation_customer',
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          staffName: data.staffName || '',
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          status: data.status,
          businessName,
          bookingId: data.appointmentId,
        },
      })
    }

    console.log(`[BusinessNotify] Booking notifications sent for appointment ${data.appointmentId}`)
  } catch (error) {
    // Never let notification errors break the main flow
    console.error('[BusinessNotify] Error sending booking notifications:', error)
  }
}

// =============================================================================
// BOOKING CANCELLATION NOTIFICATIONS
// =============================================================================

/**
 * Send all notifications for a cancelled booking:
 * 1. In-app notification to business owner (if cancelled by client)
 * 2. Email to business owner
 * 3. Email to customer (confirmation of cancellation)
 * 
 * Runs async - does not block the cancellation response
 */
export async function notifyBookingCancelled(data: BookingCancellationData): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', data.siteId)
      .single()
    
    if (!site) {
      console.error('[BusinessNotify] Site not found:', data.siteId)
      return
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site.agency_id)
      .single()
    
    if (!agency?.owner_id) {
      console.error('[BusinessNotify] Agency owner not found for site:', data.siteId)
      return
    }

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single()

    const businessName = site.name || 'Our Business'
    const currency = data.currency || 'USD'
    const dateStr = formatDate(data.startTime)
    const timeStr = formatTime(data.startTime)
    const priceStr = formatCurrency(data.servicePrice, currency)
    const durationStr = data.serviceDuration >= 60 
      ? `${Math.floor(data.serviceDuration / 60)}h ${data.serviceDuration % 60 > 0 ? `${data.serviceDuration % 60}m` : ''}`
      : `${data.serviceDuration}m`
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${data.siteId}/booking`

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
      type: 'booking_cancelled',
      title: `Booking Cancelled: ${data.serviceName}`,
      message: `${data.customerName}'s booking for ${data.serviceName} on ${dateStr} at ${timeStr} has been cancelled${data.reason ? `: ${data.reason}` : ''}.`,
      link: dashboardUrl,
      metadata: {
        appointmentId: data.appointmentId,
        siteId: data.siteId,
        cancelledBy: data.cancelledBy,
      },
    })

    // 2. Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        emailType: 'booking_cancelled_owner',
        recipientUserId: agency.owner_id,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          serviceName: data.serviceName,
          staffName: data.staffName || '',
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          cancelledBy: data.cancelledBy,
          reason: data.reason || '',
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      })
    }

    // 3. Email to customer
    if (data.customerEmail) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: 'booking_cancelled_customer',
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          staffName: data.staffName || '',
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          businessName,
          bookingId: data.appointmentId,
        },
      })
    }

    console.log(`[BusinessNotify] Booking cancellation notifications sent for appointment ${data.appointmentId}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending booking cancellation notifications:', error)
  }
}

// =============================================================================
// ORDER NOTIFICATIONS
// =============================================================================

/**
 * Send all notifications for a new order:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 * 3. Email to customer (order confirmation)
 * 
 * Runs async - does not block the order creation response
 */
export async function notifyNewOrder(data: OrderNotificationData): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    // Get site info and owner
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', data.siteId)
      .single()
    
    if (!site) {
      console.error('[BusinessNotify] Site not found:', data.siteId)
      return
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site.agency_id)
      .single()
    
    if (!agency?.owner_id) {
      console.error('[BusinessNotify] Agency owner not found')
      return
    }

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single()

    const businessName = site.name || 'Our Store'
    const currency = data.currency || 'USD'
    const totalStr = formatCurrency(data.total, currency)
    const subtotalStr = formatCurrency(data.subtotal, currency)
    const shippingStr = formatCurrency(data.shipping, currency)
    const taxStr = formatCurrency(data.tax, currency)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${data.siteId}/ecommerce/orders`

    const formattedItems = data.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: formatCurrency(item.unitPrice * item.quantity, currency),
    }))

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
      type: 'new_order',
      title: `New Order #${data.orderNumber}`,
      message: `${data.customerName} placed an order for ${totalStr} (${data.items.length} item${data.items.length > 1 ? 's' : ''})`,
      link: dashboardUrl,
      metadata: {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        siteId: data.siteId,
        customerEmail: data.customerEmail,
        total: data.total,
      },
    })

    // 2. Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        emailType: 'order_confirmation_owner',
        recipientUserId: agency.owner_id,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          orderNumber: data.orderNumber,
          items: formattedItems,
          total: totalStr,
          paymentStatus: data.paymentStatus,
          dashboardUrl,
        },
      })
    }

    // 3. Email to customer
    if (data.customerEmail) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: 'order_confirmation_customer',
        data: {
          customerName: data.customerName,
          orderNumber: data.orderNumber,
          items: formattedItems,
          subtotal: subtotalStr,
          shipping: shippingStr,
          tax: taxStr,
          total: totalStr,
          shippingAddress: data.shippingAddress || '',
          businessName,
        },
      })
    }

    console.log(`[BusinessNotify] Order notifications sent for order ${data.orderNumber}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending order notifications:', error)
  }
}

/**
 * Send shipping notification to customer + in-app notification to owner
 */
export async function notifyOrderShipped(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  trackingNumber?: string,
  trackingUrl?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', siteId)
      .single()

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site?.agency_id)
      .single()

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: 'order_shipped',
        title: `Order #${orderNumber} Shipped`,
        message: `Order for ${customerName} has been marked as shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      })
    }

    // Email to customer
    await sendBrandedEmail(site?.agency_id || null, {
      to: { email: customerEmail, name: customerName },
      emailType: 'order_shipped_customer',
      data: {
        customerName,
        orderNumber,
        trackingNumber: trackingNumber || '',
        trackingUrl: trackingUrl || '',
        businessName: site?.name || 'Our Store',
      },
    })

    console.log(`[BusinessNotify] Shipping notifications sent for order ${orderNumber}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending shipping notification:', error)
  }
}

// =============================================================================
// ORDER DELIVERED NOTIFICATIONS
// =============================================================================

/**
 * Send delivery notification to customer + in-app notification to owner
 */
export async function notifyOrderDelivered(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', siteId)
      .single()

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site?.agency_id)
      .single()

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: 'order_delivered',
        title: `Order #${orderNumber} Delivered`,
        message: `Order for ${customerName} has been marked as delivered`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      })
    }

    // Email to customer
    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: 'order_delivered_customer',
        data: {
          customerName,
          orderNumber,
          businessName: site?.name || 'Our Store',
        },
      })
    }

    console.log(`[BusinessNotify] Delivery notifications sent for order ${orderNumber}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending delivery notification:', error)
  }
}

// =============================================================================
// ORDER CANCELLED NOTIFICATIONS
// =============================================================================

/**
 * Send cancellation notification to customer + owner
 */
export async function notifyOrderCancelled(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  total: string,
  reason?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', siteId)
      .single()

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site?.agency_id)
      .single()

    const { data: ownerProfile } = agency?.owner_id ? await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single() : { data: null }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${siteId}/ecommerce/orders`

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: 'order_cancelled',
        title: `Order #${orderNumber} Cancelled`,
        message: `Order from ${customerName} (${total}) has been cancelled${reason ? `: ${reason}` : ''}`,
        link: dashboardUrl,
        metadata: { orderNumber, siteId },
      })
    }

    // Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        emailType: 'order_cancelled_owner',
        recipientUserId: agency?.owner_id,
        data: {
          customerName,
          customerEmail,
          orderNumber,
          total,
          reason: reason || '',
          dashboardUrl,
        },
      })
    }

    // Email to customer
    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: 'order_cancelled_customer',
        data: {
          customerName,
          orderNumber,
          reason: reason || '',
          businessName: site?.name || 'Our Store',
        },
      })
    }

    console.log(`[BusinessNotify] Cancellation notifications sent for order ${orderNumber}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending cancellation notification:', error)
  }
}

// =============================================================================
// PAYMENT RECEIVED NOTIFICATIONS
// =============================================================================

/**
 * Send payment confirmation notification to customer
 */
export async function notifyPaymentReceived(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  total: string,
  paymentMethod?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', siteId)
      .single()

    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: 'payment_received_customer',
        data: {
          customerName,
          orderNumber,
          total,
          paymentMethod: paymentMethod || '',
          businessName: site?.name || 'Our Store',
        },
      })
    }

    console.log(`[BusinessNotify] Payment received notification sent for order ${orderNumber}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending payment notification:', error)
  }
}

// =============================================================================
// REFUND NOTIFICATIONS
// =============================================================================

/**
 * Send refund notification to customer
 */
export async function notifyRefundIssued(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  refundAmount: string,
  reason?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', siteId)
      .single()

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site?.agency_id)
      .single()

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: 'refund_issued',
        title: `Refund Issued: Order #${orderNumber}`,
        message: `Refund of ${refundAmount} issued to ${customerName}${reason ? ` — ${reason}` : ''}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      })
    }

    // Email to customer
    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: 'refund_issued_customer',
        data: {
          customerName,
          orderNumber,
          refundAmount,
          reason: reason || '',
          businessName: site?.name || 'Our Store',
        },
      })
    }

    console.log(`[BusinessNotify] Refund notification sent for order ${orderNumber}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending refund notification:', error)
  }
}

// =============================================================================
// LOW STOCK NOTIFICATIONS
// =============================================================================

/**
 * Send low stock alert to business owner
 */
export async function notifyLowStock(
  siteId: string,
  productName: string,
  currentStock: number,
  threshold: number,
  sku?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: site } = await supabase
      .from('sites')
      .select('name, agency_id')
      .eq('id', siteId)
      .single()

    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', site?.agency_id)
      .single()

    const { data: ownerProfile } = agency?.owner_id ? await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single() : { data: null }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/sites/${siteId}/ecommerce/products`

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: 'low_stock',
        title: `Low Stock: ${productName}`,
        message: `${productName}${sku ? ` (${sku})` : ''} is low on stock (${currentStock} remaining, threshold: ${threshold})`,
        link: dashboardUrl,
        metadata: { productName, currentStock, threshold, siteId },
      })
    }

    // Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        emailType: 'low_stock_admin',
        recipientUserId: agency?.owner_id,
        data: {
          productName,
          currentStock,
          threshold,
          sku: sku || '',
          dashboardUrl,
        },
      })
    }

    console.log(`[BusinessNotify] Low stock alert sent for ${productName}`)
  } catch (error) {
    console.error('[BusinessNotify] Error sending low stock notification:', error)
  }
}
