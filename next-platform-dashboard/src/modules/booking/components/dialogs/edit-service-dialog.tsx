/**
 * Edit Service Dialog
 * 
 * Phase EM-51: Booking Module
 */
'use client'

import { useState, useEffect } from 'react'
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
import type { Service } from '../../types/booking-types'

interface EditServiceDialogProps {
  service: Service | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditServiceDialog({ service, open, onOpenChange }: EditServiceDialogProps) {
  const { editService } = useBooking()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [price, setPrice] = useState<string>('')
  const [color, setColor] = useState('#3B82F6')
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true)
  const [requireConfirmation, setRequireConfirmation] = useState(false)
  const [maxAttendees, setMaxAttendees] = useState(1)
  const [bufferBefore, setBufferBefore] = useState(0)
  const [bufferAfter, setBufferAfter] = useState(0)
  
  // Load service data when dialog opens
  useEffect(() => {
    if (open && service) {
      setName(service.name)
      setDescription(service.description || '')
      setCategory(service.category || '')
      setDurationMinutes(service.duration_minutes)
      setPrice(service.price?.toString() || '')
      setColor(service.color)
      setAllowOnlineBooking(service.allow_online_booking)
      setRequireConfirmation(service.require_confirmation)
      setMaxAttendees(service.max_attendees)
      setBufferBefore(service.buffer_before_minutes)
      setBufferAfter(service.buffer_after_minutes)
    }
  }, [open, service])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!service) return
    
    if (!name.trim()) {
      toast.error('Service name is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await editService(service.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        duration_minutes: durationMinutes,
        price: price ? parseFloat(price) : undefined,
        color,
        allow_online_booking: allowOnlineBooking,
        require_confirmation: requireConfirmation,
        max_attendees: maxAttendees,
        buffer_before_minutes: bufferBefore,
        buffer_after_minutes: bufferAfter,
      })
      
      toast.success('Service updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Failed to update service')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!service) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service details below.
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
            
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Salon Services, Consultations"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
            
            {/* Buffer Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bufferBefore">Buffer Before (min)</Label>
                <Input
                  id="bufferBefore"
                  type="number"
                  min={0}
                  max={60}
                  step={5}
                  value={bufferBefore}
                  onChange={(e) => setBufferBefore(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bufferAfter">Buffer After (min)</Label>
                <Input
                  id="bufferAfter"
                  type="number"
                  min={0}
                  max={60}
                  step={5}
                  value={bufferAfter}
                  onChange={(e) => setBufferAfter(parseInt(e.target.value) || 0)}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
