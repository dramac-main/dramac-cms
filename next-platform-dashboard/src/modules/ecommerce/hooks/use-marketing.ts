/**
 * Marketing Hooks
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Hooks for managing flash sales, bundles, gift cards, and loyalty.
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  getFlashSales,
  getActiveFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  addProductsToFlashSale,
  removeProductFromFlashSale,
  getBundles,
  createBundle,
  updateBundle,
  deleteBundle,
  addItemsToBundle,
  removeItemFromBundle,
  getGiftCards,
  getGiftCardByCode,
  createGiftCard,
  redeemGiftCard,
  refundToGiftCard,
  getLoyaltyConfig,
  configureLoyalty,
  getCustomerLoyaltyPoints,
  getLoyaltyMembers,
  earnPoints,
  redeemPoints,
  adjustLoyaltyPoints,
  getMarketingStats
} from '@/modules/ecommerce/actions/marketing-actions'
import type {
  FlashSale,
  FlashSaleInput,
  FlashSaleUpdate,
  AddFlashSaleProductInput,
  Bundle,
  BundleInput,
  BundleUpdate,
  BundleItemInput,
  GiftCard,
  GiftCardInput,
  GiftCardRedemption,
  LoyaltyConfig,
  LoyaltyConfigInput,
  LoyaltyPoints,
  EarnPointsInput,
  RedeemPointsInput,
  MarketingStats
} from '@/modules/ecommerce/types/marketing-types'

// ============================================================================
// useFlashSales
// ============================================================================

interface UseFlashSalesReturn {
  sales: FlashSale[]
  activeSales: FlashSale[]
  isLoading: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: FlashSaleInput) => Promise<FlashSale | null>
  update: (id: string, updates: FlashSaleUpdate) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  addProducts: (saleId: string, products: AddFlashSaleProductInput[]) => Promise<boolean>
  removeProduct: (saleId: string, productId: string) => Promise<boolean>
}

export function useFlashSales(siteId: string): UseFlashSalesReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sales, setSales] = useState<FlashSale[]>([])
  const [activeSales, setActiveSales] = useState<FlashSale[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [allSales, active] = await Promise.all([
        getFlashSales(siteId),
        getActiveFlashSales(siteId)
      ])
      setSales(allSales)
      setActiveSales(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flash sales')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const create = useCallback(async (input: FlashSaleInput): Promise<FlashSale | null> => {
    const result = await createFlashSale(siteId, input)
    if (result.success && result.sale) {
      setSales(prev => [result.sale!, ...prev])
      return result.sale
    }
    setError(result.error ?? 'Failed to create flash sale')
    return null
  }, [siteId])
  
  const update = useCallback(async (id: string, updates: FlashSaleUpdate): Promise<boolean> => {
    const result = await updateFlashSale(id, updates)
    if (result.success) {
      setSales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
      return true
    }
    setError(result.error ?? 'Failed to update flash sale')
    return false
  }, [])
  
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteFlashSale(id)
    if (result.success) {
      setSales(prev => prev.filter(s => s.id !== id))
      return true
    }
    setError(result.error ?? 'Failed to delete flash sale')
    return false
  }, [])
  
  const addProducts = useCallback(async (
    saleId: string, 
    products: AddFlashSaleProductInput[]
  ): Promise<boolean> => {
    const result = await addProductsToFlashSale(saleId, products)
    if (result.success) {
      await refresh()
      return true
    }
    setError(result.error ?? 'Failed to add products')
    return false
  }, [refresh])
  
  const removeProduct = useCallback(async (
    saleId: string, 
    productId: string
  ): Promise<boolean> => {
    const result = await removeProductFromFlashSale(saleId, productId)
    if (result.success) {
      await refresh()
      return true
    }
    setError(result.error ?? 'Failed to remove product')
    return false
  }, [refresh])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    sales,
    activeSales,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    addProducts,
    removeProduct
  }
}

// ============================================================================
// useBundles
// ============================================================================

interface UseBundlesReturn {
  bundles: Bundle[]
  isLoading: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: BundleInput) => Promise<Bundle | null>
  update: (id: string, updates: BundleUpdate) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  addItems: (bundleId: string, items: BundleItemInput[]) => Promise<boolean>
  removeItem: (bundleId: string, itemId: string) => Promise<boolean>
}

export function useBundles(siteId: string): UseBundlesReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getBundles(siteId)
      setBundles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bundles')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const create = useCallback(async (input: BundleInput): Promise<Bundle | null> => {
    const result = await createBundle(siteId, input)
    if (result.success && result.bundle) {
      setBundles(prev => [result.bundle!, ...prev])
      return result.bundle
    }
    setError(result.error ?? 'Failed to create bundle')
    return null
  }, [siteId])
  
  const update = useCallback(async (id: string, updates: BundleUpdate): Promise<boolean> => {
    const result = await updateBundle(id, updates)
    if (result.success) {
      setBundles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
      return true
    }
    setError(result.error ?? 'Failed to update bundle')
    return false
  }, [])
  
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteBundle(id)
    if (result.success) {
      setBundles(prev => prev.filter(b => b.id !== id))
      return true
    }
    setError(result.error ?? 'Failed to delete bundle')
    return false
  }, [])
  
  const addItems = useCallback(async (
    bundleId: string, 
    items: BundleItemInput[]
  ): Promise<boolean> => {
    const result = await addItemsToBundle(bundleId, items)
    if (result.success) {
      await refresh()
      return true
    }
    setError(result.error ?? 'Failed to add items')
    return false
  }, [refresh])
  
  const removeItem = useCallback(async (
    bundleId: string, 
    itemId: string
  ): Promise<boolean> => {
    const result = await removeItemFromBundle(bundleId, itemId)
    if (result.success) {
      await refresh()
      return true
    }
    setError(result.error ?? 'Failed to remove item')
    return false
  }, [refresh])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    bundles,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    addItems,
    removeItem
  }
}

// ============================================================================
// useGiftCards
// ============================================================================

interface UseGiftCardsReturn {
  cards: GiftCard[]
  isLoading: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: GiftCardInput) => Promise<GiftCard | null>
  lookup: (code: string) => Promise<GiftCard | null>
  redeem: (redemption: GiftCardRedemption) => Promise<{ amount_applied?: number } | null>
  refund: (cardId: string, amount: number, orderId?: string) => Promise<boolean>
}

export function useGiftCards(siteId: string): UseGiftCardsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cards, setCards] = useState<GiftCard[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getGiftCards(siteId)
      setCards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gift cards')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const create = useCallback(async (input: GiftCardInput): Promise<GiftCard | null> => {
    const result = await createGiftCard(siteId, input)
    if (result.success && result.gift_card) {
      setCards(prev => [result.gift_card!, ...prev])
      return result.gift_card
    }
    setError(result.error ?? 'Failed to create gift card')
    return null
  }, [siteId])
  
  const lookup = useCallback(async (code: string): Promise<GiftCard | null> => {
    const card = await getGiftCardByCode(siteId, code)
    return card
  }, [siteId])
  
  const redeem = useCallback(async (
    redemption: GiftCardRedemption
  ): Promise<{ amount_applied?: number } | null> => {
    const result = await redeemGiftCard(siteId, redemption)
    if (result.success) {
      await refresh()
      return { amount_applied: result.amount_applied }
    }
    setError(result.error ?? 'Failed to redeem gift card')
    return null
  }, [siteId, refresh])
  
  const refund = useCallback(async (
    cardId: string, 
    amount: number, 
    orderId?: string
  ): Promise<boolean> => {
    const result = await refundToGiftCard(cardId, amount, orderId)
    if (result.success) {
      await refresh()
      return true
    }
    setError(result.error ?? 'Failed to refund')
    return false
  }, [refresh])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    cards,
    isLoading,
    error,
    refresh,
    create,
    lookup,
    redeem,
    refund
  }
}

// ============================================================================
// useLoyalty
// ============================================================================

interface UseLoyaltyReturn {
  config: LoyaltyConfig | null
  members: LoyaltyPoints[]
  totalMembers: number
  isLoading: boolean
  error: string | null
  
  refreshConfig: () => Promise<void>
  refreshMembers: (options?: { limit?: number; offset?: number }) => Promise<void>
  updateConfig: (input: LoyaltyConfigInput) => Promise<boolean>
  getCustomerPoints: (customerId: string) => Promise<LoyaltyPoints | null>
  earnCustomerPoints: (input: EarnPointsInput) => Promise<{ new_balance?: number } | null>
  redeemCustomerPoints: (input: RedeemPointsInput) => Promise<{ new_balance?: number; discount_value?: number } | null>
  adjustPoints: (customerId: string, points: number, description: string) => Promise<boolean>
}

export function useLoyalty(siteId: string): UseLoyaltyReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<LoyaltyConfig | null>(null)
  const [members, setMembers] = useState<LoyaltyPoints[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  
  const refreshConfig = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getLoyaltyConfig(siteId)
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loyalty config')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const refreshMembers = useCallback(async (options?: { limit?: number; offset?: number }) => {
    if (!siteId) return
    
    try {
      const { members: data, total } = await getLoyaltyMembers(siteId, options)
      setMembers(data)
      setTotalMembers(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loyalty members')
    }
  }, [siteId])
  
  const updateConfig = useCallback(async (input: LoyaltyConfigInput): Promise<boolean> => {
    const result = await configureLoyalty(siteId, input)
    if (result.success && result.config) {
      setConfig(result.config)
      return true
    }
    setError(result.error ?? 'Failed to update config')
    return false
  }, [siteId])
  
  const getCustomerPoints = useCallback(async (customerId: string): Promise<LoyaltyPoints | null> => {
    return await getCustomerLoyaltyPoints(siteId, customerId)
  }, [siteId])
  
  const earnCustomerPoints = useCallback(async (
    input: EarnPointsInput
  ): Promise<{ new_balance?: number } | null> => {
    const result = await earnPoints(siteId, input)
    if (result.success) {
      return { new_balance: result.new_balance }
    }
    setError(result.error ?? 'Failed to earn points')
    return null
  }, [siteId])
  
  const redeemCustomerPoints = useCallback(async (
    input: RedeemPointsInput
  ): Promise<{ new_balance?: number; discount_value?: number } | null> => {
    const result = await redeemPoints(siteId, input)
    if (result.success) {
      return { 
        new_balance: result.new_balance,
        discount_value: result.discount_value
      }
    }
    setError(result.error ?? 'Failed to redeem points')
    return null
  }, [siteId])
  
  const adjustPoints = useCallback(async (
    customerId: string,
    points: number,
    description: string
  ): Promise<boolean> => {
    const result = await adjustLoyaltyPoints(siteId, customerId, points, description)
    if (result.success) {
      await refreshMembers()
      return true
    }
    setError(result.error ?? 'Failed to adjust points')
    return false
  }, [siteId, refreshMembers])
  
  useEffect(() => {
    refreshConfig()
    refreshMembers({ limit: 50 })
  }, [refreshConfig, refreshMembers])
  
  return {
    config,
    members,
    totalMembers,
    isLoading,
    error,
    refreshConfig,
    refreshMembers,
    updateConfig,
    getCustomerPoints,
    earnCustomerPoints,
    redeemCustomerPoints,
    adjustPoints
  }
}

// ============================================================================
// useMarketingStats
// ============================================================================

interface UseMarketingStatsReturn {
  stats: MarketingStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useMarketingStats(siteId: string): UseMarketingStatsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<MarketingStats | null>(null)
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getMarketingStats(siteId)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch marketing stats')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    stats,
    isLoading,
    error,
    refresh
  }
}
