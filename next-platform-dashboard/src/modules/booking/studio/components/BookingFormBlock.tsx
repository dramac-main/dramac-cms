/**
 * Booking Form Block - Studio Component
 * 
 * Complete booking form with customer details input.
 * Final step in the booking flow.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { User, Mail, Phone, MessageSquare, Calendar, Clock, Check, Loader2 } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface BookingFormBlockProps {
  siteId?: string
  serviceId?: string
  staffId?: string
  selectedDate?: Date
  selectedTime?: string
  showNotes?: boolean
  requirePhone?: boolean
  showSummary?: boolean
  submitButtonText?: string
  primaryColor?: string
  borderRadius?: ResponsiveValue<string>
  className?: string
  onSubmit?: (data: BookingFormData) => void
  onSuccess?: () => void
}

export interface BookingFormData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
  serviceId?: string
  staffId?: string
  date?: Date
  time?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingFormBlock({
  siteId,
  serviceId,
  staffId,
  selectedDate,
  selectedTime,
  showNotes = true,
  requirePhone = true,
  showSummary = true,
  submitButtonText = 'Book Appointment',
  primaryColor = '#8B5CF6',
  borderRadius,
  className,
  onSubmit,
  onSuccess,
}: BookingFormBlockProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerNotes: '',
    serviceId,
    staffId,
    date: selectedDate,
    time: selectedTime,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  // Validation
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  const validatePhone = (phone: string) => {
    return phone.length >= 10
  }
  
  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null
    
    switch (field) {
      case 'customerName':
        if (!formData.customerName.trim()) return 'Name is required'
        if (formData.customerName.length < 2) return 'Name must be at least 2 characters'
        break
      case 'customerEmail':
        if (!formData.customerEmail.trim()) return 'Email is required'
        if (!validateEmail(formData.customerEmail)) return 'Invalid email address'
        break
      case 'customerPhone':
        if (requirePhone && !formData.customerPhone?.trim()) return 'Phone is required'
        if (formData.customerPhone && !validatePhone(formData.customerPhone)) return 'Invalid phone number'
        break
    }
    return null
  }
  
  const isValid = () => {
    if (!formData.customerName.trim()) return false
    if (!formData.customerEmail.trim() || !validateEmail(formData.customerEmail)) return false
    if (requirePhone && !formData.customerPhone?.trim()) return false
    return true
  }
  
  // Handle input change
  const handleChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }
  
  // Handle blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      customerName: true,
      customerEmail: true,
      customerPhone: true,
    })
    
    if (!isValid()) {
      setError('Please fill in all required fields correctly.')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (onSubmit) {
        await onSubmit(formData)
      } else if (siteId) {
        // Submit to API
        const response = await fetch('/api/modules/booking/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            ...formData,
          }),
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to book appointment')
        }
      }
      
      setIsSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Responsive border radius
  const radius = typeof borderRadius === 'object' 
    ? borderRadius.mobile 
    : borderRadius || '12px'

  // Success state
  if (isSuccess) {
    return (
      <div 
        className={cn("booking-form-block bg-card border p-8 text-center", className)}
        style={{ borderRadius: radius }}
      >
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Check className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
        <p className="text-muted-foreground mb-4">
          Thank you for your booking. We&apos;ve sent a confirmation to your email.
        </p>
        <p className="text-sm text-muted-foreground">
          If you need to make changes, please contact us.
        </p>
      </div>
    )
  }

  return (
    <div 
      className={cn("booking-form-block bg-card border shadow-sm", className)}
      style={{ borderRadius: radius }}
    >
      {/* Summary */}
      {showSummary && (selectedDate || selectedTime) && (
        <div className="border-b p-4 bg-muted/30">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Your Appointment</h4>
          <div className="flex items-center gap-4 text-sm">
            {selectedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            {selectedTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {selectedTime}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <h3 className="font-semibold text-lg mb-4">Your Details</h3>
        
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Full Name <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              onBlur={() => handleBlur('customerName')}
              placeholder="John Doe"
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 transition-all",
                getFieldError('customerName') 
                  ? "border-destructive focus:ring-destructive/20" 
                  : "focus:ring-primary/20 focus:border-primary"
              )}
              style={{ 
                borderRadius: `calc(${radius} - 4px)`,
                // @ts-ignore - CSS custom property
                '--tw-ring-color': getFieldError('customerName') ? undefined : `${primaryColor}40`,
              }}
            />
          </div>
          {getFieldError('customerName') && (
            <p className="text-xs text-destructive mt-1">{getFieldError('customerName')}</p>
          )}
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Email Address <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
              onBlur={() => handleBlur('customerEmail')}
              placeholder="john@example.com"
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 transition-all",
                getFieldError('customerEmail')
                  ? "border-destructive focus:ring-destructive/20"
                  : "focus:ring-primary/20 focus:border-primary"
              )}
              style={{ borderRadius: `calc(${radius} - 4px)` }}
            />
          </div>
          {getFieldError('customerEmail') && (
            <p className="text-xs text-destructive mt-1">{getFieldError('customerEmail')}</p>
          )}
        </div>
        
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Phone Number {requirePhone && <span className="text-destructive">*</span>}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              onBlur={() => handleBlur('customerPhone')}
              placeholder="+260 97X XXX XXX"
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 transition-all",
                getFieldError('customerPhone')
                  ? "border-destructive focus:ring-destructive/20"
                  : "focus:ring-primary/20 focus:border-primary"
              )}
              style={{ borderRadius: `calc(${radius} - 4px)` }}
            />
          </div>
          {getFieldError('customerPhone') && (
            <p className="text-xs text-destructive mt-1">{getFieldError('customerPhone')}</p>
          )}
        </div>
        
        {/* Notes */}
        {showNotes && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Additional Notes
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                value={formData.customerNotes}
                onChange={(e) => handleChange('customerNotes', e.target.value)}
                placeholder="Any special requirements or notes..."
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                style={{ borderRadius: `calc(${radius} - 4px)` }}
              />
            </div>
          </div>
        )}
        
        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !isValid()}
          className={cn(
            "w-full py-3 px-4 rounded-md font-semibold text-white transition-all flex items-center justify-center gap-2",
            isSubmitting || !isValid() 
              ? "opacity-60 cursor-not-allowed" 
              : "hover:opacity-90"
          )}
          style={{ 
            backgroundColor: primaryColor,
            borderRadius: `calc(${radius} - 4px)`,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            submitButtonText
          )}
        </button>
        
        <p className="text-xs text-muted-foreground text-center">
          By booking, you agree to our terms of service and privacy policy.
        </p>
      </form>
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION
// =============================================================================

export const bookingFormDefinition: Omit<ComponentDefinition, 'module' | 'render'> & { render?: React.ComponentType<BookingFormBlockProps> } = {
  type: 'BookingFormBlock',
  label: 'Booking Form',
  description: 'Customer details form for completing a booking',
  category: 'interactive',
  icon: 'ClipboardList',
  defaultProps: {
    showNotes: true,
    requirePhone: true,
    showSummary: true,
    submitButtonText: 'Book Appointment',
    primaryColor: '#8B5CF6',
    borderRadius: { mobile: '8px', tablet: '12px', desktop: '12px' },
  },
  fields: {
    serviceId: {
      type: 'custom',
      customType: 'booking:service-selector',
      label: 'Service',
      description: 'Pre-select a service',
    },
    staffId: {
      type: 'custom',
      customType: 'booking:staff-selector',
      label: 'Staff Member',
      description: 'Pre-select a staff member',
    },
    showNotes: {
      type: 'toggle',
      label: 'Show Notes Field',
      description: 'Allow customers to add notes',
    },
    requirePhone: {
      type: 'toggle',
      label: 'Require Phone',
      description: 'Make phone number mandatory',
    },
    showSummary: {
      type: 'toggle',
      label: 'Show Summary',
      description: 'Display selected date/time at top',
    },
    submitButtonText: {
      type: 'text',
      label: 'Submit Button Text',
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
    description: 'Booking form for customer details',
    canModify: ['showNotes', 'requirePhone', 'showSummary', 'submitButtonText', 'primaryColor', 'borderRadius'],
    suggestions: [
      'Make it simpler',
      'Add more fields',
      'Change button text',
    ],
  },
  render: BookingFormBlock,
}

export default BookingFormBlock
