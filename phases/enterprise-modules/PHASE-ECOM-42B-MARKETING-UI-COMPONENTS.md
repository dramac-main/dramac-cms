# PHASE-ECOM-42B: Marketing Features - UI Components

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 6-7 hours
> **Prerequisites**: PHASE-ECOM-42A Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the dashboard UI components for marketing features including flash sale management, bundle builder, gift card administration, and loyalty program configuration. This phase delivers the marketing tools for store owners to drive engagement and sales.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-42A complete (marketing-actions.ts exists)
- [ ] Verify date-fns installed
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Marketing UI Architecture (Phase 42B)
├── Flash Sales
│   ├── FlashSalesView            → List/manage flash sales
│   ├── FlashSaleCard             → Sale summary card
│   ├── FlashSaleDialog           → Create/edit dialog
│   ├── FlashSaleProductPicker    → Add products to sale
│   └── CountdownTimer            → Sale countdown display
│
├── Bundles
│   ├── BundlesView               → List/manage bundles
│   ├── BundleCard                → Bundle summary card
│   ├── BundleBuilderDialog       → Create/edit bundle
│   └── BundleItemsList           → Manage bundle items
│
├── Gift Cards
│   ├── GiftCardsView             → List/manage gift cards
│   ├── GiftCardCard              → Card summary display
│   ├── CreateGiftCardDialog      → Issue new card
│   ├── GiftCardLookup            → Check balance by code
│   └── GiftCardTransactionHistory→ Transaction log
│
├── Loyalty Program
│   ├── LoyaltyConfigView         → Program settings
│   ├── LoyaltyTierEditor         → Configure tiers
│   ├── CustomerPointsTable       → View all members
│   └── PointsAdjustmentDialog    → Manual adjustment
│
└── Hooks
    ├── useFlashSales()           → Flash sale management
    ├── useBundles()              → Bundle management
    ├── useGiftCards()            → Gift card management
    └── useLoyalty()              → Loyalty management
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `components/ecommerce/views/marketing-view.tsx` | Create | Main marketing dashboard |
| `components/ecommerce/views/flash-sales-view.tsx` | Create | Flash sale management |
| `components/ecommerce/dialogs/flash-sale-dialog.tsx` | Create | Create/edit flash sale |
| `components/ecommerce/views/bundles-view.tsx` | Create | Bundle management |
| `components/ecommerce/dialogs/bundle-builder-dialog.tsx` | Create | Bundle builder |
| `components/ecommerce/views/gift-cards-view.tsx` | Create | Gift card management |
| `components/ecommerce/dialogs/create-gift-card-dialog.tsx` | Create | Issue gift card |
| `components/ecommerce/views/loyalty-config-view.tsx` | Create | Loyalty settings |
| `components/ecommerce/widgets/countdown-timer.tsx` | Create | Sale countdown |
| `hooks/ecommerce/use-marketing.ts` | Create | Marketing hooks |

---

## 📋 Implementation Tasks

### Task 42B.1: Create Marketing Hooks

**File**: `src/hooks/ecommerce/use-marketing.ts`
**Action**: Create

```typescript
/**
 * Marketing Hooks
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Hooks for managing flash sales, bundles, gift cards, and loyalty.
 */
'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
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
  earnPoints,
  redeemPoints
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
  RedeemPointsInput
} from '@/modules/ecommerce/types/marketing-types'

// ============================================================================
// useFlashSales
// ============================================================================

interface UseFlashSalesReturn {
  sales: FlashSale[]
  activeSales: FlashSale[]
  isLoading: boolean
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: FlashSaleInput) => Promise<FlashSale | null>
  update: (id: string, updates: FlashSaleUpdate) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  addProducts: (saleId: string, products: AddFlashSaleProductInput[]) => Promise<boolean>
  removeProduct: (saleId: string, productId: string) => Promise<boolean>
}

export function useFlashSales(siteId: string): UseFlashSalesReturn {
  const [isPending, startTransition] = useTransition()
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
    isPending,
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
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: BundleInput) => Promise<Bundle | null>
  update: (id: string, updates: BundleUpdate) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  addItems: (bundleId: string, items: BundleItemInput[]) => Promise<boolean>
  removeItem: (bundleId: string, itemId: string) => Promise<boolean>
}

export function useBundles(siteId: string): UseBundlesReturn {
  const [isPending, startTransition] = useTransition()
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
    isPending,
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
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: GiftCardInput) => Promise<GiftCard | null>
  lookup: (code: string) => Promise<GiftCard | null>
  redeem: (redemption: GiftCardRedemption) => Promise<{ amount_applied?: number } | null>
  refund: (cardId: string, amount: number, orderId?: string) => Promise<boolean>
}

export function useGiftCards(siteId: string): UseGiftCardsReturn {
  const [isPending, startTransition] = useTransition()
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
    isPending,
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
  isLoading: boolean
  isPending: boolean
  error: string | null
  
  refreshConfig: () => Promise<void>
  updateConfig: (input: LoyaltyConfigInput) => Promise<boolean>
  getCustomerPoints: (customerId: string) => Promise<LoyaltyPoints | null>
  earnCustomerPoints: (input: EarnPointsInput) => Promise<{ new_balance?: number } | null>
  redeemCustomerPoints: (input: RedeemPointsInput) => Promise<{ new_balance?: number; discount_value?: number } | null>
}

export function useLoyalty(siteId: string): UseLoyaltyReturn {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<LoyaltyConfig | null>(null)
  
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
  
  const updateConfig = useCallback(async (input: LoyaltyConfigInput): Promise<boolean> => {
    const result = await configureLoyalty(siteId, input)
    if (result.success) {
      setConfig(prev => prev ? { ...prev, ...input } : null)
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
  
  useEffect(() => {
    refreshConfig()
  }, [refreshConfig])
  
  return {
    config,
    isLoading,
    isPending,
    error,
    refreshConfig,
    updateConfig,
    getCustomerPoints,
    earnCustomerPoints,
    redeemCustomerPoints
  }
}
```

---

### Task 42B.2: Create Countdown Timer Widget

**File**: `src/components/ecommerce/widgets/countdown-timer.tsx`
**Action**: Create

```typescript
/**
 * Countdown Timer Widget
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Displays countdown to flash sale end time.
 */
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  endTime: string | Date
  onComplete?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'large'
  showLabels?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateTimeLeft(endTime: Date): TimeLeft {
  const total = endTime.getTime() - Date.now()
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }
  
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total
  }
}

function TimeUnit({ 
  value, 
  label, 
  showLabel,
  variant 
}: { 
  value: number
  label: string
  showLabel: boolean
  variant: string
}) {
  const sizeClasses = {
    default: 'w-14 h-14',
    compact: 'w-10 h-10',
    large: 'w-20 h-20'
  }
  
  const textClasses = {
    default: 'text-xl',
    compact: 'text-sm',
    large: 'text-3xl'
  }
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono font-bold',
          sizeClasses[variant as keyof typeof sizeClasses],
          textClasses[variant as keyof typeof textClasses]
        )}
      >
        {String(value).padStart(2, '0')}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1">{label}</span>
      )}
    </div>
  )
}

export function CountdownTimer({ 
  endTime, 
  onComplete,
  className,
  variant = 'default',
  showLabels = true
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => 
    calculateTimeLeft(new Date(endTime))
  )
  
  useEffect(() => {
    const end = new Date(endTime)
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(end)
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [endTime, onComplete])
  
  if (timeLeft.total <= 0) {
    return (
      <div className={cn('text-center text-destructive font-semibold', className)}>
        Sale Ended
      </div>
    )
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {timeLeft.days > 0 && (
        <>
          <TimeUnit 
            value={timeLeft.days} 
            label="Days" 
            showLabel={showLabels}
            variant={variant}
          />
          <span className="text-xl font-bold text-muted-foreground">:</span>
        </>
      )}
      <TimeUnit 
        value={timeLeft.hours} 
        label="Hours" 
        showLabel={showLabels}
        variant={variant}
      />
      <span className="text-xl font-bold text-muted-foreground">:</span>
      <TimeUnit 
        value={timeLeft.minutes} 
        label="Mins" 
        showLabel={showLabels}
        variant={variant}
      />
      <span className="text-xl font-bold text-muted-foreground">:</span>
      <TimeUnit 
        value={timeLeft.seconds} 
        label="Secs" 
        showLabel={showLabels}
        variant={variant}
      />
    </div>
  )
}
```

---

### Task 42B.3: Create Flash Sales View

**File**: `src/components/ecommerce/views/flash-sales-view.tsx`
**Action**: Create

```typescript
/**
 * Flash Sales View
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * List and manage flash sales with create/edit functionality.
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Zap,
  Calendar,
  Clock,
  Package,
  Percent,
  DollarSign
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns'
import { useFlashSales } from '@/hooks/ecommerce/use-marketing'
import { CountdownTimer } from '../widgets/countdown-timer'
import { FlashSaleDialog } from '../dialogs/flash-sale-dialog'
import type { FlashSale, FlashSaleStatus } from '@/modules/ecommerce/types/marketing-types'

// ============================================================================
// TYPES
// ============================================================================

interface FlashSalesViewProps {
  siteId: string
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: FlashSaleStatus }) {
  const variants: Record<FlashSaleStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    scheduled: { variant: 'outline', label: 'Scheduled' },
    active: { variant: 'default', label: 'Active' },
    ended: { variant: 'secondary', label: 'Ended' },
    cancelled: { variant: 'destructive', label: 'Cancelled' }
  }
  
  const config = variants[status]
  
  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  )
}

// ============================================================================
// FLASH SALE CARD
// ============================================================================

interface FlashSaleCardProps {
  sale: FlashSale
  onEdit: () => void
  onDelete: () => void
}

function FlashSaleCard({ sale, onEdit, onDelete }: FlashSaleCardProps) {
  const isActive = sale.status === 'active'
  const endsAt = new Date(sale.ends_at)
  const startsAt = new Date(sale.starts_at)
  
  return (
    <Card className={isActive ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <CardTitle className="text-lg">{sale.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={sale.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discount info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {sale.discount_type === 'percentage' ? (
              <Percent className="h-4 w-4 text-muted-foreground" />
            ) : (
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-semibold">
              {sale.discount_type === 'percentage' 
                ? `${sale.discount_value}% off`
                : `$${(sale.discount_value / 100).toFixed(2)} off`
              }
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{sale.product_count ?? 0} products</span>
          </div>
        </div>
        
        {/* Timing */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startsAt, 'MMM d, h:mm a')}</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(endsAt, 'MMM d, h:mm a')}</span>
          </div>
        </div>
        
        {/* Countdown for active sales */}
        {isActive && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Ends in:</p>
            <CountdownTimer endTime={sale.ends_at} variant="compact" />
          </div>
        )}
        
        {/* Scheduled indicator */}
        {sale.status === 'scheduled' && isFuture(startsAt) && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Starts {formatDistanceToNow(startsAt, { addSuffix: true })}
            </p>
          </div>
        )}
        
        {/* Usage stats */}
        {sale.max_uses && (
          <div className="text-sm text-muted-foreground">
            {sale.current_uses} / {sale.max_uses} redemptions
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FlashSalesView({ siteId }: FlashSalesViewProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<FlashSale | null>(null)
  
  const {
    sales,
    activeSales,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove
  } = useFlashSales(siteId)
  
  const handleEdit = (sale: FlashSale) => {
    setEditingSale(sale)
    setDialogOpen(true)
  }
  
  const handleDelete = (sale: FlashSale) => {
    setSaleToDelete(sale)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (saleToDelete) {
      await remove(saleToDelete.id)
      setDeleteDialogOpen(false)
      setSaleToDelete(null)
    }
  }
  
  const filteredSales = sales.filter(sale => {
    if (activeTab === 'all') return true
    return sale.status === activeTab
  })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Flash Sales</h2>
          <p className="text-muted-foreground">
            Create time-limited promotions to drive urgency
          </p>
        </div>
        <Button onClick={() => { setEditingSale(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Flash Sale
        </Button>
      </div>
      
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({sales.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({sales.filter(s => s.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({sales.filter(s => s.status === 'scheduled').length})
          </TabsTrigger>
          <TabsTrigger value="ended">
            Ended ({sales.filter(s => s.status === 'ended').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredSales.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No flash sales</h3>
            <p className="text-muted-foreground mb-4">
              Create your first flash sale to drive urgency and sales
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flash Sale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSales.map(sale => (
            <FlashSaleCard
              key={sale.id}
              sale={sale}
              onEdit={() => handleEdit(sale)}
              onDelete={() => handleDelete(sale)}
            />
          ))}
        </div>
      )}
      
      {/* Create/Edit Dialog */}
      <FlashSaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        siteId={siteId}
        sale={editingSale}
        onCreate={create}
        onUpdate={update}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flash Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{saleToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default FlashSalesView
```

---

### Task 42B.4: Create Gift Cards View

**File**: `src/components/ecommerce/views/gift-cards-view.tsx`
**Action**: Create

```typescript
/**
 * Gift Cards View
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * List and manage gift cards with issue/lookup functionality.
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search,
  Gift,
  CreditCard,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { useGiftCards } from '@/hooks/ecommerce/use-marketing'
import { CreateGiftCardDialog } from '../dialogs/create-gift-card-dialog'
import type { GiftCard } from '@/modules/ecommerce/types/marketing-types'

// ============================================================================
// TYPES
// ============================================================================

interface GiftCardsViewProps {
  siteId: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100)
}

// ============================================================================
// GIFT CARD LOOKUP DIALOG
// ============================================================================

interface LookupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: GiftCard | null
  onLookup: (code: string) => Promise<GiftCard | null>
}

function GiftCardLookupDialog({ open, onOpenChange, card, onLookup }: LookupDialogProps) {
  const [code, setCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchedCard, setSearchedCard] = useState<GiftCard | null>(card)
  const [notFound, setNotFound] = useState(false)
  
  const handleSearch = async () => {
    if (!code.trim()) return
    
    setIsSearching(true)
    setNotFound(false)
    
    const result = await onLookup(code.trim())
    
    if (result) {
      setSearchedCard(result)
    } else {
      setSearchedCard(null)
      setNotFound(true)
    }
    
    setIsSearching(false)
  }
  
  const copyCode = () => {
    if (searchedCard) {
      navigator.clipboard.writeText(searchedCard.code)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gift Card Lookup</DialogTitle>
          <DialogDescription>
            Check the balance and status of a gift card
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter gift card code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {notFound && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span>Gift card not found</span>
            </div>
          )}
          
          {searchedCard && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <span className="font-mono font-semibold">{searchedCard.code}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={copyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(searchedCard.current_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Initial Value</p>
                    <p className="text-lg">
                      {formatCurrency(searchedCard.initial_balance)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {searchedCard.is_active ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </div>
                
                {searchedCard.expires_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Expires: </span>
                    {format(new Date(searchedCard.expires_at), 'MMM d, yyyy')}
                  </div>
                )}
                
                {searchedCard.recipient_email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Recipient: </span>
                    {searchedCard.recipient_email}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GiftCardsView({ siteId }: GiftCardsViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [lookupDialogOpen, setLookupDialogOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  
  const {
    cards,
    isLoading,
    error,
    refresh,
    create,
    lookup
  } = useGiftCards(siteId)
  
  const handleLookup = async (code: string) => {
    return await lookup(code)
  }
  
  // Summary stats
  const totalValue = cards.reduce((sum, c) => sum + c.initial_balance, 0)
  const outstandingValue = cards.reduce((sum, c) => sum + c.current_balance, 0)
  const activeCount = cards.filter(c => c.is_active && c.current_balance > 0).length
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gift Cards</h2>
          <p className="text-muted-foreground">
            Issue and manage gift cards and store credit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLookupDialogOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Lookup
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Issue Gift Card
          </Button>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              Total Issued
            </div>
            <p className="text-2xl font-bold">{cards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              Active Cards
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground mb-1">Total Value</div>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground mb-1">Outstanding</div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(outstandingValue)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Gift Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Gift Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No gift cards</h3>
              <p className="text-muted-foreground mb-4">
                Issue your first gift card
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Issue Gift Card
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Initial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Recipient</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow 
                    key={card.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedCard(card)
                      setLookupDialogOpen(true)
                    }}
                  >
                    <TableCell className="font-mono">{card.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{card.type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(card.current_balance)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(card.initial_balance)}
                    </TableCell>
                    <TableCell>
                      {card.is_active && card.current_balance > 0 ? (
                        <Badge variant="default">Active</Badge>
                      ) : card.current_balance === 0 ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(card.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {card.recipient_email || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Create Dialog */}
      <CreateGiftCardDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        siteId={siteId}
        onCreate={create}
      />
      
      {/* Lookup Dialog */}
      <GiftCardLookupDialog
        open={lookupDialogOpen}
        onOpenChange={setLookupDialogOpen}
        card={selectedCard}
        onLookup={handleLookup}
      />
    </div>
  )
}

export default GiftCardsView
```

---

### Task 42B.5: Create Main Marketing View

**File**: `src/components/ecommerce/views/marketing-view.tsx`
**Action**: Create

```typescript
/**
 * Marketing View
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Main marketing dashboard with tabs for all marketing features.
 */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, Package, Gift, Star } from 'lucide-react'
import { FlashSalesView } from './flash-sales-view'
import { GiftCardsView } from './gift-cards-view'
// import { BundlesView } from './bundles-view'
// import { LoyaltyConfigView } from './loyalty-config-view'

// ============================================================================
// TYPES
// ============================================================================

interface MarketingViewProps {
  siteId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MarketingView({ siteId }: MarketingViewProps) {
  const [activeTab, setActiveTab] = useState('flash-sales')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground">
          Promotions, bundles, gift cards, and loyalty programs
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="flash-sales" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Flash Sales</span>
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Bundles</span>
          </TabsTrigger>
          <TabsTrigger value="gift-cards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Gift Cards</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Loyalty</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="flash-sales" className="mt-6">
          <FlashSalesView siteId={siteId} />
        </TabsContent>
        
        <TabsContent value="bundles" className="mt-6">
          {/* Bundles view placeholder */}
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Product Bundles</h3>
            <p className="text-muted-foreground">
              Create product bundles with special pricing
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="gift-cards" className="mt-6">
          <GiftCardsView siteId={siteId} />
        </TabsContent>
        
        <TabsContent value="loyalty" className="mt-6">
          {/* Loyalty view placeholder */}
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Loyalty Program</h3>
            <p className="text-muted-foreground">
              Configure points earning and redemption rules
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MarketingView
```

---

### Task 42B.6: Create Flash Sale Dialog

**File**: `src/components/ecommerce/dialogs/flash-sale-dialog.tsx`
**Action**: Create

```typescript
/**
 * Flash Sale Dialog
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for creating and editing flash sales.
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  FlashSale, 
  FlashSaleInput, 
  FlashSaleUpdate,
  FlashSaleDiscountType 
} from '@/modules/ecommerce/types/marketing-types'

// ============================================================================
// TYPES
// ============================================================================

interface FlashSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  sale: FlashSale | null
  onCreate: (input: FlashSaleInput) => Promise<FlashSale | null>
  onUpdate: (id: string, updates: FlashSaleUpdate) => Promise<boolean>
}

// ============================================================================
// HELPER
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FlashSaleDialog({
  open,
  onOpenChange,
  siteId,
  sale,
  onCreate,
  onUpdate
}: FlashSaleDialogProps) {
  const isEditing = !!sale
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<FlashSaleDiscountType>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [startTime, setStartTime] = useState('00:00')
  const [endDate, setEndDate] = useState<Date>()
  const [endTime, setEndTime] = useState('23:59')
  const [maxUses, setMaxUses] = useState('')
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [showCountdown, setShowCountdown] = useState(true)
  const [badgeText, setBadgeText] = useState('')
  
  // Populate form when editing
  useEffect(() => {
    if (sale) {
      setName(sale.name)
      setSlug(sale.slug)
      setDescription(sale.description ?? '')
      setDiscountType(sale.discount_type)
      setDiscountValue(String(sale.discount_value))
      
      const start = new Date(sale.starts_at)
      setStartDate(start)
      setStartTime(format(start, 'HH:mm'))
      
      const end = new Date(sale.ends_at)
      setEndDate(end)
      setEndTime(format(end, 'HH:mm'))
      
      setMaxUses(sale.max_uses ? String(sale.max_uses) : '')
      setMaxUsesPerCustomer(sale.max_uses_per_customer ? String(sale.max_uses_per_customer) : '')
      setIsFeatured(sale.is_featured)
      setShowCountdown(sale.show_countdown)
      setBadgeText(sale.badge_text ?? '')
    } else {
      // Reset form for new sale
      setName('')
      setSlug('')
      setDescription('')
      setDiscountType('percentage')
      setDiscountValue('')
      setStartDate(undefined)
      setStartTime('00:00')
      setEndDate(undefined)
      setEndTime('23:59')
      setMaxUses('')
      setMaxUsesPerCustomer('')
      setIsFeatured(false)
      setShowCountdown(true)
      setBadgeText('')
    }
  }, [sale, open])
  
  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!isEditing) {
      setSlug(generateSlug(value))
    }
  }
  
  const handleSubmit = async () => {
    if (!name || !startDate || !endDate || !discountValue) return
    
    setIsSubmitting(true)
    
    // Combine date and time
    const startsAt = new Date(startDate)
    const [startHour, startMin] = startTime.split(':').map(Number)
    startsAt.setHours(startHour, startMin, 0, 0)
    
    const endsAt = new Date(endDate)
    const [endHour, endMin] = endTime.split(':').map(Number)
    endsAt.setHours(endHour, endMin, 0, 0)
    
    const input: FlashSaleInput = {
      name,
      slug: slug || generateSlug(name),
      description: description || undefined,
      discount_type: discountType,
      discount_value: parseInt(discountValue),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      max_uses: maxUses ? parseInt(maxUses) : undefined,
      max_uses_per_customer: maxUsesPerCustomer ? parseInt(maxUsesPerCustomer) : undefined,
      is_featured: isFeatured,
      show_countdown: showCountdown,
      badge_text: badgeText || undefined
    }
    
    let success = false
    
    if (isEditing && sale) {
      success = await onUpdate(sale.id, input)
    } else {
      const result = await onCreate(input)
      success = !!result
    }
    
    setIsSubmitting(false)
    
    if (success) {
      onOpenChange(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Flash Sale' : 'Create Flash Sale'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the flash sale settings'
              : 'Create a time-limited promotion to drive urgency'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sale Name *</Label>
                <Input
                  id="name"
                  placeholder="Summer Sale"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="summer-sale"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Limited time offer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          {/* Discount Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Discount</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select 
                  value={discountType} 
                  onValueChange={(v) => setDiscountType(v as FlashSaleDiscountType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">
                  {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (cents)'} *
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  placeholder={discountType === 'percentage' ? '20' : '1000'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Timing */}
          <div className="space-y-4">
            <h4 className="font-medium">Timing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Limits */}
          <div className="space-y-4">
            <h4 className="font-medium">Limits (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-uses">Max Total Uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-per-customer">Max Per Customer</Label>
                <Input
                  id="max-per-customer"
                  type="number"
                  placeholder="Unlimited"
                  value={maxUsesPerCustomer}
                  onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Display Options</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Sale</Label>
                  <p className="text-sm text-muted-foreground">
                    Show prominently on storefront
                  </p>
                </div>
                <Switch
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Countdown</Label>
                  <p className="text-sm text-muted-foreground">
                    Display countdown timer
                  </p>
                </div>
                <Switch
                  checked={showCountdown}
                  onCheckedChange={setShowCountdown}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge-text">Badge Text</Label>
                <Input
                  id="badge-text"
                  placeholder="FLASH SALE"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !name || !startDate || !endDate || !discountValue}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 42B.7: Create Gift Card Dialog

**File**: `src/components/ecommerce/dialogs/create-gift-card-dialog.tsx`
**Action**: Create

```typescript
/**
 * Create Gift Card Dialog
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for issuing new gift cards.
 */
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { format, addYears } from 'date-fns'
import { CalendarIcon, Loader2, Gift, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  GiftCard, 
  GiftCardInput, 
  GiftCardType,
  GiftCardDelivery 
} from '@/modules/ecommerce/types/marketing-types'

// ============================================================================
// TYPES
// ============================================================================

interface CreateGiftCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onCreate: (input: GiftCardInput) => Promise<GiftCard | null>
}

// ============================================================================
// PRESET AMOUNTS
// ============================================================================

const PRESET_AMOUNTS = [2500, 5000, 10000, 25000, 50000, 10000] // In cents

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CreateGiftCardDialog({
  open,
  onOpenChange,
  siteId,
  onCreate
}: CreateGiftCardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCard, setCreatedCard] = useState<GiftCard | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Form state
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [type, setType] = useState<GiftCardType>('standard')
  const [expiresAt, setExpiresAt] = useState<Date>(addYears(new Date(), 1))
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [senderName, setSenderName] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<GiftCardDelivery>('email')
  
  const handleSelectAmount = (value: number) => {
    setAmount(String(value))
    setCustomAmount('')
  }
  
  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    setAmount('')
  }
  
  const getAmountInCents = (): number => {
    if (amount) return parseInt(amount)
    if (customAmount) return Math.round(parseFloat(customAmount) * 100)
    return 0
  }
  
  const handleSubmit = async () => {
    const amountCents = getAmountInCents()
    if (amountCents <= 0) return
    
    setIsSubmitting(true)
    
    const input: GiftCardInput = {
      initial_balance: amountCents,
      type,
      expires_at: expiresAt.toISOString(),
      recipient_name: recipientName || undefined,
      recipient_email: recipientEmail || undefined,
      sender_name: senderName || undefined,
      personal_message: personalMessage || undefined,
      delivery_method: deliveryMethod
    }
    
    const card = await onCreate(input)
    
    setIsSubmitting(false)
    
    if (card) {
      setCreatedCard(card)
    }
  }
  
  const handleCopyCode = () => {
    if (createdCard) {
      navigator.clipboard.writeText(createdCard.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleClose = () => {
    setCreatedCard(null)
    setAmount('')
    setCustomAmount('')
    setType('standard')
    setExpiresAt(addYears(new Date(), 1))
    setRecipientName('')
    setRecipientEmail('')
    setSenderName('')
    setPersonalMessage('')
    onOpenChange(false)
  }
  
  // Success state
  if (createdCard) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Gift Card Created!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Gift Card Code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold">
                  {createdCard.code}
                </span>
                <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-3xl font-bold mt-4">
                ${(createdCard.initial_balance / 100).toFixed(2)}
              </p>
            </div>
            
            {createdCard.recipient_email && (
              <p className="text-sm text-muted-foreground text-center">
                A notification will be sent to {createdCard.recipient_email}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue Gift Card</DialogTitle>
          <DialogDescription>
            Create a new gift card or store credit
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Amount Selection */}
          <div className="space-y-3">
            <Label>Amount *</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === String(preset) ? 'default' : 'outline'}
                  onClick={() => handleSelectAmount(preset)}
                >
                  ${(preset / 100).toFixed(0)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">or</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="Custom amount"
                  className="pl-7"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as GiftCardType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Gift Card</SelectItem>
                <SelectItem value="promotional">Promotional Credit</SelectItem>
                <SelectItem value="reward">Reward Credit</SelectItem>
                <SelectItem value="refund">Refund Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Expiration */}
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(expiresAt, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={(date) => date && setExpiresAt(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Recipient Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Recipient (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Name</Label>
                <Input
                  id="recipient-name"
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="john@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sender-name">From (Sender Name)</Label>
              <Input
                id="sender-name"
                placeholder="Your Store"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message</Label>
              <Textarea
                id="message"
                placeholder="Enjoy this gift!"
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || getAmountInCents() <= 0}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Issue Gift Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] `useFlashSales` hook CRUD operations work
- [ ] `useBundles` hook CRUD operations work
- [ ] `useGiftCards` hook CRUD operations work
- [ ] `useLoyalty` hook config operations work
- [ ] `CountdownTimer` counts down correctly
- [ ] Flash sales view lists and filters correctly
- [ ] Flash sale dialog creates/edits sales
- [ ] Gift cards view shows cards and stats
- [ ] Create gift card dialog issues cards
- [ ] Gift card lookup finds cards by code
- [ ] Marketing view tabs navigate correctly
- [ ] Mobile responsive layouts work

---

## 🔄 Rollback Plan

If issues occur:

```bash
git checkout HEAD~1 -- src/components/ecommerce/views/marketing-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/views/flash-sales-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/views/gift-cards-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/dialogs/
git checkout HEAD~1 -- src/components/ecommerce/widgets/countdown-timer.tsx
git checkout HEAD~1 -- src/hooks/ecommerce/use-marketing.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-42B completion note
- `progress.md`: Update Wave 5 section - Marketing UI complete

---

## ✨ Success Criteria

- [ ] All marketing hooks functional
- [ ] Flash sales CRUD with timing works
- [ ] Countdown timer updates in real-time
- [ ] Gift card issue and lookup works
- [ ] Copy gift card code to clipboard works
- [ ] All views render correctly
- [ ] Mobile responsive
- [ ] Zero TypeScript errors
