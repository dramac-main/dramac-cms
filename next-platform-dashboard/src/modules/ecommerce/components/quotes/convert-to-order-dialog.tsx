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
  CircleCheck,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
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
            {quote.responded_at && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <CircleCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Quote Accepted
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    {quote.metadata?.accepted_by_name 
                      ? `By ${quote.metadata.accepted_by_name} on `
                      : 'On '
                    }
                    {format(new Date(quote.responded_at), 'MMMM d, yyyy')}
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
