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
