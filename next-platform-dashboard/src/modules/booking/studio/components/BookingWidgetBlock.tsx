/**
 * Booking Widget Block - Studio Component
 * 
 * All-in-one multi-step booking wizard. 5 steps:
 * Service → Staff → Date/Time → Details → Confirmation.
 * 50+ customization properties with full theme support.
 * 
 * @module booking
 */
'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Tag, User, Calendar, FileText, CircleCheck,
  ChevronLeft, ChevronRight, Clock, Star, Mail, Phone,
  Send, Loader2, ArrowRight, Check
} from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'
import { useBookingServices, useBookingStaff, useBookingSlots, useCreateBooking } from '../../hooks'
import type { Service, Staff } from '../../types/booking-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

interface ServiceItem {
  id: string; name: string; description?: string; duration: number; price: number; currency: string; category?: string
}

interface StaffMember {
  id: string; name: string; role?: string; avatar?: string; rating?: number
}

interface TimeSlot {
  time: string; display: string; available: boolean
}

export interface BookingWidgetBlockProps {
  // Content / Labels
  title?: string
  subtitle?: string
  showHeader?: boolean
  showStepIndicator?: boolean
  showStepLabels?: boolean
  stepServiceLabel?: string
  stepStaffLabel?: string
  stepDateLabel?: string
  stepDetailsLabel?: string
  stepConfirmLabel?: string
  nextButtonText?: string
  prevButtonText?: string
  confirmButtonText?: string
  confirmingText?: string
  successTitle?: string
  successMessage?: string
  bookAnotherText?: string
  noServicesMessage?: string
  noStaffMessage?: string
  noSlotsMessage?: string

  // Widget Settings
  showServiceStep?: boolean
  showStaffStep?: boolean
  showSummary?: boolean
  autoAdvance?: boolean
  requireStaff?: boolean
  allowSkipStaff?: boolean

  // Data
  siteId?: string
  serviceId?: string
  staffId?: string

  // Calendar Settings
  firstDayOfWeek?: 'sunday' | 'monday'
  slotInterval?: number
  slotStartHour?: number
  slotEndHour?: number
  timeFormat?: '12h' | '24h'

  // Form Settings
  showNameField?: boolean
  showEmailField?: boolean
  showPhoneField?: boolean
  showNotesField?: boolean
  nameRequired?: boolean
  emailRequired?: boolean

  // Layout
  layout?: 'standard' | 'compact' | 'wide'
  stepIndicatorStyle?: 'dots' | 'numbers' | 'progress-bar' | 'pills'
  headerAlignment?: 'left' | 'center' | 'right'
  width?: string
  minHeight?: string
  padding?: string
  gap?: string

  // Colors
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  headerBackgroundColor?: string
  headerTextColor?: string
  stepActiveColor?: string
  stepCompletedColor?: string
  stepInactiveColor?: string
  cardBackgroundColor?: string
  cardBorderColor?: string
  cardSelectedBorderColor?: string
  cardSelectedBgColor?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonHoverColor?: string
  secondaryButtonBgColor?: string
  secondaryButtonTextColor?: string
  slotBgColor?: string
  slotSelectedBgColor?: string
  slotSelectedTextColor?: string
  summaryBgColor?: string
  successColor?: string
  errorColor?: string
  borderColor?: string
  dividerColor?: string
  progressBarBgColor?: string
  inputBorderColor?: string
  inputFocusBorderColor?: string
  priceColor?: string
  ratingColor?: string

  // Typography
  titleFontSize?: string
  titleFontWeight?: string
  titleFontFamily?: string
  subtitleFontSize?: string
  stepLabelFontSize?: string
  serviceNameFontSize?: string
  priceFontSize?: string
  priceFontWeight?: string
  buttonFontSize?: string
  buttonFontWeight?: string
  summaryFontSize?: string

  // Shape & Effects
  borderRadius?: string
  cardBorderRadius?: string
  buttonBorderRadius?: string
  inputBorderRadius?: string
  borderWidth?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  cardShadow?: 'none' | 'sm' | 'md' | 'lg'
  hoverScale?: boolean
  animateSteps?: boolean
  showSuccessAnimation?: boolean

  // Accessibility
  ariaLabel?: string

  // Events
  className?: string
  onComplete?: (booking: Record<string, unknown>) => void
}

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Full Body Massage', description: 'Relaxing full body massage therapy.', duration: 60, price: 85, currency: DEFAULT_CURRENCY, category: 'Massage' },
  { id: '2', name: 'Deep Tissue Massage', description: 'Intensive deep muscle treatment.', duration: 90, price: 120, currency: DEFAULT_CURRENCY, category: 'Massage' },
  { id: '3', name: 'Facial Treatment', description: 'Premium facial with skincare.', duration: 45, price: 65, currency: DEFAULT_CURRENCY, category: 'Skincare' },
  { id: '4', name: 'Hair Styling', description: 'Professional hair styling consultation.', duration: 30, price: 45, currency: DEFAULT_CURRENCY, category: 'Hair' },
]

const DEMO_STAFF: StaffMember[] = [
  { id: '1', name: 'Sarah Johnson', role: 'Senior Therapist', rating: 4.9 },
  { id: '2', name: 'Michael Chen', role: 'Massage Specialist', rating: 4.8 },
  { id: '3', name: 'Emma Williams', role: 'Skincare Expert', rating: 4.7 },
]

// =============================================================================
// HELPERS
// =============================================================================

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingWidgetBlock({
  // Content
  title = 'Book an Appointment',
  subtitle,
  showHeader = true,
  showStepIndicator = true,
  showStepLabels = true,
  stepServiceLabel = 'Service',
  stepStaffLabel = 'Staff',
  stepDateLabel = 'Date & Time',
  stepDetailsLabel = 'Details',
  stepConfirmLabel = 'Confirm',
  nextButtonText = 'Continue',
  prevButtonText = 'Back',
  confirmButtonText = 'Confirm Booking',
  confirmingText = 'Booking...',
  successTitle = 'Booking Confirmed!',
  successMessage = 'Your appointment has been booked. Check your email for confirmation.',
  bookAnotherText = 'Book Another',
  noServicesMessage = 'No services available.',
  noStaffMessage = 'No staff available.',
  noSlotsMessage = 'No time slots available for this date.',

  // Widget Settings
  showServiceStep = true,
  showStaffStep = true,
  showSummary = true,
  autoAdvance = false,
  requireStaff = false,

  // Data
  siteId,
  serviceId,
  staffId,

  // Calendar
  firstDayOfWeek = 'sunday',
  slotInterval = 30,
  slotStartHour = 9,
  slotEndHour = 17,
  timeFormat = '24h',

  // Form
  showNameField = true,
  showEmailField = true,
  showPhoneField = true,
  showNotesField = true,
  nameRequired = true,
  emailRequired = true,

  // Layout
  layout = 'standard',
  stepIndicatorStyle = 'dots',
  headerAlignment = 'center',
  width,
  minHeight,
  padding = '20px',
  gap = '16px',

  // Colors
  primaryColor = '#8B5CF6',
  secondaryColor,
  backgroundColor,
  textColor,
  headerBackgroundColor,
  headerTextColor,
  stepActiveColor,
  stepCompletedColor,
  stepInactiveColor,
  cardBackgroundColor,
  cardBorderColor,
  cardSelectedBorderColor,
  cardSelectedBgColor,
  buttonBackgroundColor,
  buttonTextColor = '#ffffff',
  buttonHoverColor,
  secondaryButtonBgColor,
  secondaryButtonTextColor,
  slotBgColor,
  slotSelectedBgColor,
  slotSelectedTextColor = '#ffffff',
  summaryBgColor,
  successColor = '#22c55e',
  errorColor = '#ef4444',
  borderColor,
  dividerColor,
  progressBarBgColor,
  inputBorderColor,
  inputFocusBorderColor,
  priceColor,
  ratingColor = '#f59e0b',

  // Typography
  titleFontSize = '20px',
  titleFontWeight = '700',
  titleFontFamily,
  subtitleFontSize = '14px',
  stepLabelFontSize = '12px',
  serviceNameFontSize = '15px',
  priceFontSize = '16px',
  priceFontWeight = '700',
  buttonFontSize = '14px',
  buttonFontWeight = '600',
  summaryFontSize = '14px',

  // Shape & Effects
  borderRadius = '16px',
  cardBorderRadius = '10px',
  buttonBorderRadius = '10px',
  inputBorderRadius = '8px',
  borderWidth = '1px',
  shadow = 'md',
  cardShadow = 'sm',
  hoverScale = true,
  animateSteps = true,
  showSuccessAnimation = true,

  // Accessibility
  ariaLabel = 'Booking Widget',

  // Events
  className,
  onComplete,
}: BookingWidgetBlockProps) {
  // Steps setup
  const steps = useMemo(() => {
    const s = []
    if (showServiceStep) s.push({ id: 'service', label: stepServiceLabel, icon: Tag })
    if (showStaffStep) s.push({ id: 'staff', label: stepStaffLabel, icon: User })
    s.push({ id: 'datetime', label: stepDateLabel, icon: Calendar })
    s.push({ id: 'details', label: stepDetailsLabel, icon: FileText })
    s.push({ id: 'confirm', label: stepConfirmLabel, icon: CircleCheck })
    return s
  }, [showServiceStep, showStaffStep, stepServiceLabel, stepStaffLabel, stepDateLabel, stepDetailsLabel, stepConfirmLabel])

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingStatus, setBookingStatus] = useState<'confirmed' | 'pending'>('confirmed')

  const [calendarDate, setCalendarDate] = useState(new Date())
  const calYear = calendarDate.getFullYear()
  const calMonth = calendarDate.getMonth()

  // ── Real Data Hooks ──────────────────────────────────────────────────────
  const { services: realServices, isLoading: loadingServices } = useBookingServices(siteId || '')
  const { staff: realStaff, isLoading: loadingStaff } = useBookingStaff(siteId || '')
  const { slots: realSlots, isLoading: loadingSlots } = useBookingSlots(siteId || '', {
    serviceId: selectedService?.id,
    date: selectedDate || undefined,
    staffId: selectedStaff?.id,
  })
  const { createBooking, isSubmitting: isCreatingBooking } = useCreateBooking(siteId || '')

  // Map DB services to display format — demo only when no siteId (Studio editor)
  const dataServices: ServiceItem[] = useMemo(() => {
    if (!siteId) return DEMO_SERVICES
    return realServices.map((s: Service) => ({
      id: s.id,
      name: s.name,
      description: s.description || undefined,
      duration: s.duration_minutes,
      price: s.price,
      currency: s.currency || DEFAULT_CURRENCY,
      category: s.category || undefined,
    }))
  }, [siteId, realServices])

  // Map DB staff to display format — demo only when no siteId (Studio editor)
  const dataStaff: StaffMember[] = useMemo(() => {
    if (!siteId) return DEMO_STAFF
    return realStaff.map((s: Staff) => ({
      id: s.id,
      name: s.name,
      role: s.bio ? s.bio.split('.')[0] : undefined,
      avatar: s.avatar_url || undefined,
      rating: 0,
    }))
  }, [siteId, realStaff])

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = firstDayOfWeek === 'monday' ? ['Mo','Tu','We','Th','Fr','Sa','Su'] : ['Su','Mo','Tu','We','Th','Fr','Sa']

  const calendarDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1)
    let startDay = first.getDay()
    if (firstDayOfWeek === 'monday') startDay = startDay === 0 ? 6 : startDay - 1
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < startDay; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(new Date(calYear, calMonth, i))
    return days
  }, [calYear, calMonth, firstDayOfWeek])

  const formatTime = (h: number, m: number) => {
    if (timeFormat === '12h') {
      const hh = h % 12 || 12; const ap = h < 12 ? 'AM' : 'PM'
      return `${hh}:${m.toString().padStart(2,'0')} ${ap}`
    }
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
  }

  const formatPrice = (price: number, currency: string) => {
    try { return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency }).format(price) }
    catch { return `${currency} ${price}` }
  }

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()
  const isPast = (d: Date) => { const t = new Date(); t.setHours(0,0,0,0); return d < t }
  const isDateSelected = (d: Date) => selectedDate?.toDateString() === d.toDateString()

  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return []
    // Use real slots from the database when siteId is present
    if (siteId) {
      return realSlots.map(s => {
        const startDate = s.start instanceof Date ? s.start : new Date(s.start)
        return {
          time: startDate.toTimeString().slice(0, 5),
          display: formatTime(startDate.getHours(), startDate.getMinutes()),
          available: s.available !== false,
        }
      })
    }
    // Demo slots only in Studio editor (no siteId)
    const slots: TimeSlot[] = []
    for (let h = slotStartHour; h < slotEndHour; h++) {
      for (let m = 0; m < 60; m += slotInterval) {
        slots.push({ time: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`, display: formatTime(h, m), available: true })
      }
    }
    return slots
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, slotStartHour, slotEndHour, slotInterval, timeFormat, siteId, selectedService?.id, realSlots])

  // Derived colors
  const btnBg = buttonBackgroundColor || primaryColor
  const activeStep = stepActiveColor || primaryColor
  const completedStep = stepCompletedColor || primaryColor
  const inactiveStep = stepInactiveColor || '#d1d5db'
  const selBorder = cardSelectedBorderColor || primaryColor
  const selBg = cardSelectedBgColor || `${primaryColor}08`
  const slotSelBg = slotSelectedBgColor || primaryColor
  const focusBorder = inputFocusBorderColor || primaryColor
  const summaryBg = summaryBgColor || `${primaryColor}05`
  const secBtnBg = secondaryButtonBgColor || 'transparent'
  const secBtnText = secondaryButtonTextColor || textColor || undefined

  const canGoNext = () => {
    const step = steps[currentStep]
    if (step.id === 'service') return !!selectedService
    if (step.id === 'staff') return !requireStaff || !!selectedStaff
    if (step.id === 'datetime') return !!selectedDate && !!selectedTime
    if (step.id === 'details') {
      if (nameRequired && !formData.name?.trim()) return false
      if (emailRequired && !formData.email?.trim()) return false
      if (emailRequired && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false
      return true
    }
    return true
  }

  const goNext = () => { if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1) }
  const goPrev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1) }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setBookingError(null)
    try {
      if (siteId && selectedService?.id) {
        // Build start/end times from selected date + time
        let startTime = new Date().toISOString()
        let endTime = new Date().toISOString()
        if (selectedDate && selectedTime) {
          const [h, m] = selectedTime.split(':').map(Number)
          const start = new Date(selectedDate)
          start.setHours(h, m, 0, 0)
          startTime = start.toISOString()
          const end = new Date(start.getTime() + (selectedService.duration || 60) * 60000)
          endTime = end.toISOString()
        }
        const result = await createBooking({
          service_id: selectedService.id,
          staff_id: selectedStaff?.id || null,
          customer_name: formData.name || '',
          customer_email: formData.email || '',
          customer_phone: formData.phone || '',
          customer_notes: formData.notes || '',
          start_time: startTime,
          end_time: endTime,
          status: 'pending',
          payment_status: 'not_required',
          metadata: {
            source: 'website_widget',
            service_name: selectedService.name,
            staff_name: selectedStaff?.name || '',
          },
        })
        setBookingStatus(result.status === 'confirmed' ? 'confirmed' : 'pending')
      } else {
        // Demo mode — simulate delay
        await new Promise(r => setTimeout(r, 1500))
      }
      setIsSubmitting(false)
      setIsComplete(true)
      onComplete?.({ service: selectedService, staff: selectedStaff, date: selectedDate, time: selectedTime, ...formData })
    } catch (err) {
      console.error('Booking failed:', err)
      setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const resetWidget = () => {
    setCurrentStep(0); setSelectedService(null); setSelectedStaff(null)
    setSelectedDate(null); setSelectedTime(null); setFormData({}); setIsComplete(false)
    setBookingError(null); setBookingStatus('confirmed')
  }

  // Success screen
  if (isComplete) {
    const isPending = bookingStatus === 'pending'
    const displayTitle = isPending ? 'Booking Submitted!' : successTitle
    const displayMessage = isPending
      ? 'Your appointment request has been submitted and is awaiting confirmation. You will receive an email once confirmed.'
      : successMessage
    const displayColor = isPending ? '#f59e0b' : successColor
    const DisplayIcon = isPending ? Clock : CircleCheck
    return (
      <div className={cn('booking-widget-block', className)} style={{
        backgroundColor: backgroundColor || undefined, borderRadius, width: width || '100%',
        border: `${borderWidth} solid ${borderColor || '#e5e7eb'}`, boxShadow: SHADOW_MAP[shadow] || 'none',
        padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', backgroundColor: `${displayColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          animation: showSuccessAnimation ? 'bounceIn 0.5s ease' : undefined,
        }}>
          <DisplayIcon style={{ width: 32, height: 32, color: displayColor }} />
        </div>
        <h3 style={{ fontWeight: '700', fontSize: '20px', margin: '0 0 8px', color: displayColor }}>{displayTitle}</h3>
        <p style={{ fontSize: '14px', opacity: 0.7, margin: '0 0 20px', lineHeight: 1.5 }}>{displayMessage}</p>
        <button onClick={resetWidget} style={{
          padding: '10px 24px', borderRadius: buttonBorderRadius, backgroundColor: btnBg,
          color: buttonTextColor, border: 'none', fontSize: buttonFontSize, fontWeight: buttonFontWeight, cursor: 'pointer',
        }}>
          {bookAnotherText}
        </button>
        <style>{`@keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`}</style>
      </div>
    )
  }

  const currentStepId = steps[currentStep]?.id

  return (
    <div className={cn('booking-widget-block', className)} style={{
      backgroundColor: backgroundColor || undefined, color: textColor || undefined,
      borderRadius, border: `${borderWidth} solid ${borderColor || '#e5e7eb'}`,
      boxShadow: SHADOW_MAP[shadow] || 'none', width: width || '100%', minHeight: minHeight || undefined,
      fontFamily: titleFontFamily || undefined, overflow: 'hidden',
    }} role="region" aria-label={ariaLabel}>

      {/* Header */}
      {showHeader && (
        <div style={{
          padding, backgroundColor: headerBackgroundColor || undefined,
          color: headerTextColor || textColor || undefined,
          borderBottom: `1px solid ${dividerColor || borderColor || '#e5e7eb'}`,
          textAlign: headerAlignment,
        }}>
          <h3 style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: subtitleFontSize, opacity: 0.7, marginTop: '4px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
      )}

      {/* Step Indicator */}
      {showStepIndicator && (
        <div style={{ padding: `12px ${padding}`, borderBottom: `1px solid ${dividerColor || borderColor || '#e5e7eb'}` }}>
          {stepIndicatorStyle === 'progress-bar' ? (
            <div style={{ height: 4, borderRadius: 2, backgroundColor: progressBarBgColor || '#e5e7eb' }}>
              <div style={{
                height: '100%', borderRadius: 2, backgroundColor: activeStep,
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                transition: animateSteps ? 'width 0.3s ease' : 'none',
              }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: stepIndicatorStyle === 'pills' ? '4px' : '8px' }}>
              {steps.map((step, idx) => {
                const isActive = idx === currentStep
                const isDone = idx < currentStep
                return (
                  <React.Fragment key={step.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      {stepIndicatorStyle === 'numbers' ? (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isDone ? completedStep : isActive ? activeStep : 'transparent',
                          color: isDone || isActive ? '#fff' : inactiveStep,
                          border: `2px solid ${isDone ? completedStep : isActive ? activeStep : inactiveStep}`,
                          fontSize: '12px', fontWeight: 600, transition: 'all 0.2s ease',
                        }}>
                          {isDone ? <Check style={{ width: 14, height: 14 }} /> : idx + 1}
                        </div>
                      ) : stepIndicatorStyle === 'pills' ? (
                        <div style={{
                          height: 4, width: isActive ? 24 : 12, borderRadius: 2,
                          backgroundColor: isDone ? completedStep : isActive ? activeStep : inactiveStep,
                          transition: 'all 0.2s ease',
                        }} />
                      ) : (
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          backgroundColor: isDone ? completedStep : isActive ? activeStep : inactiveStep,
                          transition: 'all 0.2s ease',
                        }} />
                      )}
                      {showStepLabels && stepIndicatorStyle !== 'pills' && (
                        <span style={{ fontSize: stepLabelFontSize, opacity: isActive ? 1 : 0.5, fontWeight: isActive ? 600 : 400 }}>
                          {step.label}
                        </span>
                      )}
                    </div>
                    {idx < steps.length - 1 && stepIndicatorStyle !== 'pills' && (
                      <div style={{ flex: 1, height: 1, backgroundColor: isDone ? completedStep : inactiveStep, maxWidth: 40 }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step Content */}
      <div style={{ padding, minHeight: '200px' }}>
        {/* SERVICE STEP */}
        {currentStepId === 'service' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {loadingServices && siteId ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: primaryColor }} />
              </div>
            ) : dataServices.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.6, padding: '20px' }}>{noServicesMessage}</p>
            ) : dataServices.map(service => (
              <div key={service.id} onClick={() => { setSelectedService(service); if (autoAdvance) goNext() }}
                style={{
                  padding: '14px', borderRadius: cardBorderRadius,
                  border: `${selectedService?.id === service.id ? '2px' : borderWidth} solid ${selectedService?.id === service.id ? selBorder : (cardBorderColor || '#e5e7eb')}`,
                  backgroundColor: selectedService?.id === service.id ? selBg : (cardBackgroundColor || undefined),
                  boxShadow: SHADOW_MAP[cardShadow] || 'none', cursor: 'pointer',
                  transition: animateSteps ? 'all 0.2s ease' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => hoverScale && ((e.currentTarget as HTMLElement).style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => hoverScale && ((e.currentTarget as HTMLElement).style.transform = 'none')}
              >
                <div>
                  <h4 style={{ fontWeight: '600', fontSize: serviceNameFontSize, margin: '0 0 4px' }}>{service.name}</h4>
                  {service.description && <p style={{ fontSize: '13px', opacity: 0.7, margin: '0 0 6px' }}>{service.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.7 }}>
                    <Clock style={{ width: 14, height: 14 }} /> {service.duration} min
                  </div>
                </div>
                <span style={{ fontWeight: priceFontWeight, fontSize: priceFontSize, color: priceColor || primaryColor }}>
                  {formatPrice(service.price, service.currency)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* STAFF STEP */}
        {currentStepId === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {loadingStaff && siteId ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: primaryColor }} />
              </div>
            ) : dataStaff.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.6, padding: '20px' }}>{noStaffMessage}</p>
            ) : dataStaff.map(staff => (
              <div key={staff.id} onClick={() => { setSelectedStaff(staff); if (autoAdvance) goNext() }}
                style={{
                  padding: '14px', borderRadius: cardBorderRadius,
                  border: `${selectedStaff?.id === staff.id ? '2px' : borderWidth} solid ${selectedStaff?.id === staff.id ? selBorder : (cardBorderColor || '#e5e7eb')}`,
                  backgroundColor: selectedStaff?.id === staff.id ? selBg : (cardBackgroundColor || undefined),
                  boxShadow: SHADOW_MAP[cardShadow] || 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: animateSteps ? 'all 0.2s ease' : 'none',
                }}
              >
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.name} style={{
                    width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', backgroundColor: `${primaryColor}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: primaryColor, fontWeight: 700, fontSize: '16px',
                  }}>
                    {staff.name.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>{staff.name}</h4>
                  {staff.role && <p style={{ fontSize: '13px', opacity: 0.6, margin: '2px 0 0' }}>{staff.role}</p>}
                </div>
                {staff.rating != null && staff.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star style={{ width: 14, height: 14, fill: ratingColor, color: ratingColor }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{staff.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DATE/TIME STEP */}
        {currentStepId === 'datetime' && (
          <div>
            {/* Mini Calendar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  <ChevronLeft style={{ width: 18, height: 18 }} />
                </button>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>{monthNames[calMonth]} {calYear}</span>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  <ChevronRight style={{ width: 18, height: 18 }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {dayNames.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 500, opacity: 0.5, padding: '4px 0' }}>{d}</div>
                ))}
                {calendarDays.map((date, idx) => (
                  <div key={idx} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {date && (
                      <button onClick={() => { setSelectedDate(date); setSelectedTime(null) }} disabled={isPast(date)}
                        style={{
                          width: '100%', height: '100%', borderRadius: '6px', border: isToday(date) && !isDateSelected(date) ? `2px solid ${primaryColor}` : '2px solid transparent',
                          backgroundColor: isDateSelected(date) ? primaryColor : undefined,
                          color: isDateSelected(date) ? '#fff' : isPast(date) ? '#d1d5db' : undefined,
                          fontSize: '13px', fontWeight: isDateSelected(date) ? 600 : 400,
                          cursor: isPast(date) ? 'not-allowed' : 'pointer', opacity: isPast(date) ? 0.4 : 1,
                          transition: 'all 0.15s ease',
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
                <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock style={{ width: 14, height: 14, opacity: 0.6 }} />
                  Available Times
                </p>
                {loadingSlots && siteId ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', color: primaryColor }} />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p style={{ fontSize: '14px', opacity: 0.6, textAlign: 'center', padding: '16px 0' }}>{noSlotsMessage}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {timeSlots.map(slot => (
                      <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available}
                        style={{
                          padding: '7px 10px', borderRadius: '6px', fontSize: '13px',
                          backgroundColor: selectedTime === slot.time ? slotSelBg : slot.available ? (slotBgColor || 'transparent') : '#f3f4f6',
                          color: selectedTime === slot.time ? slotSelectedTextColor : slot.available ? undefined : '#d1d5db',
                          border: `1px solid ${selectedTime === slot.time ? slotSelBg : slot.available ? (cardBorderColor || '#e5e7eb') : 'transparent'}`,
                          cursor: slot.available ? 'pointer' : 'not-allowed', fontWeight: selectedTime === slot.time ? 600 : 400,
                          textDecoration: !slot.available ? 'line-through' : 'none', opacity: !slot.available ? 0.5 : 1,
                        }}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DETAILS STEP */}
        {currentStepId === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {showNameField && (
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <User style={{ width: 14, height: 14, opacity: 0.6 }} /> Full Name {nameRequired && <span style={{ color: errorColor }}>*</span>}
                </label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your name" style={{
                    width: '100%', padding: '10px 12px', borderRadius: inputBorderRadius,
                    border: `1px solid ${inputBorderColor || '#e5e7eb'}`, fontSize: '14px', outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = inputBorderColor || '#e5e7eb'}
                />
              </div>
            )}
            {showEmailField && (
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Mail style={{ width: 14, height: 14, opacity: 0.6 }} /> Email {emailRequired && <span style={{ color: errorColor }}>*</span>}
                </label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="name@business.com" style={{
                    width: '100%', padding: '10px 12px', borderRadius: inputBorderRadius,
                    border: `1px solid ${inputBorderColor || '#e5e7eb'}`, fontSize: '14px', outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = inputBorderColor || '#e5e7eb'}
                />
              </div>
            )}
            {showPhoneField && (
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Phone style={{ width: 14, height: 14, opacity: 0.6 }} /> Phone
                </label>
                <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+260 97X XXX XXX" style={{
                    width: '100%', padding: '10px 12px', borderRadius: inputBorderRadius,
                    border: `1px solid ${inputBorderColor || '#e5e7eb'}`, fontSize: '14px', outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = inputBorderColor || '#e5e7eb'}
                />
              </div>
            )}
            {showNotesField && (
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <FileText style={{ width: 14, height: 14, opacity: 0.6 }} /> Notes
                </label>
                <textarea value={formData.notes || ''} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any special requests..." rows={3} style={{
                    width: '100%', padding: '10px 12px', borderRadius: inputBorderRadius,
                    border: `1px solid ${inputBorderColor || '#e5e7eb'}`, fontSize: '14px', outline: 'none', resize: 'vertical',
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = inputBorderColor || '#e5e7eb'}
                />
              </div>
            )}
          </div>
        )}

        {/* CONFIRM STEP */}
        {currentStepId === 'confirm' && (
          <div>
            {showSummary && (
              <div style={{ padding: '16px', borderRadius: cardBorderRadius, backgroundColor: summaryBg, marginBottom: '16px', fontSize: summaryFontSize }}>
                <h4 style={{ fontWeight: '600', fontSize: '15px', margin: '0 0 12px' }}>Booking Summary</h4>
                {selectedService && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ opacity: 0.7 }}>Service</span>
                    <span style={{ fontWeight: 500 }}>{selectedService.name}</span>
                  </div>
                )}
                {selectedStaff && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ opacity: 0.7 }}>Staff</span>
                    <span style={{ fontWeight: 500 }}>{selectedStaff.name}</span>
                  </div>
                )}
                {selectedDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ opacity: 0.7 }}>Date</span>
                    <span style={{ fontWeight: 500 }}>{selectedDate.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {selectedTime && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ opacity: 0.7 }}>Time</span>
                    <span style={{ fontWeight: 500 }}>{(() => {
                      if (timeFormat === '12h') {
                        const [h, m] = selectedTime.split(':').map(Number)
                        const period = h >= 12 ? 'PM' : 'AM'
                        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
                        return `${displayH}:${String(m).padStart(2, '0')} ${period}`
                      }
                      return selectedTime
                    })()}</span>
                  </div>
                )}
                {selectedService && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${dividerColor || '#e5e7eb'}`, marginTop: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: priceFontWeight, fontSize: priceFontSize, color: priceColor || primaryColor }}>
                      {formatPrice(selectedService.price, selectedService.currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Contact Info */}
            <div style={{ padding: '12px', borderRadius: cardBorderRadius, border: `1px solid ${cardBorderColor || '#e5e7eb'}`, fontSize: '13px' }}>
              <h4 style={{ fontWeight: '600', fontSize: '14px', margin: '0 0 8px' }}>Contact Details</h4>
              {formData.name && <p style={{ margin: '0 0 4px' }}>{formData.name}</p>}
              {formData.email && <p style={{ margin: '0 0 4px', opacity: 0.7 }}>{formData.email}</p>}
              {formData.phone && <p style={{ margin: '0 0 4px', opacity: 0.7 }}>{formData.phone}</p>}
              {formData.notes && <p style={{ margin: '0', opacity: 0.7, fontStyle: 'italic' }}>&ldquo;{formData.notes}&rdquo;</p>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        padding, borderTop: `1px solid ${dividerColor || borderColor || '#e5e7eb'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
      }}>
        {currentStep > 0 ? (
          <button onClick={goPrev} style={{
            padding: '10px 20px', borderRadius: buttonBorderRadius,
            backgroundColor: secBtnBg, color: secBtnText,
            border: `1px solid ${borderColor || '#e5e7eb'}`, fontSize: buttonFontSize, fontWeight: buttonFontWeight,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <ChevronLeft style={{ width: 16, height: 16 }} /> {prevButtonText}
          </button>
        ) : <div />}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {bookingError && (
            <p style={{ fontSize: '13px', color: errorColor, margin: 0, textAlign: 'right' }}>
              {bookingError}
            </p>
          )}
          {currentStepId === 'confirm' ? (
          <button onClick={handleConfirm} disabled={isSubmitting} style={{
            padding: '10px 24px', borderRadius: buttonBorderRadius,
            backgroundColor: isSubmitting ? `${btnBg}80` : btnBg, color: buttonTextColor,
            border: 'none', fontSize: buttonFontSize, fontWeight: buttonFontWeight,
            cursor: isSubmitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s ease',
          }}>
            {isSubmitting ? (
              <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> {confirmingText}</>
            ) : (
              <><CircleCheck style={{ width: 16, height: 16 }} /> {confirmButtonText}</>
            )}
          </button>
        ) : (
          <button onClick={goNext} disabled={!canGoNext()} style={{
            padding: '10px 24px', borderRadius: buttonBorderRadius,
            backgroundColor: canGoNext() ? btnBg : `${btnBg}40`, color: buttonTextColor,
            border: 'none', fontSize: buttonFontSize, fontWeight: buttonFontWeight,
            cursor: canGoNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s ease',
          }}>
            {nextButtonText} <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION — 50+ fields with field groups
// =============================================================================

export const bookingWidgetDefinition: ComponentDefinition = {
  type: 'BookingWidget',
  label: 'Booking Widget',
  description: 'All-in-one multi-step booking wizard — 50+ customization options',
  category: 'interactive',
  icon: 'CalendarCheck',
  keywords: ['booking', 'widget', 'wizard', 'multi-step', 'appointment', 'schedule', 'all-in-one'],
  defaultProps: {
    title: 'Book an Appointment',
    showHeader: true,
    showStepIndicator: true,
    showStepLabels: true,
    showServiceStep: true,
    showStaffStep: true,
    showSummary: true,
    autoAdvance: false,
    stepIndicatorStyle: 'dots',
    headerAlignment: 'center',
    layout: 'standard',
    firstDayOfWeek: 'sunday',
    slotInterval: 30,
    slotStartHour: 9,
    slotEndHour: 17,
    timeFormat: '24h',
    showNameField: true,
    showEmailField: true,
    showPhoneField: true,
    showNotesField: true,
    nameRequired: true,
    emailRequired: true,
    primaryColor: '#8B5CF6',
    buttonTextColor: '#ffffff',
    slotSelectedTextColor: '#ffffff',
    successColor: '#22c55e',
    errorColor: '#ef4444',
    ratingColor: '#f59e0b',
    borderRadius: '16px',
    cardBorderRadius: '10px',
    buttonBorderRadius: '10px',
    inputBorderRadius: '8px',
    borderWidth: '1px',
    shadow: 'md',
    cardShadow: 'sm',
    hoverScale: true,
    animateSteps: true,
    showSuccessAnimation: true,
    titleFontSize: '20px',
    titleFontWeight: '700',
    priceFontWeight: '700',
    buttonFontSize: '14px',
    buttonFontWeight: '600',
    padding: '20px',
    gap: '16px',
  },
  fields: {
    // Content (19)
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'text', label: 'Subtitle' },
    showHeader: { type: 'toggle', label: 'Show Header' },
    showStepIndicator: { type: 'toggle', label: 'Show Step Indicator' },
    showStepLabels: { type: 'toggle', label: 'Show Step Labels' },
    stepServiceLabel: { type: 'text', label: 'Service Step Label' },
    stepStaffLabel: { type: 'text', label: 'Staff Step Label' },
    stepDateLabel: { type: 'text', label: 'Date Step Label' },
    stepDetailsLabel: { type: 'text', label: 'Details Step Label' },
    stepConfirmLabel: { type: 'text', label: 'Confirm Step Label' },
    nextButtonText: { type: 'text', label: 'Next Button Text' },
    prevButtonText: { type: 'text', label: 'Back Button Text' },
    confirmButtonText: { type: 'text', label: 'Confirm Button Text' },
    confirmingText: { type: 'text', label: 'Confirming Text' },
    successTitle: { type: 'text', label: 'Success Title' },
    successMessage: { type: 'text', label: 'Success Message' },
    bookAnotherText: { type: 'text', label: 'Book Another Text' },
    noSlotsMessage: { type: 'text', label: 'No Slots Message' },
    noServicesMessage: { type: 'text', label: 'No Services Message' },

    // Widget Settings (5)
    showServiceStep: { type: 'toggle', label: 'Show Service Step' },
    showStaffStep: { type: 'toggle', label: 'Show Staff Step' },
    showSummary: { type: 'toggle', label: 'Show Summary' },
    autoAdvance: { type: 'toggle', label: 'Auto-Advance After Selection' },
    requireStaff: { type: 'toggle', label: 'Require Staff Selection' },

    // Data (2)
    serviceId: { type: 'custom', customType: 'booking:service-selector', label: 'Pre-Selected Service' },
    staffId: { type: 'custom', customType: 'booking:staff-selector', label: 'Pre-Selected Staff' },

    // Calendar (5)
    firstDayOfWeek: { type: 'select', label: 'First Day of Week', options: [{ label: 'Sunday', value: 'sunday' }, { label: 'Monday', value: 'monday' }] },
    slotInterval: { type: 'number', label: 'Slot Interval (min)', min: 5, max: 120 },
    slotStartHour: { type: 'number', label: 'Start Hour', min: 0, max: 23 },
    slotEndHour: { type: 'number', label: 'End Hour', min: 1, max: 24 },
    timeFormat: { type: 'select', label: 'Time Format', options: [{ label: '12-Hour', value: '12h' }, { label: '24-Hour', value: '24h' }] },

    // Form (6)
    showNameField: { type: 'toggle', label: 'Show Name' },
    showEmailField: { type: 'toggle', label: 'Show Email' },
    showPhoneField: { type: 'toggle', label: 'Show Phone' },
    showNotesField: { type: 'toggle', label: 'Show Notes' },
    nameRequired: { type: 'toggle', label: 'Name Required' },
    emailRequired: { type: 'toggle', label: 'Email Required' },

    // Layout (7)
    layout: { type: 'select', label: 'Layout', options: [{ label: 'Standard', value: 'standard' }, { label: 'Compact', value: 'compact' }, { label: 'Wide', value: 'wide' }] },
    stepIndicatorStyle: { type: 'select', label: 'Step Indicator Style', options: [{ label: 'Dots', value: 'dots' }, { label: 'Numbers', value: 'numbers' }, { label: 'Progress Bar', value: 'progress-bar' }, { label: 'Pills', value: 'pills' }] },
    headerAlignment: { type: 'select', label: 'Header Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] },
    width: { type: 'text', label: 'Width' },
    minHeight: { type: 'text', label: 'Min Height' },
    padding: { type: 'text', label: 'Padding' },
    gap: { type: 'text', label: 'Gap' },

    // Colors (31)
    primaryColor: { type: 'color', label: 'Primary Color' },
    secondaryColor: { type: 'color', label: 'Secondary Color' },
    backgroundColor: { type: 'color', label: 'Background' },
    textColor: { type: 'color', label: 'Text' },
    headerBackgroundColor: { type: 'color', label: 'Header Background' },
    headerTextColor: { type: 'color', label: 'Header Text' },
    stepActiveColor: { type: 'color', label: 'Active Step Color' },
    stepCompletedColor: { type: 'color', label: 'Completed Step Color' },
    stepInactiveColor: { type: 'color', label: 'Inactive Step Color' },
    cardBackgroundColor: { type: 'color', label: 'Card Background' },
    cardBorderColor: { type: 'color', label: 'Card Border' },
    cardSelectedBorderColor: { type: 'color', label: 'Selected Card Border' },
    cardSelectedBgColor: { type: 'color', label: 'Selected Card Background' },
    buttonBackgroundColor: { type: 'color', label: 'Button Background' },
    buttonTextColor: { type: 'color', label: 'Button Text' },
    buttonHoverColor: { type: 'color', label: 'Button Hover' },
    secondaryButtonBgColor: { type: 'color', label: 'Back Button Background' },
    secondaryButtonTextColor: { type: 'color', label: 'Back Button Text' },
    slotBgColor: { type: 'color', label: 'Slot Background' },
    slotSelectedBgColor: { type: 'color', label: 'Selected Slot Background' },
    slotSelectedTextColor: { type: 'color', label: 'Selected Slot Text' },
    summaryBgColor: { type: 'color', label: 'Summary Background' },
    successColor: { type: 'color', label: 'Success Color' },
    errorColor: { type: 'color', label: 'Error Color' },
    borderColor: { type: 'color', label: 'Border Color' },
    dividerColor: { type: 'color', label: 'Divider Color' },
    progressBarBgColor: { type: 'color', label: 'Progress Bar Background' },
    inputBorderColor: { type: 'color', label: 'Input Border' },
    inputFocusBorderColor: { type: 'color', label: 'Input Focus Border' },
    priceColor: { type: 'color', label: 'Price Color' },
    ratingColor: { type: 'color', label: 'Rating Color' },

    // Typography (11)
    titleFontSize: { type: 'text', label: 'Title Font Size' },
    titleFontWeight: { type: 'select', label: 'Title Weight', options: [{ label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Extra Bold', value: '800' }] },
    titleFontFamily: { type: 'text', label: 'Font Family' },
    subtitleFontSize: { type: 'text', label: 'Subtitle Font Size' },
    stepLabelFontSize: { type: 'text', label: 'Step Label Font Size' },
    serviceNameFontSize: { type: 'text', label: 'Service Name Font Size' },
    priceFontSize: { type: 'text', label: 'Price Font Size' },
    priceFontWeight: { type: 'select', label: 'Price Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Extra Bold', value: '800' }] },
    buttonFontSize: { type: 'text', label: 'Button Font Size' },
    buttonFontWeight: { type: 'select', label: 'Button Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    summaryFontSize: { type: 'text', label: 'Summary Font Size' },

    // Shape & Effects (10)
    borderRadius: { type: 'text', label: 'Container Radius' },
    cardBorderRadius: { type: 'text', label: 'Card Radius' },
    buttonBorderRadius: { type: 'text', label: 'Button Radius' },
    inputBorderRadius: { type: 'text', label: 'Input Radius' },
    borderWidth: { type: 'text', label: 'Border Width' },
    shadow: { type: 'select', label: 'Container Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    cardShadow: { type: 'select', label: 'Card Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }] },
    hoverScale: { type: 'toggle', label: 'Hover Scale' },
    animateSteps: { type: 'toggle', label: 'Animate Steps' },
    showSuccessAnimation: { type: 'toggle', label: 'Success Animation' },

    // Accessibility (1)
    ariaLabel: { type: 'text', label: 'ARIA Label' },
  },
  fieldGroups: [
    { id: 'content', label: 'Content & Labels', icon: 'Type', fields: ['title', 'subtitle', 'showHeader', 'showStepIndicator', 'showStepLabels', 'stepServiceLabel', 'stepStaffLabel', 'stepDateLabel', 'stepDetailsLabel', 'stepConfirmLabel', 'nextButtonText', 'prevButtonText', 'confirmButtonText', 'confirmingText', 'successTitle', 'successMessage', 'bookAnotherText', 'noSlotsMessage', 'noServicesMessage'], defaultExpanded: true },
    { id: 'widgetSettings', label: 'Widget Settings', icon: 'Settings', fields: ['showServiceStep', 'showStaffStep', 'showSummary', 'autoAdvance', 'requireStaff'], defaultExpanded: true },
    { id: 'data', label: 'Data Connection', icon: 'Database', fields: ['serviceId', 'staffId'], defaultExpanded: false },
    { id: 'calendar', label: 'Calendar Settings', icon: 'Calendar', fields: ['firstDayOfWeek', 'slotInterval', 'slotStartHour', 'slotEndHour', 'timeFormat'], defaultExpanded: false },
    { id: 'form', label: 'Form Fields', icon: 'FormInput', fields: ['showNameField', 'showEmailField', 'showPhoneField', 'showNotesField', 'nameRequired', 'emailRequired'], defaultExpanded: false },
    { id: 'layout', label: 'Layout', icon: 'Layout', fields: ['layout', 'stepIndicatorStyle', 'headerAlignment', 'width', 'minHeight', 'padding', 'gap'], defaultExpanded: false },
    { id: 'colors', label: 'Colors', icon: 'Palette', fields: ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor', 'headerBackgroundColor', 'headerTextColor', 'stepActiveColor', 'stepCompletedColor', 'stepInactiveColor', 'cardBackgroundColor', 'cardBorderColor', 'cardSelectedBorderColor', 'cardSelectedBgColor', 'buttonBackgroundColor', 'buttonTextColor', 'buttonHoverColor', 'secondaryButtonBgColor', 'secondaryButtonTextColor', 'slotBgColor', 'slotSelectedBgColor', 'slotSelectedTextColor', 'summaryBgColor', 'successColor', 'errorColor', 'borderColor', 'dividerColor', 'progressBarBgColor', 'inputBorderColor', 'inputFocusBorderColor', 'priceColor', 'ratingColor'], defaultExpanded: false },
    { id: 'typography', label: 'Typography', icon: 'ALargeSmall', fields: ['titleFontSize', 'titleFontWeight', 'titleFontFamily', 'subtitleFontSize', 'stepLabelFontSize', 'serviceNameFontSize', 'priceFontSize', 'priceFontWeight', 'buttonFontSize', 'buttonFontWeight', 'summaryFontSize'], defaultExpanded: false },
    { id: 'shape', label: 'Shape & Effects', icon: 'Square', fields: ['borderRadius', 'cardBorderRadius', 'buttonBorderRadius', 'inputBorderRadius', 'borderWidth', 'shadow', 'cardShadow', 'hoverScale', 'animateSteps', 'showSuccessAnimation'], defaultExpanded: false },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', fields: ['ariaLabel'], defaultExpanded: false },
  ],
  ai: {
    description: 'Complete multi-step booking wizard — fully customizable with 50+ properties',
    canModify: ['title', 'subtitle', 'stepIndicatorStyle', 'primaryColor', 'backgroundColor', 'showServiceStep', 'showStaffStep', 'autoAdvance', 'shadow', 'borderRadius', 'layout'],
    suggestions: ['Use progress bar indicator', 'Change to brand colors', 'Skip staff selection', 'Make compact', 'Enable auto-advance'],
  },
  render: BookingWidgetBlock,
}

export default BookingWidgetBlock
