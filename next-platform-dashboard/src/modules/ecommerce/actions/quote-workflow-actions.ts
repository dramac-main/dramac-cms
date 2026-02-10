/**
 * Quote Workflow Server Actions
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Handles quote sending, acceptance, rejection, and conversion to orders
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendBrandedEmail } from '@/lib/email/send-branded-email'
import { revalidatePath } from 'next/cache'
import type {
  Quote,
  QuoteStatus,
  QuoteItem,
  Order,
  OrderItem
} from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// TYPES
// ============================================================================

interface SendQuoteInput {
  quote_id: string
  site_id: string
  subject?: string
  message?: string
  cc_emails?: string[]
  include_pdf?: boolean
}

interface AcceptQuoteInput {
  token: string
  accepted_by_name: string
  accepted_by_email?: string
  signature_data?: string
  notes?: string
}

interface RejectQuoteInput {
  token: string
  rejection_reason?: string
  rejected_by_name?: string
}

interface ConvertToOrderInput {
  quote_id: string
  site_id: string
  include_notes?: boolean
  custom_order_notes?: string
  user_id?: string
  user_name?: string
}

interface WorkflowResult {
  success: boolean
  error?: string
  quote?: Quote
  order?: Order
}

// ============================================================================
// SEND QUOTE
// ============================================================================

/**
 * Send quote to customer via email
 */
export async function sendQuote(input: SendQuoteInput): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    // Get quote with full details
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select(`
        *,
        items:${TABLE_PREFIX}_quote_items(*)
      `)
      .eq('id', input.quote_id)
      .eq('site_id', input.site_id)
      .single()
    
    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Validate quote can be sent
    if (!['draft', 'pending_approval'].includes(quote.status)) {
      return { success: false, error: 'Quote cannot be sent in current status' }
    }
    
    // Generate access token if not exists
    let accessToken = quote.access_token
    if (!accessToken) {
      accessToken = crypto.randomUUID().replace(/-/g, '')
    }
    
    // Update quote status to sent
    const now = new Date().toISOString()
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: 'sent',
        access_token: accessToken,
        sent_at: now,
        updated_at: now
      })
      .eq('id', input.quote_id)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: input.quote_id,
      activity_type: 'sent',
      description: `Quote sent to ${quote.customer_email}`,
      metadata: {
        subject: input.subject,
        cc_emails: input.cc_emails
      }
    })
    
    // TODO: Send actual email via email service (Resend, SendGrid, etc.)
    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/quote/${accessToken}`
    const totalAmount = quote.items
      ? (quote.items as Array<{ quantity: number; unit_price: number }>).reduce(
          (sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price,
          0
        )
      : quote.total_amount || 0
    const formatted = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: quote.currency || 'ZMW' }).format(totalAmount)

    await sendBrandedEmail(quote.agency_id || null, {
      to: { email: quote.customer_email, name: quote.customer_name || undefined },
      emailType: 'quote_sent_customer',
      data: {
        customerName: quote.customer_name || 'Customer',
        quoteNumber: quote.quote_number,
        subject: input.subject,
        message: input.message,
        totalAmount: formatted,
        expiryDate: quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('en-ZM') : undefined,
        viewQuoteUrl: portalUrl,
        businessName: quote.business_name || '',
      },
    })
    
    revalidatePath(`/sites/${input.site_id}/ecommerce`)
    
    return { success: true, quote: updatedQuote }
  } catch (error) {
    console.error('Error sending quote:', error)
    return { success: false, error: 'Failed to send quote' }
  }
}

/**
 * Resend quote to customer
 */
export async function resendQuote(
  siteId: string, 
  quoteId: string,
  subject?: string,
  message?: string
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (error || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Only allow resend for sent/viewed quotes
    if (!['sent', 'viewed'].includes(quote.status)) {
      return { success: false, error: 'Quote must be sent first' }
    }
    
    // Update timestamp
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({ updated_at: now })
      .eq('id', quoteId)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: quoteId,
      activity_type: 'resent',
      description: `Quote resent to ${quote.customer_email}`,
      metadata: { subject, message }
    })
    
    // Send resend email
    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/quote/${quote.access_token}`
    const totalAmount = quote.total_amount || 0
    const formatted = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: quote.currency || 'ZMW' }).format(totalAmount)

    await sendBrandedEmail(quote.agency_id || null, {
      to: { email: quote.customer_email, name: quote.customer_name || undefined },
      emailType: 'quote_sent_customer',
      data: {
        customerName: quote.customer_name || 'Customer',
        quoteNumber: quote.quote_number,
        subject,
        message,
        totalAmount: formatted,
        expiryDate: quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('en-ZM') : undefined,
        viewQuoteUrl: portalUrl,
        businessName: quote.business_name || '',
      },
    })
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true }
  } catch (error) {
    console.error('Error resending quote:', error)
    return { success: false, error: 'Failed to resend quote' }
  }
}

/**
 * Send quote reminder
 */
export async function sendQuoteReminder(
  siteId: string,
  quoteId: string,
  message?: string
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (error || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Only for sent/viewed quotes that aren't expired
    if (!['sent', 'viewed'].includes(quote.status)) {
      return { success: false, error: 'Cannot send reminder for this quote' }
    }
    
    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: quoteId,
      activity_type: 'reminder_sent',
      description: `Reminder sent to ${quote.customer_email}`,
      metadata: { message }
    })
    
    // Send reminder email
    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/quote/${quote.access_token}`
    const totalAmount = quote.total_amount || 0
    const formatted = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: quote.currency || 'ZMW' }).format(totalAmount)

    await sendBrandedEmail(quote.agency_id || null, {
      to: { email: quote.customer_email, name: quote.customer_name || undefined },
      emailType: 'quote_reminder_customer',
      data: {
        customerName: quote.customer_name || 'Customer',
        quoteNumber: quote.quote_number,
        message,
        totalAmount: formatted,
        expiryDate: quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('en-ZM') : undefined,
        viewQuoteUrl: portalUrl,
        businessName: quote.business_name || '',
      },
    })
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true }
  } catch (error) {
    console.error('Error sending reminder:', error)
    return { success: false, error: 'Failed to send reminder' }
  }
}

// ============================================================================
// CUSTOMER PORTAL ACTIONS
// ============================================================================

/**
 * Get quote by access token (for customer portal)
 */
export async function getQuoteByToken(token: string): Promise<Quote | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select(`
        *,
        items:${TABLE_PREFIX}_quote_items(*)
      `)
      .eq('access_token', token)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error getting quote by token:', error)
    return null
  }
}

/**
 * Record quote view (for analytics)
 */
export async function recordQuoteView(token: string): Promise<void> {
  try {
    const supabase = await getModuleClient()
    
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id, status, view_count, first_viewed_at')
      .eq('access_token', token)
      .single()
    
    if (!quote) return
    
    // Update view count and first_viewed_at
    const updates: Record<string, unknown> = {
      view_count: (quote.view_count || 0) + 1,
      updated_at: new Date().toISOString()
    }
    
    // Set status to viewed if this is first view
    if (quote.status === 'sent') {
      updates.status = 'viewed'
      updates.first_viewed_at = new Date().toISOString()
      updates.viewed_at = new Date().toISOString()
    }
    
    await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update(updates)
      .eq('id', quote.id)
    
    // Log view activity
    if (quote.status === 'sent') {
      await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
        quote_id: quote.id,
        activity_type: 'viewed',
        description: 'Quote viewed by customer'
      })
    }
  } catch (error) {
    console.error('Error recording quote view:', error)
  }
}

/**
 * Accept quote (customer action)
 */
export async function acceptQuote(input: AcceptQuoteInput): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('access_token', input.token)
      .single()
    
    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Validate quote can be accepted
    if (!['sent', 'viewed'].includes(quote.status)) {
      return { success: false, error: 'Quote cannot be accepted in current status' }
    }
    
    // Check if expired
    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      return { success: false, error: 'Quote has expired' }
    }
    
    // Update quote to accepted
    const now = new Date().toISOString()
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: 'accepted',
        responded_at: now,
        response_notes: input.notes,
        metadata: {
          ...quote.metadata,
          accepted_by_name: input.accepted_by_name,
          accepted_by_email: input.accepted_by_email,
          signature_data: input.signature_data
        },
        updated_at: now
      })
      .eq('id', quote.id)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: quote.id,
      activity_type: 'accepted',
      description: `Quote accepted by ${input.accepted_by_name}`,
      metadata: {
        accepted_by_name: input.accepted_by_name,
        accepted_by_email: input.accepted_by_email
      }
    })
    
    // Send acceptance notification email to site owner
    const totalAmount = quote.total_amount || 0
    const formatted = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: quote.currency || 'ZMW' }).format(totalAmount)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/sites/${quote.site_id}/ecommerce`

    // Look up site owner email
    const ownerSupabase = await getModuleClient()
    const { data: siteData } = await ownerSupabase
      .from('sites')
      .select('agency_id')
      .eq('id', quote.site_id)
      .single()
    
    if (siteData?.agency_id) {
      const { data: agency } = await ownerSupabase
        .from('agencies')
        .select('owner_id')
        .eq('id', siteData.agency_id)
        .single()
      
      if (agency?.owner_id) {
        const { data: ownerProfile } = await ownerSupabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', agency.owner_id)
          .single()
        
        if (ownerProfile?.email) {
          await sendBrandedEmail(siteData.agency_id, {
            to: { email: ownerProfile.email, name: ownerProfile.full_name || undefined },
            emailType: 'quote_accepted_owner',
            recipientUserId: agency.owner_id,
            data: {
              customerName: quote.customer_name || 'Customer',
              customerEmail: quote.customer_email || '',
              quoteNumber: quote.quote_number,
              totalAmount: formatted,
              acceptedByName: input.accepted_by_name || quote.customer_name || 'Customer',
              dashboardUrl,
            },
          })
        }
      }
    }
    
    return { success: true, quote: updatedQuote }
  } catch (error) {
    console.error('Error accepting quote:', error)
    return { success: false, error: 'Failed to accept quote' }
  }
}

/**
 * Reject quote (customer action)
 */
export async function rejectQuote(input: RejectQuoteInput): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('access_token', input.token)
      .single()
    
    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Validate quote can be rejected
    if (!['sent', 'viewed'].includes(quote.status)) {
      return { success: false, error: 'Quote cannot be rejected in current status' }
    }
    
    // Update quote to rejected
    const now = new Date().toISOString()
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: 'rejected',
        responded_at: now,
        response_notes: input.rejection_reason,
        metadata: {
          ...quote.metadata,
          rejection_reason: input.rejection_reason,
          rejected_by_name: input.rejected_by_name
        },
        updated_at: now
      })
      .eq('id', quote.id)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: quote.id,
      activity_type: 'rejected',
      description: input.rejection_reason 
        ? `Quote rejected: ${input.rejection_reason}`
        : 'Quote rejected by customer',
      metadata: {
        rejection_reason: input.rejection_reason,
        rejected_by_name: input.rejected_by_name
      }
    })
    
    // Send rejection notification to site owner
    const totalAmount = quote.total_amount || 0
    const formatted = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: quote.currency || 'ZMW' }).format(totalAmount)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/sites/${quote.site_id}/ecommerce`

    const ownerSupabase2 = await getModuleClient()
    const { data: siteData2 } = await ownerSupabase2
      .from('sites')
      .select('agency_id')
      .eq('id', quote.site_id)
      .single()
    
    if (siteData2?.agency_id) {
      const { data: agency2 } = await ownerSupabase2
        .from('agencies')
        .select('owner_id')
        .eq('id', siteData2.agency_id)
        .single()
      
      if (agency2?.owner_id) {
        const { data: ownerProfile2 } = await ownerSupabase2
          .from('profiles')
          .select('email, full_name')
          .eq('id', agency2.owner_id)
          .single()
        
        if (ownerProfile2?.email) {
          await sendBrandedEmail(siteData2.agency_id, {
            to: { email: ownerProfile2.email, name: ownerProfile2.full_name || undefined },
            emailType: 'quote_rejected_owner',
            recipientUserId: agency2.owner_id,
            data: {
              customerName: quote.customer_name || 'Customer',
              customerEmail: quote.customer_email || '',
              quoteNumber: quote.quote_number,
              totalAmount: formatted,
              rejectedByName: input.rejected_by_name,
              rejectionReason: input.rejection_reason,
              dashboardUrl,
            },
          })
        }
      }
    }
    
    return { success: true, quote: updatedQuote }
  } catch (error) {
    console.error('Error rejecting quote:', error)
    return { success: false, error: 'Failed to reject quote' }
  }
}

// ============================================================================
// CONVERT TO ORDER
// ============================================================================

/**
 * Convert accepted quote to order
 */
export async function convertQuoteToOrder(input: ConvertToOrderInput): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    // Get quote with items
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select(`
        *,
        items:${TABLE_PREFIX}_quote_items(*)
      `)
      .eq('id', input.quote_id)
      .eq('site_id', input.site_id)
      .single()
    
    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Validate quote can be converted
    if (quote.status !== 'accepted') {
      return { success: false, error: 'Only accepted quotes can be converted to orders' }
    }
    
    // Check if already converted
    if (quote.converted_to_order_id) {
      return { success: false, error: 'Quote has already been converted to an order' }
    }
    
    // Generate order number
    const { data: lastOrder } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('order_number')
      .eq('site_id', input.site_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    const nextNumber = lastOrder 
      ? parseInt(lastOrder.order_number.replace(/\D/g, '') || '0') + 1 
      : 1001
    const orderNumber = `ORD-${nextNumber.toString().padStart(5, '0')}`
    
    // Create order
    const orderData = {
      site_id: input.site_id,
      agency_id: quote.agency_id,
      customer_id: quote.customer_id,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'pending',
      fulfillment_status: 'unfulfilled',
      currency: quote.currency,
      subtotal: quote.subtotal,
      discount_amount: quote.discount_amount,
      tax_amount: quote.tax_amount,
      shipping_amount: quote.shipping_amount,
      total: quote.total,
      customer_email: quote.customer_email,
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      billing_address: quote.billing_address,
      shipping_address: quote.shipping_address,
      notes: input.include_notes 
        ? `Converted from Quote ${quote.quote_number}\n${input.custom_order_notes || quote.internal_notes || ''}`
        : input.custom_order_notes || null,
      source: 'quote',
      metadata: {
        source_quote_id: quote.id,
        source_quote_number: quote.quote_number
      }
    }
    
    const { data: newOrder, error: orderError } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .insert(orderData)
      .select()
      .single()
    
    if (orderError || !newOrder) {
      return { success: false, error: orderError?.message || 'Failed to create order' }
    }
    
    // Create order items from quote items
    if (quote.items && quote.items.length > 0) {
      const orderItems = quote.items.map((item: QuoteItem) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_percent 
          ? (item.unit_price * item.quantity * item.discount_percent / 100) 
          : 0,
        tax_amount: item.tax_rate 
          ? (item.unit_price * item.quantity * (1 - (item.discount_percent || 0) / 100) * item.tax_rate / 100)
          : 0,
        subtotal: item.unit_price * item.quantity,
        total: item.line_total,
        options: item.options
      }))
      
      await supabase.from(`${TABLE_PREFIX}_order_items`).insert(orderItems)
    }
    
    // Update quote as converted
    const now = new Date().toISOString()
    await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: 'converted',
        converted_to_order_id: newOrder.id,
        converted_at: now,
        updated_at: now
      })
      .eq('id', quote.id)
    
    // Log activity on quote
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: quote.id,
      activity_type: 'converted',
      description: `Quote converted to Order ${orderNumber}`,
      performed_by: input.user_id,
      performed_by_name: input.user_name,
      metadata: { order_id: newOrder.id, order_number: orderNumber }
    })
    
    // Log activity on order
    await supabase.from(`${TABLE_PREFIX}_order_timeline`).insert({
      order_id: newOrder.id,
      event_type: 'created',
      description: `Order created from Quote ${quote.quote_number}`,
      performed_by: input.user_id,
      performed_by_name: input.user_name,
      metadata: { quote_id: quote.id, quote_number: quote.quote_number }
    })
    
    revalidatePath(`/sites/${input.site_id}/ecommerce`)
    
    return { success: true, order: newOrder }
  } catch (error) {
    console.error('Error converting quote to order:', error)
    return { success: false, error: 'Failed to convert quote to order' }
  }
}

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

/**
 * Update quote status with validation
 */
export async function updateQuoteStatus(
  siteId: string,
  quoteId: string,
  newStatus: QuoteStatus,
  reason?: string,
  userId?: string,
  userName?: string
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient()
    
    // Get current quote
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Validate status transition
    const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      draft: ['pending_approval', 'sent', 'cancelled'],
      pending_approval: ['draft', 'sent', 'cancelled'],
      sent: ['viewed', 'accepted', 'rejected', 'expired', 'cancelled'],
      viewed: ['accepted', 'rejected', 'expired', 'cancelled'],
      accepted: ['converted', 'cancelled'],
      rejected: ['draft'],
      expired: ['draft'],
      converted: [],
      cancelled: ['draft']
    }
    
    const allowed = validTransitions[quote.status as QuoteStatus] || []
    if (!allowed.includes(newStatus)) {
      return { 
        success: false, 
        error: `Cannot transition from ${quote.status} to ${newStatus}` 
      }
    }
    
    // Build updates
    const now = new Date().toISOString()
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: now
    }
    
    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update(updates)
      .eq('id', quoteId)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
      quote_id: quoteId,
      activity_type: 'status_changed',
      description: reason || `Status changed from ${quote.status} to ${newStatus}`,
      performed_by: userId,
      performed_by_name: userName,
      metadata: {
        old_status: quote.status,
        new_status: newStatus,
        reason
      }
    })
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true, quote: updatedQuote }
  } catch (error) {
    console.error('Error updating quote status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}

/**
 * Cancel quote
 */
export async function cancelQuote(
  siteId: string,
  quoteId: string,
  reason?: string,
  userId?: string,
  userName?: string
): Promise<WorkflowResult> {
  return updateQuoteStatus(siteId, quoteId, 'cancelled', reason, userId, userName)
}

/**
 * Mark expired quotes (to be run by cron job)
 */
export async function markExpiredQuotes(siteId: string): Promise<{ count: number }> {
  try {
    const supabase = await getModuleClient()
    
    const now = new Date().toISOString()
    
    // Find quotes that should be expired
    const { data: expiredQuotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('site_id', siteId)
      .in('status', ['sent', 'viewed'])
      .lt('valid_until', now)
    
    if (error || !expiredQuotes) {
      return { count: 0 }
    }
    
    // Update each to expired
    for (const quote of expiredQuotes) {
      await supabase
        .from(`${TABLE_PREFIX}_quotes`)
        .update({ 
          status: 'expired',
          updated_at: now
        })
        .eq('id', quote.id)
      
      await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
        quote_id: quote.id,
        activity_type: 'expired',
        description: 'Quote expired automatically'
      })
    }
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { count: expiredQuotes.length }
  } catch (error) {
    console.error('Error marking expired quotes:', error)
    return { count: 0 }
  }
}
