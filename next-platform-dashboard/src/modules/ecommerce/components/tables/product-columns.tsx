/**
 * Product Table Columns
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Column definitions for TanStack Table
 */
'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Archive, 
  Trash2,
  ImageOff,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product, ProductStatus } from '../../types/ecommerce-types'

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  draft: { 
    label: 'Draft', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  archived: { 
    label: 'Archived', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  }
}

// ============================================================================
// INLINE EDIT CELL
// ============================================================================

interface InlineEditCellProps {
  value: string | number
  onSave: (value: string | number) => Promise<void>
  type?: 'text' | 'number' | 'currency'
  currency?: string
}

function InlineEditCell({ value, onSave, type = 'text', currency = 'USD' }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const [isSaving, setIsSaving] = useState(false)

  const displayValue = type === 'currency' 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value) / 100)
    : value

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newValue = type === 'number' || type === 'currency' 
        ? Number(editValue) 
        : editValue
      await onSave(newValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(String(value))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type={type === 'text' ? 'text' : 'number'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-24 text-sm"
          autoFocus
          disabled={isSaving}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <span 
      className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {displayValue}
    </span>
  )
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

interface CreateColumnsProps {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDuplicate: (productId: string) => void
  onArchive: (product: Product) => void
  onDelete: (productId: string) => void
  onInlineEdit: (productId: string, field: string, value: unknown) => Promise<void>
  currency?: string
}

export function createProductColumns({
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onInlineEdit,
  currency = 'USD'
}: CreateColumnsProps): ColumnDef<Product>[] {
  return [
    // Checkbox column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40
    },

    // Image column
    {
      id: 'image',
      header: '',
      cell: ({ row }) => {
        const product = row.original
        const imageUrl = product.images?.[0]
        
        return (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 60
    },

    // Product Name & SKU
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span 
              className="font-medium hover:text-primary cursor-pointer"
              onClick={() => onView(product)}
            >
              {product.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {product.sku && (
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                  SKU: {product.sku}
                </span>
              )}
              <span className="opacity-60">ID: {product.id.slice(0, 8)}...</span>
            </div>
          </div>
        )
      },
      size: 280
    },

    // Status
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const config = statusConfig[status]
        return (
          <Badge className={cn('text-xs', config.className)}>
            {config.label}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value === 'all' || row.getValue(id) === value
      },
      size: 100
    },

    // Price (inline editable)
    {
      accessorKey: 'base_price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <InlineEditCell
            value={product.base_price}
            type="currency"
            currency={currency}
            onSave={async (value) => {
              await onInlineEdit(product.id, 'base_price', value)
            }}
          />
        )
      },
      size: 120
    },

    // Inventory (inline editable)
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Inventory
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        const isLowStock = product.track_inventory && 
          product.quantity <= product.low_stock_threshold
        const isOutOfStock = product.quantity === 0

        if (!product.track_inventory) {
          return <span className="text-muted-foreground text-sm">Not tracked</span>
        }

        return (
          <div className="flex items-center gap-2">
            <InlineEditCell
              value={product.quantity}
              type="number"
              onSave={async (value) => {
                await onInlineEdit(product.id, 'quantity', value)
              }}
            />
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Out
              </Badge>
            )}
            {!isOutOfStock && isLowStock && (
              <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Low
              </Badge>
            )}
          </div>
        )
      },
      size: 140
    },

    // Category
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const product = row.original
        const categoryName = (product.metadata as Record<string, unknown>)?.primary_category_name as string
        return categoryName || <span className="text-muted-foreground">—</span>
      },
      size: 120
    },

    // Actions
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {product.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onArchive(product)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(product.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50
    }
  ]
}
