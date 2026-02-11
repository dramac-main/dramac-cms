/**
 * Edit Staff Dialog
 * 
 * Phase EM-51: Booking Module
 * Includes service assignment functionality
 */
'use client'

import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useBooking } from '../../context/booking-context'
import { assignStaffToService, removeStaffFromService } from '../../actions/booking-actions'
import { toast } from 'sonner'
import type { Staff } from '../../types/booking-types'

import { DEFAULT_TIMEZONE } from '@/lib/locale-config'
// Common timezones
const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (China)' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
]

interface EditStaffDialogProps {
  staff: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStaffDialog({ staff, open, onOpenChange }: EditStaffDialogProps) {
  const { siteId, services, editStaff, refreshAll } = useBooking()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [acceptBookings, setAcceptBookings] = useState(true)
  
  // Service assignment state
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set())
  const [originalServiceIds, setOriginalServiceIds] = useState<Set<string>>(new Set())
  
  // Load staff data when dialog opens
  useEffect(() => {
    if (open && staff) {
      setName(staff.name)
      setEmail(staff.email || '')
      setPhone(staff.phone || '')
      setBio(staff.bio || '')
      setTimezone(staff.timezone || DEFAULT_TIMEZONE)
      setAcceptBookings(staff.accept_bookings)
      
      // Load assigned services
      const assignedServices = new Set(staff.services?.map(s => s.id) || [])
      setSelectedServiceIds(assignedServices)
      setOriginalServiceIds(new Set(assignedServices))
    }
  }, [open, staff])
  
  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!staff) return
    
    if (!name.trim()) {
      toast.error('Staff name is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Update staff details
      await editStaff(staff.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        timezone,
        accept_bookings: acceptBookings,
      })
      
      // Handle service assignments
      // Find services to add (in selected but not in original)
      const servicesToAdd = Array.from(selectedServiceIds).filter(
        id => !originalServiceIds.has(id)
      )
      
      // Find services to remove (in original but not in selected)
      const servicesToRemove = Array.from(originalServiceIds).filter(
        id => !selectedServiceIds.has(id)
      )
      
      // Add new service assignments
      for (const serviceId of servicesToAdd) {
        await assignStaffToService(siteId, staff.id, serviceId)
      }
      
      // Remove old service assignments
      for (const serviceId of servicesToRemove) {
        await removeStaffFromService(siteId, staff.id, serviceId)
      }
      
      // Refresh to get updated staff with services
      await refreshAll()
      
      toast.success('Staff member updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff member')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!staff) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff details and assign services below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            
            {/* Bio */}
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief description of this staff member..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Timezone */}
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Accept Bookings */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Accept Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to book with this staff member
                </p>
              </div>
              <Switch
                checked={acceptBookings}
                onCheckedChange={setAcceptBookings}
              />
            </div>
            
            <Separator />
            
            {/* Service Assignment */}
            <div className="space-y-3">
              <div>
                <Label className="text-base">Assigned Services</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select which services this staff member can provide
                </p>
              </div>
              
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No services available. Create services first.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                  {services.filter(s => s.is_active).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start space-x-3 p-2 hover:bg-accent rounded-md"
                    >
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServiceIds.has(service.id)}
                        onCheckedChange={() => handleToggleService(service.id)}
                      />
                      <label
                        htmlFor={`service-${service.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.duration_minutes}min • K{service.price || 0}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {selectedServiceIds.size} service{selectedServiceIds.size !== 1 ? 's' : ''} selected
              </p>
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
