/**
 * View Product Dialog
 * 
 * Phase EM-52: E-Commerce Module
 * Display product details in read-only mode
 */
'use client'

import { Product } from '../../types/ecommerce-types'
import { formatCurrency } from '@/lib/locale-config'
import { X, Package, Tag, Coins, TrendingUp, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ViewProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
}

export function ViewProductDialog({ product, open, onOpenChange, onEdit }: ViewProductDialogProps) {
  if (!product) return null

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      archived: { label: 'Archived', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    }
    return config[status as keyof typeof config] || config.draft
  }

  const statusBadge = getStatusBadge(product.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{product.name}</DialogTitle>
            <Badge className={cn('font-normal', statusBadge.className)}>
              {statusBadge.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          {product.images && product.images.length > 0 && (
            <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-medium">{product.sku || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium font-mono text-sm">{product.slug}</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Description
              </h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {product.short_description && (
            <div className="space-y-2">
              <h3 className="font-semibold">Short Description</h3>
              <p className="text-sm text-muted-foreground">{product.short_description}</p>
            </div>
          )}

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Base Price</p>
                <p className="text-2xl font-bold">{formatCurrency(product.base_price / 100)}</p>
              </div>
              {product.compare_at_price && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Compare At Price</p>
                  <p className="text-xl font-medium line-through text-muted-foreground">
                    {formatCurrency(product.compare_at_price / 100)}
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {Math.round((1 - product.base_price / product.compare_at_price) * 100)}% off
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Inventory */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Inventory
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Track Inventory</p>
                <p className="font-medium">{product.track_inventory ? 'Yes' : 'No'}</p>
              </div>
              {product.track_inventory && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      product.quantity <= product.low_stock_threshold && 'text-red-500'
                    )}>
                      {product.quantity}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Low Stock Threshold</p>
                    <p className="font-medium">{product.low_stock_threshold}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Weight */}
          {product.weight && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Shipping
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">{product.weight} {product.weight_unit}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Tax & Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxable</p>
              <p className="font-medium">{product.is_taxable ? 'Yes' : 'No'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Featured Product</p>
              <p className="font-medium">{product.is_featured ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
              {product.updated_at && product.updated_at !== product.created_at && (
                <>
                  <span>•</span>
                  <span>Updated {new Date(product.updated_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEdit && (
              <Button onClick={onEdit}>
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
