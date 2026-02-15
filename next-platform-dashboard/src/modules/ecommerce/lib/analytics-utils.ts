/**
 * Analytics Utilities
 * 
 * Phase ECOM-41A: Analytics & Reports
 * 
 * Helper functions for date ranges, formatting, and calculations.
 * NOTE: No 'use server' - these are pure utility functions.
 */

import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
  differenceInDays,
  parseISO
} from 'date-fns'
import type { DateRange, DateRangePreset, GroupByPeriod } from '../types/analytics-types'
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/locale-config'

// ============================================================================
// DATE RANGE HELPERS
// ============================================================================

/**
 * Convert a preset to actual date range
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()
  
  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return {
        start: startOfDay(yesterday).toISOString(),
        end: endOfDay(yesterday).toISOString(),
        preset
      }
    
    case 'last_7_days':
      return {
        start: startOfDay(subDays(now, 6)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'last_30_days':
      return {
        start: startOfDay(subDays(now, 29)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'last_90_days':
      return {
        start: startOfDay(subDays(now, 89)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'this_month':
      return {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString(),
        preset
      }
    
    case 'last_month':
      const lastMonth = subMonths(now, 1)
      return {
        start: startOfMonth(lastMonth).toISOString(),
        end: endOfMonth(lastMonth).toISOString(),
        preset
      }
    
    case 'this_quarter':
      return {
        start: startOfQuarter(now).toISOString(),
        end: endOfQuarter(now).toISOString(),
        preset
      }
    
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1)
      return {
        start: startOfQuarter(lastQuarter).toISOString(),
        end: endOfQuarter(lastQuarter).toISOString(),
        preset
      }
    
    case 'this_year':
      return {
        start: startOfYear(now).toISOString(),
        end: endOfYear(now).toISOString(),
        preset
      }
    
    case 'last_year':
      const lastYear = subYears(now, 1)
      return {
        start: startOfYear(lastYear).toISOString(),
        end: endOfYear(lastYear).toISOString(),
        preset
      }
    
    default:
      // Default to last 30 days
      return {
        start: startOfDay(subDays(now, 29)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset: 'last_30_days'
      }
  }
}

/**
 * Get comparison date range (previous period of same length)
 */
export function getComparisonDateRange(dateRange: DateRange): DateRange {
  const start = parseISO(dateRange.start)
  const end = parseISO(dateRange.end)
  const daysDiff = differenceInDays(end, start) + 1
  
  return {
    start: subDays(start, daysDiff).toISOString(),
    end: subDays(start, 1).toISOString()
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(dateRange: DateRange): string {
  const start = parseISO(dateRange.start)
  const end = parseISO(dateRange.end)
  
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return format(start, 'MMM d, yyyy')
  }
  
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

/**
 * Get preset label for display
 */
export function getPresetLabel(preset: DateRangePreset): string {
  const labels: Record<DateRangePreset, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last_7_days: 'Last 7 Days',
    last_30_days: 'Last 30 Days',
    last_90_days: 'Last 90 Days',
    this_month: 'This Month',
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    last_quarter: 'Last Quarter',
    this_year: 'This Year',
    last_year: 'Last Year',
    custom: 'Custom Range'
  }
  
  return labels[preset] || preset
}

// ============================================================================
// GROUPING HELPERS
// ============================================================================

/**
 * Determine best grouping period based on date range
 */
export function suggestGroupingPeriod(dateRange: DateRange): GroupByPeriod {
  const start = parseISO(dateRange.start)
  const end = parseISO(dateRange.end)
  const days = differenceInDays(end, start)
  
  if (days <= 1) return 'hour'
  if (days <= 14) return 'day'
  if (days <= 60) return 'week'
  if (days <= 365) return 'month'
  return 'quarter'
}

/**
 * Format period label based on grouping
 */
export function formatPeriodLabel(date: string, groupBy: GroupByPeriod): string {
  const d = parseISO(date)
  
  switch (groupBy) {
    case 'hour':
      return format(d, 'h:mm a')
    case 'day':
      return format(d, 'MMM d')
    case 'week':
      return `Week of ${format(startOfWeek(d), 'MMM d')}`
    case 'month':
      return format(d, 'MMM yyyy')
    case 'quarter':
      const q = Math.ceil((d.getMonth() + 1) / 3)
      return `Q${q} ${format(d, 'yyyy')}`
    case 'year':
      return format(d, 'yyyy')
    default:
      return format(d, 'MMM d, yyyy')
  }
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate percentage change between two values
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(conversions: number, total: number): number {
  if (total === 0) return 0
  return (conversions / total) * 100
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency value — uses platform defaults from locale-config
 */
export function formatCurrency(cents: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

/**
 * Format large number with abbreviations
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Format change indicator
 */
export function formatChange(current: number, previous: number): {
  value: number
  formatted: string
  type: 'increase' | 'decrease' | 'neutral'
} {
  const change = calculateChange(current, previous)
  
  return {
    value: change,
    formatted: formatPercentage(change),
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  }
}

// ============================================================================
// CHART HELPERS
// ============================================================================

/**
 * Generate color palette for charts
 */
export function getChartColors(count: number): string[] {
  const baseColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
  ]
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }
  
  // Generate more colors if needed
  const colors = [...baseColors]
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.508) % 360 // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`)
  }
  
  return colors
}

/**
 * Format chart tooltip value
 */
export function formatTooltipValue(value: number, type: 'currency' | 'number' | 'percentage'): string {
  switch (type) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    default:
      return value.toLocaleString()
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Convert data to CSV format
 */
export function toCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return String(value)
    }).join(',')
  )
  
  return [header, ...rows].join('\n')
}

/**
 * Trigger CSV download
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
