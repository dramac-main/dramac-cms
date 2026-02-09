/**
 * useStorefrontWishlist - Wishlist hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Manages wishlist state in localStorage with product fetching.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPublicProduct } from '../actions/public-ecommerce-actions'
import type { 
  Product, 
  WishlistItem,
  StorefrontWishlistResult 
} from '../types/ecommerce-types'

const WISHLIST_STORAGE_KEY = 'ecom_wishlist'

function getStoredWishlist(siteId: string): WishlistItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(`${WISHLIST_STORAGE_KEY}_${siteId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setStoredWishlist(siteId: string, items: WishlistItem[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`${WISHLIST_STORAGE_KEY}_${siteId}`, JSON.stringify(items))
  } catch (err) {
    console.error('Error saving wishlist:', err)
  }
}

export function useStorefrontWishlist(siteId: string): StorefrontWishlistResult {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load wishlist from localStorage
  useEffect(() => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    const storedItems = getStoredWishlist(siteId)
    setItems(storedItems)
    setIsLoading(false)
  }, [siteId])

  // Fetch product details for wishlist items
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

  // Save to localStorage whenever items change
  useEffect(() => {
    if (siteId) {
      setStoredWishlist(siteId, items)
    }
  }, [siteId, items])

  // Add item
  const addItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => {
      // Check if already exists
      const exists = prev.some(
        item => item.productId === productId && item.variantId === variantId
      )
      
      if (exists) return prev
      
      return [...prev, {
        productId,
        variantId,
        addedAt: new Date().toISOString()
      }]
    })
  }, [])

  // Remove item
  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => prev.filter(
      item => !(item.productId === productId && item.variantId === variantId)
    ))
  }, [])

  // Toggle item
  const toggleItem = useCallback((productId: string, variantId?: string) => {
    const exists = items.some(
      item => item.productId === productId && item.variantId === variantId
    )
    
    if (exists) {
      removeItem(productId, variantId)
    } else {
      addItem(productId, variantId)
    }
  }, [items, addItem, removeItem])

  // Check if in wishlist
  const isInWishlist = useCallback((productId: string, variantId?: string): boolean => {
    return items.some(
      item => item.productId === productId && item.variantId === variantId
    )
  }, [items])

  // Clear wishlist
  const clear = useCallback(() => {
    setItems([])
  }, [])

  // Item count
  const itemCount = useMemo(() => items.length, [items])

  return {
    items,
    products,
    isLoading,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clear,
    itemCount
  }
}
