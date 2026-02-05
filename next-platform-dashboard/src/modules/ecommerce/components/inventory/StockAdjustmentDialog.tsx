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
  direction: z.enum(['add', 'remove'] as const),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
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
      console.error('Error adjusting stock:', error)
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
