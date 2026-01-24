/**
 * E-Commerce Module Context Provider
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Provides E-Commerce state management and actions to all child components
 * Following CRM/Booking module pattern exactly
 */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  getProducts, getCategories, getOrders, getDiscounts, getEcommerceSettings,
  createProduct, updateProduct, deleteProduct, duplicateProduct,
  createCategory, updateCategory, deleteCategory,
  createDiscount, updateDiscount, deleteDiscount,
  updateOrderStatus, updateOrderFulfillment, updateOrderPaymentStatus,
  markOrderDelivered, addOrderNote,
  initializeEcommerceForSite,
  getLowStockProducts, getOutOfStockProducts,
  getSalesAnalytics, getTopProducts
} from '../actions/ecommerce-actions'
import type {
  Product, ProductInput, ProductUpdate, ProductFilters,
  Category, CategoryInput, CategoryUpdate,
  Order, OrderFilters,
  Discount, DiscountInput, DiscountUpdate,
  EcommerceSettings, EcommerceSettingsUpdate,
  PaginatedResponse
} from '../types/ecommerce-types'

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface EcommerceContextType {
  // Data
  products: Product[]
  categories: Category[]
  orders: Order[]
  discounts: Discount[]
  settings: EcommerceSettings | null
  
  // Inventory
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  
  // Analytics
  analytics: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    ordersByStatus: Record<string, number>
  } | null
  topProducts: Array<{ productId: string; productName: string; quantitySold: number; revenue: number }>
  
  // Pagination
  productsPagination: { total: number; page: number; totalPages: number; limit: number }
  ordersPagination: { total: number; page: number; totalPages: number; limit: number }
  
  // State
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Product actions
  addProduct: (data: Partial<ProductInput>) => Promise<Product>
  editProduct: (id: string, data: ProductUpdate) => Promise<Product>
  removeProduct: (id: string) => Promise<void>
  copyProduct: (id: string) => Promise<Product>
  
  // Category actions
  addCategory: (data: Partial<CategoryInput>) => Promise<Category>
  editCategory: (id: string, data: CategoryUpdate) => Promise<Category>
  removeCategory: (id: string) => Promise<void>
  
  // Order actions
  changeOrderStatus: (orderId: string, status: Order['status']) => Promise<Order>
  changeOrderPaymentStatus: (orderId: string, status: Order['payment_status'], transactionId?: string) => Promise<Order>
  changeOrderFulfillment: (orderId: string, status: Order['fulfillment_status'], tracking?: string, trackingUrl?: string) => Promise<Order>
  markDelivered: (orderId: string) => Promise<Order>
  addNote: (orderId: string, note: string, isInternal?: boolean) => Promise<Order>
  
  // Discount actions
  addDiscount: (data: Partial<DiscountInput>) => Promise<Discount>
  editDiscount: (id: string, data: DiscountUpdate) => Promise<Discount>
  removeDiscount: (id: string) => Promise<void>
  
  // Settings actions
  updateSettings: (data: EcommerceSettingsUpdate) => Promise<EcommerceSettings>
  
  // Filters
  productFilters: ProductFilters
  setProductFilters: (filters: ProductFilters) => void
  orderFilters: OrderFilters
  setOrderFilters: (filters: OrderFilters) => void
  
  // Pagination
  setProductsPage: (page: number) => void
  setOrdersPage: (page: number) => void
  
  // Refresh
  refresh: () => Promise<void>
  refreshProducts: () => Promise<void>
  refreshOrders: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshDiscounts: () => Promise<void>
  refreshSettings: () => Promise<void>
  refreshInventory: () => Promise<void>
  refreshAnalytics: () => Promise<void>
  
  // Site info
  siteId: string
  agencyId: string
}

// ============================================================================
// CONTEXT
// ============================================================================

const EcommerceContext = createContext<EcommerceContextType | null>(null)

export function useEcommerce() {
  const context = useContext(EcommerceContext)
  if (!context) {
    throw new Error('useEcommerce must be used within an EcommerceProvider')
  }
  return context
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useProducts() {
  const { 
    products, productsPagination, productFilters, setProductFilters, 
    setProductsPage, refreshProducts, addProduct, editProduct, 
    removeProduct, copyProduct, isLoading 
  } = useEcommerce()
  
  return { 
    products, 
    pagination: productsPagination, 
    filters: productFilters, 
    setFilters: setProductFilters, 
    setPage: setProductsPage, 
    refresh: refreshProducts, 
    add: addProduct, 
    edit: editProduct, 
    remove: removeProduct,
    duplicate: copyProduct,
    isLoading 
  }
}

export function useOrders() {
  const { 
    orders, ordersPagination, orderFilters, setOrderFilters, 
    setOrdersPage, refreshOrders, changeOrderStatus, changeOrderPaymentStatus,
    changeOrderFulfillment, markDelivered, addNote, isLoading 
  } = useEcommerce()
  
  return { 
    orders, 
    pagination: ordersPagination, 
    filters: orderFilters, 
    setFilters: setOrderFilters, 
    setPage: setOrdersPage, 
    refresh: refreshOrders, 
    changeStatus: changeOrderStatus, 
    changePaymentStatus: changeOrderPaymentStatus,
    changeFulfillment: changeOrderFulfillment,
    markDelivered,
    addNote,
    isLoading 
  }
}

export function useCategories() {
  const { categories, refreshCategories, addCategory, editCategory, removeCategory, isLoading } = useEcommerce()
  return { categories, refresh: refreshCategories, add: addCategory, edit: editCategory, remove: removeCategory, isLoading }
}

export function useDiscounts() {
  const { discounts, refreshDiscounts, addDiscount, editDiscount, removeDiscount, isLoading } = useEcommerce()
  return { discounts, refresh: refreshDiscounts, add: addDiscount, edit: editDiscount, remove: removeDiscount, isLoading }
}

export function useEcommerceSettings() {
  const { settings, refreshSettings, updateSettings, isLoading } = useEcommerce()
  return { settings, refresh: refreshSettings, update: updateSettings, isLoading }
}

export function useInventory() {
  const { lowStockProducts, outOfStockProducts, refreshInventory, isLoading } = useEcommerce()
  return { lowStockProducts, outOfStockProducts, refresh: refreshInventory, isLoading }
}

export function useEcommerceAnalytics() {
  const { analytics, topProducts, refreshAnalytics, isLoading } = useEcommerce()
  return { analytics, topProducts, refresh: refreshAnalytics, isLoading }
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface EcommerceProviderProps {
  children: ReactNode
  siteId: string
  agencyId: string
}

// ============================================================================
// PROVIDER
// ============================================================================

export function EcommerceProvider({ children, siteId, agencyId }: EcommerceProviderProps) {
  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [settings, setSettings] = useState<EcommerceSettings | null>(null)
  
  // Inventory state
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([])
  
  // Analytics state
  const [analytics, setAnalytics] = useState<EcommerceContextType['analytics']>(null)
  const [topProducts, setTopProducts] = useState<EcommerceContextType['topProducts']>([])
  
  // Pagination
  const [productsPagination, setProductsPagination] = useState({ total: 0, page: 1, totalPages: 0, limit: 20 })
  const [ordersPagination, setOrdersPagination] = useState({ total: 0, page: 1, totalPages: 0, limit: 20 })
  
  // Filters
  const [productFilters, setProductFilters] = useState<ProductFilters>({})
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({})
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const refreshProducts = useCallback(async () => {
    try {
      const result = await getProducts(siteId, productFilters, productsPagination.page, productsPagination.limit)
      setProducts(result.data)
      setProductsPagination({ 
        total: result.total, 
        page: result.page, 
        totalPages: result.totalPages,
        limit: result.limit 
      })
    } catch (err: unknown) {
      console.error('Error fetching products:', err)
    }
  }, [siteId, productFilters, productsPagination.page, productsPagination.limit])

  const refreshCategories = useCallback(async () => {
    try {
      const data = await getCategories(siteId)
      setCategories(data)
    } catch (err: unknown) {
      console.error('Error fetching categories:', err)
    }
  }, [siteId])

  const refreshOrders = useCallback(async () => {
    try {
      const result = await getOrders(siteId, orderFilters, ordersPagination.page, ordersPagination.limit)
      setOrders(result.data)
      setOrdersPagination({ 
        total: result.total, 
        page: result.page, 
        totalPages: result.totalPages,
        limit: result.limit 
      })
    } catch (err: unknown) {
      console.error('Error fetching orders:', err)
    }
  }, [siteId, orderFilters, ordersPagination.page, ordersPagination.limit])

  const refreshDiscounts = useCallback(async () => {
    try {
      const data = await getDiscounts(siteId)
      setDiscounts(data)
    } catch (err: unknown) {
      console.error('Error fetching discounts:', err)
    }
  }, [siteId])

  const refreshSettings = useCallback(async () => {
    try {
      const data = await getEcommerceSettings(siteId)
      setSettings(data)
    } catch (err: unknown) {
      console.error('Error fetching settings:', err)
    }
  }, [siteId])

  const refreshInventory = useCallback(async () => {
    try {
      const [lowStock, outOfStock] = await Promise.all([
        getLowStockProducts(siteId),
        getOutOfStockProducts(siteId)
      ])
      setLowStockProducts(lowStock)
      setOutOfStockProducts(outOfStock)
    } catch (err: unknown) {
      console.error('Error fetching inventory:', err)
    }
  }, [siteId])

  const refreshAnalytics = useCallback(async () => {
    try {
      // Default to last 30 days
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const [analyticsData, topProductsData] = await Promise.all([
        getSalesAnalytics(siteId, startDate, endDate),
        getTopProducts(siteId, startDate, endDate, 10)
      ])
      
      setAnalytics(analyticsData)
      setTopProducts(topProductsData)
    } catch (err: unknown) {
      console.error('Error fetching analytics:', err)
    }
  }, [siteId])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        refreshProducts(),
        refreshCategories(),
        refreshOrders(),
        refreshDiscounts(),
        refreshSettings(),
        refreshInventory(),
        refreshAnalytics()
      ])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [refreshProducts, refreshCategories, refreshOrders, refreshDiscounts, refreshSettings, refreshInventory, refreshAnalytics])

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const init = async () => {
      try {
        await initializeEcommerceForSite(siteId, agencyId)
        await refresh()
        setIsInitialized(true)
      } catch (err: unknown) {
        console.error('Error initializing e-commerce:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize')
      }
    }
    
    init()
  }, [siteId, agencyId, refresh])

  // ============================================================================
  // PRODUCT ACTIONS
  // ============================================================================

  const addProduct = useCallback(async (data: Partial<ProductInput>): Promise<Product> => {
    const product = await createProduct(siteId, agencyId, data)
    await refreshProducts()
    return product
  }, [siteId, agencyId, refreshProducts])

  const editProduct = useCallback(async (id: string, data: ProductUpdate): Promise<Product> => {
    const product = await updateProduct(siteId, id, data)
    await refreshProducts()
    return product
  }, [siteId, refreshProducts])

  const removeProduct = useCallback(async (id: string): Promise<void> => {
    await deleteProduct(siteId, id)
    await refreshProducts()
  }, [siteId, refreshProducts])

  const copyProduct = useCallback(async (id: string): Promise<Product> => {
    const product = await duplicateProduct(siteId, agencyId, id)
    await refreshProducts()
    return product
  }, [siteId, agencyId, refreshProducts])

  // ============================================================================
  // CATEGORY ACTIONS
  // ============================================================================

  const addCategory = useCallback(async (data: Partial<CategoryInput>): Promise<Category> => {
    const category = await createCategory(siteId, agencyId, data)
    await refreshCategories()
    return category
  }, [siteId, agencyId, refreshCategories])

  const editCategory = useCallback(async (id: string, data: CategoryUpdate): Promise<Category> => {
    const category = await updateCategory(siteId, id, data)
    await refreshCategories()
    return category
  }, [siteId, refreshCategories])

  const removeCategory = useCallback(async (id: string): Promise<void> => {
    await deleteCategory(siteId, id)
    await refreshCategories()
  }, [siteId, refreshCategories])

  // ============================================================================
  // ORDER ACTIONS
  // ============================================================================

  const changeOrderStatus = useCallback(async (orderId: string, status: Order['status']): Promise<Order> => {
    const order = await updateOrderStatus(siteId, orderId, status)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  const changeOrderPaymentStatus = useCallback(async (
    orderId: string, 
    status: Order['payment_status'], 
    transactionId?: string
  ): Promise<Order> => {
    const order = await updateOrderPaymentStatus(siteId, orderId, status, transactionId)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  const changeOrderFulfillment = useCallback(async (
    orderId: string,
    status: Order['fulfillment_status'],
    tracking?: string,
    trackingUrl?: string
  ): Promise<Order> => {
    const order = await updateOrderFulfillment(siteId, orderId, status, tracking, trackingUrl)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  const markDelivered = useCallback(async (orderId: string): Promise<Order> => {
    const order = await markOrderDelivered(siteId, orderId)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  const addNote = useCallback(async (orderId: string, note: string, isInternal = true): Promise<Order> => {
    const order = await addOrderNote(siteId, orderId, note, isInternal)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  // ============================================================================
  // DISCOUNT ACTIONS
  // ============================================================================

  const addDiscount = useCallback(async (data: Partial<DiscountInput>): Promise<Discount> => {
    const discount = await createDiscount(siteId, agencyId, data)
    await refreshDiscounts()
    return discount
  }, [siteId, agencyId, refreshDiscounts])

  const editDiscount = useCallback(async (id: string, data: DiscountUpdate): Promise<Discount> => {
    const discount = await updateDiscount(siteId, id, data)
    await refreshDiscounts()
    return discount
  }, [siteId, refreshDiscounts])

  const removeDiscount = useCallback(async (id: string): Promise<void> => {
    await deleteDiscount(siteId, id)
    await refreshDiscounts()
  }, [siteId, refreshDiscounts])

  // ============================================================================
  // SETTINGS ACTIONS
  // ============================================================================

  const updateSettingsAction = useCallback(async (data: EcommerceSettingsUpdate): Promise<EcommerceSettings> => {
    const { updateEcommerceSettings } = await import('../actions/ecommerce-actions')
    const updated = await updateEcommerceSettings(siteId, agencyId, data)
    await refreshSettings()
    return updated
  }, [siteId, agencyId, refreshSettings])

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const setProductsPage = useCallback((page: number) => {
    setProductsPagination(prev => ({ ...prev, page }))
  }, [])

  const setOrdersPage = useCallback((page: number) => {
    setOrdersPagination(prev => ({ ...prev, page }))
  }, [])

  // Refetch when filters or page change
  useEffect(() => {
    if (isInitialized) {
      refreshProducts()
    }
  }, [productFilters, productsPagination.page, isInitialized, refreshProducts])

  useEffect(() => {
    if (isInitialized) {
      refreshOrders()
    }
  }, [orderFilters, ordersPagination.page, isInitialized, refreshOrders])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: EcommerceContextType = {
    // Data
    products,
    categories,
    orders,
    discounts,
    settings,
    
    // Inventory
    lowStockProducts,
    outOfStockProducts,
    
    // Analytics
    analytics,
    topProducts,
    
    // Pagination
    productsPagination,
    ordersPagination,
    
    // State
    isLoading,
    error,
    isInitialized,
    
    // Product actions
    addProduct,
    editProduct,
    removeProduct,
    copyProduct,
    
    // Category actions
    addCategory,
    editCategory,
    removeCategory,
    
    // Order actions
    changeOrderStatus,
    changeOrderPaymentStatus,
    changeOrderFulfillment,
    markDelivered,
    addNote,
    
    // Discount actions
    addDiscount,
    editDiscount,
    removeDiscount,
    
    // Settings actions
    updateSettings: updateSettingsAction,
    
    // Filters
    productFilters,
    setProductFilters,
    orderFilters,
    setOrderFilters,
    
    // Pagination
    setProductsPage,
    setOrdersPage,
    
    // Refresh
    refresh,
    refreshProducts,
    refreshOrders,
    refreshCategories,
    refreshDiscounts,
    refreshSettings,
    refreshInventory,
    refreshAnalytics,
    
    // Site info
    siteId,
    agencyId
  }

  return (
    <EcommerceContext.Provider value={value}>
      {children}
    </EcommerceContext.Provider>
  )
}
