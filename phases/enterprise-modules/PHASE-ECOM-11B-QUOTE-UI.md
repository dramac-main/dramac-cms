# PHASE-ECOM-11B: Quote UI Components

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 5-6 hours
> **Prerequisites**: PHASE-ECOM-11A (Quote Server Actions)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create all UI components for quote management including the quotes view (list with filters), quote table, quote builder dialog, quote detail dialog, and supporting components. These components consume the server actions from Phase 11A.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Verify PHASE-ECOM-11A complete (server actions working)
- [ ] Review existing `order-detail-dialog.tsx` for patterns
- [ ] Review existing `customer-table.tsx` for TanStack Table patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUOTE UI COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  components/quotes/                                             │
│  ├── index.ts                    # Exports all components       │
│  ├── quote-table.tsx            # TanStack Table (~350 lines)   │
│  ├── quote-builder-dialog.tsx   # Multi-step form (~500 lines)  │
│  ├── quote-detail-dialog.tsx    # Tabs view (~400 lines)        │
│  ├── quote-items-editor.tsx     # Items list editor (~250 lines)│
│  ├── quote-timeline.tsx         # Activity timeline (~150 lines)│
│  ├── quote-status-badge.tsx     # Status badge (~50 lines)      │
│  └── product-selector.tsx       # Product search/add (~200 lines)│
│                                                                  │
│  components/views/                                              │
│  └── quotes-view.tsx            # Main view container (~200 ln) │
│                                                                  │
│  Integration:                                                   │
│  └── ecommerce-dashboard.tsx    # Connect quotes view           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/components/quotes/index.ts` | Create | Component exports |
| `src/modules/ecommerce/components/quotes/quote-status-badge.tsx` | Create | Status badge component |
| `src/modules/ecommerce/components/quotes/quote-timeline.tsx` | Create | Activity timeline |
| `src/modules/ecommerce/components/quotes/product-selector.tsx` | Create | Product search/add |
| `src/modules/ecommerce/components/quotes/quote-items-editor.tsx` | Create | Items list editor |
| `src/modules/ecommerce/components/quotes/quote-table.tsx` | Create | Quote data table |
| `src/modules/ecommerce/components/quotes/quote-builder-dialog.tsx` | Create | Create/edit quote |
| `src/modules/ecommerce/components/quotes/quote-detail-dialog.tsx` | Create | View quote details |
| `src/modules/ecommerce/components/views/quotes-view.tsx` | Create | Quotes list view |
| `src/modules/ecommerce/components/ecommerce-dashboard.tsx` | Modify | Connect quotes view |

---

## 📋 Implementation Tasks

### Task 11B.1: Create Quote Status Badge Component

**File**: `src/modules/ecommerce/components/quotes/quote-status-badge.tsx`
**Action**: Create

**Description**: Reusable badge component for displaying quote status with consistent styling.

```tsx
/**
 * Quote Status Badge Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Displays quote status with appropriate color coding
 */
'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  FileEdit, 
  Clock, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRightCircle,
  Ban
} from 'lucide-react'
import type { QuoteStatus } from '../../types/ecommerce-types'
import { QUOTE_STATUS_CONFIG } from '../../lib/quote-utils'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteStatusBadgeProps {
  status: QuoteStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ============================================================================
// STATUS ICONS
// ============================================================================

const statusIcons: Record<QuoteStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileEdit,
  pending_approval: Clock,
  sent: Send,
  viewed: Eye,
  accepted: CheckCircle,
  rejected: XCircle,
  expired: AlertTriangle,
  converted: ArrowRightCircle,
  cancelled: Ban
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'text-xs px-2.5 py-0.5',
    icon: 'h-3.5 w-3.5'
  },
  lg: {
    badge: 'text-sm px-3 py-1',
    icon: 'h-4 w-4'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}: QuoteStatusBadgeProps) {
  const config = QUOTE_STATUS_CONFIG[status]
  const Icon = statusIcons[status]
  const sizes = sizeConfig[size]

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border-0',
        config.bgColor,
        config.color,
        sizes.badge,
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn('mr-1', sizes.icon)} />
      )}
      {config.label}
    </Badge>
  )
}

/**
 * Get status badge props for use in other components
 */
export function getStatusBadgeProps(status: QuoteStatus) {
  const config = QUOTE_STATUS_CONFIG[status]
  return {
    className: cn(config.bgColor, config.color),
    label: config.label,
    Icon: statusIcons[status]
  }
}
```

---

### Task 11B.2: Create Quote Timeline Component

**File**: `src/modules/ecommerce/components/quotes/quote-timeline.tsx`
**Action**: Create

**Description**: Timeline component showing quote activity history, similar to order timeline.

```tsx
/**
 * Quote Timeline Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Displays activity history for a quote
 */
'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  FileEdit, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRightCircle,
  Ban,
  MessageSquare,
  Bell,
  Plus,
  Minus,
  RefreshCw,
  Settings,
  Copy
} from 'lucide-react'
import type { QuoteActivity, QuoteActivityType } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTimelineProps {
  activities: QuoteActivity[]
  className?: string
}

interface ActivityConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

// ============================================================================
// ACTIVITY CONFIG
// ============================================================================

const activityConfig: Record<QuoteActivityType, ActivityConfig> = {
  created: {
    icon: FileEdit,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  updated: {
    icon: RefreshCw,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  sent: {
    icon: Send,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  viewed: {
    icon: Eye,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  accepted: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  expired: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  converted: {
    icon: ArrowRightCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  cancelled: {
    icon: Ban,
    color: 'text-gray-500 dark:text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  note_added: {
    icon: MessageSquare,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30'
  },
  reminder_sent: {
    icon: Bell,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  item_added: {
    icon: Plus,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  item_removed: {
    icon: Minus,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  item_updated: {
    icon: Settings,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  status_changed: {
    icon: RefreshCw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  resent: {
    icon: Send,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  duplicated: {
    icon: Copy,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTimeline({ activities, className }: QuoteTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No activity recorded yet
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      
      {/* Activity items */}
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.activity_type] || activityConfig.updated
          const Icon = config.icon
          
          return (
            <div key={activity.id} className="relative flex gap-4 pl-10">
              {/* Icon circle */}
              <div 
                className={cn(
                  'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full',
                  config.bgColor
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  {activity.performed_by_name && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        by {activity.performed_by_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

### Task 11B.3: Create Product Selector Component

**File**: `src/modules/ecommerce/components/quotes/product-selector.tsx`
**Action**: Create

**Description**: Modal for searching and selecting products to add to a quote.

```tsx
/**
 * Product Selector Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Search and select products to add to a quote
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Package, Plus, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEcommerce } from '../../context/ecommerce-context'
import type { Product, ProductVariant } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ProductSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (selections: ProductSelection[]) => void
  excludeProductIds?: string[]
  multiSelect?: boolean
}

export interface ProductSelection {
  product: Product
  variant?: ProductVariant
  quantity: number
}

interface ProductItemProps {
  product: Product
  isSelected: boolean
  selectedVariantId?: string
  onToggle: (product: Product, variant?: ProductVariant) => void
  multiSelect: boolean
}

// ============================================================================
// PRODUCT ITEM COMPONENT
// ============================================================================

function ProductItem({ 
  product, 
  isSelected, 
  selectedVariantId,
  onToggle,
  multiSelect
}: ProductItemProps) {
  const [showVariants, setShowVariants] = useState(false)
  const hasVariants = product.variants && product.variants.length > 0
  
  const imageUrl = product.images?.[0]
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div className={cn(
      'border rounded-lg p-3 transition-colors',
      isSelected && 'border-primary bg-primary/5'
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox (only in multi-select) */}
        {multiSelect && !hasVariants && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(product)}
            className="mt-1"
          />
        )}
        
        {/* Image */}
        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              {product.sku && (
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">{formatPrice(product.base_price)}</p>
              {product.quantity <= 0 && (
                <Badge variant="outline" className="text-xs text-red-600">
                  Out of stock
                </Badge>
              )}
            </div>
          </div>
          
          {/* Variants toggle */}
          {hasVariants && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-7 text-xs"
              onClick={() => setShowVariants(!showVariants)}
            >
              {showVariants ? 'Hide' : 'Show'} {product.variants!.length} variants
            </Button>
          )}
          
          {/* Add button for non-variant products */}
          {!hasVariants && !multiSelect && (
            <Button
              size="sm"
              className="mt-2 h-7"
              onClick={() => onToggle(product)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Quote
            </Button>
          )}
        </div>
      </div>
      
      {/* Variants list */}
      {showVariants && hasVariants && (
        <div className="mt-3 pl-8 space-y-2">
          {product.variants!.map(variant => {
            const variantSelected = selectedVariantId === variant.id
            const optionString = Object.entries(variant.options || {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            
            return (
              <div 
                key={variant.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md border',
                  variantSelected && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2">
                  {multiSelect && (
                    <Checkbox
                      checked={variantSelected}
                      onCheckedChange={() => onToggle(product, variant)}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{optionString || 'Default'}</p>
                    {variant.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatPrice(variant.price || product.base_price)}
                  </span>
                  {!multiSelect && (
                    <Button
                      size="sm"
                      className="h-7"
                      onClick={() => onToggle(product, variant)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductSelector({
  open,
  onOpenChange,
  onSelect,
  excludeProductIds = [],
  multiSelect = true
}: ProductSelectorProps) {
  const { products, isLoading } = useEcommerce()
  const [searchQuery, setSearchQuery] = useState('')
  const [selections, setSelections] = useState<Map<string, ProductSelection>>(new Map())
  
  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelections(new Map())
      setSearchQuery('')
    }
  }, [open])
  
  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => !excludeProductIds.includes(p.id))
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [products, excludeProductIds, searchQuery])
  
  // Handle selection toggle
  const handleToggle = (product: Product, variant?: ProductVariant) => {
    const key = variant ? `${product.id}-${variant.id}` : product.id
    
    if (multiSelect) {
      const newSelections = new Map(selections)
      if (newSelections.has(key)) {
        newSelections.delete(key)
      } else {
        newSelections.set(key, { product, variant, quantity: 1 })
      }
      setSelections(newSelections)
    } else {
      // Single select - immediately add
      onSelect([{ product, variant, quantity: 1 }])
      onOpenChange(false)
    }
  }
  
  // Handle confirm selection
  const handleConfirm = () => {
    onSelect(Array.from(selections.values()))
    onOpenChange(false)
  }
  
  const selectionCount = selections.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Products
          </DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Product list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
              {searchQuery && (
                <p className="text-sm">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {filteredProducts.map(product => (
                <ProductItem
                  key={product.id}
                  product={product}
                  isSelected={selections.has(product.id)}
                  selectedVariantId={
                    Array.from(selections.keys())
                      .find(k => k.startsWith(product.id))
                      ?.split('-')[1]
                  }
                  onToggle={handleToggle}
                  multiSelect={multiSelect}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {multiSelect && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectionCount} product{selectionCount !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selectionCount === 0}>
                Add Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 11B.4: Create Quote Items Editor Component

**File**: `src/modules/ecommerce/components/quotes/quote-items-editor.tsx`
**Action**: Create

**Description**: Editable list of quote line items with add, edit, and remove functionality.

```tsx
/**
 * Quote Items Editor Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Editable list of quote line items
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Package, 
  MoreHorizontal, 
  Trash2, 
  Edit,
  GripVertical,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductSelector, ProductSelection } from './product-selector'
import { calculateItemLineTotal, formatQuoteCurrency } from '../../lib/quote-utils'
import type { QuoteItem, QuoteItemInput } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteItemsEditorProps {
  items: QuoteItem[]
  currency?: string
  onAddItems: (items: QuoteItemInput[]) => void
  onUpdateItem: (itemId: string, updates: Partial<QuoteItem>) => void
  onRemoveItem: (itemId: string) => void
  onReorderItems?: (itemIds: string[]) => void
  isReadOnly?: boolean
}

interface EditableItemRowProps {
  item: QuoteItem
  currency: string
  onUpdate: (updates: Partial<QuoteItem>) => void
  onRemove: () => void
  isReadOnly: boolean
}

// ============================================================================
// CUSTOM LINE ITEM DIALOG
// ============================================================================

interface CustomLineItemFormProps {
  onAdd: (item: QuoteItemInput) => void
  onCancel: () => void
}

function CustomLineItemForm({ onAdd, onCancel }: CustomLineItemFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || unitPrice <= 0) return
    
    onAdd({
      quote_id: '', // Will be set by parent
      name,
      description: description || undefined,
      quantity,
      unit_price: unitPrice
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-muted/30 space-y-4">
      <h4 className="font-medium">Add Custom Line Item</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Item Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Custom Service"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit Price *</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity *</label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={1}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name || unitPrice <= 0}>
          Add Item
        </Button>
      </div>
    </form>
  )
}

// ============================================================================
// EDITABLE ROW COMPONENT
// ============================================================================

function EditableItemRow({
  item,
  currency,
  onUpdate,
  onRemove,
  isReadOnly
}: EditableItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [editPrice, setEditPrice] = useState(item.unit_price)
  const [editDiscount, setEditDiscount] = useState(item.discount_percent)
  
  const handleSave = () => {
    onUpdate({
      quantity: editQuantity,
      unit_price: editPrice,
      discount_percent: editDiscount
    })
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setEditQuantity(item.quantity)
    setEditPrice(item.unit_price)
    setEditDiscount(item.discount_percent)
    setIsEditing(false)
  }
  
  const lineTotal = calculateItemLineTotal(
    isEditing ? editQuantity : item.quantity,
    isEditing ? editPrice : item.unit_price,
    isEditing ? editDiscount : item.discount_percent,
    item.tax_rate
  )

  return (
    <TableRow>
      {/* Drag handle */}
      {!isReadOnly && (
        <TableCell className="w-10">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        </TableCell>
      )}
      
      {/* Image */}
      <TableCell className="w-14">
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      
      {/* Name & SKU */}
      <TableCell>
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          {item.sku && (
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
          )}
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
      </TableCell>
      
      {/* Quantity */}
      <TableCell className="w-24">
        {isEditing ? (
          <Input
            type="number"
            min="1"
            value={editQuantity}
            onChange={(e) => setEditQuantity(Number(e.target.value))}
            className="h-8 w-20"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </TableCell>
      
      {/* Unit Price */}
      <TableCell className="w-28">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editPrice}
            onChange={(e) => setEditPrice(Number(e.target.value))}
            className="h-8 w-24"
          />
        ) : (
          <span>{formatQuoteCurrency(item.unit_price, currency)}</span>
        )}
      </TableCell>
      
      {/* Discount */}
      <TableCell className="w-24">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              max="100"
              value={editDiscount}
              onChange={(e) => setEditDiscount(Number(e.target.value))}
              className="h-8 w-16"
            />
            <span className="text-xs">%</span>
          </div>
        ) : (
          <span>{item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}</span>
        )}
      </TableCell>
      
      {/* Line Total */}
      <TableCell className="w-28 font-medium">
        {formatQuoteCurrency(lineTotal, currency)}
      </TableCell>
      
      {/* Actions */}
      {!isReadOnly && (
        <TableCell className="w-20">
          {isEditing ? (
            <div className="flex gap-1">
              <Button size="sm" className="h-7" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onRemove}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteItemsEditor({
  items,
  currency = 'USD',
  onAddItems,
  onUpdateItem,
  onRemoveItem,
  onReorderItems,
  isReadOnly = false
}: QuoteItemsEditorProps) {
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  
  // Handle product selection
  const handleProductSelect = (selections: ProductSelection[]) => {
    const newItems: QuoteItemInput[] = selections.map(sel => ({
      quote_id: '', // Will be set by parent
      product_id: sel.product.id,
      variant_id: sel.variant?.id,
      name: sel.product.name,
      sku: sel.variant?.sku || sel.product.sku || undefined,
      description: sel.product.short_description || undefined,
      image_url: sel.variant?.image_url || sel.product.images?.[0] || undefined,
      quantity: sel.quantity,
      unit_price: sel.variant?.price || sel.product.base_price,
      options: sel.variant?.options || {}
    }))
    
    onAddItems(newItems)
  }
  
  // Handle custom line item
  const handleAddCustomItem = (item: QuoteItemInput) => {
    onAddItems([item])
    setShowCustomForm(false)
  }
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateItemLineTotal(
      item.quantity,
      item.unit_price,
      item.discount_percent,
      item.tax_rate
    )
  }, 0)

  return (
    <div className="space-y-4">
      {/* Add buttons */}
      {!isReadOnly && !showCustomForm && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowProductSelector(true)}
          >
            <Package className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCustomForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Custom Item
          </Button>
        </div>
      )}
      
      {/* Custom item form */}
      {showCustomForm && (
        <CustomLineItemForm
          onAdd={handleAddCustomItem}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
      
      {/* Items table */}
      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {!isReadOnly && <TableHead className="w-10" />}
                <TableHead className="w-14">Image</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-28">Price</TableHead>
                <TableHead className="w-24">Discount</TableHead>
                <TableHead className="w-28">Total</TableHead>
                {!isReadOnly && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <EditableItemRow
                  key={item.id}
                  item={item}
                  currency={currency}
                  onUpdate={(updates) => onUpdateItem(item.id, updates)}
                  onRemove={() => onRemoveItem(item.id)}
                  isReadOnly={isReadOnly}
                />
              ))}
            </TableBody>
          </Table>
          
          {/* Subtotal */}
          <div className="border-t px-4 py-3 bg-muted/30">
            <div className="flex justify-end">
              <div className="text-right">
                <span className="text-sm text-muted-foreground mr-4">
                  Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):
                </span>
                <span className="font-semibold">
                  {formatQuoteCurrency(subtotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No items added yet</p>
          {!isReadOnly && (
            <p className="text-sm text-muted-foreground mt-1">
              Add products or custom line items to this quote
            </p>
          )}
        </div>
      )}
      
      {/* Product selector modal */}
      <ProductSelector
        open={showProductSelector}
        onOpenChange={setShowProductSelector}
        onSelect={handleProductSelect}
        excludeProductIds={items.filter(i => i.product_id).map(i => i.product_id!)}
      />
    </div>
  )
}
```

---

### Task 11B.5: Create Quote Table Component

**File**: `src/modules/ecommerce/components/quotes/quote-table.tsx`
**Action**: Create

**Description**: Data table for displaying quotes with sorting, filtering, and bulk actions.

```tsx
/**
 * Quote Table Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * TanStack Table for displaying quotes with sorting and selection
 */
'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  RowSelectionState,
  ColumnDef
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy,
  Send,
  Trash2, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuoteStatusBadge } from './quote-status-badge'
import { 
  formatQuoteCurrency, 
  isQuoteExpired, 
  calculateDaysUntilExpiry,
  getExpiryWarningLevel 
} from '../../lib/quote-utils'
import { deleteQuote, duplicateQuote } from '../../actions/quote-actions'
import type { QuoteSummary, QuoteStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTableProps {
  quotes: QuoteSummary[]
  siteId: string
  isLoading?: boolean
  onViewQuote: (quoteId: string) => void
  onEditQuote: (quoteId: string) => void
  onSendQuote?: (quoteId: string) => void
  onQuotesChange?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTable({
  quotes,
  siteId,
  isLoading = false,
  onViewQuote,
  onEditQuote,
  onSendQuote,
  onQuotesChange
}: QuoteTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  
  // Handle actions
  const handleDuplicate = async (quoteId: string) => {
    const result = await duplicateQuote(siteId, quoteId)
    if (result.success) {
      toast.success(`Quote duplicated as ${result.quote?.quote_number}`)
      onQuotesChange?.()
    } else {
      toast.error(result.error || 'Failed to duplicate quote')
    }
  }
  
  const handleDelete = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return
    
    const result = await deleteQuote(siteId, quoteId)
    if (result.success) {
      toast.success('Quote deleted')
      onQuotesChange?.()
    } else {
      toast.error(result.error || 'Failed to delete quote')
    }
  }

  // Column definitions
  const columns = useMemo<ColumnDef<QuoteSummary>[]>(() => [
    // Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      size: 40
    },
    // Quote Number
    {
      accessorKey: 'quote_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Quote #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          onClick={() => onViewQuote(row.original.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.original.quote_number}
        </button>
      )
    },
    // Customer
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer_name}</p>
          {row.original.customer_company && (
            <p className="text-xs text-muted-foreground">
              {row.original.customer_company}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {row.original.customer_email}
          </p>
        </div>
      )
    },
    // Status
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <QuoteStatusBadge status={row.original.status} />
      )
    },
    // Total
    {
      accessorKey: 'total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatQuoteCurrency(row.original.total, row.original.currency)}
        </span>
      )
    },
    // Valid Until
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }) => {
        const validUntil = row.original.valid_until
        if (!validUntil) return <span className="text-muted-foreground">No expiry</span>
        
        const warningLevel = getExpiryWarningLevel(validUntil)
        const daysLeft = calculateDaysUntilExpiry(validUntil)
        
        return (
          <div className="flex items-center gap-2">
            <span className={cn(
              warningLevel === 'expired' && 'text-red-600',
              warningLevel === 'critical' && 'text-red-500',
              warningLevel === 'warning' && 'text-amber-600'
            )}>
              {format(new Date(validUntil), 'MMM d, yyyy')}
            </span>
            {warningLevel === 'expired' && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            {warningLevel === 'critical' && daysLeft !== null && (
              <span className="text-xs text-red-500">
                ({daysLeft === 0 ? 'Today' : `${daysLeft}d`})
              </span>
            )}
            {warningLevel === 'warning' && daysLeft !== null && (
              <span className="text-xs text-amber-600">
                ({daysLeft}d)
              </span>
            )}
          </div>
        )
      }
    },
    // Items Count
    {
      accessorKey: 'items_count',
      header: 'Items',
      cell: ({ row }) => (
        <span>{row.original.items_count}</span>
      )
    },
    // Created
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.created_at), 'MMM d, yyyy')}
        </span>
      )
    },
    // Actions
    {
      id: 'actions',
      cell: ({ row }) => {
        const quote = row.original
        const canEdit = ['draft', 'pending_approval'].includes(quote.status)
        const canSend = ['draft', 'pending_approval'].includes(quote.status)
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewQuote(quote.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEditQuote(quote.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canSend && onSendQuote && (
                <DropdownMenuItem onClick={() => onSendQuote(quote.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Quote
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDuplicate(quote.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(quote.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [siteId, onViewQuote, onEditQuote, onSendQuote, onQuotesChange])

  // Table instance
  const table = useReactTable({
    data: quotes,
    columns,
    state: {
      sorting,
      rowSelection
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedCount} quote{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRowSelection({})}
          >
            Clear Selection
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              const ids = Object.keys(rowSelection)
              for (const id of ids) {
                await handleDelete(quotes[Number(id)]?.id)
              }
              setRowSelection({})
            }}
          >
            Delete Selected
          </Button>
        </div>
      )}
      
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  No quotes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {quotes.length} quote(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
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

### Task 11B.6: Create Quote Builder Dialog

**File**: `src/modules/ecommerce/components/quotes/quote-builder-dialog.tsx`
**Action**: Create

**Description**: Multi-tab dialog for creating and editing quotes.

```tsx
/**
 * Quote Builder Dialog Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Multi-tab dialog for creating/editing quotes
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Loader2, 
  User, 
  Package, 
  DollarSign, 
  FileText,
  Save,
  Send,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useEcommerce } from '../../context/ecommerce-context'
import { QuoteItemsEditor } from './quote-items-editor'
import { 
  createQuote, 
  updateQuote, 
  getQuote,
  addQuoteItem,
  updateQuoteItem,
  removeQuoteItem,
  recalculateQuoteTotals
} from '../../actions/quote-actions'
import { 
  formatQuoteCurrency, 
  calculateQuoteTotals,
  getDefaultExpiryDate 
} from '../../lib/quote-utils'
import type { 
  Quote, 
  QuoteItem, 
  QuoteInput, 
  QuoteUpdate,
  QuoteItemInput,
  Customer 
} from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId?: string // If provided, edit mode
  siteId: string
  agencyId: string
  userId?: string
  userName?: string
  onSaved?: (quote: Quote) => void
}

type Tab = 'customer' | 'items' | 'pricing' | 'content'

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteBuilderDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  agencyId,
  userId,
  userName,
  onSaved
}: QuoteBuilderDialogProps) {
  const { customers } = useEcommerce()
  const isEditMode = !!quoteId
  
  // State
  const [activeTab, setActiveTab] = useState<Tab>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  
  // Form state
  const [customerId, setCustomerId] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [shippingAmount, setShippingAmount] = useState(0)
  const [currency, setCurrency] = useState('USD')
  const [validUntil, setValidUntil] = useState(
    format(getDefaultExpiryDate(30), 'yyyy-MM-dd')
  )
  
  const [title, setTitle] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [terms, setTerms] = useState('')
  const [notesToCustomer, setNotesToCustomer] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  // Load quote data in edit mode
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      resetForm()
      return
    }
    
    if (isEditMode && quoteId) {
      loadQuote()
    }
  }, [open, quoteId, isEditMode])
  
  const resetForm = () => {
    setActiveTab('customer')
    setQuote(null)
    setItems([])
    setCustomerId('')
    setCustomerEmail('')
    setCustomerName('')
    setCustomerCompany('')
    setCustomerPhone('')
    setDiscountType('percentage')
    setDiscountValue(0)
    setTaxRate(0)
    setShippingAmount(0)
    setCurrency('USD')
    setValidUntil(format(getDefaultExpiryDate(30), 'yyyy-MM-dd'))
    setTitle('')
    setIntroduction('')
    setTerms('')
    setNotesToCustomer('')
    setInternalNotes('')
  }
  
  const loadQuote = async () => {
    if (!quoteId) return
    
    setIsLoading(true)
    try {
      const data = await getQuote(siteId, quoteId)
      if (data) {
        setQuote(data)
        setItems(data.items || [])
        
        // Populate form
        setCustomerId(data.customer_id || '')
        setCustomerEmail(data.customer_email)
        setCustomerName(data.customer_name)
        setCustomerCompany(data.customer_company || '')
        setCustomerPhone(data.customer_phone || '')
        setDiscountType(data.discount_type || 'percentage')
        setDiscountValue(data.discount_value || 0)
        setTaxRate(data.tax_rate || 0)
        setShippingAmount(data.shipping_amount || 0)
        setCurrency(data.currency)
        if (data.valid_until) {
          setValidUntil(format(new Date(data.valid_until), 'yyyy-MM-dd'))
        }
        setTitle(data.title || '')
        setIntroduction(data.introduction || '')
        setTerms(data.terms_and_conditions || '')
        setNotesToCustomer(data.notes_to_customer || '')
        setInternalNotes(data.internal_notes || '')
      }
    } catch (error) {
      console.error('Error loading quote:', error)
      toast.error('Failed to load quote')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle customer selection
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id)
    
    if (id === 'new') {
      setCustomerEmail('')
      setCustomerName('')
      setCustomerCompany('')
      setCustomerPhone('')
    } else {
      const customer = customers.find(c => c.id === id)
      if (customer) {
        setCustomerEmail(customer.email)
        setCustomerName(`${customer.first_name} ${customer.last_name}`)
        setCustomerCompany('')
        setCustomerPhone(customer.phone || '')
      }
    }
  }
  
  // Handle item operations
  const handleAddItems = async (newItems: QuoteItemInput[]) => {
    if (isEditMode && quote) {
      // Add to existing quote
      for (const item of newItems) {
        const result = await addQuoteItem(siteId, {
          ...item,
          quote_id: quote.id
        }, userId, userName)
        
        if (result.success && result.item) {
          setItems(prev => [...prev, result.item!])
        }
      }
      
      // Reload quote to get updated totals
      await loadQuote()
    } else {
      // Add to local state (will be saved with quote)
      const tempItems: QuoteItem[] = newItems.map((item, index) => ({
        id: `temp-${Date.now()}-${index}`,
        quote_id: '',
        ...item,
        discount_percent: item.discount_percent || 0,
        tax_rate: item.tax_rate || 0,
        line_total: item.quantity * item.unit_price,
        options: item.options || {},
        sort_order: items.length + index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      setItems(prev => [...prev, ...tempItems])
    }
  }
  
  const handleUpdateItem = async (itemId: string, updates: Partial<QuoteItem>) => {
    if (isEditMode && quote && !itemId.startsWith('temp-')) {
      await updateQuoteItem(siteId, quote.id, itemId, updates, userId, userName)
      await loadQuote()
    } else {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ))
    }
  }
  
  const handleRemoveItem = async (itemId: string) => {
    if (isEditMode && quote && !itemId.startsWith('temp-')) {
      await removeQuoteItem(siteId, quote.id, itemId, userId, userName)
      await loadQuote()
    } else {
      setItems(prev => prev.filter(item => item.id !== itemId))
    }
  }
  
  // Calculate totals
  const totals = calculateQuoteTotals(
    items,
    { type: discountType, value: discountValue },
    shippingAmount,
    taxRate
  )
  
  // Save quote
  const handleSave = async () => {
    // Validation
    if (!customerEmail || !customerName) {
      toast.error('Customer email and name are required')
      setActiveTab('customer')
      return
    }
    
    if (items.length === 0) {
      toast.error('Add at least one item to the quote')
      setActiveTab('items')
      return
    }
    
    setIsSaving(true)
    try {
      if (isEditMode && quote) {
        // Update existing quote
        const updates: QuoteUpdate = {
          customer_id: customerId !== 'new' ? customerId : undefined,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_company: customerCompany || undefined,
          customer_phone: customerPhone || undefined,
          discount_type: discountType,
          discount_value: discountValue,
          tax_rate: taxRate,
          shipping_amount: shippingAmount,
          currency,
          valid_until: new Date(validUntil).toISOString(),
          title: title || undefined,
          introduction: introduction || undefined,
          terms_and_conditions: terms || undefined,
          notes_to_customer: notesToCustomer || undefined,
          internal_notes: internalNotes || undefined
        }
        
        const result = await updateQuote(siteId, quote.id, updates, userId, userName)
        
        if (result.success && result.quote) {
          toast.success('Quote updated successfully')
          onSaved?.(result.quote)
          onOpenChange(false)
        } else {
          toast.error(result.error || 'Failed to update quote')
        }
      } else {
        // Create new quote
        const input: QuoteInput = {
          site_id: siteId,
          agency_id: agencyId,
          customer_id: customerId !== 'new' ? customerId : undefined,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_company: customerCompany || undefined,
          customer_phone: customerPhone || undefined,
          discount_type: discountType,
          discount_value: discountValue,
          tax_rate: taxRate,
          shipping_amount: shippingAmount,
          currency,
          valid_until: new Date(validUntil).toISOString(),
          title: title || undefined,
          introduction: introduction || undefined,
          terms_and_conditions: terms || undefined,
          notes_to_customer: notesToCustomer || undefined,
          internal_notes: internalNotes || undefined
        }
        
        const result = await createQuote(input, userId, userName)
        
        if (result.success && result.quote) {
          // Add items to the quote
          for (const item of items) {
            await addQuoteItem(siteId, {
              quote_id: result.quote.id,
              product_id: item.product_id || undefined,
              variant_id: item.variant_id || undefined,
              name: item.name,
              sku: item.sku || undefined,
              description: item.description || undefined,
              image_url: item.image_url || undefined,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent,
              tax_rate: item.tax_rate,
              options: item.options
            }, userId, userName)
          }
          
          toast.success(`Quote ${result.quote.quote_number} created successfully`)
          onSaved?.(result.quote)
          onOpenChange(false)
        } else {
          toast.error(result.error || 'Failed to create quote')
        }
      }
    } catch (error) {
      console.error('Error saving quote:', error)
      toast.error('Failed to save quote')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Quote ${quote?.quote_number || ''}` : 'Create New Quote'}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="customer" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Customer</span>
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Items</span>
                  {items.length > 0 && (
                    <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                      {items.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Customer Tab */}
              <TabsContent value="customer" className="flex-1 overflow-auto">
                <div className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label>Select Customer</Label>
                    <Select value={customerId} onValueChange={handleCustomerSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">+ Add New Customer</SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.first_name} {customer.last_name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={customerCompany}
                        onChange={(e) => setCustomerCompany(e.target.value)}
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Items Tab */}
              <TabsContent value="items" className="flex-1 overflow-auto">
                <div className="p-1">
                  <QuoteItemsEditor
                    items={items}
                    currency={currency}
                    onAddItems={handleAddItems}
                    onUpdateItem={handleUpdateItem}
                    onRemoveItem={handleRemoveItem}
                  />
                </div>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing" className="flex-1 overflow-auto">
                <div className="space-y-6 p-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select 
                        value={discountType} 
                        onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        min="0"
                        step={discountType === 'percentage' ? '1' : '0.01'}
                        max={discountType === 'percentage' ? '100' : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Shipping Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingAmount}
                      onChange={(e) => setShippingAmount(Number(e.target.value))}
                    />
                  </div>
                  
                  {/* Totals Summary */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-medium mb-4">Quote Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatQuoteCurrency(totals.subtotal, currency)}</span>
                      </div>
                      {totals.itemsDiscountTotal > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Item Discounts</span>
                          <span>-{formatQuoteCurrency(totals.itemsDiscountTotal, currency)}</span>
                        </div>
                      )}
                      {totals.quoteDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Quote Discount</span>
                          <span>-{formatQuoteCurrency(totals.quoteDiscountAmount, currency)}</span>
                        </div>
                      )}
                      {totals.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Tax ({taxRate}%)</span>
                          <span>{formatQuoteCurrency(totals.taxAmount, currency)}</span>
                        </div>
                      )}
                      {totals.shippingAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>{formatQuoteCurrency(totals.shippingAmount, currency)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>{formatQuoteCurrency(totals.total, currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Content Tab */}
              <TabsContent value="content" className="flex-1 overflow-auto">
                <div className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label>Quote Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Website Development Proposal"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Introduction</Label>
                    <Textarea
                      value={introduction}
                      onChange={(e) => setIntroduction(e.target.value)}
                      placeholder="Introduction message shown at the top of the quote..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      placeholder="Terms and conditions for this quote..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes to Customer</Label>
                    <Textarea
                      value={notesToCustomer}
                      onChange={(e) => setNotesToCustomer(e.target.value)}
                      placeholder="Any additional notes visible to the customer..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Internal Notes (Not visible to customer)</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Internal notes for your team..."
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isEditMode ? 'Update Quote' : 'Create Quote'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 11B.7: Create Quote Detail Dialog

**File**: `src/modules/ecommerce/components/quotes/quote-detail-dialog.tsx`
**Action**: Create

**Description**: Comprehensive view dialog for quote details with tabs for overview, items, and activity.

```tsx
/**
 * Quote Detail Dialog Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * View quote details with tabs
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Loader2, 
  Edit, 
  Send, 
  Copy,
  FileDown,
  ArrowRightCircle,
  ExternalLink,
  Calendar,
  Mail,
  Phone,
  Building,
  User,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuoteStatusBadge } from './quote-status-badge'
import { QuoteTimeline } from './quote-timeline'
import { QuoteItemsEditor } from './quote-items-editor'
import { getQuote, duplicateQuote } from '../../actions/quote-actions'
import { 
  formatQuoteCurrency, 
  isQuoteExpired,
  calculateDaysUntilExpiry,
  QUOTE_STATUS_CONFIG 
} from '../../lib/quote-utils'
import type { QuoteDetailData, QuoteStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId: string
  siteId: string
  onEdit?: (quoteId: string) => void
  onSend?: (quoteId: string) => void
  onConvert?: (quoteId: string) => void
  onQuoteChange?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteDetailDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  onEdit,
  onSend,
  onConvert,
  onQuoteChange
}: QuoteDetailDialogProps) {
  const [quote, setQuote] = useState<QuoteDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  
  // Load quote data
  useEffect(() => {
    if (!open || !quoteId) return
    
    async function loadQuote() {
      setIsLoading(true)
      try {
        const data = await getQuote(siteId, quoteId)
        setQuote(data)
      } catch (error) {
        console.error('Error loading quote:', error)
        toast.error('Failed to load quote details')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuote()
  }, [open, quoteId, siteId])
  
  // Handle duplicate
  const handleDuplicate = async () => {
    if (!quote) return
    
    const result = await duplicateQuote(siteId, quote.id)
    if (result.success) {
      toast.success(`Quote duplicated as ${result.quote?.quote_number}`)
      onQuoteChange?.()
    } else {
      toast.error(result.error || 'Failed to duplicate quote')
    }
  }
  
  // Copy portal link
  const handleCopyLink = () => {
    if (!quote) return
    
    const portalUrl = `${window.location.origin}/quote/${quote.access_token}`
    navigator.clipboard.writeText(portalUrl)
    toast.success('Quote link copied to clipboard')
  }
  
  // Determine available actions based on status
  const canEdit = quote && ['draft', 'pending_approval'].includes(quote.status)
  const canSend = quote && ['draft', 'pending_approval'].includes(quote.status)
  const canConvert = quote && quote.status === 'accepted'
  
  // Expiry info
  const daysUntilExpiry = quote?.valid_until ? calculateDaysUntilExpiry(quote.valid_until) : null
  const expired = quote?.valid_until ? isQuoteExpired(quote.valid_until) : false

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  if (!quote) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quote Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            The requested quote could not be found.
          </p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Quote {quote.quote_number}
                <QuoteStatusBadge status={quote.status} />
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(quote.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(quote.id)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {canSend && onSend && (
                <Button size="sm" onClick={() => onSend(quote.id)}>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              )}
              {canConvert && onConvert && (
                <Button size="sm" variant="default" onClick={() => onConvert(quote.id)}>
                  <ArrowRightCircle className="h-4 w-4 mr-1" />
                  Convert to Order
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">
              Items ({quote.items?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity ({quote.activities?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
                      {formatQuoteCurrency(quote.total, quote.currency)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="text-2xl font-bold">{quote.items?.length || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-2xl font-bold">{quote.view_count}</p>
                  </div>
                  <div className={cn(
                    "p-4 border rounded-lg",
                    expired && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  )}>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    {quote.valid_until ? (
                      <div>
                        <p className={cn(
                          "text-lg font-semibold",
                          expired && "text-red-600"
                        )}>
                          {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                        </p>
                        {!expired && daysUntilExpiry !== null && (
                          <p className={cn(
                            "text-xs",
                            daysUntilExpiry <= 3 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry} days left`}
                          </p>
                        )}
                        {expired && (
                          <p className="text-xs text-red-600">Expired</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">No expiry</p>
                    )}
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{quote.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${quote.customer_email}`} className="text-primary hover:underline">
                        {quote.customer_email}
                      </a>
                    </div>
                    {quote.customer_company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{quote.customer_company}</span>
                      </div>
                    )}
                    {quote.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${quote.customer_phone}`} className="text-primary hover:underline">
                          {quote.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Financial Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Financial Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatQuoteCurrency(quote.subtotal, quote.currency)}</span>
                    </div>
                    {quote.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Discount 
                          {quote.discount_type === 'percentage' && ` (${quote.discount_value}%)`}
                        </span>
                        <span>-{formatQuoteCurrency(quote.discount_amount, quote.currency)}</span>
                      </div>
                    )}
                    {quote.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({quote.tax_rate}%)</span>
                        <span>{formatQuoteCurrency(quote.tax_amount, quote.currency)}</span>
                      </div>
                    )}
                    {quote.shipping_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{formatQuoteCurrency(quote.shipping_amount, quote.currency)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{formatQuoteCurrency(quote.total, quote.currency)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Content sections */}
                {quote.title && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Title</h3>
                    <p>{quote.title}</p>
                  </div>
                )}
                
                {quote.introduction && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Introduction</h3>
                    <p className="whitespace-pre-wrap">{quote.introduction}</p>
                  </div>
                )}
                
                {quote.terms_and_conditions && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                    <p className="whitespace-pre-wrap text-sm">{quote.terms_and_conditions}</p>
                  </div>
                )}
                
                {quote.internal_notes && (
                  <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                    <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
                      Internal Notes (Not visible to customer)
                    </h3>
                    <p className="whitespace-pre-wrap text-sm">{quote.internal_notes}</p>
                  </div>
                )}
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Copy Portal Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <FileDown className="h-4 w-4 mr-1" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Items Tab */}
          <TabsContent value="items" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-1">
                <QuoteItemsEditor
                  items={quote.items || []}
                  currency={quote.currency}
                  onAddItems={() => {}}
                  onUpdateItem={() => {}}
                  onRemoveItem={() => {}}
                  isReadOnly={true}
                />
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-1">
                <QuoteTimeline activities={quote.activities || []} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 11B.8: Create Component Index

**File**: `src/modules/ecommerce/components/quotes/index.ts`
**Action**: Create

**Description**: Export all quote components from a single entry point.

```typescript
/**
 * Quote Components Index
 * 
 * Phase ECOM-11B: Quote UI Components
 */

export { QuoteStatusBadge, getStatusBadgeProps } from './quote-status-badge'
export { QuoteTimeline } from './quote-timeline'
export { ProductSelector } from './product-selector'
export type { ProductSelection } from './product-selector'
export { QuoteItemsEditor } from './quote-items-editor'
export { QuoteTable } from './quote-table'
export { QuoteBuilderDialog } from './quote-builder-dialog'
export { QuoteDetailDialog } from './quote-detail-dialog'
```

---

### Task 11B.9: Create Quotes View

**File**: `src/modules/ecommerce/components/views/quotes-view.tsx`
**Action**: Create

**Description**: Main view component for the quotes section with list, filters, and dialogs.

```tsx
/**
 * Quotes View Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Main view for quote management
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { useEcommerce } from '../../context/ecommerce-context'
import { 
  QuoteTable, 
  QuoteBuilderDialog, 
  QuoteDetailDialog 
} from '../quotes'
import { getQuotes, getQuoteStats } from '../../actions/quote-actions'
import { getQuoteStatusOptions } from '../../lib/quote-utils'
import type { QuoteSummary, QuoteStatus, QuoteTableFilters } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuotesViewProps {
  searchQuery?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuotesView({ searchQuery = '' }: QuotesViewProps) {
  const { siteId, agencyId } = useEcommerce()
  
  // State
  const [quotes, setQuotes] = useState<QuoteSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [localSearch, setLocalSearch] = useState(searchQuery)
  
  // Dialogs
  const [showBuilder, setShowBuilder] = useState(false)
  const [editQuoteId, setEditQuoteId] = useState<string | null>(null)
  const [viewQuoteId, setViewQuoteId] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    converted: 0
  })
  
  // Load quotes
  const loadQuotes = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    try {
      const filters: Partial<QuoteTableFilters> = {
        status: statusFilter,
        search: localSearch || searchQuery
      }
      
      const result = await getQuotes(siteId, filters)
      setQuotes(result.quotes)
      setTotal(result.total)
      
      // Load stats
      const quoteStats = await getQuoteStats(siteId)
      setStats({
        total: quoteStats.total,
        draft: quoteStats.draft,
        sent: quoteStats.sent + quoteStats.viewed,
        accepted: quoteStats.accepted,
        converted: quoteStats.converted
      })
    } catch (error) {
      console.error('Error loading quotes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [siteId, statusFilter, localSearch, searchQuery])
  
  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])
  
  // Handlers
  const handleViewQuote = (quoteId: string) => {
    setViewQuoteId(quoteId)
  }
  
  const handleEditQuote = (quoteId: string) => {
    setEditQuoteId(quoteId)
    setShowBuilder(true)
  }
  
  const handleCreateQuote = () => {
    setEditQuoteId(null)
    setShowBuilder(true)
  }
  
  const handleQuoteChange = () => {
    loadQuotes()
    setViewQuoteId(null)
  }
  
  const statusOptions = getQuoteStatusOptions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quotes</h2>
          <p className="text-muted-foreground">
            Create and manage customer quotations
          </p>
        </div>
        <Button onClick={handleCreateQuote}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Converted</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select 
          value={statusFilter} 
          onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={loadQuotes}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Quote Table */}
      {quotes.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No quotes found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {localSearch || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first quote to get started'}
          </p>
          {!localSearch && statusFilter === 'all' && (
            <Button className="mt-4" onClick={handleCreateQuote}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          )}
        </div>
      ) : (
        <QuoteTable
          quotes={quotes}
          siteId={siteId}
          isLoading={isLoading}
          onViewQuote={handleViewQuote}
          onEditQuote={handleEditQuote}
          onQuotesChange={loadQuotes}
        />
      )}
      
      {/* Quote Builder Dialog */}
      <QuoteBuilderDialog
        open={showBuilder}
        onOpenChange={setShowBuilder}
        quoteId={editQuoteId || undefined}
        siteId={siteId}
        agencyId={agencyId}
        onSaved={handleQuoteChange}
      />
      
      {/* Quote Detail Dialog */}
      {viewQuoteId && (
        <QuoteDetailDialog
          open={!!viewQuoteId}
          onOpenChange={(open) => !open && setViewQuoteId(null)}
          quoteId={viewQuoteId}
          siteId={siteId}
          onEdit={handleEditQuote}
          onQuoteChange={handleQuoteChange}
        />
      )}
    </div>
  )
}
```

---

### Task 11B.10: Connect Quotes View to Dashboard

**File**: `src/modules/ecommerce/components/ecommerce-dashboard.tsx`
**Action**: Modify

**Description**: Add the QuotesView component to the dashboard's activeView switch.

**Find this section in the file (around line 200-250) and add the quotes view import and case:**

```tsx
// Add to imports at the top of the file
import { QuotesView } from './views/quotes-view'

// Find the activeView switch/conditional and add:
{activeView === 'quotes' && <QuotesView searchQuery={searchQuery} />}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] QuotesView loads without errors
- [ ] Create quote dialog opens and saves
- [ ] Edit quote dialog loads existing data
- [ ] Quote detail dialog shows all tabs
- [ ] Status badges display correct colors
- [ ] Timeline shows activities
- [ ] Product selector searches and adds products
- [ ] Items editor allows add/edit/remove
- [ ] Quote table sorts and filters correctly
- [ ] Bulk actions work (delete, duplicate)
- [ ] Mobile responsive (test at 375px width)

---

## 🔄 Rollback Plan

If issues occur:

1. **Remove quote components folder:**
```bash
rm -rf src/modules/ecommerce/components/quotes
```

2. **Remove quotes-view.tsx:**
```bash
rm src/modules/ecommerce/components/views/quotes-view.tsx
```

3. **Revert dashboard changes:**
```bash
git checkout src/modules/ecommerce/components/ecommerce-dashboard.tsx
```

4. **Verify Clean State:**
```bash
npx tsc --noEmit
```

---

## 📝 Memory Bank Updates

After completion, update these files:

**activeContext.md:**
```markdown
### Phase ECOM-11B Complete (Date)
- ✅ Created 8 quote UI components
- ✅ QuotesView integrated into dashboard
- ✅ TanStack Table with sorting/filtering
- ✅ Multi-tab quote builder dialog
- ✅ Quote detail dialog with activity timeline
- ✅ Product selector for adding items
```

**progress.md:**
```markdown
| ECOM-11B | Quote UI Components | ✅ Complete |
```

---

## ✨ Success Criteria

- [ ] All 8 quote components created and working
- [ ] QuotesView accessible from sidebar navigation
- [ ] Create, view, edit quotes end-to-end
- [ ] Items can be added from products or custom
- [ ] Totals calculate correctly with discounts/tax
- [ ] Timeline shows all quote activities
- [ ] Table supports sorting, filtering, pagination
- [ ] Mobile responsive design
- [ ] No TypeScript errors
- [ ] Follows existing component patterns
