/**
 * Quote Detail Dialog Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * View quote details with tabs
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Loader2, 
  Edit, 
  Send, 
  Copy,
  FileDown,
  ArrowRightCircle,
  ExternalLink,
  Mail,
  Phone,
  Building,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuoteStatusBadge } from './quote-status-badge'
import { QuoteTimeline } from './quote-timeline'
import { QuoteItemsEditor } from './quote-items-editor'
import { getQuote, duplicateQuote } from '../../actions/quote-actions'
import { 
  formatQuoteCurrency, 
  isQuoteExpired,
  calculateDaysUntilExpiry
} from '../../lib/quote-utils'
import { downloadQuotePDF } from '../../lib/quote-pdf-generator'
import type { QuoteDetailData } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId: string
  siteId: string
  onEdit?: (quoteId: string) => void
  onSend?: (quoteId: string) => void
  onConvert?: (quoteId: string) => void
  onQuoteChange?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteDetailDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  onEdit,
  onSend,
  onConvert,
  onQuoteChange
}: QuoteDetailDialogProps) {
  const [quote, setQuote] = useState<QuoteDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  
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
        toast.error('Failed to load quote details')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuote()
  }, [open, quoteId, siteId])
  
  // Handle duplicate
  const handleDuplicate = async () => {
    if (!quote) return
    
    const result = await duplicateQuote(siteId, quote.id)
    if (result.success) {
      toast.success(`Quote duplicated as ${result.quote?.quote_number}`)
      onQuoteChange?.()
    } else {
      toast.error(result.error || 'Failed to duplicate quote')
    }
  }
  
  // Copy portal link
  const handleCopyLink = () => {
    if (!quote) return
    
    const portalUrl = `${window.location.origin}/quote/${quote.access_token}`
    navigator.clipboard.writeText(portalUrl)
    toast.success('Quote link copied to clipboard')
  }
  
  // Determine available actions based on status
  const canEdit = quote && ['draft', 'pending_approval'].includes(quote.status)
  const canSend = quote && ['draft', 'pending_approval'].includes(quote.status)
  const canConvert = quote && quote.status === 'accepted'
  
  // Expiry info
  const daysUntilExpiry = quote?.valid_until ? calculateDaysUntilExpiry(quote.valid_until) : null
  const expired = quote?.valid_until ? isQuoteExpired(quote.valid_until) : false

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  if (!quote) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quote Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            The requested quote could not be found.
          </p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Quote {quote.quote_number}
                <QuoteStatusBadge status={quote.status} />
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(quote.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(quote.id)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {canSend && onSend && (
                <Button size="sm" onClick={() => onSend(quote.id)}>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              )}
              {canConvert && onConvert && (
                <Button size="sm" variant="default" onClick={() => onConvert(quote.id)}>
                  <ArrowRightCircle className="h-4 w-4 mr-1" />
                  Convert to Order
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">
              Items ({quote.items?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity ({quote.activities?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
                      {formatQuoteCurrency(quote.total, quote.currency)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="text-2xl font-bold">{quote.items?.length || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-2xl font-bold">{quote.view_count}</p>
                  </div>
                  <div className={cn(
                    "p-4 border rounded-lg",
                    expired && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  )}>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    {quote.valid_until ? (
                      <div>
                        <p className={cn(
                          "text-lg font-semibold",
                          expired && "text-red-600"
                        )}>
                          {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                        </p>
                        {!expired && daysUntilExpiry !== null && (
                          <p className={cn(
                            "text-xs",
                            daysUntilExpiry <= 3 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry} days left`}
                          </p>
                        )}
                        {expired && (
                          <p className="text-xs text-red-600">Expired</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">No expiry</p>
                    )}
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{quote.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${quote.customer_email}`} className="text-primary hover:underline">
                        {quote.customer_email}
                      </a>
                    </div>
                    {quote.customer_company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{quote.customer_company}</span>
                      </div>
                    )}
                    {quote.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${quote.customer_phone}`} className="text-primary hover:underline">
                          {quote.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Financial Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Financial Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatQuoteCurrency(quote.subtotal, quote.currency)}</span>
                    </div>
                    {quote.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Discount 
                          {quote.discount_type === 'percentage' && ` (${quote.discount_value}%)`}
                        </span>
                        <span>-{formatQuoteCurrency(quote.discount_amount, quote.currency)}</span>
                      </div>
                    )}
                    {quote.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({quote.tax_rate}%)</span>
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
                
                {/* Content sections */}
                {quote.title && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Title</h3>
                    <p>{quote.title}</p>
                  </div>
                )}
                
                {quote.introduction && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Introduction</h3>
                    <p className="whitespace-pre-wrap">{quote.introduction}</p>
                  </div>
                )}
                
                {quote.terms_and_conditions && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                    <p className="whitespace-pre-wrap text-sm">{quote.terms_and_conditions}</p>
                  </div>
                )}
                
                {quote.internal_notes && (
                  <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                    <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
                      Internal Notes (Not visible to customer)
                    </h3>
                    <p className="whitespace-pre-wrap text-sm">{quote.internal_notes}</p>
                  </div>
                )}
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Copy Portal Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!quote) return
                      const success = downloadQuotePDF(quote)
                      if (!success) {
                        toast.error('Could not open print window. Please allow popups.')
                      }
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Items Tab */}
          <TabsContent value="items" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-1">
                <QuoteItemsEditor
                  items={quote.items || []}
                  currency={quote.currency}
                  onAddItems={() => {}}
                  onUpdateItem={() => {}}
                  onRemoveItem={() => {}}
                  isReadOnly={true}
                />
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-1">
                <QuoteTimeline activities={quote.activities || []} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
