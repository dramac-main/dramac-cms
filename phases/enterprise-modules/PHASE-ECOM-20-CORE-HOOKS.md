# PHASE-ECOM-20: Core Data Hooks & Context

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 6-8 hours
> **Prerequisites**: ECOM-01 through ECOM-13 (Wave 1 & 2 Complete)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create standalone React hooks for fetching e-commerce data that can be used across Studio components and public website pages. These hooks provide a consistent API for products, cart, wishlist, search, and recently viewed items, forming the data layer foundation for all Wave 3 frontend components.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce actions (`src/modules/ecommerce/actions/`)
- [ ] Review existing StorefrontWidget.tsx for patterns
- [ ] Verify Wave 1 & 2 phases are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
StorefrontProvider (Context)
├── Provides: siteId, settings, currency
├── Wraps all storefront hooks
└── Used by: All Studio e-commerce components

Hooks Layer
├── useStorefrontProducts   → Product listing with filters
├── useStorefrontProduct    → Single product details
├── useStorefrontCategories → Category tree
├── useStorefrontCart       → Cart operations
├── useStorefrontWishlist   → Wishlist (localStorage)
├── useStorefrontSearch     → Product search
└── useRecentlyViewed       → Recently viewed (localStorage)

Data Flow
[Server Actions] → [Hooks] → [Context] → [Components]
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/hooks/index.ts` | Create | Export all hooks |
| `src/modules/ecommerce/hooks/useStorefrontProducts.ts` | Create | Product listing hook |
| `src/modules/ecommerce/hooks/useStorefrontProduct.ts` | Create | Single product hook |
| `src/modules/ecommerce/hooks/useStorefrontCategories.ts` | Create | Categories hook |
| `src/modules/ecommerce/hooks/useStorefrontCart.ts` | Create | Cart management hook |
| `src/modules/ecommerce/hooks/useStorefrontWishlist.ts` | Create | Wishlist hook |
| `src/modules/ecommerce/hooks/useStorefrontSearch.ts` | Create | Search hook |
| `src/modules/ecommerce/hooks/useRecentlyViewed.ts` | Create | Recently viewed hook |
| `src/modules/ecommerce/context/storefront-context.tsx` | Create | Storefront provider |
| `src/modules/ecommerce/index.ts` | Modify | Export new hooks |

---

## 📋 Implementation Tasks

### Task 20.1: Create Storefront Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end of file)

**Description**: Add types specific to storefront hooks

```typescript
// ============================================================================
// STOREFRONT HOOK TYPES (Phase ECOM-20)
// ============================================================================

export interface StorefrontProductsOptions {
  categoryId?: string
  categorySlug?: string
  featured?: boolean
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'name' | 'price-asc' | 'price-desc' | 'newest' | 'popularity'
  limit?: number
  page?: number
}

export interface StorefrontProductsResult {
  products: Product[]
  pagination: {
    total: number
    page: number
    totalPages: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface StorefrontProductResult {
  product: Product | null
  variants: ProductVariant[]
  options: ProductOption[]
  relatedProducts: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface StorefrontCategoriesResult {
  categories: Category[]
  categoryTree: CategoryTreeNode[]
  isLoading: boolean
  error: string | null
  getCategoryById: (id: string) => Category | undefined
  getCategoryBySlug: (slug: string) => Category | undefined
  getCategoryPath: (categoryId: string) => Category[]
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  level: number
}

export interface StorefrontCartResult {
  cart: Cart | null
  items: CartItem[]
  totals: CartTotals | null
  itemCount: number
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<boolean>
  updateItemQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>
  removeDiscount: () => Promise<boolean>
  refresh: () => Promise<void>
}

export interface WishlistItem {
  productId: string
  variantId?: string
  addedAt: string
}

export interface StorefrontWishlistResult {
  items: WishlistItem[]
  products: Product[]
  isLoading: boolean
  addItem: (productId: string, variantId?: string) => void
  removeItem: (productId: string, variantId?: string) => void
  toggleItem: (productId: string, variantId?: string) => void
  isInWishlist: (productId: string, variantId?: string) => boolean
  clear: () => void
  itemCount: number
}

export interface StorefrontSearchResult {
  query: string
  setQuery: (query: string) => void
  results: Product[]
  isSearching: boolean
  error: string | null
  recentSearches: string[]
  clearRecentSearches: () => void
}

export interface RecentlyViewedResult {
  products: Product[]
  isLoading: boolean
  addProduct: (productId: string) => void
  removeProduct: (productId: string) => void
  clear: () => void
}

export interface StorefrontContextValue {
  siteId: string
  settings: EcommerceSettings | null
  currency: string
  currencySymbol: string
  taxRate: number
  formatPrice: (amount: number) => string
  isInitialized: boolean
}
```

---

### Task 20.2: Create useStorefrontProducts Hook

**File**: `src/modules/ecommerce/hooks/useStorefrontProducts.ts`
**Action**: Create

**Description**: Hook for fetching product listings with filters and pagination

```typescript
/**
 * useStorefrontProducts - Product listing hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Fetches products with filtering, sorting, and pagination support.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getProducts, getProductsByCategory } from '../actions/ecommerce-actions'
import type { 
  Product, 
  StorefrontProductsOptions, 
  StorefrontProductsResult 
} from '../types/ecommerce-types'

export function useStorefrontProducts(
  siteId: string,
  options: StorefrontProductsOptions = {}
): StorefrontProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    limit: options.limit || 12,
    hasNext: false,
    hasPrev: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize options to prevent unnecessary re-fetches
  const optionsKey = useMemo(() => JSON.stringify(options), [options])

  const fetchProducts = useCallback(async () => {
    if (!siteId) return

    setIsLoading(true)
    setError(null)

    try {
      const {
        categoryId,
        categorySlug,
        featured,
        search,
        minPrice,
        maxPrice,
        inStock,
        sortBy,
        limit = 12,
        page = 1
      } = options

      // Build filters for the action
      const filters: Record<string, unknown> = {}
      
      if (featured !== undefined) filters.featured = featured
      if (search) filters.search = search
      if (minPrice !== undefined) filters.minPrice = minPrice
      if (maxPrice !== undefined) filters.maxPrice = maxPrice
      if (inStock !== undefined) filters.inStock = inStock

      // Handle sorting
      if (sortBy) {
        switch (sortBy) {
          case 'price-asc':
            filters.sortBy = 'base_price'
            filters.sortOrder = 'asc'
            break
          case 'price-desc':
            filters.sortBy = 'base_price'
            filters.sortOrder = 'desc'
            break
          case 'newest':
            filters.sortBy = 'created_at'
            filters.sortOrder = 'desc'
            break
          case 'name':
            filters.sortBy = 'name'
            filters.sortOrder = 'asc'
            break
          case 'popularity':
            // Would need a popularity field
            filters.sortBy = 'created_at'
            filters.sortOrder = 'desc'
            break
        }
      }

      let result

      // Fetch by category or all products
      if (categoryId || categorySlug) {
        result = await getProductsByCategory(
          siteId,
          categoryId || categorySlug || '',
          filters,
          page,
          limit
        )
      } else {
        result = await getProducts(siteId, filters, page, limit)
      }

      // Filter to only active products for storefront
      const activeProducts = result.data.filter(p => p.status === 'active')
      
      setProducts(activeProducts)
      setPagination({
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      })
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [siteId, optionsKey])

  // Fetch on mount and when options change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    pagination,
    isLoading,
    error,
    refetch: fetchProducts
  }
}
```

---

### Task 20.3: Create useStorefrontProduct Hook

**File**: `src/modules/ecommerce/hooks/useStorefrontProduct.ts`
**Action**: Create

**Description**: Hook for fetching single product with variants and related products

```typescript
/**
 * useStorefrontProduct - Single product hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Fetches a single product by ID or slug with variants and related products.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getProduct, 
  getProductBySlug, 
  getProductVariants, 
  getProductOptions,
  getProducts 
} from '../actions/ecommerce-actions'
import type { 
  Product, 
  ProductVariant, 
  ProductOption,
  StorefrontProductResult 
} from '../types/ecommerce-types'

export function useStorefrontProduct(
  siteId: string,
  idOrSlug: string
): StorefrontProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!siteId || !idOrSlug) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Determine if idOrSlug is a UUID or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
      
      let productData: Product | null = null
      
      if (isUUID) {
        productData = await getProduct(siteId, idOrSlug)
      } else {
        productData = await getProductBySlug(siteId, idOrSlug)
      }

      if (!productData) {
        setError('Product not found')
        setProduct(null)
        return
      }

      // Only show active products on storefront
      if (productData.status !== 'active') {
        setError('Product not available')
        setProduct(null)
        return
      }

      setProduct(productData)

      // Fetch variants and options in parallel
      const [variantsData, optionsData] = await Promise.all([
        getProductVariants(productData.id).catch(() => []),
        getProductOptions(productData.id).catch(() => [])
      ])

      setVariants(variantsData.filter(v => v.is_active))
      setOptions(optionsData)

      // Fetch related products (same category, excluding this product)
      try {
        const relatedResult = await getProducts(siteId, {
          status: 'active'
        }, 1, 8)
        
        // Filter out current product and limit to 4
        const related = relatedResult.data
          .filter(p => p.id !== productData.id && p.status === 'active')
          .slice(0, 4)
        
        setRelatedProducts(related)
      } catch {
        // Non-critical, don't fail the whole request
        setRelatedProducts([])
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err instanceof Error ? err.message : 'Failed to load product')
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }, [siteId, idOrSlug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    variants,
    options,
    relatedProducts,
    isLoading,
    error,
    refetch: fetchProduct
  }
}
```

---

### Task 20.4: Create useStorefrontCategories Hook

**File**: `src/modules/ecommerce/hooks/useStorefrontCategories.ts`
**Action**: Create

**Description**: Hook for fetching category tree with utility functions

```typescript
/**
 * useStorefrontCategories - Categories hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Fetches categories and provides utility functions for navigation.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getCategories } from '../actions/ecommerce-actions'
import type { 
  Category, 
  CategoryTreeNode,
  StorefrontCategoriesResult 
} from '../types/ecommerce-types'

/**
 * Build category tree from flat list
 */
function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  // First pass: create all nodes
  for (const category of categories) {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      level: 0
    })
  }

  // Second pass: build tree structure
  for (const category of categories) {
    const node = categoryMap.get(category.id)!
    
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      const parent = categoryMap.get(category.parent_id)!
      node.level = parent.level + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by sort_order
  const sortNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortNodes(node.children)
      }
    }
    return nodes
  }

  return sortNodes(roots)
}

export function useStorefrontCategories(siteId: string): StorefrontCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getCategories(siteId)
      // Only show active categories
      const activeCategories = data.filter(c => c.is_active)
      setCategories(activeCategories)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  // Utility: Get category by ID
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(c => c.id === id)
  }, [categories])

  // Utility: Get category by slug
  const getCategoryBySlug = useCallback((slug: string): Category | undefined => {
    return categories.find(c => c.slug === slug)
  }, [categories])

  // Utility: Get category path (breadcrumbs)
  const getCategoryPath = useCallback((categoryId: string): Category[] => {
    const path: Category[] = []
    let currentId: string | null = categoryId

    while (currentId) {
      const category = categories.find(c => c.id === currentId)
      if (category) {
        path.unshift(category)
        currentId = category.parent_id
      } else {
        break
      }
    }

    return path
  }, [categories])

  return {
    categories,
    categoryTree,
    isLoading,
    error,
    getCategoryById,
    getCategoryBySlug,
    getCategoryPath
  }
}
```

---

### Task 20.5: Create useStorefrontCart Hook

**File**: `src/modules/ecommerce/hooks/useStorefrontCart.ts`
**Action**: Create

**Description**: Hook for cart management with all operations

```typescript
/**
 * useStorefrontCart - Cart management hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Provides cart state and operations for storefront components.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getOrCreateCart,
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart as clearCartAction,
  applyDiscountToCart,
  removeDiscountFromCart,
  calculateCartTotals
} from '../actions/ecommerce-actions'
import type { 
  Cart, 
  CartItem,
  CartTotals,
  StorefrontCartResult 
} from '../types/ecommerce-types'

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
      const cartData = await getOrCreateCart(siteId, userId, sessionId)
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
      const refreshedCart = await getCart(cart.id)
      if (refreshedCart) {
        setCart(refreshedCart)
      }
    } catch (err) {
      console.error('Error refreshing cart:', err)
    }
  }, [cart?.id])

  // Calculate totals
  const totals = useMemo((): CartTotals | null => {
    if (!cart) return null
    return calculateCartTotals(cart, taxRate)
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
      const updatedCart = await addCartItem(cart.id, productId, variantId, quantity)
      setCart(updatedCart)
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
      const updatedCart = await updateCartItemQuantity(cart.id, itemId, quantity)
      setCart(updatedCart)
      return true
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id])

  // Remove item
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      const updatedCart = await removeCartItem(cart.id, itemId)
      setCart(updatedCart)
      return true
    } catch (err) {
      console.error('Error removing item:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id])

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
      const result = await applyDiscountToCart(cart.id, code)
      if (result.success && result.cart) {
        setCart(result.cart)
      }
      return { success: result.success, message: result.message }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply discount'
      setError(message)
      return { success: false, message }
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id])

  // Remove discount
  const removeDiscount = useCallback(async (): Promise<boolean> => {
    if (!cart?.id) {
      setError('Cart not initialized')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      const updatedCart = await removeDiscountFromCart(cart.id)
      setCart(updatedCart)
      return true
    } catch (err) {
      console.error('Error removing discount:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove discount')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [cart?.id])

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
```

---

### Task 20.6: Create useStorefrontWishlist Hook

**File**: `src/modules/ecommerce/hooks/useStorefrontWishlist.ts`
**Action**: Create

**Description**: Hook for wishlist management using localStorage

```typescript
/**
 * useStorefrontWishlist - Wishlist hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Manages wishlist state in localStorage with product fetching.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getProduct } from '../actions/ecommerce-actions'
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
        getProduct(siteId, item.productId).catch(() => null)
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
```

---

### Task 20.7: Create useStorefrontSearch Hook

**File**: `src/modules/ecommerce/hooks/useStorefrontSearch.ts`
**Action**: Create

**Description**: Hook for product search with debouncing

```typescript
/**
 * useStorefrontSearch - Search hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Provides debounced product search with recent searches.
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getProducts } from '../actions/ecommerce-actions'
import type { 
  Product, 
  StorefrontSearchResult 
} from '../types/ecommerce-types'

const RECENT_SEARCHES_KEY = 'ecom_recent_searches'
const MAX_RECENT_SEARCHES = 5
const DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2

function getRecentSearches(siteId: string): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(`${RECENT_SEARCHES_KEY}_${siteId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(siteId: string, query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return
  
  try {
    const recent = getRecentSearches(siteId)
    const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase())
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(`${RECENT_SEARCHES_KEY}_${siteId}`, JSON.stringify(updated))
  } catch (err) {
    console.error('Error saving recent search:', err)
  }
}

function clearRecentSearchesStorage(siteId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(`${RECENT_SEARCHES_KEY}_${siteId}`)
  } catch (err) {
    console.error('Error clearing recent searches:', err)
  }
}

export function useStorefrontSearch(siteId: string): StorefrontSearchResult {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const abortController = useRef<AbortController | null>(null)

  // Load recent searches
  useEffect(() => {
    if (siteId) {
      setRecentSearches(getRecentSearches(siteId))
    }
  }, [siteId])

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!siteId || searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setIsSearching(false)
      return
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    setIsSearching(true)
    setError(null)

    try {
      const response = await getProducts(siteId, {
        search: searchQuery,
        status: 'active'
      }, 1, 10)

      setResults(response.data)
      
      // Save to recent searches
      addRecentSearch(siteId, searchQuery)
      setRecentSearches(getRecentSearches(siteId))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Ignore aborted requests
      }
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [siteId])

  // Debounced query setter
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!newQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    if (newQuery.length >= MIN_SEARCH_LENGTH) {
      setIsSearching(true)
      debounceTimer.current = setTimeout(() => {
        performSearch(newQuery)
      }, DEBOUNCE_MS)
    }
  }, [performSearch])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    clearRecentSearchesStorage(siteId)
    setRecentSearches([])
  }, [siteId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    recentSearches,
    clearRecentSearches
  }
}
```

---

### Task 20.8: Create useRecentlyViewed Hook

**File**: `src/modules/ecommerce/hooks/useRecentlyViewed.ts`
**Action**: Create

**Description**: Hook for tracking recently viewed products

```typescript
/**
 * useRecentlyViewed - Recently viewed products hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Tracks and displays recently viewed products using localStorage.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProduct } from '../actions/ecommerce-actions'
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
        getProduct(siteId, item.productId).catch(() => null)
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
```

---

### Task 20.9: Create Storefront Context Provider

**File**: `src/modules/ecommerce/context/storefront-context.tsx`
**Action**: Create

**Description**: Context provider for storefront settings and utilities

```typescript
/**
 * StorefrontProvider - Storefront context
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Provides site settings, currency, and utilities to all storefront components.
 */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { getEcommerceSettings } from '../actions/ecommerce-actions'
import type { 
  EcommerceSettings,
  StorefrontContextValue 
} from '../types/ecommerce-types'

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZMW: 'K',
  KES: 'KSh',
  NGN: '₦',
  ZAR: 'R',
  TZS: 'TSh',
  UGX: 'USh',
  RWF: 'FRw',
  GHS: '₵',
  XOF: 'CFA',
  XAF: 'FCFA',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
}

// Default context value
const defaultContextValue: StorefrontContextValue = {
  siteId: '',
  settings: null,
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0,
  formatPrice: () => '$0.00',
  isInitialized: false
}

const StorefrontContext = createContext<StorefrontContextValue>(defaultContextValue)

// ============================================================================
// HOOK
// ============================================================================

export function useStorefront(): StorefrontContextValue {
  const context = useContext(StorefrontContext)
  if (!context.siteId) {
    console.warn('useStorefront used outside of StorefrontProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface StorefrontProviderProps {
  children: ReactNode
  siteId: string
}

export function StorefrontProvider({ children, siteId }: StorefrontProviderProps) {
  const [settings, setSettings] = useState<EcommerceSettings | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings
  useEffect(() => {
    if (!siteId) return

    async function loadSettings() {
      try {
        const data = await getEcommerceSettings(siteId)
        setSettings(data)
      } catch (err) {
        console.error('Error loading storefront settings:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    loadSettings()
  }, [siteId])

  // Derived values
  const currency = settings?.currency || 'USD'
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency
  const taxRate = settings?.default_tax_rate || 0

  // Format price utility
  const formatPrice = useCallback((amount: number): string => {
    const decimals = settings?.currency_decimal_places ?? 2
    const formatted = amount.toFixed(decimals)
    
    // Position of symbol
    const position = settings?.currency_symbol_position || 'before'
    
    if (position === 'after') {
      return `${formatted} ${currencySymbol}`
    }
    
    return `${currencySymbol}${formatted}`
  }, [settings, currencySymbol])

  // Context value
  const value = useMemo((): StorefrontContextValue => ({
    siteId,
    settings,
    currency,
    currencySymbol,
    taxRate,
    formatPrice,
    isInitialized
  }), [siteId, settings, currency, currencySymbol, taxRate, formatPrice, isInitialized])

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  )
}
```

---

### Task 20.10: Create Hooks Index File

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Create

**Description**: Export all storefront hooks

```typescript
/**
 * E-Commerce Storefront Hooks
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Exports all hooks for use in Studio components and pages.
 */

export { useStorefrontProducts } from './useStorefrontProducts'
export { useStorefrontProduct } from './useStorefrontProduct'
export { useStorefrontCategories } from './useStorefrontCategories'
export { useStorefrontCart } from './useStorefrontCart'
export { useStorefrontWishlist } from './useStorefrontWishlist'
export { useStorefrontSearch } from './useStorefrontSearch'
export { useRecentlyViewed } from './useRecentlyViewed'
```

---

### Task 20.11: Update Module Index

**File**: `src/modules/ecommerce/index.ts`
**Action**: Modify

**Description**: Add exports for new hooks and context

Add after the existing exports:

```typescript
// ============================================================================
// STOREFRONT HOOKS (Phase ECOM-20)
// ============================================================================

export {
  useStorefrontProducts,
  useStorefrontProduct,
  useStorefrontCategories,
  useStorefrontCart,
  useStorefrontWishlist,
  useStorefrontSearch,
  useRecentlyViewed
} from './hooks'

// ============================================================================
// STOREFRONT CONTEXT (Phase ECOM-20)
// ============================================================================

export {
  StorefrontProvider,
  useStorefront
} from './context/storefront-context'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] `useStorefrontProducts` returns products with filters
- [ ] `useStorefrontProduct` returns product with variants
- [ ] `useStorefrontCategories` returns category tree
- [ ] `useStorefrontCart` adds/removes items
- [ ] `useStorefrontWishlist` persists to localStorage
- [ ] `useStorefrontSearch` debounces and returns results
- [ ] `useRecentlyViewed` tracks viewed products
- [ ] `StorefrontProvider` provides settings and currency
- [ ] `formatPrice` formats correctly based on settings

---

## 🔄 Rollback Plan

If issues occur:
1. Remove hooks directory: `rm -rf src/modules/ecommerce/hooks`
2. Remove storefront context: `rm src/modules/ecommerce/context/storefront-context.tsx`
3. Revert type additions in `ecommerce-types.ts`
4. Revert exports in `index.ts`
5. Run `npx tsc --noEmit` to verify clean state

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add "✅ PHASE-ECOM-20: Core Data Hooks & Context Complete"
- `progress.md`: Update e-commerce section with Wave 3 progress

---

## ✨ Success Criteria

- [ ] All 7 storefront hooks work correctly
- [ ] StorefrontProvider provides context to children
- [ ] Hooks handle loading, error, and empty states
- [ ] localStorage persistence works for wishlist and recently viewed
- [ ] Search debouncing prevents excessive API calls
- [ ] TypeScript compiles with zero errors
- [ ] Hooks exported and usable from module index
