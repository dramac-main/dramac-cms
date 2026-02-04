/**
 * E-Commerce Command Palette
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Quick search and navigation using Cmd+K
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { 
  Home,
  Package, 
  ShoppingCart, 
  Users, 
  FolderTree, 
  Percent,
  FileText,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react'
import type { EcommerceView } from '../types/ecommerce-types'
import { quickSearch } from '../actions/dashboard-actions'
import { useDebounce } from '@/hooks/use-debounce'

// ============================================================================
// TYPES
// ============================================================================

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onNavigate: (view: EcommerceView) => void
  onCreateProduct: () => void
  onCreateCategory: () => void
  onCreateDiscount: () => void
  onViewProduct: (productId: string) => void
  onViewOrder: (orderId: string) => void
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const navigationItems = [
  { id: 'home' as EcommerceView, label: 'Dashboard', icon: Home, keywords: ['home', 'overview'] },
  { id: 'products' as EcommerceView, label: 'Products', icon: Package, keywords: ['inventory', 'items'] },
  { id: 'orders' as EcommerceView, label: 'Orders', icon: ShoppingCart, keywords: ['sales', 'purchases'] },
  { id: 'customers' as EcommerceView, label: 'Customers', icon: Users, keywords: ['users', 'clients'] },
  { id: 'categories' as EcommerceView, label: 'Categories', icon: FolderTree, keywords: ['collections', 'groups'] },
  { id: 'discounts' as EcommerceView, label: 'Discounts', icon: Percent, keywords: ['coupons', 'promotions'] },
  { id: 'quotes' as EcommerceView, label: 'Quotes', icon: FileText, keywords: ['quotations', 'rfq'] },
  { id: 'analytics' as EcommerceView, label: 'Analytics', icon: BarChart3, keywords: ['reports', 'stats'] },
  { id: 'settings' as EcommerceView, label: 'Settings', icon: Settings, keywords: ['config', 'preferences'] },
]

const actionItems = [
  { id: 'create-product', label: 'New Product', icon: Plus, action: 'product' },
  { id: 'create-category', label: 'New Category', icon: Plus, action: 'category' },
  { id: 'create-discount', label: 'New Discount', icon: Plus, action: 'discount' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function CommandPalette({
  open,
  onOpenChange,
  siteId,
  onNavigate,
  onCreateProduct,
  onCreateCategory,
  onCreateDiscount,
  onViewProduct,
  onViewOrder
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{
    products: Array<{ id: string; name: string; sku: string | null }>
    orders: Array<{ id: string; orderNumber: string; customerEmail: string }>
    categories: Array<{ id: string; name: string }>
  }>({ products: [], orders: [], categories: [] })
  const [isSearching, setIsSearching] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  // Perform search when debounced value changes
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true)
      quickSearch(siteId, debouncedSearch)
        .then(setSearchResults)
        .finally(() => setIsSearching(false))
    } else {
      setSearchResults({ products: [], orders: [], categories: [] })
    }
  }, [debouncedSearch, siteId])

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = useCallback((callback: () => void) => {
    onOpenChange(false)
    setSearch('')
    callback()
  }, [onOpenChange])

  const hasSearchResults = 
    searchResults.products.length > 0 || 
    searchResults.orders.length > 0 || 
    searchResults.categories.length > 0

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search products, orders, or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Search Results */}
        {hasSearchResults && (
          <>
            {searchResults.products.length > 0 && (
              <CommandGroup heading="Products">
                {searchResults.products.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelect(() => onViewProduct(product.id))}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <span>{product.name}</span>
                    {product.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.orders.length > 0 && (
              <CommandGroup heading="Orders">
                {searchResults.orders.map((order) => (
                  <CommandItem
                    key={order.id}
                    onSelect={() => handleSelect(() => onViewOrder(order.id))}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>{order.orderNumber}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {order.customerEmail}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.categories.length > 0 && (
              <CommandGroup heading="Categories">
                {searchResults.categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => handleSelect(() => onNavigate('categories'))}
                  >
                    <FolderTree className="mr-2 h-4 w-4" />
                    <span>{category.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(() => onNavigate(item.id))}
                keywords={item.keywords}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>Go to {item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {actionItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.id}
                onSelect={() => {
                  handleSelect(() => {
                    switch (item.action) {
                      case 'product':
                        onCreateProduct()
                        break
                      case 'category':
                        onCreateCategory()
                        break
                      case 'discount':
                        onCreateDiscount()
                        break
                    }
                  })
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
