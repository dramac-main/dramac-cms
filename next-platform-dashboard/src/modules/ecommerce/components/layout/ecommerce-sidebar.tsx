/**
 * E-Commerce Sidebar Navigation
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Provides main navigation for the e-commerce dashboard
 */
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
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
  ChevronLeft,
  ChevronRight,
  Store,
  Warehouse
} from 'lucide-react'
import type { EcommerceView } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface NavItemConfig {
  id: EcommerceView
  label: string
  icon: typeof Home
  badge?: number
  badgeVariant?: 'default' | 'destructive' | 'secondary'
}

interface EcommerceSidebarProps {
  activeView: EcommerceView
  onViewChange: (view: EcommerceView) => void
  pendingOrders?: number
  lowStockCount?: number
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

// ============================================================================
// NAV ITEMS CONFIG
// ============================================================================

function getNavItems(pendingOrders: number, lowStockCount: number): NavItemConfig[] {
  return [
    { id: 'home', label: 'Dashboard', icon: Home },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeVariant: 'destructive' as const
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      badgeVariant: 'destructive' as const
    },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Warehouse,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeVariant: 'destructive' as const
    },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'quotes', label: 'Quotes', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EcommerceSidebar({
  activeView,
  onViewChange,
  pendingOrders = 0,
  lowStockCount = 0,
  isCollapsed = false,
  onCollapsedChange
}: EcommerceSidebarProps) {
  const [_hoveredItem, setHoveredItem] = useState<string | null>(null)
  const navItems = getNavItems(pendingOrders, lowStockCount)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Store Header */}
        <div className="flex items-center h-14 px-4 border-b">
          <div className={cn(
            'flex items-center gap-3 overflow-hidden',
            isCollapsed && 'justify-center'
          )}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate">E-Commerce</span>
                <span className="text-xs text-muted-foreground truncate">Store Dashboard</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              const button = (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-10 relative',
                    isCollapsed && 'justify-center px-2',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                  )}
                  onClick={() => onViewChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && (
                        <Badge 
                          variant={item.badgeVariant || 'secondary'}
                          className="ml-auto h-5 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge !== undefined && (
                    <Badge 
                      variant={item.badgeVariant || 'secondary'}
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </Button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div className="relative">{button}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.label}
                      {item.badge !== undefined && (
                        <Badge variant={item.badgeVariant || 'secondary'} className="h-5">
                          {item.badge}
                        </Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return button
            })}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full', isCollapsed && 'px-2')}
            onClick={() => onCollapsedChange?.(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
