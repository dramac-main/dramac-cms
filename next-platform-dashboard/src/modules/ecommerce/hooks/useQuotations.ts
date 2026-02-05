/**
 * useQuotations - Quotation management hook
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Manages quote requests, history, and actions for storefront.
 */
'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Quote, QuoteItem, QuoteStatus, QuoteInput, Product } from '../types/ecommerce-types'

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
  submitQuoteRequest: (input: QuoteRequestData) => Promise<Quote | null>
  acceptQuote: (quoteId: string, name: string, email?: string, signature?: string) => Promise<boolean>
  rejectQuote: (quoteId: string, reason?: string) => Promise<boolean>
  
  // State
  isSubmitting: boolean
  submitError: string | null
}

export interface QuoteRequestData {
  customer_name: string
  customer_email: string
  customer_phone?: string
  company_name?: string
  notes?: string
}

// ============================================================================
// API FUNCTIONS (simplified - uses existing quote-workflow-actions)
// ============================================================================

async function fetchQuotes(siteId: string, userId?: string, status?: QuoteStatus[]): Promise<Quote[]> {
  // Import the action dynamically to avoid server-only import in client
  const { getQuotes } = await import('../actions/quote-actions')
  const result = await getQuotes(siteId, { status: status?.[0], customerId: userId })
  return result.quotes as unknown as Quote[]
}

async function fetchQuote(siteId: string, quoteId: string): Promise<Quote | null> {
  const { getQuote } = await import('../actions/quote-actions')
  return getQuote(siteId, quoteId)
}

async function createQuoteAction(siteId: string, agencyId: string, data: QuoteRequestData, items: QuoteBuilderItem[]): Promise<Quote | null> {
  const { createQuote: createQuoteServerAction, addQuoteItem, recalculateQuoteTotals } = await import('../actions/quote-actions')
  
  const quoteInput: QuoteInput = {
    site_id: siteId,
    agency_id: agencyId,
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    customer_company: data.company_name,
    notes_to_customer: data.notes
  }
  
  const result = await createQuoteServerAction(quoteInput)
  
  if (result.success && result.quote) {
    // Add items to the quote
    for (const item of items) {
      await addQuoteItem(siteId, {
        quote_id: result.quote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.product_name,
        image_url: item.product_image,
        quantity: item.quantity,
        unit_price: item.requested_price || item.list_price,
        discount_percent: 0,
        tax_rate: 0
      })
    }
    // Recalculate totals after adding items
    await recalculateQuoteTotals(siteId, result.quote.id)
    // Return updated quote
    return result.quote
  }
  
  return null
}

async function acceptQuoteAction(token: string, name: string, email?: string, signature?: string): Promise<boolean> {
  const { acceptQuote } = await import('../actions/quote-workflow-actions')
  const result = await acceptQuote({ 
    token, 
    accepted_by_name: name,
    accepted_by_email: email,
    signature_data: signature
  })
  return result.success
}

async function rejectQuoteAction(token: string, reason?: string): Promise<boolean> {
  const { rejectQuote } = await import('../actions/quote-workflow-actions')
  const result = await rejectQuote({ token, rejection_reason: reason })
  return result.success
}

// ============================================================================
// HOOK
// ============================================================================

export function useQuotations(
  siteId: string,
  agencyId?: string,
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
    queryKey: ['storefront-quotes', siteId, userId, statusFilter],
    queryFn: () => fetchQuotes(siteId, userId, statusFilter),
    enabled: !!siteId
  })

  // Load single quote
  const loadQuote = useCallback(async (quoteId: string) => {
    setIsLoadingQuote(true)
    try {
      const quote = await fetchQuote(siteId, quoteId)
      setCurrentQuote(quote)
    } catch (err) {
      console.error('Error loading quote:', err)
      setCurrentQuote(null)
    } finally {
      setIsLoadingQuote(false)
    }
  }, [siteId])

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
    mutationFn: async (data: QuoteRequestData) => {
      if (!agencyId) throw new Error('Agency ID required')
      return createQuoteAction(siteId, agencyId, data, builderItems)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront-quotes'] })
      clearBuilder()
    }
  })

  // Submit quote request
  const submitQuoteRequest = useCallback(async (data: QuoteRequestData): Promise<Quote | null> => {
    setSubmitError(null)
    
    if (builderItems.length === 0) {
      setSubmitError('No items in quote builder')
      return null
    }

    try {
      const result = await submitMutation.mutateAsync(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit quote'
      setSubmitError(message)
      return null
    }
  }, [builderItems, submitMutation])

  // Accept quote
  const handleAcceptQuote = useCallback(async (
    quoteId: string, 
    name: string, 
    email?: string, 
    signature?: string
  ): Promise<boolean> => {
    try {
      // Get the quote's access token
      const quote = currentQuote?.id === quoteId ? currentQuote : await fetchQuote(siteId, quoteId)
      if (!quote?.access_token) return false
      
      const success = await acceptQuoteAction(quote.access_token, name, email, signature)
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['storefront-quotes'] })
        if (currentQuote?.id === quoteId) {
          loadQuote(quoteId)
        }
      }
      return success
    } catch (err) {
      console.error('Error accepting quote:', err)
      return false
    }
  }, [currentQuote, loadQuote, queryClient, siteId])

  // Reject quote
  const handleRejectQuote = useCallback(async (quoteId: string, reason?: string): Promise<boolean> => {
    try {
      const quote = currentQuote?.id === quoteId ? currentQuote : await fetchQuote(siteId, quoteId)
      if (!quote?.access_token) return false
      
      const success = await rejectQuoteAction(quote.access_token, reason)
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['storefront-quotes'] })
      }
      return success
    } catch (err) {
      console.error('Error rejecting quote:', err)
      return false
    }
  }, [currentQuote, queryClient, siteId])

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
    isSubmitting: submitMutation.isPending,
    submitError
  }
}
