/**
 * Quotes View Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Main view for quote management
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  RefreshCw
} from 'lucide-react'
import { useEcommerce } from '../../context/ecommerce-context'
import { 
  QuoteTable, 
  QuoteBuilderDialog, 
  QuoteDetailDialog 
} from '../quotes'
import { getQuotes, getQuoteStats } from '../../actions/quote-actions'
import { getQuoteStatusOptions } from '../../lib/quote-utils'
import type { QuoteSummary, QuoteStatus, QuoteTableFilters } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuotesViewProps {
  searchQuery?: string
  siteId: string
  agencyId: string
  userId?: string
  userName?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuotesView({ 
  searchQuery = '',
  siteId,
  agencyId,
  userId,
  userName 
}: QuotesViewProps) {
  // State
  const [quotes, setQuotes] = useState<QuoteSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [localSearch, setLocalSearch] = useState(searchQuery)
  
  // Dialogs
  const [showBuilder, setShowBuilder] = useState(false)
  const [editQuoteId, setEditQuoteId] = useState<string | null>(null)
  const [viewQuoteId, setViewQuoteId] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    converted: 0
  })
  
  // Load quotes
  const loadQuotes = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    try {
      const filters: Partial<QuoteTableFilters> = {
        status: statusFilter,
        search: localSearch || searchQuery
      }
      
      const result = await getQuotes(siteId, filters)
      setQuotes(result.quotes)
      setTotal(result.total)
      
      // Load stats
      const quoteStats = await getQuoteStats(siteId)
      setStats({
        total: quoteStats.total,
        draft: quoteStats.draft,
        sent: quoteStats.sent + quoteStats.viewed,
        accepted: quoteStats.accepted,
        converted: quoteStats.converted
      })
    } catch (error) {
      console.error('Error loading quotes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [siteId, statusFilter, localSearch, searchQuery])
  
  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])
  
  // Handlers
  const handleViewQuote = (quoteId: string) => {
    setViewQuoteId(quoteId)
  }
  
  const handleEditQuote = (quoteId: string) => {
    setEditQuoteId(quoteId)
    setShowBuilder(true)
  }
  
  const handleCreateQuote = () => {
    setEditQuoteId(null)
    setShowBuilder(true)
  }
  
  const handleQuoteChange = () => {
    loadQuotes()
    setViewQuoteId(null)
  }
  
  const statusOptions = getQuoteStatusOptions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quotes</h2>
          <p className="text-muted-foreground">
            Create and manage customer quotations
          </p>
        </div>
        <Button onClick={handleCreateQuote}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Converted</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select 
          value={statusFilter} 
          onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={loadQuotes}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Quote Table */}
      {quotes.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No quotes found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {localSearch || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first quote to get started'}
          </p>
          {!localSearch && statusFilter === 'all' && (
            <Button className="mt-4" onClick={handleCreateQuote}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          )}
        </div>
      ) : (
        <QuoteTable
          quotes={quotes}
          siteId={siteId}
          isLoading={isLoading}
          onViewQuote={handleViewQuote}
          onEditQuote={handleEditQuote}
          onQuotesChange={loadQuotes}
        />
      )}
      
      {/* Quote Builder Dialog */}
      <QuoteBuilderDialog
        open={showBuilder}
        onOpenChange={setShowBuilder}
        quoteId={editQuoteId || undefined}
        siteId={siteId}
        agencyId={agencyId}
        userId={userId}
        userName={userName}
        onSaved={handleQuoteChange}
      />
      
      {/* Quote Detail Dialog */}
      {viewQuoteId && (
        <QuoteDetailDialog
          open={!!viewQuoteId}
          onOpenChange={(open) => !open && setViewQuoteId(null)}
          quoteId={viewQuoteId}
          siteId={siteId}
          onEdit={handleEditQuote}
          onQuoteChange={handleQuoteChange}
        />
      )}
    </div>
  )
}
