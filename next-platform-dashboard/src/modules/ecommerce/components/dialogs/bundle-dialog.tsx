/**
 * Bundle Dialog Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for creating/editing product bundles
 */
'use client'

import { useState, useEffect } from 'react'
import { createBundle, updateBundle } from '../../actions/marketing-actions'
import type { Bundle, BundleInput } from '../../types/marketing-types'
import { Loader2, Package, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface BundleDialogProps {
  siteId: string
  bundle: Bundle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BundleDialog({ 
  siteId, 
  bundle, 
  open, 
  onOpenChange, 
  onSuccess 
}: BundleDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sku, setSku] = useState('')
  const [bundlePrice, setBundlePrice] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!bundle

  // Load data when dialog opens
  useEffect(() => {
    if (open && bundle) {
      setName(bundle.name)
      setDescription(bundle.description || '')
      setSku(bundle.sku || '')
      setBundlePrice(bundle.bundle_price ? (bundle.bundle_price / 100).toFixed(2) : '')
      setIsActive(bundle.is_active)
    } else if (!open) {
      resetForm()
    }
  }, [open, bundle])

  const resetForm = () => {
    setName('')
    setDescription('')
    setSku('')
    setBundlePrice('')
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Please enter a bundle name')
      return
    }

    const price = parseFloat(bundlePrice)
    if (bundlePrice && (isNaN(price) || price < 0)) {
      toast.error('Please enter a valid price')
      return
    }

    setIsSubmitting(true)

    const data: BundleInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      sku: sku.trim() || undefined,
      pricing_type: 'fixed',
      fixed_price: bundlePrice ? Math.round(price * 100) : undefined,
    }

    try {
      if (isEditing) {
        const result = await updateBundle(bundle.id, { ...data, is_active: isActive })
        if (result.success) {
          toast.success('Bundle updated')
          onSuccess?.()
        } else {
          toast.error(result.error || 'Failed to update bundle')
        }
      } else {
        const result = await createBundle(siteId, data)
        if (result.success) {
          toast.success('Bundle created')
          onSuccess?.()
        } else {
          toast.error(result.error || 'Failed to create bundle')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              {isEditing ? 'Edit Bundle' : 'Create Bundle'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update your product bundle' 
                : 'Create a bundle to sell products together at a discount'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Bundle Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Starter Kit Bundle"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Everything you need to get started"
                rows={2}
              />
            </div>

            {/* SKU */}
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU (optional)</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="BUNDLE-001"
                className="font-mono"
              />
            </div>

            {/* Bundle Price */}
            <div className="grid gap-2">
              <Label htmlFor="bundlePrice">Bundle Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bundlePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set the discounted price for buying all items together
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Make this bundle available for purchase
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Bundle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
