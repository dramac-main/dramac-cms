/**
 * Create Appointment Dialog
 * 
 * Phase EM-51: Booking Module
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Clock, User, Mail, Phone, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBooking } from '../../context/booking-context'
import { toast } from 'sonner'

// Time slots for the select
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function formatTimeSlot(time: string, format: '12h' | '24h' = '12h'): string {
  const [hours, minutes] = time.split(':').map(Number)
  if (format === '24h') {
    return time
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`
}

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedServiceId?: string
  preselectedStaffId?: string
  preselectedDate?: Date
}

export function CreateAppointmentDialog({ 
  open, 
  onOpenChange,
  preselectedServiceId,
  preselectedStaffId,
  preselectedDate
}: CreateAppointmentDialogProps) {
  const { services, staff, settings, addAppointment } = useBooking()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [serviceId, setServiceId] = useState<string>(preselectedServiceId || '')
  const [staffId, setStaffId] = useState<string>(preselectedStaffId || '')
  const [dateStr, setDateStr] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('09:00')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  
  // Get selected service for duration calculation
  const selectedService = services.find(s => s.id === serviceId)
  
  // Get staff who provide the selected service
  const availableStaff = selectedService
    ? staff.filter(s => 
        s.is_active && 
        s.services?.some(srv => srv.id === serviceId)
      )
    : staff.filter(s => s.is_active)
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setServiceId(preselectedServiceId || '')
      setStaffId(preselectedStaffId || '')
      setDateStr(preselectedDate 
        ? preselectedDate.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0]
      )
      setStartTime('09:00')
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setCustomerNotes('')
    }
  }, [open, preselectedServiceId, preselectedStaffId, preselectedDate])
  
  // Calculate end time based on service duration
  const calculateEndTime = (): string => {
    if (!startTime || !selectedService) return ''
    
    const [hours, minutes] = startTime.split(':').map(Number)
    const duration = selectedService.duration_minutes
    const endMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(endMinutes / 60) % 24
    const endMins = endMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!serviceId) {
      toast.error('Please select a service')
      return
    }
    
    if (!dateStr) {
      toast.error('Please select a date')
      return
    }
    
    if (!customerName.trim()) {
      toast.error('Customer name is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Calculate start and end times
      const [hours, minutes] = startTime.split(':').map(Number)
      const startDateTime = new Date(dateStr + 'T00:00:00')
      startDateTime.setHours(hours, minutes, 0, 0)
      
      const endDateTime = new Date(startDateTime)
      const duration = selectedService?.duration_minutes || 60
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)
      
      await addAppointment({
        service_id: serviceId,
        staff_id: staffId || undefined,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        customer_notes: customerNotes.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: settings?.auto_confirm ? 'confirmed' : 'pending',
        payment_status: 'not_required',
        metadata: {},
        custom_fields: {}
      })
      
      toast.success('Appointment created successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create appointment')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const endTime = calculateEndTime()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Book a new appointment. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Service Selection */}
            <div className="grid gap-2">
              <Label htmlFor="service">Service *</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {service.duration_minutes}min - ${service.price}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Staff Selection */}
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select 
                value={staffId || "none"} 
                onValueChange={(v) => setStaffId(v === "none" ? "" : v)}
                disabled={availableStaff.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any available staff</SelectItem>
                  {availableStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time *
                </Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {formatTimeSlot(slot, settings?.time_format)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Duration Display */}
            {selectedService && endTime && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                <span className="font-medium">Duration: </span>
                {selectedService.duration_minutes} minutes
                <span className="mx-2">•</span>
                <span className="font-medium">End Time: </span>
                {formatTimeSlot(endTime, settings?.time_format)}
              </div>
            )}
            
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h4>
              
              {/* Customer Name */}
              <div className="grid gap-2">
                <Label htmlFor="customerName">Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </div>
              
              {/* Customer Email & Phone */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="customerPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              
              {/* Notes */}
              <div className="grid gap-2 mt-4">
                <Label htmlFor="customerNotes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </Label>
                <Textarea
                  id="customerNotes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
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
              {isSubmitting ? 'Creating...' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
