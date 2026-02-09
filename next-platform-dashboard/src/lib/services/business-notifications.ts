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
import { sendEmail } from '@/lib/email/send-email'
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
    const currency = data.currency || 'ZMW'
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
      await sendEmail({
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        type: 'booking_confirmation_owner',
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
      await sendEmail({
        to: { email: data.customerEmail, name: data.customerName },
        type: 'booking_confirmation_customer',
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
    const currency = data.currency || 'ZMW'
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
      await sendEmail({
        to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
        type: 'order_confirmation_owner',
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
      await sendEmail({
        to: { email: data.customerEmail, name: data.customerName },
        type: 'order_confirmation_customer',
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
 * Send shipping notification to customer
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
      .select('name')
      .eq('id', siteId)
      .single()

    await sendEmail({
      to: { email: customerEmail, name: customerName },
      type: 'order_shipped_customer',
      data: {
        customerName,
        orderNumber,
        trackingNumber: trackingNumber || '',
        trackingUrl: trackingUrl || '',
        businessName: site?.name || 'Our Store',
      },
    })
  } catch (error) {
    console.error('[BusinessNotify] Error sending shipping notification:', error)
  }
}
