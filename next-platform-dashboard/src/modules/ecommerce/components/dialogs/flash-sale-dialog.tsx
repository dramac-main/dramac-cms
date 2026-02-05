/**
 * Flash Sale Dialog Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for creating/editing flash sales
 */
'use client'

import { useState, useEffect } from 'react'
import { createFlashSale, updateFlashSale } from '../../actions/marketing-actions'
import type { FlashSale, FlashSaleInput } from '../../types/marketing-types'
import { Loader2, Zap, Calendar, Percent, DollarSign } from 'lucide-react'

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
import { toast } from 'sonner'

interface FlashSaleDialogProps {
  siteId: string
  flashSale: FlashSale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function FlashSaleDialog({ 
  siteId, 
  flashSale, 
  open, 
  onOpenChange, 
  onSuccess 
}: FlashSaleDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [status, setStatus] = useState<'scheduled' | 'active' | 'paused'>('scheduled')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!flashSale

  // Load data when dialog opens
  useEffect(() => {
    if (open && flashSale) {
      setName(flashSale.name)
      setDescription(flashSale.description || '')
      setDiscountType(flashSale.discount_type)
      setDiscountValue(flashSale.discount_value.toString())
      
      // Parse dates
      const start = new Date(flashSale.starts_at)
      const end = new Date(flashSale.ends_at)
      setStartDate(start.toISOString().split('T')[0])
      setStartTime(start.toTimeString().slice(0, 5))
      setEndDate(end.toISOString().split('T')[0])
      setEndTime(end.toTimeString().slice(0, 5))
      
      setMaxUses(flashSale.max_uses?.toString() || '')
      setStatus(flashSale.status as 'scheduled' | 'active' | 'paused')
    } else if (!open) {
      resetForm()
    }
  }, [open, flashSale])

  const resetForm = () => {
    setName('')
    setDescription('')
    setDiscountType('percentage')
    setDiscountValue('')
    setStartDate('')
    setStartTime('')
    setEndDate('')
    setEndTime('')
    setMaxUses('')
    setStatus('scheduled')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Please enter a sale name')
      return
    }

    const numValue = parseFloat(discountValue)
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Please enter a valid discount value')
      return
    }

    if (discountType === 'percentage' && numValue > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('Please enter start and end dates')
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      toast.error('End date must be after start date')
      return
    }

    setIsSubmitting(true)

    const data: FlashSaleInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      discount_type: discountType,
      discount_value: discountType === 'percentage' ? numValue : Math.round(numValue * 100),
      starts_at: startDateTime.toISOString(),
      ends_at: endDateTime.toISOString(),
      max_uses: maxUses ? parseInt(maxUses) : undefined,
    }

    try {
      if (isEditing) {
        const result = await updateFlashSale(flashSale.id, data)
        if (result.success) {
          toast.success('Flash sale updated')
          onSuccess?.()
        } else {
          toast.error(result.error || 'Failed to update flash sale')
        }
      } else {
        const result = await createFlashSale(siteId, data)
        if (result.success) {
          toast.success('Flash sale created')
          onSuccess?.()
        } else {
          toast.error(result.error || 'Failed to create flash sale')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {isEditing ? 'Edit Flash Sale' : 'Create Flash Sale'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update your flash sale promotion' 
                : 'Create a limited-time promotion to boost sales'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Sale Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer Flash Sale"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Limited time offer! Get great deals on selected items."
                rows={2}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={(v: 'percentage' | 'fixed_amount') => setDiscountType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Percentage Off
                      </span>
                    </SelectItem>
                    <SelectItem value="fixed_amount">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Fixed Amount
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountValue">
                  {discountType === 'percentage' ? 'Percentage' : 'Amount ($)'}
                </Label>
                <div className="relative">
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    max={discountType === 'percentage' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '20' : '10.00'}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {discountType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Max Uses */}
            <div className="grid gap-2">
              <Label htmlFor="maxUses">Max Uses (optional)</Label>
              <Input
                id="maxUses"
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Leave empty for unlimited"
              />
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: 'scheduled' | 'active' | 'paused') => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Flash Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
