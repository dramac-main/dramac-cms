/**
 * QuoteDetailBlock - Full quote detail view
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Complete quote view with items, pricing, and actions.
 */
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Mail, 
  Phone,
  ArrowLeft,
  MessageSquare
} from 'lucide-react'
import { useStorefront } from '../../context/storefront-context'
import { useQuotations } from '../../hooks/useQuotations'
import { QuoteStatusBadge, isQuoteActionable, isQuoteFinal } from './QuoteStatusBadge'
import { QuoteItemCard } from './QuoteItemCard'
import { QuotePriceBreakdown, QuoteSavingsDisplay } from './QuotePriceBreakdown'
import { QuoteActionButtons } from './QuoteActionButtons'
import type { Quote } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteDetailBlockProps {
  /** Quote ID to load */
  quoteId?: string
  /** Access token (for public quote view) */
  accessToken?: string
  /** Pre-loaded quote data */
  quote?: Quote
  /** Display variant */
  variant?: 'default' | 'compact' | 'print'
  /** Show back button */
  showBackButton?: boolean
  /** Back button URL */
  backUrl?: string
  /** Show customer info section */
  showCustomerInfo?: boolean
  /** Show activity/history */
  showActivity?: boolean
  /** Enable quote actions (accept/reject) */
  enableActions?: boolean
  /** Print handler */
  onPrint?: () => void
  /** Download handler */
  onDownload?: () => void
  /** Share handler */
  onShare?: () => void
  className?: string
}

// ============================================================================
// HELPER
// ============================================================================

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function QuoteDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteDetailBlock({
  quoteId,
  accessToken,
  quote: preloadedQuote,
  variant: variantProp = 'default',
  showBackButton = true,
  backUrl = '/quotes',
  showCustomerInfo = true,
  showActivity = false,
  enableActions = true,
  onPrint,
  onDownload,
  onShare,
  className
}: QuoteDetailBlockProps) {
  const { siteId, formatPrice, settings } = useStorefront()
  
  const {
    quote: loadedQuote,
    isLoadingQuote,
    loadQuote,
    acceptQuote,
    rejectQuote
  } = useQuotations(siteId, settings?.agency_id)

  const variant = variantProp || 'default'
  
  // Load quote on mount if ID provided
  React.useEffect(() => {
    if (quoteId && !preloadedQuote) {
      loadQuote(quoteId)
    }
  }, [quoteId, preloadedQuote, loadQuote])

  const quote = preloadedQuote || loadedQuote

  // Loading state
  if (isLoadingQuote && !quote) {
    return <QuoteDetailSkeleton />
  }

  // No quote found
  if (!quote) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Quote Not Found</h3>
          <p className="mt-2 text-gray-500">
            The quote you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          {showBackButton && (
            <Button asChild variant="outline" className="mt-4">
              <a href={backUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quotes
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Calculate original total for savings display
  const originalTotal = quote.items?.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity)
  }, 0) || 0

  // Print variant
  if (variant === 'print') {
    return (
      <div className={cn('bg-white p-8', className)}>
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">Quote #{quote.quote_number || quote.id.slice(0, 8)}</h1>
            <p className="mt-1 text-gray-600">Date: {formatDate(quote.created_at)}</p>
            {quote.valid_until && (
              <p className="text-gray-600">Valid Until: {formatDate(quote.valid_until)}</p>
            )}
          </div>
          <div className="text-right">
            <QuoteStatusBadge status={quote.status} size="lg" />
          </div>
        </div>

        {/* Customer Info */}
        {showCustomerInfo && (
          <div className="mt-6 border-b pb-6">
            <h2 className="font-semibold text-gray-900">Customer</h2>
            <div className="mt-2 text-gray-600">
              {quote.customer_name && <p>{quote.customer_name}</p>}
              {quote.customer_company && <p>{quote.customer_company}</p>}
              {quote.customer_email && <p>{quote.customer_email}</p>}
              {quote.customer_phone && <p>{quote.customer_phone}</p>}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mt-6">
          <h2 className="font-semibold text-gray-900">Items</h2>
          <table className="mt-4 w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">
                    {formatPrice?.(item.unit_price) || `$${item.unit_price.toFixed(2)}`}
                  </td>
                  <td className="py-3 text-right">
                    {formatPrice?.(item.line_total) || `$${item.line_total.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64">
            <QuotePriceBreakdown quote={quote} formatPrice={formatPrice} variant="detailed" />
          </div>
        </div>

        {/* Terms */}
        {quote.terms_and_conditions && (
          <div className="mt-8 border-t pt-6">
            <h2 className="font-semibold text-gray-900">Terms & Conditions</h2>
            <p className="mt-2 text-sm text-gray-600">{quote.terms_and_conditions}</p>
          </div>
        )}
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Quote #{quote.quote_number || quote.id.slice(0, 8)}
            </CardTitle>
            <QuoteStatusBadge status={quote.status} size="sm" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Items summary */}
          <div className="space-y-2">
            {quote.items?.slice(0, 3).map((item, index) => (
              <QuoteItemCard key={index} item={item} variant="compact" formatPrice={formatPrice} />
            ))}
            {(quote.items?.length || 0) > 3 && (
              <p className="text-sm text-gray-500">
                +{(quote.items?.length || 0) - 3} more items
              </p>
            )}
          </div>

          <Separator />

          {/* Pricing */}
          <QuotePriceBreakdown quote={quote} formatPrice={formatPrice} variant="compact" />

          {/* Actions */}
          {enableActions && isQuoteActionable(quote.status) && (
            <QuoteActionButtons
              quote={quote}
              onAccept={(name, email, sig) => acceptQuote(quote.id, name, email, sig)}
              onReject={(reason) => rejectQuote(quote.id, reason)}
              variant="compact"
              showAllActions={false}
            />
          )}
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button asChild variant="ghost" size="sm">
              <a href={backUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </a>
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quote #{quote.quote_number || quote.id.slice(0, 8)}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(quote.created_at)}
              </span>
              {quote.valid_until && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Valid until {formatDate(quote.valid_until)}
                </span>
              )}
            </div>
          </div>
        </div>
        <QuoteStatusBadge status={quote.status} size="lg" />
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info card */}
          {showCustomerInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {quote.customer_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{quote.customer_name}</span>
                    </div>
                  )}
                  {quote.customer_company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{quote.customer_company}</span>
                    </div>
                  )}
                  {quote.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{quote.customer_email}</span>
                    </div>
                  )}
                  {quote.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{quote.customer_phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Quote Items ({quote.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.items?.map((item, index) => (
                <QuoteItemCard
                  key={index}
                  item={item}
                  variant="readonly"
                  formatPrice={formatPrice}
                  showDiscount
                />
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          {quote.notes_to_customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{quote.notes_to_customer}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuotePriceBreakdown
                quote={quote}
                formatPrice={formatPrice}
                variant="detailed"
              />

              {/* Savings display */}
              {quote.discount_amount && quote.discount_amount > 0 && (
                <QuoteSavingsDisplay
                  originalTotal={originalTotal}
                  quotedTotal={quote.total}
                  formatPrice={formatPrice}
                />
              )}
            </CardContent>
          </Card>

          {/* Actions card */}
          {enableActions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteActionButtons
                  quote={quote}
                  onAccept={(name, email, sig) => acceptQuote(quote.id, name, email, sig)}
                  onReject={(reason) => rejectQuote(quote.id, reason)}
                  onPrint={onPrint || (() => window.print())}
                  onDownload={onDownload}
                  onShare={onShare}
                  variant="stacked"
                  showAllActions
                />
              </CardContent>
            </Card>
          )}

          {/* Activity (if enabled) */}
          {showActivity && quote.activities && quote.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quote.activities.map((activity, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                      <div>
                        <p className="text-gray-900">{activity.description}</p>
                        <p className="text-gray-500">
                          {activity.performed_by_name} · {formatDateTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
