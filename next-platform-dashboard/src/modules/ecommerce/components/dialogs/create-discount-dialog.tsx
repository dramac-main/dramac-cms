/**
 * Create Discount Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { Loader2, Plus, Percent, Coins, CalendarDays } from 'lucide-react'
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
import type { DiscountInput, DiscountType } from '../../types/ecommerce-types'

interface CreateDiscountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDiscountDialog({ open, onOpenChange }: CreateDiscountDialogProps) {
  const { addDiscount, siteId, agencyId } = useEcommerce()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [minimumOrderAmount, setMinimumOrderAmount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [isActive, setIsActive] = useState(true)

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCode(result)
  }

  const resetForm = () => {
    setCode('')
    setDescription('')
    setDiscountType('percentage')
    setDiscountValue('')
    setMinimumOrderAmount('')
    setUsageLimit('')
    setUsageLimitPerUser('')
    setStartsAt('')
    setEndsAt('')
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      toast.error('Discount code is required')
      return
    }
    
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('Valid discount value is required')
      return
    }

    if (discountType === 'percentage' && parseFloat(discountValue) > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }

    setIsSubmitting(true)

    try {
      const discountData = {
        site_id: siteId,
        agency_id: agencyId,
        code: code.toUpperCase().trim(),
        description: description || null,
        type: discountType,
        value: discountType === 'percentage' 
          ? parseFloat(discountValue)
          : Math.round(parseFloat(discountValue) * 100),
        minimum_order_amount: minimumOrderAmount 
          ? Math.round(parseFloat(minimumOrderAmount) * 100)
          : null,
        minimum_quantity: null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        once_per_customer: usageLimitPerUser ? parseInt(usageLimitPerUser) === 1 : false,
        starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        is_active: isActive,
        applies_to: 'all' as const,
        applies_to_ids: [],
      }

      await addDiscount(discountData)
      toast.success('Discount code created successfully')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create discount code')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Create Discount Code
          </DialogTitle>
          <DialogDescription>
            Create a new discount code for your store
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Discount Code *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={generateCode}>
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Customers will enter this code at checkout
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal description (not shown to customers)"
              rows={2}
            />
          </div>

          {/* Discount Type & Value */}
          <div className="space-y-4">
            <h3 className="font-medium">Discount Value</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Type</Label>
                <Select 
                  value={discountType} 
                  onValueChange={(v) => setDiscountType(v as DiscountType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Percentage
                      </span>
                    </SelectItem>
                    <SelectItem value="fixed_amount">
                      <span className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Fixed Amount
                      </span>
                    </SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Value *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {discountType === 'percentage' ? '%' : '$'}
                  </span>
                  <Input
                    id="discountValue"
                    type="number"
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="pl-7"
                    disabled={discountType === 'free_shipping'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Order */}
          <div className="space-y-2">
            <Label htmlFor="minimumOrderAmount">Minimum Order Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="minimumOrderAmount"
                type="number"
                step="0.01"
                min="0"
                value={minimumOrderAmount}
                onChange={(e) => setMinimumOrderAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for no minimum
            </p>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="font-medium">Usage Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Total Uses</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="0"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLimitPerUser">Per Customer</Label>
                <Input
                  id="usageLimitPerUser"
                  type="number"
                  min="0"
                  value={usageLimitPerUser}
                  onChange={(e) => setUsageLimitPerUser(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Active Dates */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Active Dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Date</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for no date restrictions
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Discount can be used immediately
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Discount
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
