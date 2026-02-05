# PHASE-ECOM-11A: Quote Server Actions & Core Logic

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 5-6 hours
> **Prerequisites**: PHASE-ECOM-10 (Database Schema & Types)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create all server actions for quote management including CRUD operations, quote number generation, totals calculation, and activity logging. This phase establishes the backend logic that the UI components (Phase 11B) will consume.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Verify PHASE-ECOM-10 complete (database tables exist)
- [ ] Review existing `order-actions.ts` for patterns
- [ ] Review existing `customer-actions.ts` for patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUOTE ACTIONS ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  quote-actions.ts (~800 lines)                                  │
│  ├── Quote CRUD                                                 │
│  │   ├── createQuote()                                          │
│  │   ├── getQuote() / getQuoteByToken()                        │
│  │   ├── getQuotes()                                            │
│  │   ├── updateQuote()                                          │
│  │   ├── deleteQuote()                                          │
│  │   └── duplicateQuote()                                       │
│  │                                                               │
│  ├── Quote Items                                                │
│  │   ├── addQuoteItem()                                         │
│  │   ├── updateQuoteItem()                                      │
│  │   ├── removeQuoteItem()                                      │
│  │   └── reorderQuoteItems()                                    │
│  │                                                               │
│  ├── Calculations                                               │
│  │   ├── calculateQuoteTotals()                                 │
│  │   └── calculateItemLineTotal()                               │
│  │                                                               │
│  ├── Utilities                                                  │
│  │   ├── generateQuoteNumber()                                  │
│  │   └── logQuoteActivity()                                     │
│  │                                                               │
│  └── Bulk Operations                                            │
│      └── executeQuoteBulkAction()                               │
│                                                                  │
│  lib/quote-utils.ts (~150 lines)                                │
│  ├── formatQuoteNumber()                                        │
│  ├── isQuoteExpired()                                           │
│  ├── canTransitionStatus()                                      │
│  ├── getQuoteStatusConfig()                                     │
│  └── calculateDaysUntilExpiry()                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/actions/quote-actions.ts` | Create | All quote server actions |
| `src/modules/ecommerce/lib/quote-utils.ts` | Create | Pure utility functions |

---

## 📋 Implementation Tasks

### Task 11A.1: Create Quote Utility Functions

**File**: `src/modules/ecommerce/lib/quote-utils.ts`
**Action**: Create

**Description**: Pure utility functions for quote operations (no 'use server' directive - these are client-safe).

```typescript
/**
 * Quote Utility Functions
 * 
 * Phase ECOM-11A: Quote Server Actions & Core Logic
 * 
 * Pure functions for quote calculations and validations
 * These do NOT use 'use server' - they're importable on client
 */

import type { 
  QuoteStatus, 
  QuoteItem, 
  QuoteStatusConfig,
  QuoteDiscountType 
} from '../types/ecommerce-types'

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

/**
 * Quote status display configuration
 */
export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, QuoteStatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Quote is being created or edited',
    allowedTransitions: ['pending_approval', 'sent', 'cancelled']
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Awaiting internal approval before sending',
    allowedTransitions: ['sent', 'draft', 'cancelled']
  },
  sent: {
    label: 'Sent',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Quote has been sent to customer',
    allowedTransitions: ['viewed', 'accepted', 'rejected', 'expired', 'cancelled']
  },
  viewed: {
    label: 'Viewed',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Customer has viewed the quote',
    allowedTransitions: ['accepted', 'rejected', 'expired']
  },
  accepted: {
    label: 'Accepted',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Customer accepted the quote',
    allowedTransitions: ['converted', 'cancelled']
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Customer rejected the quote',
    allowedTransitions: []
  },
  expired: {
    label: 'Expired',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Quote validity period has passed',
    allowedTransitions: []
  },
  converted: {
    label: 'Converted',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    description: 'Quote has been converted to an order',
    allowedTransitions: []
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500 dark:text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Quote was cancelled',
    allowedTransitions: ['draft']
  }
}

/**
 * Get status configuration
 */
export function getQuoteStatusConfig(status: QuoteStatus): QuoteStatusConfig {
  return QUOTE_STATUS_CONFIG[status]
}

/**
 * Get all statuses as array for select dropdowns
 */
export function getQuoteStatusOptions(): Array<{ value: QuoteStatus; label: string }> {
  return Object.entries(QUOTE_STATUS_CONFIG).map(([value, config]) => ({
    value: value as QuoteStatus,
    label: config.label
  }))
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Check if a status transition is valid
 */
export function canTransitionStatus(
  currentStatus: QuoteStatus, 
  newStatus: QuoteStatus
): boolean {
  const config = QUOTE_STATUS_CONFIG[currentStatus]
  return config.allowedTransitions.includes(newStatus)
}

/**
 * Get allowed transitions for a status
 */
export function getAllowedTransitions(status: QuoteStatus): QuoteStatus[] {
  return QUOTE_STATUS_CONFIG[status].allowedTransitions
}

/**
 * Check if quote is in a final state
 */
export function isQuoteFinalState(status: QuoteStatus): boolean {
  return QUOTE_STATUS_CONFIG[status].allowedTransitions.length === 0
}

// ============================================================================
// EXPIRATION UTILITIES
// ============================================================================

/**
 * Check if quote is expired
 */
export function isQuoteExpired(validUntil: string | null | undefined): boolean {
  if (!validUntil) return false
  return new Date(validUntil) < new Date()
}

/**
 * Calculate days until expiry (negative if expired)
 */
export function calculateDaysUntilExpiry(validUntil: string | null | undefined): number | null {
  if (!validUntil) return null
  
  const expiryDate = new Date(validUntil)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiryDate.setHours(0, 0, 0, 0)
  
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Get expiry warning level
 */
export function getExpiryWarningLevel(
  validUntil: string | null | undefined
): 'expired' | 'critical' | 'warning' | 'ok' | null {
  const days = calculateDaysUntilExpiry(validUntil)
  if (days === null) return null
  if (days < 0) return 'expired'
  if (days <= 1) return 'critical'
  if (days <= 3) return 'warning'
  return 'ok'
}

/**
 * Get default expiry date (30 days from now)
 */
export function getDefaultExpiryDate(validityDays: number = 30): Date {
  const date = new Date()
  date.setDate(date.getDate() + validityDays)
  date.setHours(23, 59, 59, 999)
  return date
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format quote number from template
 * Supports: {prefix}, {counter}, {year}, {month}, {day}
 */
export function formatQuoteNumber(
  format: string,
  prefix: string,
  counter: number
): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  
  return format
    .replace('{prefix}', prefix)
    .replace('{counter}', counter.toString().padStart(4, '0'))
    .replace('{year}', year)
    .replace('{month}', month)
    .replace('{day}', day)
}

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate line total for a quote item
 * Formula: (quantity * unit_price) * (1 - discount_percent/100) * (1 + tax_rate/100)
 */
export function calculateItemLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
  taxRate: number = 0,
  includeTaxInTotal: boolean = true
): number {
  const subtotal = quantity * unitPrice
  const discountAmount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discountAmount
  
  if (includeTaxInTotal && taxRate > 0) {
    const taxAmount = afterDiscount * (taxRate / 100)
    return Math.round((afterDiscount + taxAmount) * 100) / 100
  }
  
  return Math.round(afterDiscount * 100) / 100
}

/**
 * Calculate quote totals from items
 */
export function calculateQuoteTotals(
  items: Array<{
    quantity: number
    unit_price: number
    discount_percent?: number
    tax_rate?: number
  }>,
  quoteDiscount: { type?: QuoteDiscountType | null; value?: number } = {},
  shippingAmount: number = 0,
  taxRate: number = 0
): {
  subtotal: number
  itemsDiscountTotal: number
  quoteDiscountAmount: number
  taxAmount: number
  shippingAmount: number
  total: number
} {
  // Calculate subtotal (before any discounts)
  let subtotal = 0
  let itemsDiscountTotal = 0
  
  for (const item of items) {
    const itemSubtotal = item.quantity * item.unit_price
    subtotal += itemSubtotal
    
    if (item.discount_percent) {
      itemsDiscountTotal += itemSubtotal * (item.discount_percent / 100)
    }
  }
  
  const afterItemDiscounts = subtotal - itemsDiscountTotal
  
  // Calculate quote-level discount
  let quoteDiscountAmount = 0
  if (quoteDiscount.type && quoteDiscount.value) {
    if (quoteDiscount.type === 'percentage') {
      quoteDiscountAmount = afterItemDiscounts * (quoteDiscount.value / 100)
    } else {
      quoteDiscountAmount = Math.min(quoteDiscount.value, afterItemDiscounts)
    }
  }
  
  const afterAllDiscounts = afterItemDiscounts - quoteDiscountAmount
  
  // Calculate tax
  const taxAmount = afterAllDiscounts * (taxRate / 100)
  
  // Calculate total
  const total = afterAllDiscounts + taxAmount + shippingAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemsDiscountTotal: Math.round(itemsDiscountTotal * 100) / 100,
    quoteDiscountAmount: Math.round(quoteDiscountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format currency amount for display
 */
export function formatQuoteCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Format currency amount without symbol (for inputs)
 */
export function formatQuoteAmount(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals)
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate quote can be sent
 */
export function canSendQuote(quote: {
  status: QuoteStatus
  customer_email: string
  items?: Array<unknown>
  total: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!['draft', 'pending_approval'].includes(quote.status)) {
    errors.push('Quote must be in draft or pending approval status to send')
  }
  
  if (!quote.customer_email || !isValidEmail(quote.customer_email)) {
    errors.push('Valid customer email is required')
  }
  
  if (!quote.items || quote.items.length === 0) {
    errors.push('Quote must have at least one item')
  }
  
  if (quote.total <= 0) {
    errors.push('Quote total must be greater than zero')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate quote can be converted to order
 */
export function canConvertToOrder(quote: {
  status: QuoteStatus
  items?: Array<unknown>
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (quote.status !== 'accepted') {
    errors.push('Quote must be accepted before converting to order')
  }
  
  if (!quote.items || quote.items.length === 0) {
    errors.push('Quote must have at least one item')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

### Task 11A.2: Create Quote Server Actions

**File**: `src/modules/ecommerce/actions/quote-actions.ts`
**Action**: Create

**Description**: Complete server actions for quote CRUD, items management, and utility operations.

```typescript
/**
 * Quote Server Actions
 * 
 * Phase ECOM-11A: Quote Server Actions & Core Logic
 * 
 * Server actions for managing quotes, items, and calculations
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Quote,
  QuoteItem,
  QuoteInput,
  QuoteUpdate,
  QuoteItemInput,
  QuoteItemUpdate,
  QuoteDetailData,
  QuoteSummary,
  QuoteStatus,
  QuoteActivityType,
  QuoteTableFilters,
  QuoteBulkAction,
  BulkActionResult,
  QuoteSettings
} from '../types/ecommerce-types'
import { formatQuoteNumber, calculateQuoteTotals, calculateItemLineTotal } from '../lib/quote-utils'

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
// QUOTE NUMBER GENERATION
// ============================================================================

/**
 * Generate unique quote number for a site
 */
export async function generateQuoteNumber(siteId: string): Promise<string> {
  const supabase = await getModuleClient()
  
  // Get or create quote settings
  let { data: settings } = await supabase
    .from(`${TABLE_PREFIX}_quote_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()
  
  // If no settings exist, create default
  if (!settings) {
    const { data: site } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', siteId)
      .single()
    
    if (!site) throw new Error('Site not found')
    
    const { data: newSettings, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .insert({
        site_id: siteId,
        agency_id: site.agency_id,
        quote_number_prefix: 'QUO-',
        quote_number_counter: 1000,
        quote_number_format: '{prefix}{counter}'
      })
      .select()
      .single()
    
    if (error) throw error
    settings = newSettings
  }
  
  // Generate quote number
  const quoteNumber = formatQuoteNumber(
    settings.quote_number_format,
    settings.quote_number_prefix,
    settings.quote_number_counter
  )
  
  // Increment counter
  await supabase
    .from(`${TABLE_PREFIX}_quote_settings`)
    .update({ quote_number_counter: settings.quote_number_counter + 1 })
    .eq('id', settings.id)
  
  return quoteNumber
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log quote activity
 */
export async function logQuoteActivity(
  quoteId: string,
  activityType: QuoteActivityType,
  description: string,
  options?: {
    performedBy?: string
    performedByName?: string
    ipAddress?: string
    userAgent?: string
    oldValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const supabase = await getModuleClient()
  
  await supabase
    .from(`${TABLE_PREFIX}_quote_activities`)
    .insert({
      quote_id: quoteId,
      activity_type: activityType,
      description,
      performed_by: options?.performedBy,
      performed_by_name: options?.performedByName,
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
      old_value: options?.oldValue,
      new_value: options?.newValue,
      metadata: options?.metadata || {}
    })
}

// ============================================================================
// QUOTE CRUD
// ============================================================================

/**
 * Create a new quote
 */
export async function createQuote(
  input: QuoteInput,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Generate quote number
    const quoteNumber = await generateQuoteNumber(input.site_id)
    
    // Calculate validity date
    const validFrom = input.valid_from || new Date().toISOString()
    let validUntil = input.valid_until
    
    if (!validUntil) {
      // Get default validity from settings
      const { data: settings } = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .select('default_validity_days')
        .eq('site_id', input.site_id)
        .single()
      
      const validityDays = settings?.default_validity_days || 30
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + validityDays)
      expiryDate.setHours(23, 59, 59, 999)
      validUntil = expiryDate.toISOString()
    }
    
    // Create quote
    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .insert({
        site_id: input.site_id,
        agency_id: input.agency_id,
        quote_number: quoteNumber,
        reference_number: input.reference_number,
        customer_id: input.customer_id,
        customer_email: input.customer_email,
        customer_name: input.customer_name,
        customer_company: input.customer_company,
        customer_phone: input.customer_phone,
        billing_address: input.billing_address,
        shipping_address: input.shipping_address,
        status: 'draft',
        subtotal: 0,
        discount_type: input.discount_type,
        discount_value: input.discount_value || 0,
        discount_amount: 0,
        tax_rate: input.tax_rate || 0,
        tax_amount: 0,
        shipping_amount: input.shipping_amount || 0,
        total: 0,
        currency: input.currency || 'USD',
        valid_from: validFrom,
        valid_until: validUntil,
        title: input.title,
        introduction: input.introduction,
        terms_and_conditions: input.terms_and_conditions,
        notes_to_customer: input.notes_to_customer,
        internal_notes: input.internal_notes,
        template_id: input.template_id,
        created_by: userId,
        last_modified_by: userId,
        metadata: input.metadata || {}
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Log activity
    await logQuoteActivity(
      quote.id,
      'created',
      `Quote ${quoteNumber} created`,
      {
        performedBy: userId,
        performedByName: userName
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, quote }
  } catch (error) {
    console.error('Error creating quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create quote' 
    }
  }
}

/**
 * Get a single quote with all details
 */
export async function getQuote(
  siteId: string,
  quoteId: string
): Promise<QuoteDetailData | null> {
  const supabase = await getModuleClient()
  
  // Get quote
  const { data: quote, error: quoteError } = await supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('*')
    .eq('id', quoteId)
    .eq('site_id', siteId)
    .single()
  
  if (quoteError || !quote) return null
  
  // Get items
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_quote_items`)
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })
  
  // Get activities
  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_quote_activities`)
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false })
  
  // Get customer if linked
  let customer = null
  if (quote.customer_id) {
    const { data: customerData } = await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .select('*')
      .eq('id', quote.customer_id)
      .single()
    
    customer = customerData
  }
  
  return {
    ...quote,
    items: items || [],
    activities: activities || [],
    customer
  }
}

/**
 * Get quote by access token (for customer portal)
 */
export async function getQuoteByToken(
  token: string
): Promise<QuoteDetailData | null> {
  const supabase = await getModuleClient()
  
  // Get quote by token
  const { data: quote, error: quoteError } = await supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('*')
    .eq('access_token', token)
    .single()
  
  if (quoteError || !quote) return null
  
  // Get items
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_quote_items`)
    .select('*')
    .eq('quote_id', quote.id)
    .order('sort_order', { ascending: true })
  
  // Get activities (limited for customer view)
  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_quote_activities`)
    .select('*')
    .eq('quote_id', quote.id)
    .in('activity_type', ['created', 'sent', 'viewed', 'accepted', 'rejected', 'expired'])
    .order('created_at', { ascending: false })
    .limit(10)
  
  return {
    ...quote,
    items: items || [],
    activities: activities || [],
    customer: null
  }
}

/**
 * Get quotes list with filters
 */
export async function getQuotes(
  siteId: string,
  filters?: Partial<QuoteTableFilters>,
  page: number = 1,
  pageSize: number = 20
): Promise<{ quotes: QuoteSummary[]; total: number }> {
  const supabase = await getModuleClient()
  
  // Build query
  let query = supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('*, items:mod_ecommod01_quote_items(count)', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `quote_number.ilike.${searchTerm},customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},customer_company.ilike.${searchTerm}`
    )
  }
  
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }
  
  if (filters?.expiresFrom) {
    query = query.gte('valid_until', filters.expiresFrom)
  }
  
  if (filters?.expiresTo) {
    query = query.lte('valid_until', filters.expiresTo)
  }
  
  if (filters?.minTotal !== null && filters?.minTotal !== undefined) {
    query = query.gte('total', filters.minTotal)
  }
  
  if (filters?.maxTotal !== null && filters?.maxTotal !== undefined) {
    query = query.lte('total', filters.maxTotal)
  }
  
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }
  
  // Check for expired quotes filter
  if (filters?.hasExpired === true) {
    query = query.lt('valid_until', new Date().toISOString())
  } else if (filters?.hasExpired === false) {
    query = query.or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
  }
  
  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching quotes:', error)
    return { quotes: [], total: 0 }
  }
  
  // Transform to QuoteSummary
  const quotes: QuoteSummary[] = (data || []).map(q => ({
    id: q.id,
    quote_number: q.quote_number,
    customer_name: q.customer_name,
    customer_company: q.customer_company,
    customer_email: q.customer_email,
    status: q.status,
    total: q.total,
    currency: q.currency,
    valid_until: q.valid_until,
    items_count: q.items?.[0]?.count || 0,
    created_at: q.created_at,
    updated_at: q.updated_at
  }))
  
  return { quotes, total: count || 0 }
}

/**
 * Update a quote
 */
export async function updateQuote(
  siteId: string,
  quoteId: string,
  updates: QuoteUpdate,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get current quote for comparison
    const { data: currentQuote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!currentQuote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Update quote
    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        ...updates,
        last_modified_by: userId
      })
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .select()
      .single()
    
    if (error) throw error
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'updated',
      `Quote ${quote.quote_number} updated`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: currentQuote,
        newValue: quote
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, quote }
  } catch (error) {
    console.error('Error updating quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update quote' 
    }
  }
}

/**
 * Delete a quote
 */
export async function deleteQuote(
  siteId: string,
  quoteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .delete()
      .eq('id', quoteId)
      .eq('site_id', siteId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete quote' 
    }
  }
}

/**
 * Duplicate a quote
 */
export async function duplicateQuote(
  siteId: string,
  quoteId: string,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get original quote with items
    const original = await getQuote(siteId, quoteId)
    if (!original) {
      return { success: false, error: 'Original quote not found' }
    }
    
    // Generate new quote number
    const quoteNumber = await generateQuoteNumber(siteId)
    
    // Calculate new validity
    const { data: settings } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('default_validity_days')
      .eq('site_id', siteId)
      .single()
    
    const validityDays = settings?.default_validity_days || 30
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validityDays)
    validUntil.setHours(23, 59, 59, 999)
    
    // Create new quote
    const { data: newQuote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .insert({
        site_id: original.site_id,
        agency_id: original.agency_id,
        quote_number: quoteNumber,
        reference_number: null,
        customer_id: original.customer_id,
        customer_email: original.customer_email,
        customer_name: original.customer_name,
        customer_company: original.customer_company,
        customer_phone: original.customer_phone,
        billing_address: original.billing_address,
        shipping_address: original.shipping_address,
        status: 'draft',
        subtotal: original.subtotal,
        discount_type: original.discount_type,
        discount_value: original.discount_value,
        discount_amount: original.discount_amount,
        tax_rate: original.tax_rate,
        tax_amount: original.tax_amount,
        shipping_amount: original.shipping_amount,
        total: original.total,
        currency: original.currency,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        title: original.title,
        introduction: original.introduction,
        terms_and_conditions: original.terms_and_conditions,
        notes_to_customer: original.notes_to_customer,
        internal_notes: `Duplicated from ${original.quote_number}`,
        template_id: original.template_id,
        created_by: userId,
        last_modified_by: userId,
        metadata: { ...original.metadata, duplicated_from: original.id }
      })
      .select()
      .single()
    
    if (quoteError) throw quoteError
    
    // Copy items
    if (original.items && original.items.length > 0) {
      const newItems = original.items.map((item, index) => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        tax_rate: item.tax_rate,
        line_total: item.line_total,
        options: item.options,
        sort_order: index
      }))
      
      await supabase
        .from(`${TABLE_PREFIX}_quote_items`)
        .insert(newItems)
    }
    
    // Log activity on original
    await logQuoteActivity(
      quoteId,
      'duplicated',
      `Quote duplicated as ${quoteNumber}`,
      {
        performedBy: userId,
        performedByName: userName,
        metadata: { new_quote_id: newQuote.id }
      }
    )
    
    // Log activity on new
    await logQuoteActivity(
      newQuote.id,
      'created',
      `Quote ${quoteNumber} created (duplicated from ${original.quote_number})`,
      {
        performedBy: userId,
        performedByName: userName,
        metadata: { duplicated_from: quoteId }
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, quote: newQuote }
  } catch (error) {
    console.error('Error duplicating quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate quote' 
    }
  }
}

// ============================================================================
// QUOTE ITEMS
// ============================================================================

/**
 * Add item to quote
 */
export async function addQuoteItem(
  siteId: string,
  input: QuoteItemInput,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; item?: QuoteItem; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id, quote_number')
      .eq('id', input.quote_id)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Calculate line total
    const lineTotal = calculateItemLineTotal(
      input.quantity,
      input.unit_price,
      input.discount_percent || 0,
      input.tax_rate || 0
    )
    
    // Get max sort order
    const { data: maxOrderResult } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('sort_order')
      .eq('quote_id', input.quote_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    
    const sortOrder = input.sort_order ?? ((maxOrderResult?.sort_order || 0) + 1)
    
    // Insert item
    const { data: item, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .insert({
        quote_id: input.quote_id,
        product_id: input.product_id,
        variant_id: input.variant_id,
        name: input.name,
        sku: input.sku,
        description: input.description,
        image_url: input.image_url,
        quantity: input.quantity,
        unit_price: input.unit_price,
        discount_percent: input.discount_percent || 0,
        tax_rate: input.tax_rate || 0,
        line_total: lineTotal,
        options: input.options || {},
        sort_order: sortOrder
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate quote totals
    await recalculateQuoteTotals(siteId, input.quote_id)
    
    // Log activity
    await logQuoteActivity(
      input.quote_id,
      'item_added',
      `Added item: ${input.name}`,
      {
        performedBy: userId,
        performedByName: userName,
        newValue: { item_id: item.id, name: input.name, quantity: input.quantity }
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, item }
  } catch (error) {
    console.error('Error adding quote item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add item' 
    }
  }
}

/**
 * Update a quote item
 */
export async function updateQuoteItem(
  siteId: string,
  quoteId: string,
  itemId: string,
  updates: QuoteItemUpdate,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; item?: QuoteItem; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Get current item
    const { data: currentItem } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('*')
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .single()
    
    if (!currentItem) {
      return { success: false, error: 'Item not found' }
    }
    
    // Calculate new line total if quantity or price changed
    const quantity = updates.quantity ?? currentItem.quantity
    const unitPrice = updates.unit_price ?? currentItem.unit_price
    const discountPercent = updates.discount_percent ?? currentItem.discount_percent
    const taxRate = updates.tax_rate ?? currentItem.tax_rate
    
    const lineTotal = calculateItemLineTotal(quantity, unitPrice, discountPercent, taxRate)
    
    // Update item
    const { data: item, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .update({
        ...updates,
        line_total: lineTotal
      })
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate quote totals
    await recalculateQuoteTotals(siteId, quoteId)
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'item_updated',
      `Updated item: ${item.name}`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: currentItem,
        newValue: item
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, item }
  } catch (error) {
    console.error('Error updating quote item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update item' 
    }
  }
}

/**
 * Remove item from quote
 */
export async function removeQuoteItem(
  siteId: string,
  quoteId: string,
  itemId: string,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Get item for logging
    const { data: item } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('*')
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .single()
    
    if (!item) {
      return { success: false, error: 'Item not found' }
    }
    
    // Delete item
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .delete()
      .eq('id', itemId)
      .eq('quote_id', quoteId)
    
    if (error) throw error
    
    // Recalculate quote totals
    await recalculateQuoteTotals(siteId, quoteId)
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'item_removed',
      `Removed item: ${item.name}`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: item
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error removing quote item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove item' 
    }
  }
}

/**
 * Reorder quote items
 */
export async function reorderQuoteItems(
  siteId: string,
  quoteId: string,
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Update sort order for each item
    const updates = itemIds.map((id, index) => ({
      id,
      sort_order: index
    }))
    
    for (const update of updates) {
      await supabase
        .from(`${TABLE_PREFIX}_quote_items`)
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('quote_id', quoteId)
    }
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error reordering quote items:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder items' 
    }
  }
}

// ============================================================================
// QUOTE TOTALS
// ============================================================================

/**
 * Recalculate and update quote totals
 */
export async function recalculateQuoteTotals(
  siteId: string,
  quoteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get quote
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Get all items
    const { data: items } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('*')
      .eq('quote_id', quoteId)
    
    // Calculate totals
    const totals = calculateQuoteTotals(
      items || [],
      { type: quote.discount_type, value: quote.discount_value },
      quote.shipping_amount,
      quote.tax_rate
    )
    
    // Update quote
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        subtotal: totals.subtotal,
        discount_amount: totals.quoteDiscountAmount,
        tax_amount: totals.taxAmount,
        total: totals.total
      })
      .eq('id', quoteId)
      .eq('site_id', siteId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error recalculating quote totals:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to recalculate totals' 
    }
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Execute bulk action on quotes
 */
export async function executeQuoteBulkAction(
  siteId: string,
  action: QuoteBulkAction,
  userId?: string,
  userName?: string
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  
  const results: BulkActionResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: []
  }
  
  for (const quoteId of action.quoteIds) {
    try {
      switch (action.action) {
        case 'delete':
          const deleteResult = await deleteQuote(siteId, quoteId)
          if (!deleteResult.success) {
            results.failed++
            results.errors.push({ id: quoteId, error: deleteResult.error || 'Delete failed' })
          } else {
            results.processed++
          }
          break
          
        case 'mark_expired':
          const { error: expireError } = await supabase
            .from(`${TABLE_PREFIX}_quotes`)
            .update({ status: 'expired' })
            .eq('id', quoteId)
            .eq('site_id', siteId)
          
          if (expireError) {
            results.failed++
            results.errors.push({ id: quoteId, error: expireError.message })
          } else {
            await logQuoteActivity(quoteId, 'expired', 'Quote marked as expired (bulk action)', {
              performedBy: userId,
              performedByName: userName
            })
            results.processed++
          }
          break
          
        case 'duplicate':
          const dupResult = await duplicateQuote(siteId, quoteId, userId, userName)
          if (!dupResult.success) {
            results.failed++
            results.errors.push({ id: quoteId, error: dupResult.error || 'Duplicate failed' })
          } else {
            results.processed++
          }
          break
          
        default:
          results.failed++
          results.errors.push({ id: quoteId, error: `Unknown action: ${action.action}` })
      }
    } catch (error) {
      results.failed++
      results.errors.push({ 
        id: quoteId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }
  
  results.success = results.failed === 0
  
  revalidatePath('/ecommerce')
  
  return results
}

// ============================================================================
// QUOTE SETTINGS
// ============================================================================

/**
 * Get quote settings for a site
 */
export async function getQuoteSettings(
  siteId: string
): Promise<QuoteSettings | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_quote_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quote settings:', error)
  }
  
  return data
}

/**
 * Update quote settings
 */
export async function updateQuoteSettings(
  siteId: string,
  agencyId: string,
  updates: Partial<QuoteSettings>
): Promise<{ success: boolean; settings?: QuoteSettings; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Check if settings exist
    const { data: existing } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('id')
      .eq('site_id', siteId)
      .single()
    
    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .update(updates)
        .eq('site_id', siteId)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .insert({
          site_id: siteId,
          agency_id: agencyId,
          ...updates
        })
        .select()
        .single()
    }
    
    if (result.error) throw result.error
    
    revalidatePath('/ecommerce')
    
    return { success: true, settings: result.data }
  } catch (error) {
    console.error('Error updating quote settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update settings' 
    }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get quote statistics for dashboard
 */
export async function getQuoteStats(siteId: string): Promise<{
  total: number
  draft: number
  pending: number
  sent: number
  viewed: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  totalValue: number
  acceptedValue: number
  conversionRate: number
}> {
  const supabase = await getModuleClient()
  
  const { data: quotes } = await supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('status, total')
    .eq('site_id', siteId)
  
  if (!quotes || quotes.length === 0) {
    return {
      total: 0,
      draft: 0,
      pending: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      totalValue: 0,
      acceptedValue: 0,
      conversionRate: 0
    }
  }
  
  const stats = {
    total: quotes.length,
    draft: 0,
    pending: 0,
    sent: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    totalValue: 0,
    acceptedValue: 0,
    conversionRate: 0
  }
  
  for (const quote of quotes) {
    stats.totalValue += Number(quote.total) || 0
    
    switch (quote.status) {
      case 'draft': stats.draft++; break
      case 'pending_approval': stats.pending++; break
      case 'sent': stats.sent++; break
      case 'viewed': stats.viewed++; break
      case 'accepted': 
        stats.accepted++
        stats.acceptedValue += Number(quote.total) || 0
        break
      case 'rejected': stats.rejected++; break
      case 'expired': stats.expired++; break
      case 'converted': 
        stats.converted++
        stats.acceptedValue += Number(quote.total) || 0
        break
    }
  }
  
  // Calculate conversion rate (accepted + converted) / (sent + viewed + accepted + rejected + expired + converted)
  const responded = stats.sent + stats.viewed + stats.accepted + stats.rejected + stats.expired + stats.converted
  stats.conversionRate = responded > 0 
    ? Math.round(((stats.accepted + stats.converted) / responded) * 100) 
    : 0
  
  return stats
}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Test `generateQuoteNumber()` generates unique incrementing numbers
- [ ] Test `createQuote()` creates quote with auto-generated number
- [ ] Test `getQuote()` returns quote with items and activities
- [ ] Test `updateQuote()` updates and logs activity
- [ ] Test `deleteQuote()` removes quote and cascades to items
- [ ] Test `duplicateQuote()` creates copy with new number
- [ ] Test `addQuoteItem()` adds item and recalculates totals
- [ ] Test `updateQuoteItem()` updates item and recalculates totals
- [ ] Test `removeQuoteItem()` removes item and recalculates totals
- [ ] Test `getQuotes()` with various filters
- [ ] Test `getQuoteStats()` returns correct counts
- [ ] Verify `calculateQuoteTotals()` math is correct
- [ ] Verify `calculateItemLineTotal()` math is correct

**Manual Testing Commands:**
```typescript
// In a server component or API route:
import { createQuote, getQuote, addQuoteItem } from '@/modules/ecommerce/actions/quote-actions'

// Test create
const result = await createQuote({
  site_id: 'your-site-id',
  agency_id: 'your-agency-id',
  customer_email: 'test@example.com',
  customer_name: 'Test Customer'
}, 'user-id', 'User Name')

console.log(result)

// Test add item
const itemResult = await addQuoteItem('your-site-id', {
  quote_id: result.quote.id,
  name: 'Test Product',
  quantity: 2,
  unit_price: 99.99
})

// Test get
const quote = await getQuote('your-site-id', result.quote.id)
console.log(quote)
```

---

## 🔄 Rollback Plan

If issues occur:

1. **Remove quote-actions.ts:**
```bash
rm src/modules/ecommerce/actions/quote-actions.ts
```

2. **Remove quote-utils.ts:**
```bash
rm src/modules/ecommerce/lib/quote-utils.ts
```

3. **Verify Clean State:**
```bash
npx tsc --noEmit
```

---

## 📝 Memory Bank Updates

After completion, update these files:

**activeContext.md:**
```markdown
### Phase ECOM-11A Complete (Date)
- ✅ Created quote-actions.ts (~800 lines, 20+ server actions)
- ✅ Created quote-utils.ts (~150 lines, utility functions)
- ✅ Quote CRUD operations working
- ✅ Item management with auto-recalculation
- ✅ Activity logging for all operations
```

**progress.md:**
```markdown
| ECOM-11A | Quote Server Actions & Core Logic | ✅ Complete |
```

---

## ✨ Success Criteria

- [ ] All server actions compile without errors
- [ ] Utility functions work correctly (client-importable)
- [ ] Quote numbers increment correctly
- [ ] Totals calculate correctly with discounts and tax
- [ ] Activity logging captures all operations
- [ ] Bulk operations process all selected quotes
- [ ] Filters work correctly in `getQuotes()`
- [ ] No `any` types except for Supabase client workaround
- [ ] All functions follow existing patterns from `order-actions.ts`
- [ ] `revalidatePath` called appropriately for cache invalidation
