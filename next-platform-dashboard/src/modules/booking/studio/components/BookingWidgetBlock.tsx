/**
 * Booking Widget Block - Studio Component
 * 
 * Complete all-in-one booking widget that combines
 * service selection, staff selection, calendar, and form.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  User, 
  Briefcase,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface BookingWidgetBlockProps {
  siteId?: string
  title?: string
  subtitle?: string
  showStaffSelection?: boolean
  showServiceSelection?: boolean
  primaryColor?: string
  borderRadius?: ResponsiveValue<string>
  className?: string
  onBookingComplete?: (booking: BookingData) => void
}

interface BookingData {
  serviceId: string
  staffId?: string
  date: Date
  time: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
}

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  currency: string
  color: string
}

interface Staff {
  id: string
  name: string
  avatar_url?: string
}

type BookingStep = 'service' | 'staff' | 'datetime' | 'details' | 'confirmation'

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingWidgetBlock({
  siteId,
  title = 'Book an Appointment',
  subtitle = 'Select a service and time that works for you',
  showStaffSelection = true,
  showServiceSelection = true,
  primaryColor = '#8B5CF6',
  borderRadius,
  className,
  onBookingComplete,
}: BookingWidgetBlockProps) {
  // State
  const [step, setStep] = useState<BookingStep>(showServiceSelection ? 'service' : 'datetime')
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerNotes: '',
  })
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Load services and staff data
  useEffect(() => {
    if (siteId) {
      // Fetch real data from the booking module API
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const [servicesRes, staffRes] = await Promise.all([
            fetch(`/api/modules/booking/services?siteId=${siteId}`),
            fetch(`/api/modules/booking/staff?siteId=${siteId}`),
          ])
          
          if (servicesRes.ok) {
            const data = await servicesRes.json()
            setServices(data.services || data || [])
          }
          if (staffRes.ok) {
            const data = await staffRes.json()
            setStaff(data.staff || data || [])
          }
        } catch {
          // Fall back to demo data on error
          setServices([
            { id: '1', name: 'Consultation', duration_minutes: 30, price: 5000, currency: 'ZMW', color: '#3B82F6' },
            { id: '2', name: 'Full Session', duration_minutes: 60, price: 15000, currency: 'ZMW', color: '#10B981' },
            { id: '3', name: 'Premium Package', duration_minutes: 90, price: 25000, currency: 'ZMW', color: '#F59E0B' },
          ])
          setStaff([
            { id: '1', name: 'Dr. Sarah Johnson' },
            { id: '2', name: 'Michael Chen' },
            { id: '3', name: 'Emily Rodriguez' },
          ])
        }
        setIsLoading(false)
      }
      fetchData()
    } else {
      // No siteId — use demo data for Studio preview
      setServices([
        { id: '1', name: 'Consultation', duration_minutes: 30, price: 5000, currency: 'ZMW', color: '#3B82F6' },
        { id: '2', name: 'Full Session', duration_minutes: 60, price: 15000, currency: 'ZMW', color: '#10B981' },
        { id: '3', name: 'Premium Package', duration_minutes: 90, price: 25000, currency: 'ZMW', color: '#F59E0B' },
      ])
      setStaff([
        { id: '1', name: 'Dr. Sarah Johnson' },
        { id: '2', name: 'Michael Chen' },
        { id: '3', name: 'Emily Rodriguez' },
      ])
      setIsLoading(false)
    }
  }, [siteId])
  
  // Generate time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      const slots: string[] = []
      for (let hour = 9; hour < 17; hour++) {
        for (let min = 0; min < 60; min += 30) {
          if (Math.random() > 0.2) { // Simulate some unavailable slots
            slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
          }
        }
      }
      setTimeSlots(slots)
    }
  }, [selectedDate])
  
  // Format price
  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price / 100)
  }
  
  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  
  // Calendar helpers
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }
  
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }
  
  // Navigation
  const getStepIndex = (): number => {
    const steps: BookingStep[] = []
    if (showServiceSelection) steps.push('service')
    if (showStaffSelection) steps.push('staff')
    steps.push('datetime', 'details', 'confirmation')
    return steps.indexOf(step)
  }
  
  const getTotalSteps = (): number => {
    return 2 + (showServiceSelection ? 1 : 0) + (showStaffSelection ? 1 : 0)
  }
  
  const canGoNext = (): boolean => {
    switch (step) {
      case 'service': return !!selectedService
      case 'staff': return true // Staff is optional
      case 'datetime': return !!selectedDate && !!selectedTime
      case 'details': return !!formData.customerName && !!formData.customerEmail
      default: return false
    }
  }
  
  const goNext = () => {
    switch (step) {
      case 'service':
        setStep(showStaffSelection ? 'staff' : 'datetime')
        break
      case 'staff':
        setStep('datetime')
        break
      case 'datetime':
        setStep('details')
        break
      case 'details':
        handleSubmit()
        break
    }
  }
  
  const goBack = () => {
    switch (step) {
      case 'staff':
        setStep('service')
        break
      case 'datetime':
        setStep(showStaffSelection ? 'staff' : 'service')
        break
      case 'details':
        setStep('datetime')
        break
    }
  }
  
  // Submit
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const booking: BookingData = {
      serviceId: selectedService.id,
      staffId: selectedStaff?.id,
      date: selectedDate,
      time: selectedTime,
      ...formData,
    }
    
    onBookingComplete?.(booking)
    setStep('confirmation')
    setIsSubmitting(false)
  }
  
  // Responsive border radius
  const radius = typeof borderRadius === 'object' 
    ? borderRadius.mobile 
    : borderRadius || '16px'

  if (isLoading) {
    return (
      <div 
        className={cn("booking-widget-block bg-card border shadow-lg flex items-center justify-center", className)}
        style={{ borderRadius: radius, minHeight: '400px' }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div 
      className={cn("booking-widget-block bg-card border shadow-lg overflow-hidden", className)}
      style={{ borderRadius: radius }}
    >
      {/* Header */}
      <div 
        className="p-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {step !== 'confirmation' && (
          <div className="flex items-center gap-3 mb-4">
            {step !== 'service' && showServiceSelection && (
              <button
                onClick={goBack}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {step !== 'service' && !showServiceSelection && step !== 'datetime' && (
              <button
                onClick={goBack}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-white/80 text-sm">{subtitle}</p>
            </div>
          </div>
        )}
        
        {/* Progress Steps */}
        {step !== 'confirmation' && (
          <div className="flex gap-2">
            {Array.from({ length: getTotalSteps() }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  i <= getStepIndex() ? 'bg-white' : 'bg-white/30'
                )}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Service Selection */}
        {step === 'service' && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5" />
              Select a Service
            </h3>
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  selectedService?.id === service.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'hover:border-muted-foreground/30'
                )}
                style={{
                  borderColor: selectedService?.id === service.id ? primaryColor : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatPrice(service.price, service.currency)}
                    </span>
                    {selectedService?.id === service.id && (
                      <Check className="h-5 w-5" style={{ color: primaryColor }} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Staff Selection */}
        {step === 'staff' && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              Choose a Staff Member (Optional)
            </h3>
            <button
              onClick={() => setSelectedStaff(null)}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all",
                !selectedStaff ? 'border-primary ring-2 ring-primary/20' : 'hover:border-muted-foreground/30'
              )}
              style={{
                borderColor: !selectedStaff ? primaryColor : undefined,
              }}
            >
              <p className="font-medium">No preference</p>
              <p className="text-sm text-muted-foreground">Any available staff member</p>
            </button>
            {staff.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedStaff(member)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4",
                  selectedStaff?.id === member.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'hover:border-muted-foreground/30'
                )}
                style={{
                  borderColor: selectedStaff?.id === member.id ? primaryColor : undefined,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                </div>
                {selectedStaff?.id === member.id && (
                  <Check className="h-5 w-5" style={{ color: primaryColor }} />
                )}
              </button>
            ))}
          </div>
        )}
        
        {/* Date & Time Selection */}
        {step === 'datetime' && (
          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5" />
                Select Date
              </h3>
              
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-muted rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-medium">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-muted rounded-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {dayNames.map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {getCalendarDays().map((date, i) => (
                  <div key={i} className="aspect-square">
                    {date && (
                      <button
                        onClick={() => !isDateDisabled(date) && setSelectedDate(date)}
                        disabled={isDateDisabled(date)}
                        className={cn(
                          "w-full h-full flex items-center justify-center rounded-md text-sm transition-all",
                          isDateDisabled(date) && "text-muted-foreground/40 cursor-not-allowed",
                          !isDateDisabled(date) && "hover:bg-muted cursor-pointer",
                          selectedDate?.toDateString() === date.toDateString() && "text-white"
                        )}
                        style={{
                          backgroundColor: selectedDate?.toDateString() === date.toDateString() ? primaryColor : undefined,
                        }}
                      >
                        {date.getDate()}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5" />
                  Select Time
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "py-2 px-3 rounded-md text-sm font-medium transition-all border",
                        selectedTime === time 
                          ? "text-white border-transparent" 
                          : "hover:border-primary"
                      )}
                      style={{
                        backgroundColor: selectedTime === time ? primaryColor : undefined,
                        borderColor: selectedTime !== time ? undefined : primaryColor,
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Customer Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Your Details</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(p => ({ ...p, customerName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(p => ({ ...p, customerEmail: e.target.value }))}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData(p => ({ ...p, customerPhone: e.target.value }))}
                placeholder="+260 97X XXX XXX"
                className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes</label>
              <textarea
                value={formData.customerNotes}
                onChange={(e) => setFormData(p => ({ ...p, customerNotes: e.target.value }))}
                placeholder="Any special requests..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            
            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm">
                {selectedService && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span>{selectedService.name}</span>
                  </div>
                )}
                {selectedStaff && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff</span>
                    <span>{selectedStaff.name}</span>
                  </div>
                )}
                {selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>{selectedTime}</span>
                  </div>
                )}
                {selectedService && (
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatPrice(selectedService.price, selectedService.currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Confirmation */}
        {step === 'confirmation' && (
          <div className="text-center py-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Check className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for your booking. We&apos;ve sent a confirmation email with all the details.
            </p>
            <div className="p-4 bg-muted/50 rounded-lg text-left max-w-sm mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {step !== 'confirmation' && (
        <div className="p-6 pt-0">
          <button
            onClick={goNext}
            disabled={!canGoNext() || isSubmitting}
            className={cn(
              "w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2",
              (!canGoNext() || isSubmitting) ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            )}
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : step === 'details' ? (
              'Confirm Booking'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION
// =============================================================================

export const bookingWidgetDefinition: Omit<ComponentDefinition, 'module' | 'render'> & { render?: React.ComponentType<BookingWidgetBlockProps> } = {
  type: 'BookingWidgetBlock',
  label: 'Booking Widget',
  description: 'Complete all-in-one booking widget with multi-step flow',
  category: 'interactive',
  icon: 'CalendarCheck',
  defaultProps: {
    title: 'Book an Appointment',
    subtitle: 'Select a service and time that works for you',
    showStaffSelection: true,
    showServiceSelection: true,
    primaryColor: '#8B5CF6',
    borderRadius: { mobile: '12px', tablet: '16px', desktop: '16px' },
  },
  fields: {
    title: {
      type: 'text',
      label: 'Title',
    },
    subtitle: {
      type: 'text',
      label: 'Subtitle',
    },
    showServiceSelection: {
      type: 'toggle',
      label: 'Show Service Selection',
      description: 'Allow users to choose a service',
    },
    showStaffSelection: {
      type: 'toggle',
      label: 'Show Staff Selection',
      description: 'Allow users to choose a staff member',
    },
    primaryColor: {
      type: 'color',
      label: 'Primary Color',
    },
    borderRadius: {
      type: 'spacing',
      label: 'Border Radius',
    },
  },
  ai: {
    description: 'Complete booking widget with service, staff, date/time selection and form',
    canModify: ['title', 'subtitle', 'showServiceSelection', 'showStaffSelection', 'primaryColor', 'borderRadius'],
    suggestions: [
      'Change the title',
      'Hide staff selection',
      'Update colors to match brand',
    ],
  },
  render: BookingWidgetBlock,
}

export default BookingWidgetBlock
