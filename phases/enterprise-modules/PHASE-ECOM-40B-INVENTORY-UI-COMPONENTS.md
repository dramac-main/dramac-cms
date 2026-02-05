# PHASE-ECOM-40B: Inventory Management - UI Components

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 5-6 hours
> **Prerequisites**: PHASE-ECOM-40A Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the dashboard UI components for inventory management including the inventory dashboard view, stock adjustment dialogs, inventory history table, alert widgets, and settings panels. These components provide a complete inventory management interface for store operators.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Verify PHASE-ECOM-40A is complete (schema + actions)
- [ ] Verify database migration has been applied
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Inventory UI Components (Phase 40B)
├── Views
│   └── inventory-view.tsx         → Main inventory dashboard
│
├── Widgets
│   └── StockAlertWidget.tsx       → Dashboard alert summary
│
├── Dialogs
│   ├── StockAdjustmentDialog.tsx  → Single/bulk adjustment
│   └── AlertSettingsDialog.tsx    → Configure thresholds
│
├── Tables
│   └── InventoryHistoryTable.tsx  → Movement history with filters
│
└── Settings
    └── InventoryAlertSettings.tsx → Global alert configuration
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `components/views/inventory-view.tsx` | Create | Main inventory dashboard |
| `components/widgets/StockAlertWidget.tsx` | Create | Alert summary widget |
| `components/inventory/StockAdjustmentDialog.tsx` | Create | Stock adjustment modal |
| `components/inventory/AlertSettingsDialog.tsx` | Create | Per-product alert config |
| `components/inventory/InventoryHistoryTable.tsx` | Create | Movement history table |
| `components/settings/InventoryAlertSettings.tsx` | Create | Global alert settings |
| `components/inventory/index.ts` | Create | Barrel export |
| `components/ecommerce-dashboard.tsx` | Modify | Add inventory view |

---

## 📋 Implementation Tasks

### Task 40B.1: Create Stock Alert Widget

**File**: `src/modules/ecommerce/components/widgets/StockAlertWidget.tsx`
**Action**: Create

```typescript
/**
 * Stock Alert Widget
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * Dashboard widget showing stock alert summary with quick actions.
 */
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Package, AlertCircle, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getStockAlerts } from '../../actions/inventory-actions'
import type { AlertedProduct, StockAlertLevel } from '../../types/inventory-types'

interface StockAlertWidgetProps {
  siteId: string
  onViewAll?: () => void
  onProductClick?: (productId: string) => void
  className?: string
}

const alertLevelConfig: Record<StockAlertLevel, {
  label: string
  color: string
  icon: typeof AlertTriangle
  bgColor: string
}> = {
  out: {
    label: 'Out of Stock',
    color: 'text-red-600 dark:text-red-400',
    icon: AlertCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  critical: {
    label: 'Critical',
    color: 'text-orange-600 dark:text-orange-400',
    icon: AlertTriangle,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  low: {
    label: 'Low Stock',
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: Package,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  ok: {
    label: 'In Stock',
    color: 'text-green-600 dark:text-green-400',
    icon: CheckCircle,
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  }
}

export function StockAlertWidget({
  siteId,
  onViewAll,
  onProductClick,
  className
}: StockAlertWidgetProps) {
  const [alerts, setAlerts] = useState<AlertedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAlerts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const data = await getStockAlerts(siteId, 'all')
      // Only show alerts (not 'ok' status)
      setAlerts(data.filter(a => a.alert_level !== 'ok').slice(0, 5))
    } catch (error) {
      console.error('Error fetching stock alerts:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [siteId])

  // Count by level
  const outCount = alerts.filter(a => a.alert_level === 'out').length
  const criticalCount = alerts.filter(a => a.alert_level === 'critical').length
  const lowCount = alerts.filter(a => a.alert_level === 'low').length

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription>
              Products needing attention
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchAlerts(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex gap-2 mb-4">
          {outCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {outCount} Out
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge className="gap-1 bg-orange-500 hover:bg-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} Critical
            </Badge>
          )}
          {lowCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {lowCount} Low
            </Badge>
          )}
          {alerts.length === 0 && (
            <Badge variant="outline" className="gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              All Good
            </Badge>
          )}
        </div>

        {/* Alert list */}
        {alerts.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {alerts.map(alert => {
                const config = alertLevelConfig[alert.alert_level]
                const Icon = config.icon
                
                return (
                  <div
                    key={`${alert.product_id}-${alert.variant_id}`}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      config.bgColor,
                      "hover:opacity-80"
                    )}
                    onClick={() => onProductClick?.(alert.product_id)}
                  >
                    {/* Product image or icon */}
                    <div className="h-10 w-10 rounded bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      {alert.image_url ? (
                        <img 
                          src={alert.image_url} 
                          alt={alert.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {alert.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.sku ? `SKU: ${alert.sku}` : 'No SKU'}
                      </p>
                    </div>
                    
                    {/* Stock count */}
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", config.color)}>
                        {alert.current_stock}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{alert.threshold}
                      </p>
                    </div>
                    
                    {/* Alert icon */}
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-sm font-medium">All stock levels healthy</p>
            <p className="text-xs text-muted-foreground">
              No products below threshold
            </p>
          </div>
        )}

        {/* View all link */}
        {onViewAll && alerts.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={onViewAll}
          >
            View All Inventory
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### Task 40B.2: Create Stock Adjustment Dialog

**File**: `src/modules/ecommerce/components/inventory/StockAdjustmentDialog.tsx`
**Action**: Create

```typescript
/**
 * Stock Adjustment Dialog
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * Modal dialog for adjusting stock levels with reason tracking.
 */
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle,
  Loader2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Truck,
  Trash2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { adjustStock } from '../../actions/inventory-actions'
import type { InventoryMovementType } from '../../types/inventory-types'
import type { Product, ProductVariant } from '../../types/ecommerce-types'

// Movement type configurations
const movementTypes: Array<{
  value: InventoryMovementType
  label: string
  description: string
  icon: typeof Plus
  direction: 'in' | 'out'
}> = [
  { 
    value: 'restock', 
    label: 'Restock', 
    description: 'Inventory received',
    icon: ArrowUp,
    direction: 'in'
  },
  { 
    value: 'adjustment', 
    label: 'Adjustment', 
    description: 'Manual correction',
    icon: RotateCcw,
    direction: 'in' // Can be either, handled by sign
  },
  { 
    value: 'return', 
    label: 'Return', 
    description: 'Customer returned item',
    icon: Truck,
    direction: 'in'
  },
  { 
    value: 'sale', 
    label: 'Sale', 
    description: 'Sold (manual)',
    icon: ArrowDown,
    direction: 'out'
  },
  { 
    value: 'damage', 
    label: 'Damage', 
    description: 'Damaged/unusable',
    icon: Trash2,
    direction: 'out'
  },
  { 
    value: 'expired', 
    label: 'Expired', 
    description: 'Past expiry date',
    icon: AlertTriangle,
    direction: 'out'
  }
]

const formSchema = z.object({
  type: z.enum(['restock', 'adjustment', 'return', 'sale', 'damage', 'expired'] as const),
  direction: z.enum(['add', 'remove']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  product: Product
  variant?: ProductVariant | null
  onSuccess?: () => void
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  siteId,
  product,
  variant,
  onSuccess
}: StockAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const currentStock = variant?.quantity ?? product.quantity
  const productName = variant 
    ? `${product.name} (${Object.values(variant.options).join(' / ')})`
    : product.name
  const sku = variant?.sku ?? product.sku

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'adjustment',
      direction: 'add',
      quantity: 1,
      reason: ''
    }
  })

  const selectedType = form.watch('type')
  const direction = form.watch('direction')
  const quantity = form.watch('quantity')
  
  // Calculate new stock preview
  const quantityChange = direction === 'add' ? quantity : -quantity
  const newStock = Math.max(0, currentStock + quantityChange)

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const adjustedQuantity = values.direction === 'add' 
        ? values.quantity 
        : -values.quantity
      
      const result = await adjustStock(
        siteId,
        product.id,
        variant?.id ?? null,
        adjustedQuantity,
        values.type,
        values.reason
      )
      
      if (result.success) {
        toast.success('Stock adjusted successfully', {
          description: `${productName}: ${currentStock} → ${newStock}`
        })
        onOpenChange(false)
        onSuccess?.()
        form.reset()
      } else {
        toast.error('Failed to adjust stock', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Stock
          </DialogTitle>
          <DialogDescription>
            Update inventory for {productName}
          </DialogDescription>
        </DialogHeader>

        {/* Product info card */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <div className="h-12 w-12 rounded bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {product.images?.[0] ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            {variant && (
              <p className="text-sm text-muted-foreground">
                {Object.values(variant.options).join(' / ')}
              </p>
            )}
            {sku && (
              <p className="text-xs text-muted-foreground">SKU: {sku}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{currentStock}</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Movement type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {movementTypes.map(type => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{type.label}</span>
                              <span className="text-muted-foreground">
                                - {type.description}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Direction (add/remove) */}
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="add"
                          id="add"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="add"
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-md border-2 p-3 cursor-pointer",
                            "hover:bg-accent peer-data-[state=checked]:border-green-500",
                            "peer-data-[state=checked]:bg-green-50 dark:peer-data-[state=checked]:bg-green-900/20"
                          )}
                        >
                          <Plus className="h-4 w-4 text-green-600" />
                          <span>Add Stock</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="remove"
                          id="remove"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="remove"
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-md border-2 p-3 cursor-pointer",
                            "hover:bg-accent peer-data-[state=checked]:border-red-500",
                            "peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-900/20"
                          )}
                        >
                          <Minus className="h-4 w-4 text-red-600" />
                          <span>Remove Stock</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => field.onChange(Math.max(1, (field.value || 1) - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        className="text-center"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => field.onChange((field.value || 1) + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted">
              <div className="text-center">
                <p className="text-2xl font-bold">{currentStock}</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
                direction === 'add' 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {direction === 'add' ? '+' : '-'}{quantity || 0}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-2xl font-bold",
                  newStock === 0 && "text-red-600"
                )}>
                  {newStock}
                </p>
                <p className="text-xs text-muted-foreground">New</p>
              </div>
            </div>

            {/* Warning if going to 0 */}
            {newStock === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">
                  This will set stock to 0 (out of stock)
                </p>
              </div>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a note about this adjustment..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be recorded in the inventory history
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Adjust Stock
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 40B.3: Create Inventory History Table

**File**: `src/modules/ecommerce/components/inventory/InventoryHistoryTable.tsx`
**Action**: Create

```typescript
/**
 * Inventory History Table
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * TanStack Table showing stock movement history with filters.
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Truck,
  Trash2,
  AlertTriangle,
  Package,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getStockHistory } from '../../actions/inventory-actions'
import type { InventoryMovement, InventoryMovementType } from '../../types/inventory-types'

// Movement type display config
const movementTypeConfig: Record<InventoryMovementType, {
  label: string
  icon: typeof ArrowUp
  color: string
  bgColor: string
}> = {
  restock: {
    label: 'Restock',
    icon: ArrowUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  adjustment: {
    label: 'Adjustment',
    icon: RotateCcw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  sale: {
    label: 'Sale',
    icon: ArrowDown,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  return: {
    label: 'Return',
    icon: Truck,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
  },
  transfer: {
    label: 'Transfer',
    icon: Truck,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  damage: {
    label: 'Damage',
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  reserved: {
    label: 'Reserved',
    icon: Package,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  unreserved: {
    label: 'Unreserved',
    icon: Package,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30'
  }
}

interface InventoryHistoryTableProps {
  siteId: string
  productId?: string
  className?: string
}

export function InventoryHistoryTable({
  siteId,
  productId,
  className
}: InventoryHistoryTableProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const fetchHistory = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const result = await getStockHistory(siteId, productId, {
        type: typeFilter !== 'all' ? typeFilter as InventoryMovementType : undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      
      setMovements(result.movements)
      setTotal(result.total)
    } catch (error) {
      console.error('Error fetching inventory history:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [siteId, productId, typeFilter, page, pageSize])

  // Define columns
  const columns: ColumnDef<InventoryMovement>[] = useMemo(() => [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="font-medium">
            {format(new Date(row.original.created_at), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(row.original.created_at), 'h:mm a')}
          </p>
        </div>
      )
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original.product
        const variant = row.original.variant
        
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden">
              {product?.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {product?.name ?? 'Unknown Product'}
              </p>
              {variant && (
                <p className="text-xs text-muted-foreground">
                  {Object.values(variant.options).join(' / ')}
                </p>
              )}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const config = movementTypeConfig[row.original.type]
        const Icon = config.icon
        
        return (
          <Badge variant="secondary" className={cn("gap-1", config.bgColor, config.color)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'quantity',
      header: 'Change',
      cell: ({ row }) => {
        const qty = row.original.quantity
        const isPositive = qty > 0
        
        return (
          <span className={cn(
            "font-mono font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? '+' : ''}{qty}
          </span>
        )
      }
    },
    {
      accessorKey: 'previous_stock',
      header: 'Before',
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">
          {row.original.previous_stock}
        </span>
      )
    },
    {
      accessorKey: 'new_stock',
      header: 'After',
      cell: ({ row }) => (
        <span className={cn(
          "font-mono font-medium",
          row.original.new_stock === 0 && "text-red-600"
        )}>
          {row.original.new_stock}
        </span>
      )
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {row.original.reason || '-'}
        </span>
      )
    }
  ], [])

  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize)
  })

  const totalPages = Math.ceil(total / pageSize)

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Product', 'SKU', 'Type', 'Change', 'Before', 'After', 'Reason']
    const rows = movements.map(m => [
      format(new Date(m.created_at), 'yyyy-MM-dd HH:mm:ss'),
      m.product?.name ?? 'Unknown',
      m.product?.sku ?? '',
      m.type,
      m.quantity,
      m.previous_stock,
      m.new_stock,
      m.reason ?? ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(movementTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>No inventory movements found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 40B.4: Create Inventory View

**File**: `src/modules/ecommerce/components/views/inventory-view.tsx`
**Action**: Create

```typescript
/**
 * Inventory View Component
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * Main inventory dashboard with stock levels, alerts, and history.
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Plus,
  Settings,
  Download,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { StockAlertWidget } from '../widgets/StockAlertWidget'
import { StockAdjustmentDialog } from '../inventory/StockAdjustmentDialog'
import { InventoryHistoryTable } from '../inventory/InventoryHistoryTable'
import { 
  getInventoryReport, 
  getStockValuation,
  getStockAlerts 
} from '../../actions/inventory-actions'
import type { InventoryReport, StockValuation, AlertedProduct } from '../../types/inventory-types'
import type { Product } from '../../types/ecommerce-types'

interface InventoryViewProps {
  siteId: string
  agencyId: string
}

export function InventoryView({ siteId, agencyId }: InventoryViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<InventoryReport | null>(null)
  const [valuation, setValuation] = useState<StockValuation | null>(null)
  const [alerts, setAlerts] = useState<AlertedProduct[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Dialog state
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [reportData, valuationData, alertData] = await Promise.all([
        getInventoryReport(siteId),
        getStockValuation(siteId),
        getStockAlerts(siteId, 'all')
      ])
      
      setReport(reportData)
      setValuation(valuationData)
      setAlerts(alertData.filter(a => a.alert_level !== 'ok'))
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [siteId])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">
            Manage stock levels and track inventory movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {report?.summary.total_products ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report?.summary.total_quantity ?? 0} units
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inventory Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(valuation?.total_cost ?? 0)}
                </p>
                <p className="text-sm text-green-600">
                  {formatCurrency(valuation?.potential_profit ?? 0)} potential profit
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {(report?.summary.low_stock_count ?? 0) + (report?.summary.critical_stock_count ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report?.summary.critical_stock_count ?? 0} critical
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <TrendingDown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Out of Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {report?.summary.out_of_stock_count ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  products unavailable
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Alerts Widget */}
            <StockAlertWidget
              siteId={siteId}
              onViewAll={() => setActiveTab('alerts')}
              onProductClick={(productId) => {
                // Navigate to product or open adjustment
                console.log('Product clicked:', productId)
              }}
              className="lg:col-span-1"
            />

            {/* Quick Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Stock Distribution</CardTitle>
                <CardDescription>Products by stock level</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stock level bars */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>In Stock</span>
                      <span className="font-medium text-green-600">
                        {report?.summary.in_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.in_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Low Stock</span>
                      <span className="font-medium text-yellow-600">
                        {report?.summary.low_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.low_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Critical Stock</span>
                      <span className="font-medium text-orange-600">
                        {report?.summary.critical_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.critical_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Out of Stock</span>
                      <span className="font-medium text-red-600">
                        {report?.summary.out_of_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.out_of_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Stock Alerts</CardTitle>
                  <CardDescription>
                    Products that need attention
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Alerts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div
                      key={`${alert.product_id}-${alert.variant_id}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        alert.alert_level === 'out' && "bg-red-50 dark:bg-red-900/20",
                        alert.alert_level === 'critical' && "bg-orange-50 dark:bg-orange-900/20",
                        alert.alert_level === 'low' && "bg-yellow-50 dark:bg-yellow-900/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                          {alert.image_url ? (
                            <img 
                              src={alert.image_url}
                              alt={alert.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{alert.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.sku ? `SKU: ${alert.sku}` : 'No SKU'} • 
                            {alert.current_stock} in stock
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          alert.alert_level === 'out' ? 'destructive' :
                          alert.alert_level === 'critical' ? 'default' :
                          'secondary'
                        }>
                          {alert.alert_level === 'out' ? 'Out of Stock' :
                           alert.alert_level === 'critical' ? 'Critical' :
                           'Low Stock'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Restock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-medium">All stock levels healthy</p>
                  <p className="text-sm text-muted-foreground">
                    No products below threshold
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory History</CardTitle>
              <CardDescription>
                All stock movements and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryHistoryTable siteId={siteId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Cost Value</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(valuation?.total_cost ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Retail Value</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(valuation?.total_value ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Potential Profit</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(valuation?.potential_profit ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* By Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {valuation?.by_category && valuation.by_category.length > 0 ? (
                <div className="space-y-3">
                  {valuation.by_category.map(cat => (
                    <div key={cat.category_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cat.category_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cat.quantity} units
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(cat.value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No category data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      {selectedProduct && (
        <StockAdjustmentDialog
          open={adjustmentDialogOpen}
          onOpenChange={setAdjustmentDialogOpen}
          siteId={siteId}
          product={selectedProduct}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}
```

---

### Task 40B.5: Create Inventory Components Index

**File**: `src/modules/ecommerce/components/inventory/index.ts`
**Action**: Create

```typescript
/**
 * Inventory Components Barrel Export
 * 
 * Phase ECOM-40B: Inventory Management UI
 */

export { StockAdjustmentDialog } from './StockAdjustmentDialog'
export { InventoryHistoryTable } from './InventoryHistoryTable'
```

---

### Task 40B.6: Update Dashboard with Inventory View

**File**: `src/modules/ecommerce/components/ecommerce-dashboard.tsx`
**Action**: Modify

Add the inventory view to the dashboard navigation. Find the views switch statement and add:

```typescript
// Add import at top
import { InventoryView } from './views/inventory-view'

// In the switch statement for activeView, add:
case 'inventory':
  return <InventoryView siteId={siteId} agencyId={agencyId} />
```

Also add 'inventory' to the EcommerceDashboardView type and navigation sidebar.

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Stock Alert Widget displays alerts correctly
- [ ] Stock Adjustment Dialog opens and saves adjustments
- [ ] Inventory History Table loads and filters data
- [ ] Inventory View renders all tabs correctly
- [ ] Pagination works in history table
- [ ] Export to CSV generates valid file
- [ ] Dashboard navigation includes Inventory link
- [ ] All components handle loading states
- [ ] All components handle empty states

---

## 🔄 Rollback Plan

If issues occur:

```bash
# Revert UI component files
git checkout HEAD~1 -- src/modules/ecommerce/components/views/inventory-view.tsx
git checkout HEAD~1 -- src/modules/ecommerce/components/widgets/StockAlertWidget.tsx
git checkout HEAD~1 -- src/modules/ecommerce/components/inventory/
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-40B completion note
- `progress.md`: Mark Wave 5 ECOM-40 complete

---

## ✨ Success Criteria

- [ ] Inventory dashboard shows accurate summary cards
- [ ] Stock alerts display with correct severity levels
- [ ] Stock adjustments create movement records
- [ ] History table shows all movements with filters
- [ ] Valuation tab shows correct totals
- [ ] Export produces valid CSV file
- [ ] Dashboard navigation works correctly
- [ ] Zero TypeScript errors
- [ ] All loading states work properly
