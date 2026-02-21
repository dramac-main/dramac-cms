/**
 * E-Commerce Header
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Header with breadcrumbs, search command palette trigger, and quick actions
 */
'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { 
  Search, 
  Plus, 
  Package, 
  FolderTree, 
  Percent,
  Settings,
  RefreshCw,
  Command
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EcommerceView } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface EcommerceHeaderProps {
  currentView: EcommerceView
  onOpenCommandPalette: () => void
  onCreateProduct: () => void
  onCreateCategory: () => void
  onCreateDiscount: () => void
  onOpenSettings: () => void
  onRefresh: () => void
  isRefreshing?: boolean
}

// ============================================================================
// VIEW LABELS
// ============================================================================

const viewLabels: Record<EcommerceView, string> = {
  home: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  categories: 'Categories',
  inventory: 'Inventory',
  discounts: 'Discounts',
  quotes: 'Quotes',
  reviews: 'Reviews',
  templates: 'Templates',
  marketing: 'Marketing',
  analytics: 'Analytics',
  developer: 'Developer',
  settings: 'Settings',
  embed: 'Embed'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EcommerceHeader({
  currentView,
  onOpenCommandPalette,
  onCreateProduct,
  onCreateCategory,
  onCreateDiscount,
  onOpenSettings,
  onRefresh,
  isRefreshing = false
}: EcommerceHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-background">
      {/* Left: Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault() }}>
              E-Commerce
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{viewLabels[currentView]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search Trigger */}
        <Button
          variant="outline"
          className="w-64 justify-start text-muted-foreground"
          onClick={onOpenCommandPalette}
        >
          <Search className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Quick Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onCreateProduct}>
              <Package className="h-4 w-4 mr-2" />
              New Product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateCategory}>
              <FolderTree className="h-4 w-4 mr-2" />
              New Category
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateDiscount}>
              <Percent className="h-4 w-4 mr-2" />
              New Discount
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Store Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </Button>
      </div>
    </header>
  )
}
