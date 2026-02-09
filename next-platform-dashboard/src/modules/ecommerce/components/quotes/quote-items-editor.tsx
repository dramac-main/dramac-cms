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

import { DEFAULT_CURRENCY } from '@/lib/locale-config'
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
  const [editDiscount, setEditDiscount] = useState(item.discount_percent || 0)
  
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
    setEditDiscount(item.discount_percent || 0)
    setIsEditing(false)
  }
  
  const lineTotal = calculateItemLineTotal(
    isEditing ? editQuantity : item.quantity,
    isEditing ? editPrice : item.unit_price,
    isEditing ? editDiscount : (item.discount_percent || 0),
    item.tax_rate || 0
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
          <span>{(item.discount_percent || 0) > 0 ? `${item.discount_percent}%` : '-'}</span>
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
                ✕
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
  currency = DEFAULT_CURRENCY,
  onAddItems,
  onUpdateItem,
  onRemoveItem,
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
      // Convert cents to dollars (database stores prices as cents)
      unit_price: (sel.variant?.price || sel.product.base_price) / 100,
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
      item.discount_percent || 0,
      item.tax_rate || 0
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
