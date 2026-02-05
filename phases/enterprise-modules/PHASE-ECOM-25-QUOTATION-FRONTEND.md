# PHASE-ECOM-25: Quotation Frontend Components

> **Priority**: 🟡 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-14 (Quotation System Backend), PHASE-ECOM-20 (Core Hooks)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create frontend components for the quotation/RFQ (Request for Quote) system. These components allow customers to request quotes for products, view quote history, and interact with the quotation workflow established in Wave 2.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-14 quotation backend is complete
- [ ] PHASE-ECOM-20 hooks are implemented
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review quotation database schema
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Quotation Frontend Components
├── QuoteRequestBlock         → Request quote form (Studio)
├── QuoteListBlock            → User's quote history (Studio)
├── QuoteDetailBlock          → Single quote view (Studio)
├── QuoteBuilderBlock         → Multi-product quote builder (Studio)
├── QuoteItemCard             → Quote line item display
├── QuoteStatusBadge          → Quote status indicator
├── QuotePriceBreakdown       → Quote pricing details
└── QuoteActionButtons        → Accept/decline/counter actions

Quote Flow
[Browse] → [Add to Quote] → [Submit RFQ] → [Receive Quote] → [Accept/Counter]
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `modules/ecommerce/hooks/useQuotations.ts` | Create | Quotation data hook |
| `studio/blocks/ecommerce/quote-request-block.tsx` | Create | Quote request form |
| `studio/blocks/ecommerce/quote-list-block.tsx` | Create | Quote history list |
| `studio/blocks/ecommerce/quote-detail-block.tsx` | Create | Single quote view |
| `studio/blocks/ecommerce/quote-builder-block.tsx` | Create | Multi-product builder |
| `studio/components/ecommerce/QuoteItemCard.tsx` | Create | Quote item display |
| `studio/components/ecommerce/QuoteStatusBadge.tsx` | Create | Status badge |
| `studio/components/ecommerce/QuotePriceBreakdown.tsx` | Create | Pricing breakdown |
| `studio/components/ecommerce/QuoteActionButtons.tsx` | Create | Action buttons |
| `modules/ecommerce/actions/quotation-actions.ts` | Create | Server actions |
| `studio/blocks/ecommerce/index.ts` | Modify | Export quotation blocks |

---

## 📋 Implementation Tasks

### Task 25.1: Create Quotation Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end)

**Description**: Add quotation-specific types

```typescript
// ============================================================================
// QUOTATION TYPES (Phase ECOM-25)
// ============================================================================

export type QuoteStatus = 
  | 'draft'
  | 'submitted' 
  | 'reviewing'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'countered'

export interface QuoteItem {
  id: string
  quote_id: string
  product_id: string
  variant_id?: string
  quantity: number
  requested_price?: number
  quoted_price?: number
  notes?: string
  // Joined data
  product?: Product
  product_name?: string
  product_image?: string
  variant_name?: string
}

export interface Quote {
  id: string
  site_id: string
  user_id?: string
  quote_number: string
  status: QuoteStatus
  
  // Contact info (for guest quotes)
  customer_name?: string
  customer_email: string
  customer_phone?: string
  company_name?: string
  
  // Addresses
  shipping_address?: ShippingAddress
  billing_address?: BillingAddress
  
  // Pricing
  subtotal?: number
  discount_total?: number
  tax_total?: number
  shipping_cost?: number
  grand_total?: number
  
  // Terms
  valid_until?: string
  payment_terms?: string
  delivery_terms?: string
  
  // Notes
  customer_notes?: string
  internal_notes?: string
  admin_notes?: string
  
  // Items
  items?: QuoteItem[]
  
  // Metadata
  created_at: string
  updated_at: string
  submitted_at?: string
  quoted_at?: string
  expires_at?: string
}

export interface QuoteRequestInput {
  site_id: string
  user_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  company_name?: string
  customer_notes?: string
  items: Array<{
    product_id: string
    variant_id?: string
    quantity: number
    requested_price?: number
    notes?: string
  }>
}

export interface QuoteCounterInput {
  quote_id: string
  items: Array<{
    item_id: string
    quantity?: number
    counter_price?: number
  }>
  notes?: string
}
```

---

### Task 25.2: Create Quotation Actions

**File**: `src/modules/ecommerce/actions/quotation-actions.ts`
**Action**: Create

**Description**: Server actions for quotation operations

```typescript
/**
 * Quotation Server Actions
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Server actions for quotation CRUD operations.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Quote, QuoteItem, QuoteRequestInput, QuoteStatus } from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01_'

// ============================================================================
// CREATE QUOTE
// ============================================================================

export async function createQuoteRequest(input: QuoteRequestInput): Promise<Quote> {
  const supabase = await createClient()

  // Generate quote number
  const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}`

  // Create quote
  const { data: quote, error: quoteError } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .insert({
      site_id: input.site_id,
      user_id: input.user_id,
      quote_number: quoteNumber,
      status: 'submitted',
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      company_name: input.company_name,
      customer_notes: input.customer_notes,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (quoteError || !quote) {
    throw new Error(quoteError?.message || 'Failed to create quote')
  }

  // Create quote items
  if (input.items.length > 0) {
    const itemsToInsert = input.items.map(item => ({
      quote_id: quote.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      requested_price: item.requested_price,
      notes: item.notes
    }))

    const { error: itemsError } = await supabase
      .from(`${TABLE_PREFIX}quote_items`)
      .insert(itemsToInsert)

    if (itemsError) {
      // Cleanup quote if items failed
      await supabase.from(`${TABLE_PREFIX}quotes`).delete().eq('id', quote.id)
      throw new Error(itemsError.message)
    }
  }

  revalidatePath('/account/quotes')
  return quote as Quote
}

// ============================================================================
// GET QUOTES
// ============================================================================

export async function getQuotes(
  siteId: string,
  userId?: string,
  status?: QuoteStatus[]
): Promise<Quote[]> {
  const supabase = await createClient()

  let query = supabase
    .from(`${TABLE_PREFIX}quotes`)
    .select(`
      *,
      items:${TABLE_PREFIX}quote_items(
        *,
        product:${TABLE_PREFIX}products(id, name, slug, primary_image)
      )
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (status && status.length > 0) {
    query = query.in('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Quote[]
}

// ============================================================================
// GET SINGLE QUOTE
// ============================================================================

export async function getQuote(quoteId: string): Promise<Quote | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .select(`
      *,
      items:${TABLE_PREFIX}quote_items(
        *,
        product:${TABLE_PREFIX}products(id, name, slug, primary_image, price, sale_price)
      )
    `)
    .eq('id', quoteId)
    .single()

  if (error) {
    return null
  }

  return data as Quote
}

// ============================================================================
// GET QUOTE BY NUMBER
// ============================================================================

export async function getQuoteByNumber(quoteNumber: string): Promise<Quote | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .select(`
      *,
      items:${TABLE_PREFIX}quote_items(
        *,
        product:${TABLE_PREFIX}products(id, name, slug, primary_image, price, sale_price)
      )
    `)
    .eq('quote_number', quoteNumber)
    .single()

  if (error) {
    return null
  }

  return data as Quote
}

// ============================================================================
// ACCEPT QUOTE
// ============================================================================

export async function acceptQuote(quoteId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .update({ 
      status: 'accepted',
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .eq('status', 'quoted') // Can only accept quoted quotes

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/account/quotes')
  return { success: true }
}

// ============================================================================
// REJECT QUOTE
// ============================================================================

export async function rejectQuote(
  quoteId: string, 
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .update({ 
      status: 'rejected',
      customer_notes: reason ? `Rejection reason: ${reason}` : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .in('status', ['quoted', 'submitted'])

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/account/quotes')
  return { success: true }
}

// ============================================================================
// COUNTER QUOTE
// ============================================================================

export async function counterQuote(
  quoteId: string,
  counterItems: Array<{ item_id: string; quantity?: number; counter_price?: number }>,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Update quote status
  const { error: quoteError } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .update({ 
      status: 'countered',
      customer_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .eq('status', 'quoted')

  if (quoteError) {
    return { success: false, error: quoteError.message }
  }

  // Update counter items
  for (const item of counterItems) {
    const updates: Record<string, unknown> = {}
    if (item.quantity !== undefined) updates.quantity = item.quantity
    if (item.counter_price !== undefined) updates.counter_price = item.counter_price

    if (Object.keys(updates).length > 0) {
      await supabase
        .from(`${TABLE_PREFIX}quote_items`)
        .update(updates)
        .eq('id', item.item_id)
    }
  }

  revalidatePath('/account/quotes')
  return { success: true }
}

// ============================================================================
// CANCEL QUOTE
// ============================================================================

export async function cancelQuote(quoteId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .update({ 
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .eq('status', 'submitted')

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/account/quotes')
  return { success: true }
}

// ============================================================================
// CONVERT QUOTE TO ORDER
// ============================================================================

export async function convertQuoteToOrder(quoteId: string): Promise<{ 
  success: boolean
  orderId?: string
  error?: string 
}> {
  const supabase = await createClient()

  // Get the quote
  const quote = await getQuote(quoteId)
  if (!quote) {
    return { success: false, error: 'Quote not found' }
  }

  if (quote.status !== 'accepted') {
    return { success: false, error: 'Quote must be accepted before converting to order' }
  }

  // Create order from quote
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`

  const { data: order, error: orderError } = await supabase
    .from(`${TABLE_PREFIX}orders`)
    .insert({
      site_id: quote.site_id,
      user_id: quote.user_id,
      order_number: orderNumber,
      email: quote.customer_email,
      phone: quote.customer_phone,
      status: 'pending',
      shipping_address: quote.shipping_address,
      billing_address: quote.billing_address,
      subtotal: quote.subtotal,
      discount_total: quote.discount_total,
      tax_total: quote.tax_total,
      shipping_cost: quote.shipping_cost,
      grand_total: quote.grand_total,
      payment_terms: quote.payment_terms,
      notes: `Created from quote ${quote.quote_number}`,
      quote_id: quote.id
    })
    .select()
    .single()

  if (orderError || !order) {
    return { success: false, error: orderError?.message || 'Failed to create order' }
  }

  // Create order items from quote items
  if (quote.items && quote.items.length > 0) {
    const orderItems = quote.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name || item.product?.name,
      product_image: item.product_image || item.product?.primary_image,
      variant_name: item.variant_name,
      quantity: item.quantity,
      unit_price: item.quoted_price || item.product?.price || 0,
      line_total: (item.quoted_price || item.product?.price || 0) * item.quantity
    }))

    await supabase.from(`${TABLE_PREFIX}order_items`).insert(orderItems)
  }

  // Update quote status
  await supabase
    .from(`${TABLE_PREFIX}quotes`)
    .update({ 
      status: 'accepted',
      internal_notes: `Converted to order ${orderNumber}`
    })
    .eq('id', quoteId)

  revalidatePath('/account/quotes')
  revalidatePath('/account/orders')

  return { success: true, orderId: order.id }
}
```

---

### Task 25.3: Create useQuotations Hook

**File**: `src/modules/ecommerce/hooks/useQuotations.ts`
**Action**: Create

**Description**: Hook for managing quotations

```typescript
/**
 * useQuotations - Quotation management hook
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Manages quote requests, history, and actions.
 */
'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createQuoteRequest,
  getQuotes,
  getQuote,
  acceptQuote,
  rejectQuote,
  counterQuote,
  cancelQuote,
  convertQuoteToOrder
} from '../actions/quotation-actions'
import type { Quote, QuoteRequestInput, QuoteStatus } from '../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteBuilderItem {
  product_id: string
  variant_id?: string
  quantity: number
  requested_price?: number
  notes?: string
  // For display
  product_name: string
  product_image?: string
  variant_name?: string
  list_price: number
}

export interface UseQuotationsResult {
  // Quotes list
  quotes: Quote[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  
  // Single quote
  quote: Quote | null
  isLoadingQuote: boolean
  loadQuote: (quoteId: string) => void
  
  // Quote builder
  builderItems: QuoteBuilderItem[]
  addToBuilder: (item: QuoteBuilderItem) => void
  updateBuilderItem: (productId: string, updates: Partial<QuoteBuilderItem>) => void
  removeFromBuilder: (productId: string) => void
  clearBuilder: () => void
  builderCount: number
  
  // Actions
  submitQuoteRequest: (input: Omit<QuoteRequestInput, 'items'>) => Promise<Quote>
  acceptQuote: (quoteId: string) => Promise<boolean>
  rejectQuote: (quoteId: string, reason?: string) => Promise<boolean>
  counterQuote: (quoteId: string, items: any[], notes?: string) => Promise<boolean>
  cancelQuote: (quoteId: string) => Promise<boolean>
  convertToOrder: (quoteId: string) => Promise<{ success: boolean; orderId?: string }>
  
  // State
  isSubmitting: boolean
  submitError: string | null
}

// ============================================================================
// HOOK
// ============================================================================

export function useQuotations(
  siteId: string,
  userId?: string,
  statusFilter?: QuoteStatus[]
): UseQuotationsResult {
  const queryClient = useQueryClient()
  
  const [builderItems, setBuilderItems] = useState<QuoteBuilderItem[]>([])
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch quotes list
  const {
    data: quotes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['quotes', siteId, userId, statusFilter],
    queryFn: () => getQuotes(siteId, userId, statusFilter),
    enabled: !!siteId
  })

  // Load single quote
  const loadQuote = useCallback(async (quoteId: string) => {
    setIsLoadingQuote(true)
    try {
      const quote = await getQuote(quoteId)
      setCurrentQuote(quote)
    } finally {
      setIsLoadingQuote(false)
    }
  }, [])

  // Builder actions
  const addToBuilder = useCallback((item: QuoteBuilderItem) => {
    setBuilderItems(prev => {
      const existing = prev.find(i => 
        i.product_id === item.product_id && 
        i.variant_id === item.variant_id
      )
      if (existing) {
        return prev.map(i => 
          i.product_id === item.product_id && i.variant_id === item.variant_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const updateBuilderItem = useCallback((productId: string, updates: Partial<QuoteBuilderItem>) => {
    setBuilderItems(prev => 
      prev.map(item => 
        item.product_id === productId ? { ...item, ...updates } : item
      )
    )
  }, [])

  const removeFromBuilder = useCallback((productId: string) => {
    setBuilderItems(prev => prev.filter(item => item.product_id !== productId))
  }, [])

  const clearBuilder = useCallback(() => {
    setBuilderItems([])
  }, [])

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: createQuoteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      clearBuilder()
    }
  })

  // Submit quote request
  const submitQuoteRequest = useCallback(async (
    input: Omit<QuoteRequestInput, 'items'>
  ): Promise<Quote> => {
    setSubmitError(null)
    
    if (builderItems.length === 0) {
      throw new Error('No items in quote builder')
    }

    try {
      const result = await submitMutation.mutateAsync({
        ...input,
        items: builderItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          requested_price: item.requested_price,
          notes: item.notes
        }))
      })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit quote'
      setSubmitError(message)
      throw err
    }
  }, [builderItems, submitMutation])

  // Accept quote
  const handleAcceptQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    const result = await acceptQuote(quoteId)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      if (currentQuote?.id === quoteId) {
        loadQuote(quoteId)
      }
    }
    return result.success
  }, [queryClient, currentQuote, loadQuote])

  // Reject quote
  const handleRejectQuote = useCallback(async (quoteId: string, reason?: string): Promise<boolean> => {
    const result = await rejectQuote(quoteId, reason)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    }
    return result.success
  }, [queryClient])

  // Counter quote
  const handleCounterQuote = useCallback(async (
    quoteId: string, 
    items: any[], 
    notes?: string
  ): Promise<boolean> => {
    const result = await counterQuote(quoteId, items, notes)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    }
    return result.success
  }, [queryClient])

  // Cancel quote
  const handleCancelQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    const result = await cancelQuote(quoteId)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    }
    return result.success
  }, [queryClient])

  // Convert to order
  const handleConvertToOrder = useCallback(async (quoteId: string) => {
    const result = await convertQuoteToOrder(quoteId)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
    return result
  }, [queryClient])

  return {
    quotes,
    isLoading,
    error: error as Error | null,
    refetch,
    quote: currentQuote,
    isLoadingQuote,
    loadQuote,
    builderItems,
    addToBuilder,
    updateBuilderItem,
    removeFromBuilder,
    clearBuilder,
    builderCount: builderItems.reduce((sum, item) => sum + item.quantity, 0),
    submitQuoteRequest,
    acceptQuote: handleAcceptQuote,
    rejectQuote: handleRejectQuote,
    counterQuote: handleCounterQuote,
    cancelQuote: handleCancelQuote,
    convertToOrder: handleConvertToOrder,
    isSubmitting: submitMutation.isPending,
    submitError
  }
}
```

---

### Task 25.4: Create Quote Status Badge

**File**: `src/studio/components/ecommerce/QuoteStatusBadge.tsx`
**Action**: Create

**Description**: Visual status indicator for quotes

```typescript
/**
 * QuoteStatusBadge - Quote status indicator
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Displays quote status with appropriate styling.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { 
  FileEdit, 
  Send, 
  Search, 
  FileCheck, 
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { QuoteStatus } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteStatusBadgeProps {
  status: QuoteStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ============================================================================
// CONFIG
// ============================================================================

const STATUS_CONFIG: Record<QuoteStatus, {
  label: string
  icon: React.ElementType
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
}> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 border-gray-200'
  },
  submitted: {
    label: 'Submitted',
    icon: Send,
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  reviewing: {
    label: 'Under Review',
    icon: Search,
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  quoted: {
    label: 'Quoted',
    icon: FileCheck,
    variant: 'default',
    className: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    variant: 'default',
    className: 'bg-green-100 text-green-700 border-green-200'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-200'
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    variant: 'secondary',
    className: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  countered: {
    label: 'Counter Offer',
    icon: RefreshCcw,
    variant: 'default',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteStatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className
}: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {config.label}
    </Badge>
  )
}
```

---

### Task 25.5: Create Quote Item Card

**File**: `src/studio/components/ecommerce/QuoteItemCard.tsx`
**Action**: Create

**Description**: Quote line item display

```typescript
/**
 * QuoteItemCard - Quote item display
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Displays a single item in a quote.
 */
'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Package, Trash2, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { QuoteItem } from '@/modules/ecommerce/types/ecommerce-types'
import type { QuoteBuilderItem } from '@/modules/ecommerce/hooks/useQuotations'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteItemCardProps {
  item: QuoteItem | QuoteBuilderItem
  variant?: 'display' | 'editable' | 'compact'
  showRequestedPrice?: boolean
  showQuotedPrice?: boolean
  showNotes?: boolean
  onUpdateQuantity?: (quantity: number) => void
  onUpdatePrice?: (price: number) => void
  onUpdateNotes?: (notes: string) => void
  onRemove?: () => void
  className?: string
}

// ============================================================================
// TYPE GUARD
// ============================================================================

function isQuoteItem(item: QuoteItem | QuoteBuilderItem): item is QuoteItem {
  return 'quote_id' in item
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteItemCard({
  item,
  variant = 'display',
  showRequestedPrice = true,
  showQuotedPrice = true,
  showNotes = true,
  onUpdateQuantity,
  onUpdatePrice,
  onUpdateNotes,
  onRemove,
  className
}: QuoteItemCardProps) {
  const { formatPrice } = useStorefront()

  const productName = isQuoteItem(item) 
    ? item.product_name || item.product?.name 
    : item.product_name
    
  const productImage = isQuoteItem(item)
    ? item.product_image || item.product?.primary_image
    : item.product_image

  const productSlug = isQuoteItem(item) ? item.product?.slug : undefined
  
  const requestedPrice = isQuoteItem(item) ? item.requested_price : item.requested_price
  const quotedPrice = isQuoteItem(item) ? item.quoted_price : undefined
  const listPrice = isQuoteItem(item) ? item.product?.price : item.list_price

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 py-2', className)}>
        <div className="relative h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
          {productImage ? (
            <Image
              src={productImage}
              alt={productName || 'Product'}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{productName}</p>
          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
        </div>
        {quotedPrice && (
          <span className="font-semibold">{formatPrice(quotedPrice * item.quantity)}</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex gap-4 py-4', className)}>
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 rounded-lg bg-muted overflow-hidden">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName || 'Product'}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Product Name */}
        <div className="flex items-start justify-between gap-2">
          <div>
            {productSlug ? (
              <Link 
                href={`/shop/product/${productSlug}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {productName}
              </Link>
            ) : (
              <p className="font-medium">{productName}</p>
            )}
            {isQuoteItem(item) && item.variant_name && (
              <p className="text-sm text-muted-foreground">{item.variant_name}</p>
            )}
          </div>
          
          {variant === 'editable' && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quantity */}
        <div className="mt-2 flex items-center gap-4">
          {variant === 'editable' && onUpdateQuantity ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-7 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdateQuantity(item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Quantity: {item.quantity}
            </span>
          )}

          {/* Prices */}
          <div className="flex items-center gap-4 ml-auto">
            {listPrice && (
              <div className="text-sm">
                <span className="text-muted-foreground">List: </span>
                <span>{formatPrice(listPrice)}</span>
              </div>
            )}
            
            {showRequestedPrice && requestedPrice && (
              <div className="text-sm">
                <span className="text-muted-foreground">Requested: </span>
                <span>{formatPrice(requestedPrice)}</span>
              </div>
            )}
            
            {showQuotedPrice && quotedPrice && (
              <div className="text-sm font-semibold text-primary">
                <span className="text-muted-foreground font-normal">Quoted: </span>
                <span>{formatPrice(quotedPrice)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Requested Price Input (editable) */}
        {variant === 'editable' && onUpdatePrice && (
          <div className="mt-2">
            <Input
              type="number"
              placeholder="Requested price (optional)"
              value={requestedPrice || ''}
              onChange={(e) => onUpdatePrice(parseFloat(e.target.value) || 0)}
              className="w-40"
            />
          </div>
        )}

        {/* Notes */}
        {showNotes && (
          variant === 'editable' && onUpdateNotes ? (
            <Textarea
              placeholder="Item notes (optional)"
              value={item.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={2}
              className="mt-2"
            />
          ) : item.notes ? (
            <p className="mt-2 text-sm text-muted-foreground italic">
              Note: {item.notes}
            </p>
          ) : null
        )}
      </div>
    </div>
  )
}
```

---

### Task 25.6: Create Quote Price Breakdown

**File**: `src/studio/components/ecommerce/QuotePriceBreakdown.tsx`
**Action**: Create

**Description**: Quote pricing details component

```typescript
/**
 * QuotePriceBreakdown - Quote pricing summary
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Displays quote totals and breakdown.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { Quote } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuotePriceBreakdownProps {
  quote: Quote
  showTerms?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuotePriceBreakdown({
  quote,
  showTerms = true,
  className
}: QuotePriceBreakdownProps) {
  const { formatPrice } = useStorefront()

  const hasDiscount = quote.discount_total && quote.discount_total > 0
  const hasTax = quote.tax_total && quote.tax_total > 0
  const hasShipping = quote.shipping_cost && quote.shipping_cost > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Price Lines */}
      <div className="space-y-2">
        {/* Subtotal */}
        {quote.subtotal !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(quote.subtotal)}</span>
          </div>
        )}

        {/* Discount */}
        {hasDiscount && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(quote.discount_total!)}</span>
          </div>
        )}

        {/* Shipping */}
        {hasShipping && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatPrice(quote.shipping_cost!)}</span>
          </div>
        )}

        {/* Tax */}
        {hasTax && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(quote.tax_total!)}</span>
          </div>
        )}

        <Separator />

        {/* Grand Total */}
        {quote.grand_total !== undefined && (
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(quote.grand_total)}</span>
          </div>
        )}
      </div>

      {/* Terms */}
      {showTerms && (quote.valid_until || quote.payment_terms || quote.delivery_terms) && (
        <>
          <Separator />
          <div className="space-y-2 text-sm">
            {quote.valid_until && (
              <div>
                <span className="text-muted-foreground">Valid until: </span>
                <span>{new Date(quote.valid_until).toLocaleDateString()}</span>
              </div>
            )}
            {quote.payment_terms && (
              <div>
                <span className="text-muted-foreground">Payment terms: </span>
                <span>{quote.payment_terms}</span>
              </div>
            )}
            {quote.delivery_terms && (
              <div>
                <span className="text-muted-foreground">Delivery: </span>
                <span>{quote.delivery_terms}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

---

### Task 25.7: Create Quote Action Buttons

**File**: `src/studio/components/ecommerce/QuoteActionButtons.tsx`
**Action**: Create

**Description**: Quote action buttons (accept, reject, etc.)

```typescript
/**
 * QuoteActionButtons - Quote action buttons
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Action buttons for quote operations.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, RefreshCcw, ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import type { Quote, QuoteStatus } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteActionButtonsProps {
  quote: Quote
  onAccept: () => Promise<void>
  onReject: (reason?: string) => Promise<void>
  onCounter?: () => void
  onConvertToOrder?: () => Promise<void>
  isLoading?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteActionButtons({
  quote,
  onAccept,
  onReject,
  onCounter,
  onConvertToOrder,
  isLoading = false,
  className
}: QuoteActionButtonsProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept()
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await onReject(rejectReason || undefined)
      setRejectReason('')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleConvert = async () => {
    if (!onConvertToOrder) return
    setIsConverting(true)
    try {
      await onConvertToOrder()
    } finally {
      setIsConverting(false)
    }
  }

  // Only show actions for quoted status
  if (quote.status !== 'quoted' && quote.status !== 'accepted') {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {/* Accept Button */}
      {quote.status === 'quoted' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Quote
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Accept this quote?</AlertDialogTitle>
              <AlertDialogDescription>
                By accepting this quote, you agree to the terms and pricing outlined.
                You can then proceed to place your order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAccept} disabled={isAccepting}>
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Quote'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Convert to Order Button (for accepted quotes) */}
      {quote.status === 'accepted' && onConvertToOrder && (
        <Button onClick={handleConvert} disabled={isConverting}>
          {isConverting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Place Order
            </>
          )}
        </Button>
      )}

      {/* Counter Button */}
      {quote.status === 'quoted' && onCounter && (
        <Button variant="outline" onClick={onCounter} disabled={isLoading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Counter Offer
        </Button>
      )}

      {/* Reject Button */}
      {quote.status === 'quoted' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline this quote?</AlertDialogTitle>
              <AlertDialogDescription>
                Please let us know why you're declining this quote.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Reason for declining (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={isRejecting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  'Decline Quote'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
```

---

### Task 25.8: Create Quote Request Block

**File**: `src/studio/blocks/ecommerce/quote-request-block.tsx`
**Action**: Create

**Description**: Quote request form for single product

```typescript
/**
 * QuoteRequestBlock - Quote request form
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Form for requesting a quote on a product.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Loader2, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { useQuotations } from '@/modules/ecommerce/hooks/useQuotations'
import type { Product } from '@/modules/ecommerce/types/ecommerce-types'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// VALIDATION
// ============================================================================

const quoteRequestSchema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  company_name: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  requested_price: z.number().optional(),
  customer_notes: z.string().optional()
})

type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteRequestBlockProps extends StudioBlockProps {
  // Product
  product?: Product
  productId?: string
  
  // Display
  variant?: ResponsiveValue<'card' | 'inline' | 'modal'>
  showTitle?: boolean
  title?: string
  description?: string
  
  // Fields
  showPhone?: boolean
  showCompany?: boolean
  showRequestedPrice?: boolean
  showNotes?: boolean
  
  // Behavior
  defaultQuantity?: number
  minQuantity?: number
  successMessage?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteRequestBlock({
  product,
  productId,
  variant = 'card',
  showTitle = true,
  title = 'Request a Quote',
  description = 'Fill out the form below and we\'ll get back to you with a custom quote.',
  showPhone = true,
  showCompany = true,
  showRequestedPrice = true,
  showNotes = true,
  defaultQuantity = 1,
  minQuantity = 1,
  successMessage = 'Your quote request has been submitted successfully!',
  className,
  __studioMeta
}: QuoteRequestBlockProps) {
  const { siteId } = useStorefront()
  const { submitQuoteRequest, addToBuilder, isSubmitting } = useQuotations(siteId)
  const [isSuccess, setIsSuccess] = useState(false)

  const variantValue = getResponsiveValue(variant, 'card')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      quantity: defaultQuantity
    }
  })

  const onSubmit = async (data: QuoteRequestFormData) => {
    if (!product && !productId) return

    // Add to builder
    addToBuilder({
      product_id: product?.id || productId!,
      quantity: data.quantity,
      requested_price: data.requested_price,
      notes: data.customer_notes,
      product_name: product?.name || 'Product',
      product_image: product?.primary_image,
      list_price: product?.price || 0
    })

    try {
      await submitQuoteRequest({
        site_id: siteId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        company_name: data.company_name,
        customer_notes: data.customer_notes
      })
      setIsSuccess(true)
    } catch (err) {
      // Error handled by hook
    }
  }

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quote Requested!</h3>
            <p className="text-muted-foreground">{successMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Your Name *</Label>
          <Input
            id="customer_name"
            {...register('customer_name')}
            placeholder="John Doe"
            className={cn(errors.customer_name && 'border-destructive')}
          />
          {errors.customer_name && (
            <p className="text-xs text-destructive">{errors.customer_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_email">Email *</Label>
          <Input
            id="customer_email"
            type="email"
            {...register('customer_email')}
            placeholder="john@example.com"
            className={cn(errors.customer_email && 'border-destructive')}
          />
          {errors.customer_email && (
            <p className="text-xs text-destructive">{errors.customer_email.message}</p>
          )}
        </div>
      </div>

      {/* Phone & Company */}
      {(showPhone || showCompany) && (
        <div className="grid grid-cols-2 gap-4">
          {showPhone && (
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                type="tel"
                {...register('customer_phone')}
                placeholder="+260 97X XXX XXX"
              />
            </div>
          )}
          {showCompany && (
            <div className="space-y-2">
              <Label htmlFor="company_name">Company</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                placeholder="Company name"
              />
            </div>
          )}
        </div>
      )}

      {/* Quantity & Requested Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min={minQuantity}
            {...register('quantity', { valueAsNumber: true })}
            className={cn(errors.quantity && 'border-destructive')}
          />
          {errors.quantity && (
            <p className="text-xs text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        {showRequestedPrice && (
          <div className="space-y-2">
            <Label htmlFor="requested_price">Target Price (optional)</Label>
            <Input
              id="requested_price"
              type="number"
              step="0.01"
              {...register('requested_price', { valueAsNumber: true })}
              placeholder="Your budget"
            />
          </div>
        )}
      </div>

      {/* Notes */}
      {showNotes && (
        <div className="space-y-2">
          <Label htmlFor="customer_notes">Additional Notes</Label>
          <Textarea
            id="customer_notes"
            {...register('customer_notes')}
            placeholder="Any specific requirements or questions?"
            rows={3}
          />
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Request Quote
          </>
        )}
      </Button>
    </form>
  )

  // Inline variant
  if (variantValue === 'inline') {
    return (
      <div className={className}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
        )}
        {FormContent}
      </div>
    )
  }

  // Card variant (default)
  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {FormContent}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const quoteRequestBlockConfig = {
  type: 'quote-request',
  label: 'Quote Request Form',
  category: 'e-commerce',
  icon: 'FileText',
  defaultProps: {
    variant: 'card',
    showTitle: true,
    title: 'Request a Quote',
    description: 'Fill out the form below and we\'ll get back to you.',
    showPhone: true,
    showCompany: true,
    showRequestedPrice: true,
    showNotes: true,
    defaultQuantity: 1,
    minQuantity: 1
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Request a Quote'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text'
    },
    {
      name: 'variant',
      label: 'Style',
      type: 'select',
      options: [
        { value: 'card', label: 'Card' },
        { value: 'inline', label: 'Inline' }
      ],
      responsive: true
    },
    {
      name: 'showPhone',
      label: 'Show Phone Field',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showCompany',
      label: 'Show Company Field',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showRequestedPrice',
      label: 'Show Requested Price Field',
      type: 'toggle',
      defaultValue: true
    }
  ],
  ai: {
    suggestable: true,
    description: 'Quote request form for B2B pricing',
    contextHints: ['quote', 'rfq', 'request quote', 'pricing inquiry']
  }
}
```

---

### Task 25.9: Create Quote List Block

**File**: `src/studio/blocks/ecommerce/quote-list-block.tsx`
**Action**: Create

**Description**: User's quote history list

```typescript
/**
 * QuoteListBlock - Quote history list
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Displays user's quote history.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FileText, ArrowRight, Loader2, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QuoteStatusBadge } from '@/studio/components/ecommerce/QuoteStatusBadge'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { useQuotations } from '@/modules/ecommerce/hooks/useQuotations'
import type { Quote, QuoteStatus } from '@/modules/ecommerce/types/ecommerce-types'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteListBlockProps extends StudioBlockProps {
  // Data
  userId?: string
  statusFilter?: QuoteStatus[]
  
  // Display
  variant?: ResponsiveValue<'list' | 'cards' | 'compact'>
  showTitle?: boolean
  title?: string
  maxItems?: number
  showViewAll?: boolean
  viewAllUrl?: string
  
  // Empty state
  emptyTitle?: string
  emptyDescription?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// QUOTE ROW COMPONENT
// ============================================================================

interface QuoteRowProps {
  quote: Quote
  variant: 'list' | 'cards' | 'compact'
  formatPrice: (price: number) => string
}

function QuoteRow({ quote, variant, formatPrice }: QuoteRowProps) {
  const itemCount = quote.items?.length || 0

  if (variant === 'compact') {
    return (
      <Link
        href={`/account/quotes/${quote.id}`}
        className="flex items-center justify-between py-3 px-4 hover:bg-accent rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm">{quote.quote_number}</span>
          <QuoteStatusBadge status={quote.status} size="sm" />
        </div>
        {quote.grand_total !== undefined && (
          <span className="font-semibold">{formatPrice(quote.grand_total)}</span>
        )}
      </Link>
    )
  }

  if (variant === 'cards') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono font-medium">{quote.quote_number}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(quote.created_at).toLocaleDateString()}
              </p>
            </div>
            <QuoteStatusBadge status={quote.status} />
          </div>
          
          <div className="space-y-1 mb-4">
            <p className="text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </p>
            {quote.grand_total !== undefined && (
              <p className="font-semibold text-lg">{formatPrice(quote.grand_total)}</p>
            )}
          </div>

          <Button variant="outline" asChild className="w-full">
            <Link href={`/account/quotes/${quote.id}`}>
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // List variant (default)
  return (
    <Link
      href={`/account/quotes/${quote.id}`}
      className="flex items-center justify-between py-4 px-4 border-b last:border-b-0 hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{quote.quote_number}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(quote.created_at).toLocaleDateString()} • {itemCount} item{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <QuoteStatusBadge status={quote.status} />
        {quote.grand_total !== undefined && (
          <span className="font-semibold">{formatPrice(quote.grand_total)}</span>
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteListBlock({
  userId,
  statusFilter,
  variant = 'list',
  showTitle = true,
  title = 'Your Quotes',
  maxItems,
  showViewAll = true,
  viewAllUrl = '/account/quotes',
  emptyTitle = 'No quotes yet',
  emptyDescription = 'Request a quote on any product to get started.',
  className,
  __studioMeta
}: QuoteListBlockProps) {
  const { siteId, formatPrice } = useStorefront()
  const { quotes, isLoading } = useQuotations(siteId, userId, statusFilter)
  
  const variantValue = getResponsiveValue(variant, 'list')
  const displayQuotes = maxItems ? quotes.slice(0, maxItems) : quotes

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && <Skeleton className="h-6 w-32 mb-4" />}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">{emptyTitle}</h3>
        <p className="text-muted-foreground mt-1">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showViewAll && maxItems && quotes.length > maxItems && (
            <Button variant="ghost" asChild>
              <Link href={viewAllUrl}>
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}

      {variantValue === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayQuotes.map(quote => (
            <QuoteRow
              key={quote.id}
              quote={quote}
              variant={variantValue}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      ) : (
        <div className={cn(
          variantValue === 'list' && 'border rounded-lg divide-y'
        )}>
          {displayQuotes.map(quote => (
            <QuoteRow
              key={quote.id}
              quote={quote}
              variant={variantValue}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const quoteListBlockConfig = {
  type: 'quote-list',
  label: 'Quote List',
  category: 'e-commerce',
  icon: 'FileStack',
  defaultProps: {
    variant: 'list',
    showTitle: true,
    title: 'Your Quotes',
    showViewAll: true,
    viewAllUrl: '/account/quotes'
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Your Quotes'
    },
    {
      name: 'variant',
      label: 'Display Style',
      type: 'select',
      options: [
        { value: 'list', label: 'List' },
        { value: 'cards', label: 'Cards' },
        { value: 'compact', label: 'Compact' }
      ],
      responsive: true
    },
    {
      name: 'maxItems',
      label: 'Max Items to Show',
      type: 'number',
      description: 'Leave empty to show all'
    },
    {
      name: 'showViewAll',
      label: 'Show View All Link',
      type: 'toggle',
      defaultValue: true
    }
  ],
  ai: {
    suggestable: true,
    description: 'List of user quote requests',
    contextHints: ['quote history', 'my quotes', 'quote list']
  }
}
```

---

### Task 25.10: Create Quote Detail Block

**File**: `src/studio/blocks/ecommerce/quote-detail-block.tsx`
**Action**: Create

**Description**: Single quote detail view

```typescript
/**
 * QuoteDetailBlock - Single quote view
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Displays detailed quote information.
 */
'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Calendar, Mail, Phone, Building2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { QuoteStatusBadge } from '@/studio/components/ecommerce/QuoteStatusBadge'
import { QuoteItemCard } from '@/studio/components/ecommerce/QuoteItemCard'
import { QuotePriceBreakdown } from '@/studio/components/ecommerce/QuotePriceBreakdown'
import { QuoteActionButtons } from '@/studio/components/ecommerce/QuoteActionButtons'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { useQuotations } from '@/modules/ecommerce/hooks/useQuotations'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteDetailBlockProps extends StudioBlockProps {
  quoteId?: string
  showActions?: boolean
  showPricing?: boolean
  showCustomerInfo?: boolean
  showNotes?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteDetailBlock({
  quoteId,
  showActions = true,
  showPricing = true,
  showCustomerInfo = true,
  showNotes = true,
  className,
  __studioMeta
}: QuoteDetailBlockProps) {
  const { siteId } = useStorefront()
  const { 
    quote, 
    isLoadingQuote, 
    loadQuote,
    acceptQuote,
    rejectQuote,
    convertToOrder
  } = useQuotations(siteId)

  // Load quote on mount or when ID changes
  useEffect(() => {
    const id = quoteId || new URLSearchParams(window.location.search).get('id')
    if (id) {
      loadQuote(id)
    }
  }, [quoteId, loadQuote])

  if (isLoadingQuote) {
    return (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className={cn('text-center py-12', className)}>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Quote not found</h3>
        <p className="text-muted-foreground">
          The quote you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{quote.quote_number}</h1>
            <QuoteStatusBadge status={quote.status} size="lg" />
          </div>
          <p className="text-muted-foreground mt-1">
            Requested on {new Date(quote.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {showActions && (
          <QuoteActionButtons
            quote={quote}
            onAccept={() => acceptQuote(quote.id)}
            onReject={(reason) => rejectQuote(quote.id, reason)}
            onConvertToOrder={() => convertToOrder(quote.id)}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quote Items ({quote.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {quote.items?.map(item => (
                <QuoteItemCard
                  key={item.id}
                  item={item}
                  variant="display"
                  showQuotedPrice={quote.status === 'quoted' || quote.status === 'accepted'}
                />
              ))}
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {showNotes && quote.customer_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{quote.customer_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes (if quoted) */}
          {showNotes && quote.admin_notes && (quote.status === 'quoted' || quote.status === 'accepted') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response from Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{quote.admin_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {showCustomerInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{quote.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{quote.customer_email}</span>
                </div>
                {quote.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{quote.customer_phone}</span>
                  </div>
                )}
                {quote.company_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{quote.company_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          {showPricing && quote.grand_total !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quote Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <QuotePriceBreakdown quote={quote} />
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
                <span>
                  {quote.submitted_at 
                    ? new Date(quote.submitted_at).toLocaleDateString()
                    : 'Pending'}
                </span>
              </div>
              {quote.quoted_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Quoted:</span>
                  <span>{new Date(quote.quoted_at).toLocaleDateString()}</span>
                </div>
              )}
              {quote.valid_until && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires:</span>
                  <span>{new Date(quote.valid_until).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const quoteDetailBlockConfig = {
  type: 'quote-detail',
  label: 'Quote Detail',
  category: 'e-commerce',
  icon: 'FileText',
  defaultProps: {
    showActions: true,
    showPricing: true,
    showCustomerInfo: true,
    showNotes: true
  },
  fields: [
    {
      name: 'showActions',
      label: 'Show Action Buttons',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showPricing',
      label: 'Show Pricing Summary',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showCustomerInfo',
      label: 'Show Customer Info',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showNotes',
      label: 'Show Notes',
      type: 'toggle',
      defaultValue: true
    }
  ],
  ai: {
    suggestable: true,
    description: 'Detailed view of a single quote',
    contextHints: ['quote details', 'view quote', 'quote page']
  }
}
```

---

### Task 25.11: Update Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

Add quotation hook export:

```typescript
export { useQuotations } from './useQuotations'
export type { QuoteBuilderItem, UseQuotationsResult } from './useQuotations'
```

---

### Task 25.12: Update E-Commerce Blocks Index

**File**: `src/studio/blocks/ecommerce/index.ts`
**Action**: Modify

Add quotation block exports:

```typescript
// Quotation Blocks (Phase ECOM-25)
export { QuoteRequestBlock, quoteRequestBlockConfig } from './quote-request-block'
export { QuoteListBlock, quoteListBlockConfig } from './quote-list-block'
export { QuoteDetailBlock, quoteDetailBlockConfig } from './quote-detail-block'

// Quotation Utility Components
export { QuoteStatusBadge } from '@/studio/components/ecommerce/QuoteStatusBadge'
export { QuoteItemCard } from '@/studio/components/ecommerce/QuoteItemCard'
export { QuotePriceBreakdown } from '@/studio/components/ecommerce/QuotePriceBreakdown'
export { QuoteActionButtons } from '@/studio/components/ecommerce/QuoteActionButtons'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] `useQuotations` hook manages state correctly
- [ ] `QuoteRequestBlock` submits quotes
- [ ] `QuoteListBlock` displays quote history
- [ ] `QuoteDetailBlock` shows quote details
- [ ] `QuoteStatusBadge` shows correct status
- [ ] `QuoteActionButtons` accept/reject work
- [ ] Quote to order conversion works
- [ ] All components integrate with hooks

---

## 🔄 Rollback Plan

If issues occur:
1. Remove quotation hook: `rm src/modules/ecommerce/hooks/useQuotations.ts`
2. Remove quotation actions: `rm src/modules/ecommerce/actions/quotation-actions.ts`
3. Remove quotation blocks from `studio/blocks/ecommerce/`
4. Remove quotation components from `studio/components/ecommerce/`
5. Revert type additions
6. Revert index.ts changes
7. Run `npx tsc --noEmit` to verify

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add "✅ PHASE-ECOM-25: Quotation Frontend Complete"
- `progress.md`: Update e-commerce section with Wave 3 completion

---

## ✨ Success Criteria

- [ ] Quote request form works
- [ ] Quote list shows user history
- [ ] Quote detail shows full information
- [ ] Accept/reject/counter actions work
- [ ] Quote to order conversion works
- [ ] Status badges display correctly
- [ ] All 3 quotation blocks render
- [ ] TypeScript compiles with zero errors

---

## 🎉 WAVE 3 COMPLETE!

With PHASE-ECOM-25 complete, Wave 3 "Studio Components - Real Data Integration" is finished!

### Wave 3 Summary:
- **ECOM-20**: Core Data Hooks (7 hooks + context)
- **ECOM-21**: Product Display Components (4 blocks + 4 utilities)
- **ECOM-22**: Cart Components (3 blocks + 5 utilities)
- **ECOM-23**: Checkout Components (3 blocks + 6 utilities)
- **ECOM-24**: Navigation & Discovery (5 blocks + 2 utilities)
- **ECOM-25**: Quotation Frontend (3 blocks + 4 utilities)

**Total Components Created**: 18 blocks + 21 utility components + 10 hooks
