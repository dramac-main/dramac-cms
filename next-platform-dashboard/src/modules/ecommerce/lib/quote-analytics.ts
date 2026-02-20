/**
 * Quote Analytics Utilities
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Analytics and reporting functions for quotes
 */

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  differenceInDays,
  parseISO 
} from 'date-fns'
import type { 
  QuoteAnalytics, 
  QuotePerformance,
  QuoteStatus 
} from '../types/ecommerce-types'

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
// HELPERS
// ============================================================================

/**
 * Get empty analytics object
 */
function getEmptyAnalytics(): QuoteAnalytics {
  return {
    total_quotes: 0,
    total_value: 0,
    average_value: 0,
    by_status: {
      draft: 0,
      pending_approval: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      cancelled: 0
    },
    conversion_rate: 0,
    rejection_rate: 0,
    expiry_rate: 0,
    average_time_to_accept: 0,
    total_accepted_value: 0,
    total_pending_value: 0,
    total_lost_value: 0,
    quotes_this_month: 0,
    quotes_last_month: 0,
    growth_rate: 0
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

interface QuoteRow {
  id: string
  status: string
  total: number | null
  created_at: string
  sent_at: string | null
  accepted_at: string | null
}

/**
 * Get comprehensive quote analytics for a site
 */
export async function getQuoteAnalytics(siteId: string): Promise<QuoteAnalytics> {
  try {
    const supabase = await getModuleClient()
    
    // Get all quotes
    const { data: quotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id, status, total, created_at, sent_at, accepted_at')
      .eq('site_id', siteId)
    
    if (error || !quotes) {
      return getEmptyAnalytics()
    }
    
    const typedQuotes = quotes as QuoteRow[]
    
    // Calculate metrics
    const total = typedQuotes.length
    const totalValue = typedQuotes.reduce((sum: number, q: QuoteRow) => sum + (q.total || 0), 0)
    const avgValue = total > 0 ? totalValue / total : 0
    
    // Status counts
    const statusCounts: Record<QuoteStatus, number> = {
      draft: 0,
      pending_approval: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      cancelled: 0
    }
    
    for (const quote of typedQuotes) {
      if (quote.status in statusCounts) {
        statusCounts[quote.status as QuoteStatus]++
      }
    }
    
    // Conversion metrics
    const sentQuotes = typedQuotes.filter((q: QuoteRow) => 
      !['draft', 'pending_approval', 'cancelled'].includes(q.status)
    )
    const sentCount = sentQuotes.length
    const acceptedCount = statusCounts.accepted + statusCounts.converted
    const rejectedCount = statusCounts.rejected
    const expiredCount = statusCounts.expired
    
    const conversionRate = sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0
    const rejectionRate = sentCount > 0 ? (rejectedCount / sentCount) * 100 : 0
    const expiryRate = sentCount > 0 ? (expiredCount / sentCount) * 100 : 0
    
    // Time to accept (for accepted quotes)
    const acceptedQuotes = typedQuotes.filter((q: QuoteRow) => 
      q.status === 'accepted' || q.status === 'converted'
    )
    let avgTimeToAccept = 0
    if (acceptedQuotes.length > 0) {
      const totalDays = acceptedQuotes.reduce((sum: number, q: QuoteRow) => {
        if (q.sent_at && q.accepted_at) {
          return sum + differenceInDays(parseISO(q.accepted_at), parseISO(q.sent_at))
        }
        return sum
      }, 0)
      avgTimeToAccept = totalDays / acceptedQuotes.length
    }
    
    // Value metrics
    const acceptedValue = typedQuotes
      .filter((q: QuoteRow) => q.status === 'accepted' || q.status === 'converted')
      .reduce((sum: number, q: QuoteRow) => sum + (q.total || 0), 0)
    
    const pendingValue = typedQuotes
      .filter((q: QuoteRow) => ['sent', 'viewed'].includes(q.status))
      .reduce((sum: number, q: QuoteRow) => sum + (q.total || 0), 0)
    
    const lostValue = typedQuotes
      .filter((q: QuoteRow) => ['rejected', 'expired', 'cancelled'].includes(q.status))
      .reduce((sum: number, q: QuoteRow) => sum + (q.total || 0), 0)
    
    // Time-based metrics
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    
    const quotesThisMonth = typedQuotes.filter((q: QuoteRow) => 
      parseISO(q.created_at) >= thisMonthStart
    ).length
    
    const quotesLastMonth = typedQuotes.filter((q: QuoteRow) => {
      const created = parseISO(q.created_at)
      return created >= lastMonthStart && created <= lastMonthEnd
    }).length
    
    const growthRate = quotesLastMonth > 0 
      ? ((quotesThisMonth - quotesLastMonth) / quotesLastMonth) * 100 
      : 0
    
    return {
      total_quotes: total,
      total_value: totalValue,
      average_value: avgValue,
      by_status: statusCounts,
      conversion_rate: conversionRate,
      rejection_rate: rejectionRate,
      expiry_rate: expiryRate,
      average_time_to_accept: avgTimeToAccept,
      total_accepted_value: acceptedValue,
      total_pending_value: pendingValue,
      total_lost_value: lostValue,
      quotes_this_month: quotesThisMonth,
      quotes_last_month: quotesLastMonth,
      growth_rate: growthRate
    }
  } catch (error) {
    console.error('Error getting quote analytics:', error)
    return getEmptyAnalytics()
  }
}

// ============================================================================
// PERFORMANCE REPORTS
// ============================================================================

/**
 * Get quote performance for the last N months
 */
export async function getQuotePerformance(
  siteId: string,
  months: number = 6
): Promise<QuotePerformance[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data: quotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('status, total, created_at, sent_at, accepted_at')
      .eq('site_id', siteId)
      .gte('created_at', subMonths(new Date(), months).toISOString())
    
    if (error || !quotes) {
      return []
    }
    
    // Group by month
    const monthlyData: Map<string, QuotePerformance> = new Map()
    
    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i)
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthlyData.set(period, {
        period,
        quotes_created: 0,
        quotes_sent: 0,
        quotes_accepted: 0,
        quotes_rejected: 0,
        quotes_expired: 0,
        total_value: 0,
        accepted_value: 0
      })
    }
    
    // Populate data
    for (const quote of quotes) {
      const created = parseISO(quote.created_at)
      const period = `${created.getFullYear()}-${(created.getMonth() + 1).toString().padStart(2, '0')}`
      
      const monthData = monthlyData.get(period)
      if (monthData) {
        monthData.quotes_created++
        monthData.total_value += quote.total || 0
        
        if (['sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'].includes(quote.status)) {
          monthData.quotes_sent++
        }
        
        if (quote.status === 'accepted' || quote.status === 'converted') {
          monthData.quotes_accepted++
          monthData.accepted_value += quote.total || 0
        }
        
        if (quote.status === 'rejected') {
          monthData.quotes_rejected++
        }
        
        if (quote.status === 'expired') {
          monthData.quotes_expired++
        }
      }
    }
    
    // Convert to array and sort by period
    return Array.from(monthlyData.values()).sort((a, b) => a.period.localeCompare(b.period))
  } catch (error) {
    console.error('Error getting quote performance:', error)
    return []
  }
}

// ============================================================================
// TOP PERFORMERS
// ============================================================================

interface TemplateRow {
  id: string
  name: string
  usage_count: number
}

/**
 * Get top templates by usage
 */
export async function getTopTemplates(
  siteId: string,
  limit: number = 5
): Promise<{ id: string; name: string; usage_count: number; conversion_rate: number }[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data: templates, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
      .select('id, name, usage_count')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(limit)
    
    if (error || !templates) {
      return []
    }
    
    return (templates as TemplateRow[]).map((t: TemplateRow) => ({
      id: t.id,
      name: t.name,
      usage_count: t.usage_count,
      conversion_rate: 0 // Placeholder - would need quote-template relationship tracking
    }))
  } catch (error) {
    console.error('Error getting top templates:', error)
    return []
  }
}

/**
 * Get quote value distribution
 */
export async function getQuoteValueDistribution(
  siteId: string
): Promise<{ range: string; count: number }[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data: quotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('total')
      .eq('site_id', siteId)
    
    if (error || !quotes) {
      return []
    }
    
    // Define ranges
    const s = DEFAULT_CURRENCY_SYMBOL
    const ranges = [
      { range: `${s}0 - ${s}100`, min: 0, max: 100, count: 0 },
      { range: `${s}100 - ${s}500`, min: 100, max: 500, count: 0 },
      { range: `${s}500 - ${s}1,000`, min: 500, max: 1000, count: 0 },
      { range: `${s}1,000 - ${s}5,000`, min: 1000, max: 5000, count: 0 },
      { range: `${s}5,000 - ${s}10,000`, min: 5000, max: 10000, count: 0 },
      { range: `${s}10,000+`, min: 10000, max: Infinity, count: 0 }
    ]
    
    for (const quote of quotes) {
      const value = quote.total || 0
      for (const r of ranges) {
        if (value >= r.min && value < r.max) {
          r.count++
          break
        }
      }
    }
    
    return ranges.map(r => ({ range: r.range, count: r.count }))
  } catch (error) {
    console.error('Error getting quote value distribution:', error)
    return []
  }
}
