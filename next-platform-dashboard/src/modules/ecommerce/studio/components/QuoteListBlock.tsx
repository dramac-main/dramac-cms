/**
 * QuoteListBlock - Display list of quotes
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Shows customer's quote history with filtering and status.
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Calendar, 
  Clock,
  ChevronRight,
  Filter,
  Package,
  Loader2
} from 'lucide-react'
import { useStorefront } from '../../context/storefront-context'
import { useQuotations } from '../../hooks/useQuotations'
import { QuoteStatusBadge, getQuoteStatusLabel } from './QuoteStatusBadge'
import { QuotePriceBreakdown } from './QuotePriceBreakdown'
import type { Quote, QuoteStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteListBlockProps {
  /** Customer/User ID to filter quotes */
  userId?: string
  /** Status filter */
  statusFilter?: QuoteStatus[]
  /** Display variant */
  variant?: 'list' | 'cards' | 'table'
  /** Quote detail page base URL */
  detailUrl?: string
  /** Max items to show (for pagination) */
  maxItems?: number
  /** Show status filter dropdown */
  showStatusFilter?: boolean
  /** Show empty state */
  showEmptyState?: boolean
  /** Custom empty state message */
  emptyMessage?: string
  /** Title */
  title?: string
  className?: string
}

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const STATUS_OPTIONS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Quotes' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' }
]

// ============================================================================
// HELPER
// ============================================================================

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================================
// QUOTE CARD COMPONENT
// ============================================================================

interface QuoteCardProps {
  quote: Quote
  formatPrice?: (price: number) => string
  detailUrl?: string
}

function QuoteCard({ quote, formatPrice, detailUrl }: QuoteCardProps) {
  const itemCount = quote.items?.length || 0
  const href = detailUrl ? `${detailUrl}/${quote.id}` : `/quote/${quote.access_token || quote.id}`

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                #{quote.quote_number || quote.id.slice(0, 8)}
              </span>
              <QuoteStatusBadge status={quote.status} size="sm" />
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(quote.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
            </div>

            {quote.valid_until && (
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                Valid until {formatDate(quote.valid_until)}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">
              {formatPrice?.(quote.total) || `$${quote.total.toFixed(2)}`}
            </p>
            <Link href={href}>
              <Button variant="ghost" size="sm" className="mt-1">
                View <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// QUOTE LIST ITEM COMPONENT
// ============================================================================

interface QuoteListItemProps {
  quote: Quote
  formatPrice?: (price: number) => string
  detailUrl?: string
}

function QuoteListItem({ quote, formatPrice, detailUrl }: QuoteListItemProps) {
  const itemCount = quote.items?.length || 0
  const href = detailUrl ? `${detailUrl}/${quote.id}` : `/quote/${quote.access_token || quote.id}`

  return (
    <Link href={href} className="block">
      <div className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-5 w-5 text-gray-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              #{quote.quote_number || quote.id.slice(0, 8)}
            </span>
            <QuoteStatusBadge status={quote.status} size="sm" variant="outline" />
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(quote.created_at)} · {itemCount} item{itemCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold">
            {formatPrice?.(quote.total) || `$${quote.total.toFixed(2)}`}
          </p>
        </div>

        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteListBlock({
  userId,
  statusFilter: initialStatusFilter,
  variant: variantProp = 'list',
  detailUrl,
  maxItems,
  showStatusFilter = true,
  showEmptyState = true,
  emptyMessage = 'No quotes found',
  title = 'Your Quotes',
  className
}: QuoteListBlockProps) {
  const { siteId, formatPrice, settings } = useStorefront()
  const [selectedStatus, setSelectedStatus] = React.useState<QuoteStatus | 'all'>('all')
  
  const statusFilterArray = React.useMemo(() => {
    if (selectedStatus !== 'all') return [selectedStatus]
    return initialStatusFilter
  }, [selectedStatus, initialStatusFilter])

  const {
    quotes,
    isLoading,
    error,
    refetch
  } = useQuotations(siteId, settings?.agency_id, userId, statusFilterArray)

  const variant = variantProp || 'list'

  // Apply maxItems limit
  const displayedQuotes = maxItems ? quotes.slice(0, maxItems) : quotes

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-6 text-center', className)}>
        <p className="text-red-600">Failed to load quotes</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    )
  }

  // Empty state
  if (displayedQuotes.length === 0 && showEmptyState) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Quotes Yet</h3>
          <p className="mt-2 text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        
        {showStatusFilter && (
          <Select
            value={selectedStatus}
            onValueChange={(v) => setSelectedStatus(v as QuoteStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Quotes */}
      {variant === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              formatPrice={formatPrice}
              detailUrl={detailUrl}
            />
          ))}
        </div>
      ) : variant === 'table' ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quote #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Items</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedQuotes.map((quote) => {
                const itemCount = quote.items?.length || 0
                const href = detailUrl ? `${detailUrl}/${quote.id}` : `/quote/${quote.access_token || quote.id}`
                
                return (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      #{quote.quote_number || quote.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(quote.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {itemCount}
                    </td>
                    <td className="px-4 py-3">
                      <QuoteStatusBadge status={quote.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice?.(quote.total) || `$${quote.total.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={href}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedQuotes.map((quote) => (
            <QuoteListItem
              key={quote.id}
              quote={quote}
              formatPrice={formatPrice}
              detailUrl={detailUrl}
            />
          ))}
        </div>
      )}

      {/* Load more indicator */}
      {maxItems && quotes.length > maxItems && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing {maxItems} of {quotes.length} quotes
          </p>
        </div>
      )}
    </div>
  )
}
