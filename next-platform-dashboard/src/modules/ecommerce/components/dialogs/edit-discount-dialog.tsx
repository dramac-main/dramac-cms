/**
 * Edit Discount Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState, useEffect } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import type { Discount, DiscountType } from '../../types/ecommerce-types'
import { Loader2, Percent, DollarSign, Calendar } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface EditDiscountDialogProps {
  discount: Discount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDiscountDialog({ discount, open, onOpenChange }: EditDiscountDialogProps) {
  const { editDiscount, isLoading } = useEcommerce()
  const [code, setCode] = useState('')
  const [type, setType] = useState<DiscountType>('percentage')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load discount data when dialog opens
  useEffect(() => {
    if (open && discount) {
      setCode(discount.code)
      setType(discount.type)
      setValue(discount.value.toString())
      setDescription(discount.description || '')
      setMinPurchase(discount.minimum_order_amount ? (discount.minimum_order_amount / 100).toString() : '')
      setMaxUses(discount.usage_limit?.toString() || '')
      setMaxUsesPerCustomer(discount.once_per_customer ? '1' : '')
      setStartDate(discount.starts_at ? new Date(discount.starts_at).toISOString().split('T')[0] : '')
      setEndDate(discount.ends_at ? new Date(discount.ends_at).toISOString().split('T')[0] : '')
      setIsActive(discount.is_active)
    } else if (!open) {
      resetForm()
    }
  }, [open, discount])

  const resetForm = () => {
    setCode('')
    setType('percentage')
    setValue('')
    setDescription('')
    setMinPurchase('')
    setMaxUses('')
    setMaxUsesPerCustomer('')
    setStartDate('')
    setEndDate('')
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discount) return

    if (!code.trim()) {
      alert('Please enter a discount code')
      return
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      alert('Please enter a valid discount value')
      return
    }

    if (type === 'percentage' && numValue > 100) {
      alert('Percentage discount cannot exceed 100%')
      return
    }

    setIsSubmitting(true)
    try {
      const updateData: any = {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'percentage' ? numValue : Math.round(numValue * 100),
        description: description.trim() || null,
        minimum_order_amount: minPurchase ? Math.round(parseFloat(minPurchase) * 100) : null,
        usage_limit: maxUses ? parseInt(maxUses) : null,
        once_per_customer: maxUsesPerCustomer ? parseInt(maxUsesPerCustomer) === 1 : false,
        starts_at: startDate || new Date().toISOString().split('T')[0],
        ends_at: endDate || null,
        is_active: isActive,
      }

      await editDiscount(discount.id, updateData)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error updating discount:', error)
      alert('Failed to update discount. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Discount Code</DialogTitle>
          <DialogDescription>
            Update the discount details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Discount Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER2024"
                required
              />
              <p className="text-xs text-muted-foreground">
                Customers will enter this code at checkout
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as DiscountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-2" />
                        Percentage Off
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Fixed Amount Off
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'percentage' ? '10' : '5.00'}
                  step={type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={type === 'percentage' ? '100' : undefined}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summer sale discount..."
                rows={2}
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Usage Limits</h3>
            
            <div className="space-y-2">
              <Label htmlFor="minPurchase">Minimum Purchase Amount ($)</Label>
              <Input
                id="minPurchase"
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="50.00"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Minimum order value required to use this discount
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Total Usage Limit</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="100"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsesPerCustomer">Uses Per Customer</Label>
                <Input
                  id="maxUsesPerCustomer"
                  type="number"
                  value={maxUsesPerCustomer}
                  onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
                  placeholder="1"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited
                </p>
              </div>
            </div>
          </div>

          {/* Active Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Active Period</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to start immediately
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Only active discounts can be used at checkout
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Discount
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
