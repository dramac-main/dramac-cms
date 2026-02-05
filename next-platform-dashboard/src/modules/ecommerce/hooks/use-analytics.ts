'use client'

/**
 * useAnalytics Hook
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * React hooks for fetching and managing analytics data.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  DateRange,
  DateRangePreset,
  GroupByPeriod,
  SalesOverview,
  SalesByPeriod,
  SalesByChannel,
  RevenueBreakdown,
  ProductPerformance,
  CategoryPerformance,
  CustomerInsights,
  CustomerLifetimeValue,
  CustomerSegmentation,
  ConversionFunnel,
  CartAbandonment,
  SavedReport,
  SavedReportInput
} from '../types/analytics-types'
import {
  getDateRangeFromPreset,
  getComparisonDateRange,
  suggestGroupingPeriod
} from '../lib/analytics-utils'
import {
  getSalesOverview,
  getSalesByPeriod,
  getSalesByChannel,
  getRevenueBreakdown,
  getProductPerformance,
  getTopProducts,
  getCategoryPerformance,
  getCustomerInsights,
  getCustomerLifetimeValue,
  getCustomerSegmentation,
  getConversionFunnel,
  getCartAbandonmentRate,
  getSavedReports,
  createSavedReport,
  updateSavedReport,
  deleteSavedReport,
  toggleReportFavorite
} from '../actions/analytics-actions'

// ============================================================================
// DATE RANGE HOOK
// ============================================================================

export interface UseDateRangeReturn {
  dateRange: DateRange
  preset: DateRangePreset
  comparisonRange: DateRange
  groupBy: GroupByPeriod
  setPreset: (preset: DateRangePreset) => void
  setCustomRange: (start: string, end: string) => void
  setGroupBy: (groupBy: GroupByPeriod) => void
}

export function useDateRange(
  initialPreset: DateRangePreset = 'last_30_days'
): UseDateRangeReturn {
  const [preset, setPresetState] = useState<DateRangePreset>(initialPreset)
  const [dateRange, setDateRange] = useState<DateRange>(() => 
    getDateRangeFromPreset(initialPreset)
  )
  const [groupBy, setGroupBy] = useState<GroupByPeriod>(() => 
    suggestGroupingPeriod(getDateRangeFromPreset(initialPreset))
  )
  
  const comparisonRange = useMemo(() => 
    getComparisonDateRange(dateRange), 
    [dateRange]
  )
  
  const setPreset = useCallback((newPreset: DateRangePreset) => {
    setPresetState(newPreset)
    const newRange = getDateRangeFromPreset(newPreset)
    setDateRange(newRange)
    setGroupBy(suggestGroupingPeriod(newRange))
  }, [])
  
  const setCustomRange = useCallback((start: string, end: string) => {
    const newRange = { start, end, preset: 'custom' as DateRangePreset }
    setPresetState('custom')
    setDateRange(newRange)
    setGroupBy(suggestGroupingPeriod(newRange))
  }, [])
  
  return {
    dateRange,
    preset,
    comparisonRange,
    groupBy,
    setPreset,
    setCustomRange,
    setGroupBy
  }
}

// ============================================================================
// SALES ANALYTICS HOOK
// ============================================================================

export interface UseSalesAnalyticsReturn {
  overview: SalesOverview | null
  salesByPeriod: SalesByPeriod[] | null
  salesByChannel: SalesByChannel[] | null
  revenueBreakdown: RevenueBreakdown | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useSalesAnalytics(
  siteId: string,
  dateRange: DateRange,
  groupBy: GroupByPeriod = 'day'
): UseSalesAnalyticsReturn {
  const [overview, setOverview] = useState<SalesOverview | null>(null)
  const [salesByPeriod, setSalesByPeriod] = useState<SalesByPeriod[] | null>(null)
  const [salesByChannel, setSalesByChannel] = useState<SalesByChannel[] | null>(null)
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [
        overviewResult,
        periodResult,
        channelResult,
        breakdownResult
      ] = await Promise.all([
        getSalesOverview(siteId, dateRange),
        getSalesByPeriod(siteId, dateRange, groupBy),
        getSalesByChannel(siteId, dateRange),
        getRevenueBreakdown(siteId, dateRange)
      ])
      
      if (overviewResult.error) throw new Error(overviewResult.error)
      if (periodResult.error) throw new Error(periodResult.error)
      if (channelResult.error) throw new Error(channelResult.error)
      if (breakdownResult.error) throw new Error(breakdownResult.error)
      
      setOverview(overviewResult.data)
      setSalesByPeriod(periodResult.data)
      setSalesByChannel(channelResult.data)
      setRevenueBreakdown(breakdownResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales analytics')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, dateRange, groupBy])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return {
    overview,
    salesByPeriod,
    salesByChannel,
    revenueBreakdown,
    isLoading,
    error,
    refresh: fetchData
  }
}

// ============================================================================
// PRODUCT ANALYTICS HOOK
// ============================================================================

export interface UseProductAnalyticsReturn {
  products: ProductPerformance[] | null
  topProducts: ProductPerformance[] | null
  categories: CategoryPerformance[] | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProductAnalytics(
  siteId: string,
  dateRange: DateRange,
  limit: number = 10
): UseProductAnalyticsReturn {
  const [products, setProducts] = useState<ProductPerformance[] | null>(null)
  const [topProducts, setTopProducts] = useState<ProductPerformance[] | null>(null)
  const [categories, setCategories] = useState<CategoryPerformance[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [
        productsResult,
        topResult,
        categoriesResult
      ] = await Promise.all([
        getProductPerformance(siteId, dateRange, limit),
        getTopProducts(siteId, dateRange, 'revenue', 5),
        getCategoryPerformance(siteId, dateRange)
      ])
      
      if (productsResult.error) throw new Error(productsResult.error)
      if (topResult.error) throw new Error(topResult.error)
      if (categoriesResult.error) throw new Error(categoriesResult.error)
      
      setProducts(productsResult.data)
      setTopProducts(topResult.data)
      setCategories(categoriesResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product analytics')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, dateRange, limit])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return {
    products,
    topProducts,
    categories,
    isLoading,
    error,
    refresh: fetchData
  }
}

// ============================================================================
// CUSTOMER ANALYTICS HOOK
// ============================================================================

export interface UseCustomerAnalyticsReturn {
  insights: CustomerInsights | null
  lifetimeValue: CustomerLifetimeValue[] | null
  segmentation: CustomerSegmentation | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCustomerAnalytics(
  siteId: string,
  dateRange: DateRange
): UseCustomerAnalyticsReturn {
  const [insights, setInsights] = useState<CustomerInsights | null>(null)
  const [lifetimeValue, setLifetimeValue] = useState<CustomerLifetimeValue[] | null>(null)
  const [segmentation, setSegmentation] = useState<CustomerSegmentation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [
        insightsResult,
        clvResult,
        segmentResult
      ] = await Promise.all([
        getCustomerInsights(siteId, dateRange),
        getCustomerLifetimeValue(siteId, 10),
        getCustomerSegmentation(siteId)
      ])
      
      if (insightsResult.error) throw new Error(insightsResult.error)
      if (clvResult.error) throw new Error(clvResult.error)
      if (segmentResult.error) throw new Error(segmentResult.error)
      
      setInsights(insightsResult.data)
      setLifetimeValue(clvResult.data)
      setSegmentation(segmentResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer analytics')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, dateRange])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return {
    insights,
    lifetimeValue,
    segmentation,
    isLoading,
    error,
    refresh: fetchData
  }
}

// ============================================================================
// CONVERSION ANALYTICS HOOK
// ============================================================================

export interface UseConversionAnalyticsReturn {
  funnel: ConversionFunnel | null
  cartAbandonment: CartAbandonment | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useConversionAnalytics(
  siteId: string,
  dateRange: DateRange
): UseConversionAnalyticsReturn {
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null)
  const [cartAbandonment, setCartAbandonment] = useState<CartAbandonment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [funnelResult, abandonmentResult] = await Promise.all([
        getConversionFunnel(siteId, dateRange),
        getCartAbandonmentRate(siteId, dateRange)
      ])
      
      if (funnelResult.error) throw new Error(funnelResult.error)
      if (abandonmentResult.error) throw new Error(abandonmentResult.error)
      
      setFunnel(funnelResult.data)
      setCartAbandonment(abandonmentResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversion analytics')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, dateRange])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return {
    funnel,
    cartAbandonment,
    isLoading,
    error,
    refresh: fetchData
  }
}

// ============================================================================
// SAVED REPORTS HOOK
// ============================================================================

export interface UseSavedReportsReturn {
  reports: SavedReport[]
  favorites: SavedReport[]
  isLoading: boolean
  error: string | null
  createReport: (input: SavedReportInput) => Promise<SavedReport | null>
  updateReport: (id: string, input: Partial<SavedReportInput>) => Promise<SavedReport | null>
  deleteReport: (id: string) => Promise<boolean>
  toggleFavorite: (id: string) => Promise<SavedReport | null>
  refresh: () => Promise<void>
}

export function useSavedReports(siteId: string): UseSavedReportsReturn {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const favorites = useMemo(() => 
    reports.filter(r => r.is_favorite),
    [reports]
  )
  
  const fetchData = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getSavedReports(siteId)
      if (result.error) throw new Error(result.error)
      setReports(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved reports')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  const createReportHandler = useCallback(async (input: SavedReportInput): Promise<SavedReport | null> => {
    const result = await createSavedReport(siteId, input)
    if (result.error) {
      setError(result.error)
      return null
    }
    if (result.data) {
      setReports(prev => [result.data!, ...prev])
    }
    return result.data
  }, [siteId])
  
  const updateReportHandler = useCallback(async (
    id: string, 
    input: Partial<SavedReportInput>
  ): Promise<SavedReport | null> => {
    const result = await updateSavedReport(id, input)
    if (result.error) {
      setError(result.error)
      return null
    }
    if (result.data) {
      setReports(prev => prev.map(r => r.id === id ? result.data! : r))
    }
    return result.data
  }, [])
  
  const deleteReportHandler = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteSavedReport(id)
    if (result.error) {
      setError(result.error)
      return false
    }
    setReports(prev => prev.filter(r => r.id !== id))
    return true
  }, [])
  
  const toggleFavoriteHandler = useCallback(async (id: string): Promise<SavedReport | null> => {
    const result = await toggleReportFavorite(id)
    if (result.error) {
      setError(result.error)
      return null
    }
    if (result.data) {
      setReports(prev => prev.map(r => r.id === id ? result.data! : r))
    }
    return result.data
  }, [])
  
  return {
    reports,
    favorites,
    isLoading,
    error,
    createReport: createReportHandler,
    updateReport: updateReportHandler,
    deleteReport: deleteReportHandler,
    toggleFavorite: toggleFavoriteHandler,
    refresh: fetchData
  }
}

// ============================================================================
// COMBINED ANALYTICS HOOK
// ============================================================================

export interface UseAnalyticsReturn {
  dateRange: UseDateRangeReturn
  sales: UseSalesAnalyticsReturn
  products: UseProductAnalyticsReturn
  customers: UseCustomerAnalyticsReturn
  conversions: UseConversionAnalyticsReturn
  savedReports: UseSavedReportsReturn
  refreshAll: () => Promise<void>
}

export function useAnalytics(
  siteId: string,
  initialPreset: DateRangePreset = 'last_30_days'
): UseAnalyticsReturn {
  const dateRange = useDateRange(initialPreset)
  const sales = useSalesAnalytics(siteId, dateRange.dateRange, dateRange.groupBy)
  const products = useProductAnalytics(siteId, dateRange.dateRange)
  const customers = useCustomerAnalytics(siteId, dateRange.dateRange)
  const conversions = useConversionAnalytics(siteId, dateRange.dateRange)
  const savedReports = useSavedReports(siteId)
  
  const refreshAll = useCallback(async () => {
    await Promise.all([
      sales.refresh(),
      products.refresh(),
      customers.refresh(),
      conversions.refresh(),
      savedReports.refresh()
    ])
  }, [sales, products, customers, conversions, savedReports])
  
  return {
    dateRange,
    sales,
    products,
    customers,
    conversions,
    savedReports,
    refreshAll
  }
}
