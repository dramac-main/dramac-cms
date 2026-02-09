/**
 * useRecentlyViewed - Recently viewed products hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Tracks and displays recently viewed products using localStorage.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPublicProduct } from '../actions/public-ecommerce-actions'
import type { 
  Product, 
  RecentlyViewedResult 
} from '../types/ecommerce-types'

const RECENTLY_VIEWED_KEY = 'ecom_recently_viewed'
const DEFAULT_MAX_ITEMS = 8

interface RecentlyViewedItem {
  productId: string
  viewedAt: string
}

function getStoredRecentlyViewed(siteId: string): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(`${RECENTLY_VIEWED_KEY}_${siteId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setStoredRecentlyViewed(siteId: string, items: RecentlyViewedItem[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`${RECENTLY_VIEWED_KEY}_${siteId}`, JSON.stringify(items))
  } catch (err) {
    console.error('Error saving recently viewed:', err)
  }
}

export function useRecentlyViewed(
  siteId: string,
  maxItems = DEFAULT_MAX_ITEMS
): RecentlyViewedResult {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage
  useEffect(() => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    const stored = getStoredRecentlyViewed(siteId)
    setItems(stored.slice(0, maxItems))
    setIsLoading(false)
  }, [siteId, maxItems])

  // Fetch product details
  useEffect(() => {
    if (items.length === 0) {
      setProducts([])
      return
    }

    async function fetchProducts() {
      const productPromises = items.map(item => 
        getPublicProduct(siteId, item.productId).catch(() => null)
      )
      
      const results = await Promise.all(productPromises)
      const validProducts = results.filter((p): p is Product => p !== null && p.status === 'active')
      setProducts(validProducts)
    }

    fetchProducts()
  }, [siteId, items])

  // Save to localStorage
  useEffect(() => {
    if (siteId && items.length > 0) {
      setStoredRecentlyViewed(siteId, items)
    }
  }, [siteId, items])

  // Add product to recently viewed
  const addProduct = useCallback((productId: string) => {
    setItems(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.productId !== productId)
      
      // Add to front
      const newItem: RecentlyViewedItem = {
        productId,
        viewedAt: new Date().toISOString()
      }
      
      return [newItem, ...filtered].slice(0, maxItems)
    })
  }, [maxItems])

  // Remove product
  const removeProduct = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId))
  }, [])

  // Clear all
  const clear = useCallback(() => {
    setItems([])
    if (siteId) {
      localStorage.removeItem(`${RECENTLY_VIEWED_KEY}_${siteId}`)
    }
  }, [siteId])

  return {
    products,
    isLoading,
    addProduct,
    removeProduct,
    clear
  }
}
