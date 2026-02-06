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
  currency: string = 'ZMW',  // ZAMBIAN KWACHA DEFAULT
  locale: string = 'en-ZM',   // Zambia locale
  isAlreadyInDollars: boolean = true // Quote amounts are stored in main currency unit
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

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * Get quote portal URL for customer access
 */
export function getQuotePortalUrl(accessToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/quote/${accessToken}`
}
