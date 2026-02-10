/**
 * Create Service Dialog
 * 
 * Phase EM-51: Booking Module
 */
'use client'

import { useState } from 'react'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
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
import { useBooking } from '../../context/booking-context'
import { toast } from 'sonner'

import { DEFAULT_CURRENCY } from '@/lib/locale-config'
interface CreateServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateServiceDialog({ open, onOpenChange }: CreateServiceDialogProps) {
  const { addService } = useBooking()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [price, setPrice] = useState<string>('')
  const [color, setColor] = useState('#3B82F6')
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true)
  const [requireConfirmation, setRequireConfirmation] = useState(false)
  const [maxAttendees, setMaxAttendees] = useState(1)
  
  const resetForm = () => {
    setName('')
    setDescription('')
    setDurationMinutes(60)
    setPrice('')
    setColor('#3B82F6')
    setAllowOnlineBooking(true)
    setRequireConfirmation(false)
    setMaxAttendees(1)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Service name is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await addService({
        name: name.trim(),
        description: description.trim() || undefined,
        duration_minutes: durationMinutes,
        price: price ? parseFloat(price) : undefined,
        color,
        allow_online_booking: allowOnlineBooking,
        require_confirmation: requireConfirmation,
        max_attendees: maxAttendees,
        is_active: true,
        currency: DEFAULT_CURRENCY,
        buffer_before_minutes: 0,
        buffer_after_minutes: 0,
        sort_order: 0,
        custom_fields: {}
      })
      
      toast.success('Service created successfully')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating service:', error)
      toast.error('Failed to create service')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Add a new bookable service to your calendar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Haircut, Consultation, Massage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this service..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Duration and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price ({DEFAULT_CURRENCY_SYMBOL})</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            
            {/* Color and Max Attendees */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min={1}
                  max={100}
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Online Booking</Label>
                  <p className="text-sm text-muted-foreground">
                    Customers can book this service online
                  </p>
                </div>
                <Switch
                  checked={allowOnlineBooking}
                  onCheckedChange={setAllowOnlineBooking}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Confirmation</Label>
                  <p className="text-sm text-muted-foreground">
                    Bookings require manual confirmation
                  </p>
                </div>
                <Switch
                  checked={requireConfirmation}
                  onCheckedChange={setRequireConfirmation}
                />
              </div>
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
