/**
 * Bulk Actions Toolbar
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Toolbar for performing bulk operations on selected products
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Trash2, 
  MoreHorizontal, 
  CheckCircle, 
  FileEdit, 
  Archive,
  X,
  Tag,
  Coins,
  Package
} from 'lucide-react'
import type { BulkAction, Category } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onExecute: (action: BulkAction, params?: Record<string, unknown>) => Promise<void>
  isExecuting: boolean
  categories: Category[]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onExecute,
  isExecuting,
  categories
}: BulkActionsToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPriceAdjust, setShowPriceAdjust] = useState(false)
  const [showStockAdjust, setShowStockAdjust] = useState(false)
  
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0)
  const [priceAdjustType, setPriceAdjustType] = useState<'fixed' | 'percentage'>('percentage')
  const [stockAdjustment, setStockAdjustment] = useState<number>(0)

  if (selectedCount === 0) return null

  const handleDelete = async () => {
    await onExecute('delete')
    setShowDeleteConfirm(false)
  }

  const handlePriceAdjust = async () => {
    await onExecute('adjust_price', {
      adjustment: priceAdjustment,
      type: priceAdjustType
    })
    setShowPriceAdjust(false)
    setPriceAdjustment(0)
  }

  const handleStockAdjust = async () => {
    await onExecute('adjust_stock', { adjustment: stockAdjustment })
    setShowStockAdjust(false)
    setStockAdjustment(0)
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 border rounded-lg">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExecute('set_active')}
            disabled={isExecuting}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Set Active
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExecute('set_draft')}
            disabled={isExecuting}
          >
            <FileEdit className="h-4 w-4 mr-1" />
            Set Draft
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExecute('set_archived')}
            disabled={isExecuting}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExecuting}>
              <MoreHorizontal className="h-4 w-4 mr-1" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {/* Assign Category */}
            {categories.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tag className="h-4 w-4 mr-2" />
                  Assign Category
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => onExecute('assign_category', { categoryId: category.id })}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            <DropdownMenuItem onClick={() => setShowPriceAdjust(true)}>
              <Coins className="h-4 w-4 mr-2" />
              Adjust Prices
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowStockAdjust(true)}>
              <Package className="h-4 w-4 mr-2" />
              Adjust Stock
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected 
              products and all their variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Adjustment Dialog */}
      <Dialog open={showPriceAdjust} onOpenChange={setShowPriceAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Prices</DialogTitle>
            <DialogDescription>
              Adjust prices for {selectedCount} selected products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              value={priceAdjustType}
              onValueChange={(v) => setPriceAdjustType(v as 'fixed' | 'percentage')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Percentage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed Amount</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label>
                {priceAdjustType === 'percentage' ? 'Percentage Change' : 'Amount Change'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                  placeholder={priceAdjustType === 'percentage' ? '10' : '5.00'}
                />
                <span className="text-muted-foreground">
                  {priceAdjustType === 'percentage' ? '%' : '$'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use negative values to decrease prices
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceAdjust(false)}>
              Cancel
            </Button>
            <Button onClick={handlePriceAdjust} disabled={isExecuting}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockAdjust} onOpenChange={setShowStockAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Adjust inventory for {selectedCount} selected products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity Adjustment</Label>
              <Input
                type="number"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(Number(e.target.value))}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Use negative values to decrease stock
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockAdjust(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjust} disabled={isExecuting}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
