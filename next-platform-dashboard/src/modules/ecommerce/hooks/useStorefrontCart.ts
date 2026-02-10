/**
 * useStorefrontCart - Cart management hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Provides cart state and operations for storefront components.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatCurrency } from '@/lib/locale-config'
import {
  getPublicOrCreateCart,
  getPublicCart,
  addPublicCartItem,
  updatePublicCartItemQuantity as updateCartItemQty,
  removePublicCartItem as removeCartItemAction,
  clearPublicCart as clearCartAction,
  applyPublicDiscountToCart,
  removePublicDiscountFromCart,
} from '../actions/public-ecommerce-actions'
import type { 
  Cart, 
  CartTotals,
  StorefrontCartResult,
  EcommerceSettings,
} from '../types/ecommerce-types'
import { calculateShipping } from '../lib/shipping-calculator'

// Session ID for guest carts
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem('ecom_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('ecom_session_id', sessionId)
  }
  return sessionId
}

// Local totals calculation (synchronous)
function calculateLocalTotals(cart: Cart, taxRate: number, settings?: EcommerceSettings | null): CartTotals {
  const subtotal = cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const discount = cart.discount_amount || 0
  const taxableAmount = subtotal - discount
  const tax = (taxableAmount * taxRate) / 100

  // Calculate shipping from settings if available
  let shipping = 0
  if (settings) {
    try {
      const result = calculateShipping({
        items: cart.items,
        shippingAddress: { first_name: '', last_name: '', address_line_1: '', city: '', state: '', postal_code: '', country: '' },
        settings,
        subtotal: taxableAmount,
      })
      shipping = result.cost
    } catch {
      // Fallback to free shipping on error
      shipping = 0
    }
  }

  const total = taxableAmount + tax + shipping
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  
  return {
    subtotal,
    discount,
    tax,
    shipping,
    total,
    itemCount
  }
}

export function useStorefrontCart(
  siteId: string,
  userId?: string,
  taxRate = 0
): StorefrontCartResult {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize cart
  const initCart = useCallback(async () => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const sessionId = userId ? undefined : getOrCreateSessionId()
      const cartData = await getPublicOrCreateCart(siteId, userId, sessionId)
      setCart(cartData)
    } catch (err) {
      console.error('Error initializing cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, userId])

  useEffect(() => {
    initCart()
  }, [initCart])

  // Refresh cart
  const refresh = useCallback(async () => {
    if (!cart?.id) return
    
    try {
      const refreshedCart = await getPublicCart(cart.id)
      if (refreshedCart) {
        setCart(refreshedCart)
      }
    } catch (err) {
      console.error('Error refreshing cart:', err)
    }
  }, [cart?.id])

  // Calculate totals locally (synchronous)
  const totals = useMemo((): CartTotals | null => {
    if (!cart) return null
    return calculateLocalTotals(cart, taxRate)
  }, [cart, taxRate])

  // Item count
  const itemCount = useMemo(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart?.items])

  // Add item to cart
  const addItem = useCallback(async (
    productId: string,
    variantId: string | null,
    quantity: number
  ): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      // addCartItem returns CartItem, not Cart - so we need to refresh
      await addPublicCartItem(cart.id, productId, variantId, quantity)
      // Refresh to get the full updated cart with all items
      const refreshedCart = await getPublicCart(cart.id)
      if (refreshedCart) {
        setCart(refreshedCart)
      }
      return true
    } catch (err) {
      console.error('Error adding to cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to add item')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id])

  // Update item quantity
  const updateItemQuantity = useCallback(async (
    itemId: string,
    quantity: number
  ): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      await updateCartItemQty(itemId, quantity)
      await refresh()
      return true
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id, refresh])

  // Remove item
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      await removeCartItemAction(itemId)
      await refresh()
      return true
    } catch (err) {
      console.error('Error removing item:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id, refresh])

  // Clear cart
  const clearCartFn = useCallback(async (): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      await clearCartAction(cart.id)
      // Reinitialize empty cart
      await initCart()
      return true
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear cart')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id, initCart])

  // Apply discount
  const applyDiscount = useCallback(async (
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!cart?.id) {
      return { success: false, message: 'Cart not initialized' }
    }

    setIsUpdating(true)
    setError(null)

    try {
      // Calculate subtotal
      const subtotal = cart.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0
      const result = await applyPublicDiscountToCart(cart.id, code, subtotal)
      if (result.success) {
        await refresh()
      }
      return { 
        success: result.success, 
        message: result.success 
          ? `Discount applied: -${formatCurrency(result.discountAmount)}`
          : result.error || 'Invalid discount code'
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply discount'
      setError(message)
      return { success: false, message }
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id, cart?.items, refresh])

  // Remove discount
  const removeDiscount = useCallback(async (): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      await removePublicDiscountFromCart(cart.id)
      await refresh()
      return true
    } catch (err) {
      console.error('Error removing discount:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove discount')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id, refresh])

  return {
    cart,
    items: cart?.items || [],
    totals,
    itemCount,
    isLoading,
    isUpdating,
    error,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart: clearCartFn,
    applyDiscount,
    removeDiscount,
    refresh
  }
}
