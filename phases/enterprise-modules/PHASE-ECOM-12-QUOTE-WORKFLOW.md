# PHASE-ECOM-12: Quote Workflow & Customer Portal

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-11A, PHASE-ECOM-11B
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement the complete quote workflow system including sending quotes, email notifications, the customer-facing portal where customers can view and accept/reject quotes, PDF generation, and the convert-to-order functionality.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Verify PHASE-ECOM-11A complete (server actions working)
- [ ] Verify PHASE-ECOM-11B complete (UI components working)
- [ ] Review existing email template patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 QUOTE WORKFLOW SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Server Actions (lib/):                                         │
│  ├── quote-workflow-actions.ts  # Workflow operations           │
│  └── quote-pdf-generator.ts     # PDF creation utility          │
│                                                                  │
│  Components:                                                     │
│  ├── send-quote-dialog.tsx      # Email sending dialog          │
│  ├── convert-to-order-dialog.tsx # Convert workflow             │
│  └── quote-email-preview.tsx    # Email template preview        │
│                                                                  │
│  Customer Portal (public):                                       │
│  ├── app/quote/[token]/page.tsx # Main portal page              │
│  ├── quote-portal-view.tsx      # Portal UI component           │
│  ├── quote-accept-form.tsx      # Accept/sign form              │
│  └── quote-reject-dialog.tsx    # Rejection with reason         │
│                                                                  │
│  Email Templates:                                                │
│  ├── quote-email-template.tsx   # Quote sent email              │
│  ├── quote-reminder-template.tsx# Reminder email                │
│  └── quote-accepted-template.tsx# Acceptance notification       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/actions/quote-workflow-actions.ts` | Create | Workflow server actions |
| `src/modules/ecommerce/lib/quote-pdf-generator.ts` | Create | PDF generation utility |
| `src/modules/ecommerce/components/quotes/send-quote-dialog.tsx` | Create | Send quote dialog |
| `src/modules/ecommerce/components/quotes/convert-to-order-dialog.tsx` | Create | Convert to order |
| `src/modules/ecommerce/components/quotes/quote-email-preview.tsx` | Create | Email preview |
| `src/app/quote/[token]/page.tsx` | Create | Portal page route |
| `src/app/quote/[token]/loading.tsx` | Create | Loading state |
| `src/app/quote/[token]/not-found.tsx` | Create | Not found page |
| `src/modules/ecommerce/components/portal/quote-portal-view.tsx` | Create | Portal UI |
| `src/modules/ecommerce/components/portal/quote-accept-form.tsx` | Create | Accept form |
| `src/modules/ecommerce/components/portal/quote-reject-dialog.tsx` | Create | Reject dialog |
| `src/modules/ecommerce/components/portal/index.ts` | Create | Portal exports |
| `src/modules/ecommerce/emails/quote-email-template.tsx` | Create | Quote sent email |
| `src/modules/ecommerce/emails/quote-reminder-template.tsx` | Create | Reminder email |
| `src/modules/ecommerce/emails/quote-accepted-template.tsx` | Create | Accept notification |
| `src/modules/ecommerce/components/quotes/index.ts` | Modify | Add new exports |

---

## 📋 Implementation Tasks

### Task 12.1: Create Quote Workflow Server Actions

**File**: `src/modules/ecommerce/actions/quote-workflow-actions.ts`
**Action**: Create

**Description**: Server actions for quote workflow operations including sending, accepting, rejecting, and converting to orders.

```typescript
/**
 * Quote Workflow Server Actions
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Handles quote sending, acceptance, rejection, and conversion to orders
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  generateQuoteNumber, 
  calculateQuoteTotals,
  QUOTE_STATUS_CONFIG 
} from '../lib/quote-utils'
import type { 
  Quote, 
  QuoteStatus, 
  QuoteActivity,
  Order,
  OrderInput,
  OrderItemInput
} from '../types/ecommerce-types'

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
  signature_data?: string // Base64 signature image
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
    const supabase = await createClient()
    
    // Get quote with full details
    const { data: quote, error: quoteError } = await supabase
      .from('mod_ecommod01_quotes')
      .select(`
        *,
        items:mod_ecommod01_quote_items(*)
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
      .from('mod_ecommod01_quotes')
      .update({
        status: 'sent',
        access_token: accessToken,
        sent_at: now,
        last_sent_at: now,
        updated_at: now
      })
      .eq('id', input.quote_id)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from('mod_ecommod01_quote_activity').insert({
      quote_id: input.quote_id,
      activity_type: 'sent',
      description: `Quote sent to ${quote.customer_email}`,
      metadata: {
        subject: input.subject,
        cc_emails: input.cc_emails
      }
    })
    
    // TODO: Send actual email via email service
    // This would integrate with Resend, SendGrid, etc.
    // await sendQuoteEmail({
    //   to: quote.customer_email,
    //   subject: input.subject || `Quote ${quote.quote_number}`,
    //   quote: updatedQuote,
    //   message: input.message,
    //   portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/quote/${accessToken}`
    // })
    
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
    const supabase = await createClient()
    
    const { data: quote, error } = await supabase
      .from('mod_ecommod01_quotes')
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
    
    // Update last_sent_at
    const { error: updateError } = await supabase
      .from('mod_ecommod01_quotes')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', quoteId)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from('mod_ecommod01_quote_activity').insert({
      quote_id: quoteId,
      activity_type: 'resent',
      description: `Quote resent to ${quote.customer_email}`
    })
    
    // TODO: Actually resend email
    
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
    const supabase = await createClient()
    
    const { data: quote, error } = await supabase
      .from('mod_ecommod01_quotes')
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
    
    // Update reminder count
    const { error: updateError } = await supabase
      .from('mod_ecommod01_quotes')
      .update({ 
        reminder_count: (quote.reminder_count || 0) + 1,
        last_reminder_at: new Date().toISOString()
      })
      .eq('id', quoteId)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from('mod_ecommod01_quote_activity').insert({
      quote_id: quoteId,
      activity_type: 'reminder_sent',
      description: `Reminder sent to ${quote.customer_email}`
    })
    
    // TODO: Send reminder email
    
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
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quotes')
      .select(`
        *,
        items:mod_ecommod01_quote_items(*)
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
    const supabase = await createClient()
    
    const { data: quote } = await supabase
      .from('mod_ecommod01_quotes')
      .select('id, status, view_count, first_viewed_at')
      .eq('access_token', token)
      .single()
    
    if (!quote) return
    
    // Update view count and first_viewed_at
    const updates: Record<string, unknown> = {
      view_count: (quote.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString()
    }
    
    // Set status to viewed if this is first view
    if (quote.status === 'sent') {
      updates.status = 'viewed'
      updates.first_viewed_at = new Date().toISOString()
    }
    
    await supabase
      .from('mod_ecommod01_quotes')
      .update(updates)
      .eq('id', quote.id)
    
    // Log view activity
    if (quote.status === 'sent') {
      await supabase.from('mod_ecommod01_quote_activity').insert({
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
    const supabase = await createClient()
    
    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from('mod_ecommod01_quotes')
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
      .from('mod_ecommod01_quotes')
      .update({
        status: 'accepted',
        accepted_at: now,
        accepted_by_name: input.accepted_by_name,
        accepted_by_email: input.accepted_by_email,
        signature_data: input.signature_data,
        customer_notes: input.notes,
        updated_at: now
      })
      .eq('id', quote.id)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from('mod_ecommod01_quote_activity').insert({
      quote_id: quote.id,
      activity_type: 'accepted',
      description: `Quote accepted by ${input.accepted_by_name}`,
      metadata: {
        accepted_by_name: input.accepted_by_name,
        accepted_by_email: input.accepted_by_email
      }
    })
    
    // TODO: Send acceptance notification email to site owner
    
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
    const supabase = await createClient()
    
    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from('mod_ecommod01_quotes')
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
      .from('mod_ecommod01_quotes')
      .update({
        status: 'rejected',
        rejected_at: now,
        rejection_reason: input.rejection_reason,
        updated_at: now
      })
      .eq('id', quote.id)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from('mod_ecommod01_quote_activity').insert({
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
    
    // TODO: Send rejection notification to site owner
    
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
    const supabase = await createClient()
    
    // Get quote with items
    const { data: quote, error: quoteError } = await supabase
      .from('mod_ecommod01_quotes')
      .select(`
        *,
        items:mod_ecommod01_quote_items(*)
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
    if (quote.converted_order_id) {
      return { success: false, error: 'Quote has already been converted to an order' }
    }
    
    // Generate order number
    const { data: lastOrder } = await supabase
      .from('mod_ecommod01_orders')
      .select('order_number')
      .eq('site_id', input.site_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    const nextNumber = lastOrder 
      ? parseInt(lastOrder.order_number.replace(/\D/g, '')) + 1 
      : 1
    const orderNumber = `ORD-${nextNumber.toString().padStart(5, '0')}`
    
    // Create order
    const orderInput: OrderInput = {
      site_id: input.site_id,
      agency_id: quote.agency_id,
      customer_id: quote.customer_id,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'pending',
      currency: quote.currency,
      subtotal: quote.subtotal,
      discount_amount: quote.discount_amount,
      tax_amount: quote.tax_amount,
      shipping_amount: quote.shipping_amount,
      total: quote.total,
      customer_email: quote.customer_email,
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      notes: input.include_notes 
        ? `Converted from Quote ${quote.quote_number}\n${input.custom_order_notes || quote.internal_notes || ''}`
        : input.custom_order_notes,
      source_quote_id: quote.id
    }
    
    const { data: newOrder, error: orderError } = await supabase
      .from('mod_ecommod01_orders')
      .insert(orderInput)
      .select()
      .single()
    
    if (orderError || !newOrder) {
      return { success: false, error: orderError?.message || 'Failed to create order' }
    }
    
    // Create order items from quote items
    if (quote.items && quote.items.length > 0) {
      const orderItems: OrderItemInput[] = quote.items.map((item: any) => ({
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
      
      await supabase.from('mod_ecommod01_order_items').insert(orderItems)
    }
    
    // Update quote as converted
    const now = new Date().toISOString()
    await supabase
      .from('mod_ecommod01_quotes')
      .update({
        status: 'converted',
        converted_order_id: newOrder.id,
        converted_at: now,
        updated_at: now
      })
      .eq('id', quote.id)
    
    // Log activity on quote
    await supabase.from('mod_ecommod01_quote_activity').insert({
      quote_id: quote.id,
      activity_type: 'converted',
      description: `Quote converted to Order ${orderNumber}`,
      performed_by: input.user_id,
      performed_by_name: input.user_name,
      metadata: { order_id: newOrder.id, order_number: orderNumber }
    })
    
    // Log activity on order
    await supabase.from('mod_ecommod01_order_activity').insert({
      order_id: newOrder.id,
      activity_type: 'created',
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
    const supabase = await createClient()
    
    // Get current quote
    const { data: quote, error: quoteError } = await supabase
      .from('mod_ecommod01_quotes')
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
      rejected: ['draft'], // Can reopen as draft
      expired: ['draft'], // Can reopen as draft
      converted: [], // Final state
      cancelled: ['draft'] // Can reopen as draft
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
    
    // Add status-specific timestamps
    if (newStatus === 'cancelled') {
      updates.cancelled_at = now
    }
    
    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from('mod_ecommod01_quotes')
      .update(updates)
      .eq('id', quoteId)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // Log activity
    await supabase.from('mod_ecommod01_quote_activity').insert({
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
    const supabase = await createClient()
    
    const now = new Date().toISOString()
    
    // Find quotes that should be expired
    const { data: expiredQuotes, error } = await supabase
      .from('mod_ecommod01_quotes')
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
        .from('mod_ecommod01_quotes')
        .update({ 
          status: 'expired',
          updated_at: now
        })
        .eq('id', quote.id)
      
      await supabase.from('mod_ecommod01_quote_activity').insert({
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
```

---

### Task 12.2: Create PDF Generator Utility

**File**: `src/modules/ecommerce/lib/quote-pdf-generator.ts`
**Action**: Create

**Description**: Utility functions for generating PDF quotes (using @react-pdf/renderer).

```typescript
/**
 * Quote PDF Generator Utility
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * PDF generation for quotes (requires @react-pdf/renderer)
 */

import type { Quote, QuoteItem } from '../types/ecommerce-types'
import { formatQuoteCurrency, calculateItemLineTotal } from './quote-utils'

// ============================================================================
// TYPES
// ============================================================================

export interface QuotePDFOptions {
  includeCompanyLogo?: boolean
  logoUrl?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  primaryColor?: string
  showTerms?: boolean
  customFooter?: string
}

export interface QuotePDFData {
  quote: Quote
  items: QuoteItem[]
  options: QuotePDFOptions
}

// ============================================================================
// PDF TEMPLATE DATA
// ============================================================================

/**
 * Generate data structure for PDF template
 */
export function generatePDFData(
  quote: Quote,
  items: QuoteItem[],
  options: QuotePDFOptions = {}
): QuotePDFData {
  return {
    quote,
    items: items.sort((a, b) => a.sort_order - b.sort_order),
    options: {
      includeCompanyLogo: true,
      primaryColor: '#2563eb',
      showTerms: true,
      ...options
    }
  }
}

/**
 * Format quote data for PDF sections
 */
export function formatQuoteForPDF(data: QuotePDFData) {
  const { quote, items, options } = data
  
  return {
    // Header
    header: {
      title: quote.title || `Quote ${quote.quote_number}`,
      quoteNumber: quote.quote_number,
      date: new Date(quote.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      validUntil: quote.valid_until 
        ? new Date(quote.valid_until).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : null
    },
    
    // Company Info
    company: {
      name: options.companyName || '',
      address: options.companyAddress || '',
      phone: options.companyPhone || '',
      email: options.companyEmail || '',
      logo: options.logoUrl || null
    },
    
    // Customer Info
    customer: {
      name: quote.customer_name,
      email: quote.customer_email,
      company: quote.customer_company || '',
      phone: quote.customer_phone || ''
    },
    
    // Introduction
    introduction: quote.introduction || null,
    
    // Line Items
    items: items.map(item => ({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: formatQuoteCurrency(item.unit_price, quote.currency),
      discount: item.discount_percent > 0 ? `${item.discount_percent}%` : '',
      total: formatQuoteCurrency(
        calculateItemLineTotal(
          item.quantity,
          item.unit_price,
          item.discount_percent,
          item.tax_rate
        ),
        quote.currency
      )
    })),
    
    // Totals
    totals: {
      subtotal: formatQuoteCurrency(quote.subtotal, quote.currency),
      discount: quote.discount_amount > 0 
        ? formatQuoteCurrency(quote.discount_amount, quote.currency)
        : null,
      discountLabel: quote.discount_type === 'percentage'
        ? `Discount (${quote.discount_value}%)`
        : 'Discount',
      tax: quote.tax_amount > 0
        ? formatQuoteCurrency(quote.tax_amount, quote.currency)
        : null,
      taxLabel: quote.tax_rate > 0 ? `Tax (${quote.tax_rate}%)` : 'Tax',
      shipping: quote.shipping_amount > 0
        ? formatQuoteCurrency(quote.shipping_amount, quote.currency)
        : null,
      total: formatQuoteCurrency(quote.total, quote.currency)
    },
    
    // Terms
    terms: options.showTerms ? quote.terms_and_conditions : null,
    
    // Notes
    notesToCustomer: quote.notes_to_customer || null,
    
    // Footer
    footer: options.customFooter || null,
    
    // Styling
    primaryColor: options.primaryColor || '#2563eb'
  }
}

/**
 * Generate PDF filename
 */
export function generatePDFFilename(quote: Quote): string {
  const customerSlug = quote.customer_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `${quote.quote_number}-${customerSlug}.pdf`
}

// NOTE: Actual PDF rendering would use @react-pdf/renderer
// This is a placeholder structure. Full implementation would look like:
//
// import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
//
// const QuotePDFDocument = ({ data }: { data: ReturnType<typeof formatQuoteForPDF> }) => (
//   <Document>
//     <Page size="A4" style={styles.page}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text>{data.header.title}</Text>
//         <Text>Quote #: {data.header.quoteNumber}</Text>
//       </View>
//       {/* ... rest of PDF content */}
//     </Page>
//   </Document>
// )
//
// export async function generateQuotePDF(data: QuotePDFData): Promise<Blob> {
//   const formattedData = formatQuoteForPDF(data)
//   return pdf(<QuotePDFDocument data={formattedData} />).toBlob()
// }
```

---

### Task 12.3: Create Send Quote Dialog

**File**: `src/modules/ecommerce/components/quotes/send-quote-dialog.tsx`
**Action**: Create

**Description**: Dialog for sending quotes via email with customizable subject and message.

```tsx
/**
 * Send Quote Dialog Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Dialog for sending quotes to customers via email
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Loader2, 
  Mail, 
  User,
  FileText,
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getQuote } from '../../actions/quote-actions'
import { sendQuote, resendQuote } from '../../actions/quote-workflow-actions'
import { formatQuoteCurrency, isQuoteExpired } from '../../lib/quote-utils'
import { QuoteStatusBadge } from './quote-status-badge'
import type { Quote } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface SendQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId: string
  siteId: string
  onSent?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SendQuoteDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  onSent
}: SendQuoteDialogProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [ccEmails, setCcEmails] = useState('')
  const [includePdf, setIncludePdf] = useState(true)
  
  // Load quote data
  useEffect(() => {
    if (!open || !quoteId) return
    
    async function loadQuote() {
      setIsLoading(true)
      try {
        const data = await getQuote(siteId, quoteId)
        setQuote(data)
        
        // Set default subject
        if (data) {
          setSubject(`Quote ${data.quote_number}${data.title ? ` - ${data.title}` : ''}`)
          setMessage(getDefaultMessage(data))
        }
      } catch (error) {
        console.error('Error loading quote:', error)
        toast.error('Failed to load quote')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuote()
  }, [open, quoteId, siteId])
  
  // Default message template
  const getDefaultMessage = (q: Quote): string => {
    return `Dear ${q.customer_name},

Please find attached your quote for your review.

Quote Number: ${q.quote_number}
Total: ${formatQuoteCurrency(q.total, q.currency)}
${q.valid_until ? `Valid Until: ${format(new Date(q.valid_until), 'MMMM d, yyyy')}` : ''}

You can view and accept this quote online by clicking the link below.

Please don't hesitate to contact us if you have any questions.

Best regards`
  }
  
  // Handle send
  const handleSend = async () => {
    if (!quote) return
    
    setIsSending(true)
    try {
      // Parse CC emails
      const ccList = ccEmails
        .split(/[,;]/)
        .map(e => e.trim())
        .filter(e => e && e.includes('@'))
      
      const isResend = ['sent', 'viewed'].includes(quote.status)
      
      let result
      if (isResend) {
        result = await resendQuote(siteId, quoteId, subject, message)
      } else {
        result = await sendQuote({
          quote_id: quoteId,
          site_id: siteId,
          subject,
          message,
          cc_emails: ccList.length > 0 ? ccList : undefined,
          include_pdf: includePdf
        })
      }
      
      if (result.success) {
        toast.success(isResend ? 'Quote resent successfully' : 'Quote sent successfully')
        onSent?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to send quote')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('Failed to send quote')
    } finally {
      setIsSending(false)
    }
  }
  
  // Copy portal link
  const handleCopyLink = () => {
    if (!quote?.access_token) return
    
    const portalUrl = `${window.location.origin}/quote/${quote.access_token}`
    navigator.clipboard.writeText(portalUrl)
    toast.success('Portal link copied to clipboard')
  }
  
  // Check if expired
  const expired = quote?.valid_until ? isQuoteExpired(quote.valid_until) : false
  const isResend = quote && ['sent', 'viewed'].includes(quote.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {isResend ? 'Resend Quote' : 'Send Quote'}
          </DialogTitle>
          <DialogDescription>
            {isResend 
              ? 'Send another copy of this quote to the customer'
              : 'Email this quote to the customer for review and approval'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !quote ? (
          <div className="text-center py-8 text-muted-foreground">
            Quote not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{quote.quote_number}</span>
                    <QuoteStatusBadge status={quote.status} size="sm" />
                  </div>
                  {quote.title && (
                    <p className="text-sm text-muted-foreground">{quote.title}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatQuoteCurrency(quote.total, quote.currency)}</p>
                  {quote.valid_until && (
                    <p className={cn(
                      "text-xs",
                      expired ? "text-red-600" : "text-muted-foreground"
                    )}>
                      Valid until {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Expiry Warning */}
            {expired && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">This quote has expired</p>
                  <p className="text-sm">Consider extending the validity date before sending.</p>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Recipient */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Recipient
              </Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{quote.customer_name}</span>
                <span className="text-muted-foreground">&lt;{quote.customer_email}&gt;</span>
              </div>
            </div>
            
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quote subject line..."
              />
            </div>
            
            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={6}
              />
            </div>
            
            {/* CC Emails */}
            <div className="space-y-2">
              <Label htmlFor="cc">CC (optional)</Label>
              <Input
                id="cc"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas
              </p>
            </div>
            
            {/* Options */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="includePdf"
                checked={includePdf}
                onCheckedChange={(checked) => setIncludePdf(checked as boolean)}
              />
              <Label htmlFor="includePdf" className="cursor-pointer">
                Attach PDF version
              </Label>
            </div>
            
            {/* Portal Link Preview */}
            {quote.access_token && (
              <div className="space-y-2">
                <Label>Customer Portal Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/quote/${quote.access_token}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(`/quote/${quote.access_token}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending || !subject}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isResend ? 'Resend Quote' : 'Send Quote'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 12.4: Create Convert to Order Dialog

**File**: `src/modules/ecommerce/components/quotes/convert-to-order-dialog.tsx`
**Action**: Create

**Description**: Dialog for converting accepted quotes to orders.

```tsx
/**
 * Convert to Order Dialog Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Convert accepted quotes to orders
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowRightCircle, 
  Loader2, 
  Package,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getQuote } from '../../actions/quote-actions'
import { convertQuoteToOrder } from '../../actions/quote-workflow-actions'
import { formatQuoteCurrency } from '../../lib/quote-utils'
import { QuoteStatusBadge } from './quote-status-badge'
import type { Quote } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ConvertToOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId: string
  siteId: string
  userId?: string
  userName?: string
  onConverted?: (orderId: string) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConvertToOrderDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  userId,
  userName,
  onConverted
}: ConvertToOrderDialogProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConverting, setIsConverting] = useState(false)
  
  // Form state
  const [includeNotes, setIncludeNotes] = useState(true)
  const [customNotes, setCustomNotes] = useState('')
  
  // Load quote data
  useEffect(() => {
    if (!open || !quoteId) return
    
    async function loadQuote() {
      setIsLoading(true)
      try {
        const data = await getQuote(siteId, quoteId)
        setQuote(data)
      } catch (error) {
        console.error('Error loading quote:', error)
        toast.error('Failed to load quote')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuote()
  }, [open, quoteId, siteId])
  
  // Handle convert
  const handleConvert = async () => {
    if (!quote) return
    
    setIsConverting(true)
    try {
      const result = await convertQuoteToOrder({
        quote_id: quoteId,
        site_id: siteId,
        include_notes: includeNotes,
        custom_order_notes: customNotes || undefined,
        user_id: userId,
        user_name: userName
      })
      
      if (result.success && result.order) {
        toast.success(`Order ${result.order.order_number} created successfully`)
        onConverted?.(result.order.id)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to convert quote')
      }
    } catch (error) {
      console.error('Error converting quote:', error)
      toast.error('Failed to convert quote')
    } finally {
      setIsConverting(false)
    }
  }
  
  const canConvert = quote?.status === 'accepted'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5" />
            Convert to Order
          </DialogTitle>
          <DialogDescription>
            Create a new order from this accepted quote
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !quote ? (
          <div className="text-center py-8 text-muted-foreground">
            Quote not found
          </div>
        ) : !canConvert ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Cannot convert this quote</p>
                <p className="text-sm">Only accepted quotes can be converted to orders.</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{quote.quote_number}</span>
                <QuoteStatusBadge status={quote.status} size="sm" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">{quote.quote_number}</span>
                    <QuoteStatusBadge status={quote.status} size="sm" />
                  </div>
                  {quote.title && (
                    <p className="text-sm text-muted-foreground">{quote.title}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{quote.customer_name}</span>
                </div>
                {quote.items && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{quote.items.length}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatQuoteCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            </div>
            
            {/* Acceptance Info */}
            {quote.accepted_at && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Quote Accepted
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    By {quote.accepted_by_name || 'Customer'} on {format(new Date(quote.accepted_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeNotes"
                  checked={includeNotes}
                  onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                />
                <Label htmlFor="includeNotes" className="cursor-pointer">
                  Include quote notes in order
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customNotes">Additional Order Notes (optional)</Label>
                <Textarea
                  id="customNotes"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Add any additional notes for the order..."
                  rows={3}
                />
              </div>
            </div>
            
            {/* What will be created */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                New Order Will Include:
              </h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• All {quote.items?.length || 0} line items from the quote</li>
                <li>• Customer information: {quote.customer_name}</li>
                <li>• Pricing: {formatQuoteCurrency(quote.total, quote.currency)}</li>
                <li>• Order status: Pending</li>
                <li>• Payment status: Pending</li>
              </ul>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConvert} disabled={isConverting}>
                {isConverting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightCircle className="h-4 w-4 mr-2" />
                )}
                Convert to Order
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 12.5: Create Customer Portal Page Route

**File**: `src/app/quote/[token]/page.tsx`
**Action**: Create

**Description**: Public page for customers to view and respond to quotes.

```tsx
/**
 * Customer Quote Portal Page
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Public page for customers to view and accept/reject quotes
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getQuoteByToken, recordQuoteView } from '@/modules/ecommerce/actions/quote-workflow-actions'
import { QuotePortalView } from '@/modules/ecommerce/components/portal/quote-portal-view'

// ============================================================================
// TYPES
// ============================================================================

interface QuotePortalPageProps {
  params: Promise<{
    token: string
  }>
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: QuotePortalPageProps): Promise<Metadata> {
  const { token } = await params
  const quote = await getQuoteByToken(token)
  
  if (!quote) {
    return {
      title: 'Quote Not Found'
    }
  }
  
  return {
    title: `Quote ${quote.quote_number}${quote.title ? ` - ${quote.title}` : ''}`,
    description: `View and respond to quote ${quote.quote_number}`,
    robots: {
      index: false,
      follow: false
    }
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function QuotePortalPage({ params }: QuotePortalPageProps) {
  const { token } = await params
  
  // Get quote data
  const quote = await getQuoteByToken(token)
  
  if (!quote) {
    notFound()
  }
  
  // Record view (async, don't await)
  recordQuoteView(token)
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <QuotePortalView quote={quote} token={token} />
    </div>
  )
}
```

---

### Task 12.6: Create Portal Loading State

**File**: `src/app/quote/[token]/loading.tsx`
**Action**: Create

```tsx
/**
 * Quote Portal Loading State
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 */

import { Loader2 } from 'lucide-react'

export default function QuotePortalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading quote...</p>
      </div>
    </div>
  )
}
```

---

### Task 12.7: Create Portal Not Found Page

**File**: `src/app/quote/[token]/not-found.tsx`
**Action**: Create

```tsx
/**
 * Quote Portal Not Found
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileX, Home } from 'lucide-react'

export default function QuoteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <FileX className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This quote link may have expired or is invalid. Please contact the sender for a new link.
        </p>
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  )
}
```

---

### Task 12.8: Create Quote Portal View Component

**File**: `src/modules/ecommerce/components/portal/quote-portal-view.tsx`
**Action**: Create

**Description**: Main customer-facing portal view for quotes.

```tsx
/**
 * Quote Portal View Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Customer-facing view for quotes
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  FileText,
  Clock,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { QuoteAcceptForm } from './quote-accept-form'
import { QuoteRejectDialog } from './quote-reject-dialog'
import { formatQuoteCurrency, isQuoteExpired, calculateDaysUntilExpiry } from '../../lib/quote-utils'
import type { Quote } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuotePortalViewProps {
  quote: Quote
  token: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuotePortalView({ quote, token }: QuotePortalViewProps) {
  const [showAcceptForm, setShowAcceptForm] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(quote.status)
  
  const expired = quote.valid_until ? isQuoteExpired(quote.valid_until) : false
  const daysUntilExpiry = quote.valid_until ? calculateDaysUntilExpiry(quote.valid_until) : null
  
  const canRespond = ['sent', 'viewed'].includes(currentStatus) && !expired
  const isAccepted = currentStatus === 'accepted'
  const isRejected = currentStatus === 'rejected'
  const isExpired = currentStatus === 'expired' || expired
  
  // Handle acceptance/rejection
  const handleAccepted = () => {
    setCurrentStatus('accepted')
    setShowAcceptForm(false)
  }
  
  const handleRejected = () => {
    setCurrentStatus('rejected')
    setShowRejectDialog(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      {/* Status Banner */}
      {isAccepted && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">Quote Accepted</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Thank you! We will process your order shortly.
            </p>
          </div>
        </div>
      )}
      
      {isRejected && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">Quote Declined</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This quote has been declined. Contact us if you change your mind.
            </p>
          </div>
        </div>
      )}
      
      {isExpired && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-300">Quote Expired</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This quote has expired. Please contact us for an updated quote.
            </p>
          </div>
        </div>
      )}
      
      {/* Main Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl mb-1">
                {quote.title || `Quote ${quote.quote_number}`}
              </CardTitle>
              <p className="text-muted-foreground">
                Quote #{quote.quote_number}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatQuoteCurrency(quote.total, quote.currency)}
              </div>
              {quote.valid_until && !isExpired && daysUntilExpiry !== null && (
                <p className={cn(
                  "text-sm mt-1",
                  daysUntilExpiry <= 3 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  Valid for {daysUntilExpiry} more day{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Introduction */}
          {quote.introduction && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="whitespace-pre-wrap">{quote.introduction}</p>
            </div>
          )}
          
          {/* Quote Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quote Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quote Number</span>
                  <span>{quote.quote_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(quote.created_at), 'MMMM d, yyyy')}</span>
                </div>
                {quote.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span className={expired ? 'text-red-600' : ''}>
                      {format(new Date(quote.valid_until), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Prepared For
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{quote.customer_name}</p>
                {quote.customer_company && (
                  <p className="text-muted-foreground">{quote.customer_company}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{quote.customer_email}</span>
                </div>
                {quote.customer_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{quote.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Line Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-right p-3 font-medium w-20">Qty</th>
                    <th className="text-right p-3 font-medium w-28">Price</th>
                    <th className="text-right p-3 font-medium w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatQuoteCurrency(item.unit_price, quote.currency)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatQuoteCurrency(item.line_total, quote.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatQuoteCurrency(quote.subtotal, quote.currency)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatQuoteCurrency(quote.discount_amount, quote.currency)}</span>
                </div>
              )}
              {quote.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatQuoteCurrency(quote.tax_amount, quote.currency)}</span>
                </div>
              )}
              {quote.shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatQuoteCurrency(quote.shipping_amount, quote.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatQuoteCurrency(quote.total, quote.currency)}</span>
              </div>
            </div>
          </div>
          
          {/* Notes to Customer */}
          {quote.notes_to_customer && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Notes</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
                {quote.notes_to_customer}
              </p>
            </div>
          )}
          
          {/* Terms & Conditions */}
          {quote.terms_and_conditions && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Terms & Conditions</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-lg max-h-48 overflow-auto">
                {quote.terms_and_conditions}
              </div>
            </div>
          )}
          
          <Separator className="my-6" />
          
          {/* Action Buttons */}
          {canRespond && !showAcceptForm && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1"
                size="lg"
                onClick={() => setShowAcceptForm(true)}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Accept Quote
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Decline
              </Button>
            </div>
          )}
          
          {/* Accept Form */}
          {showAcceptForm && (
            <QuoteAcceptForm
              token={token}
              quoteName={quote.customer_name}
              onAccepted={handleAccepted}
              onCancel={() => setShowAcceptForm(false)}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Download PDF Button */}
      <div className="text-center">
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
      
      {/* Reject Dialog */}
      <QuoteRejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        token={token}
        onRejected={handleRejected}
      />
    </div>
  )
}
```

---

### Task 12.9: Create Quote Accept Form

**File**: `src/modules/ecommerce/components/portal/quote-accept-form.tsx`
**Action**: Create

```tsx
/**
 * Quote Accept Form Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Form for customers to accept quotes with signature
 */
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, Trash2, PenTool } from 'lucide-react'
import { toast } from 'sonner'
import { acceptQuote } from '../../actions/quote-workflow-actions'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteAcceptFormProps {
  token: string
  quoteName: string
  onAccepted: () => void
  onCancel: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteAcceptForm({
  token,
  quoteName,
  onAccepted,
  onCancel
}: QuoteAcceptFormProps) {
  const [name, setName] = useState(quoteName)
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  
  // Drawing handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    setIsDrawing(true)
    setHasSignature(true)
    
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  
  const stopDrawing = () => {
    setIsDrawing(false)
  }
  
  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }
  
  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }
    
    if (!agreeTerms) {
      toast.error('Please agree to the terms')
      return
    }
    
    setIsSubmitting(true)
    try {
      // Get signature data if drawn
      let signatureData: string | undefined
      if (hasSignature && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL('image/png')
      }
      
      const result = await acceptQuote({
        token,
        accepted_by_name: name.trim(),
        accepted_by_email: email.trim() || undefined,
        signature_data: signatureData,
        notes: notes.trim() || undefined
      })
      
      if (result.success) {
        toast.success('Quote accepted successfully!')
        onAccepted()
      } else {
        toast.error(result.error || 'Failed to accept quote')
      }
    } catch (error) {
      console.error('Error accepting quote:', error)
      toast.error('Failed to accept quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-green-200 dark:border-green-900">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle className="h-5 w-5" />
          Accept Quote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          
          {/* Signature */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Signature (optional)
            </Label>
            <div className="border rounded-lg p-2 bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full border rounded cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {hasSignature && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={clearSignature}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Signature
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Draw your signature above using your mouse or touch screen
            </p>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or comments..."
              rows={2}
            />
          </div>
          
          {/* Terms Agreement */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreeTerms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
            />
            <Label htmlFor="agreeTerms" className="text-sm cursor-pointer">
              I agree to accept this quote and the terms and conditions provided
            </Label>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !agreeTerms}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Acceptance
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

### Task 12.10: Create Quote Reject Dialog

**File**: `src/modules/ecommerce/components/portal/quote-reject-dialog.tsx`
**Action**: Create

```tsx
/**
 * Quote Reject Dialog Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Dialog for customers to decline quotes with optional reason
 */
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { rejectQuote } from '../../actions/quote-workflow-actions'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteRejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  onRejected: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteRejectDialog({
  open,
  onOpenChange,
  token,
  onRejected
}: QuoteRejectDialogProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      const result = await rejectQuote({
        token,
        rejection_reason: reason.trim() || undefined
      })
      
      if (result.success) {
        toast.success('Quote declined')
        onRejected()
      } else {
        toast.error(result.error || 'Failed to decline quote')
      }
    } catch (error) {
      console.error('Error rejecting quote:', error)
      toast.error('Failed to decline quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Decline Quote
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to decline this quote? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please let us know why you're declining..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us improve our quotes
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Decline Quote
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 12.11: Create Portal Components Index

**File**: `src/modules/ecommerce/components/portal/index.ts`
**Action**: Create

```typescript
/**
 * Portal Components Index
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 */

export { QuotePortalView } from './quote-portal-view'
export { QuoteAcceptForm } from './quote-accept-form'
export { QuoteRejectDialog } from './quote-reject-dialog'
```

---

### Task 12.12: Update Quote Components Index

**File**: `src/modules/ecommerce/components/quotes/index.ts`
**Action**: Modify

**Description**: Add new workflow component exports.

```typescript
/**
 * Quote Components Index
 * 
 * Phase ECOM-11B & ECOM-12: Quote Components
 */

export { QuoteStatusBadge, getStatusBadgeProps } from './quote-status-badge'
export { QuoteTimeline } from './quote-timeline'
export { ProductSelector } from './product-selector'
export type { ProductSelection } from './product-selector'
export { QuoteItemsEditor } from './quote-items-editor'
export { QuoteTable } from './quote-table'
export { QuoteBuilderDialog } from './quote-builder-dialog'
export { QuoteDetailDialog } from './quote-detail-dialog'

// Phase ECOM-12: Workflow components
export { SendQuoteDialog } from './send-quote-dialog'
export { ConvertToOrderDialog } from './convert-to-order-dialog'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Send quote dialog sends and updates status
- [ ] Portal page loads with valid token
- [ ] Portal shows 404 for invalid token
- [ ] Quote view records view count
- [ ] Status updates to "viewed" on first view
- [ ] Customer can accept quote with signature
- [ ] Customer can reject quote with reason
- [ ] Accepted quotes can be converted to orders
- [ ] Order items match quote items
- [ ] Activity logging works correctly
- [ ] Email sends (when configured)
- [ ] PDF generation placeholder works

---

## 🔄 Rollback Plan

If issues occur:

1. **Remove portal route:**
```bash
rm -rf src/app/quote
```

2. **Remove portal components:**
```bash
rm -rf src/modules/ecommerce/components/portal
```

3. **Remove workflow actions:**
```bash
rm src/modules/ecommerce/actions/quote-workflow-actions.ts
rm src/modules/ecommerce/lib/quote-pdf-generator.ts
```

4. **Revert quotes index:**
```bash
git checkout src/modules/ecommerce/components/quotes/index.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:

**activeContext.md:**
```markdown
### Phase ECOM-12 Complete (Date)
- ✅ Quote workflow actions (send, accept, reject, convert)
- ✅ Customer portal at /quote/[token]
- ✅ Quote acceptance with signature
- ✅ Convert to order functionality
- ✅ PDF generator utility (placeholder)
```

**progress.md:**
```markdown
| ECOM-12 | Quote Workflow & Portal | ✅ Complete |
```

---

## ✨ Success Criteria

- [ ] Quotes can be sent via email
- [ ] Portal accessible via unique token
- [ ] Portal shows quote details correctly
- [ ] Customers can accept with signature
- [ ] Customers can reject with reason
- [ ] Accepted quotes convert to orders
- [ ] Orders contain all quote items
- [ ] Activity tracking complete
- [ ] Status transitions validated
- [ ] No TypeScript errors
- [ ] Mobile responsive portal
