/**
 * Edit Product Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState, useEffect } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { useCurrency } from '../../context/ecommerce-context'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ImageGalleryUpload } from '../shared/image-upload'
import type { Product, ProductStatus } from '../../types/ecommerce-types'

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
  const { editProduct, categories } = useEcommerce()
  const { currencySymbol } = useCurrency()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [sku, setSku] = useState('')
  const [trackInventory, setTrackInventory] = useState(true)
  const [quantity, setQuantity] = useState('0')
  const [status, setStatus] = useState<ProductStatus>('draft')
  const [images, setImages] = useState<string[]>([])

  // Load product data when dialog opens
  useEffect(() => {
    if (open && product) {
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description || '')
      setShortDescription(product.short_description || '')
      setBasePrice((product.base_price / 100).toFixed(2))
      setCompareAtPrice(product.compare_at_price ? (product.compare_at_price / 100).toFixed(2) : '')
      setSku(product.sku || '')
      setTrackInventory(product.track_inventory)
      setQuantity(product.quantity?.toString() || '0')
      setStatus(product.status)
      setImages(product.images || [])
    }
  }, [open, product])

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Only auto-generate slug if it matches the previous generated slug
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!product) return
    
    if (!name.trim()) {
      toast.error('Product name is required')
      return
    }
    
    if (!basePrice || parseFloat(basePrice) < 0) {
      toast.error('Valid price is required')
      return
    }

    setIsSubmitting(true)

    try {
      const updateData = {
        name: name.trim(),
        slug: slug || generateSlug(name),
        description: description || undefined,
        short_description: shortDescription || undefined,
        base_price: Math.round(parseFloat(basePrice) * 100),
        compare_at_price: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null,
        sku: sku || undefined,
        track_inventory: trackInventory,
        quantity: parseInt(quantity) || 0,
        status,
        images: images
      }

      await editProduct(product.id, updateData)
      toast.success('Product updated successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update product')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <ImageGalleryUpload
            value={images}
            onChange={setImages}
            siteId={product.site_id}
            folder="products"
            label="Product Images"
            maxImages={10}
          />

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="product-url-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief product summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description"
                rows={4}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-medium">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="font-medium">Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Stock Keeping Unit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!trackInventory}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trackInventory">Track Inventory</Label>
                <p className="text-sm text-muted-foreground">
                  Keep track of stock levels
                </p>
              </div>
              <Switch
                id="trackInventory"
                checked={trackInventory}
                onCheckedChange={setTrackInventory}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
