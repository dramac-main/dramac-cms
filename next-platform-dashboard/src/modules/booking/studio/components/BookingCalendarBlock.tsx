/**
 * Booking Calendar Block - Studio Component
 * 
 * Interactive calendar widget for selecting dates and times.
 * 50+ customization properties with full theme support.
 * 
 * @module booking
 */
'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Clock, Calendar, Loader2 } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'
import { useBookingSlots } from '../../hooks/useBookingSlots'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface BookingCalendarBlockProps {
  // Content
  title?: string
  subtitle?: string
  showHeader?: boolean
  showTimeSlots?: boolean
  showLegend?: boolean
  emptyDateMessage?: string
  noSlotsMessage?: string
  selectedDateLabel?: string
  availableLabel?: string
  unavailableLabel?: string
  todayLabel?: string

  // Data / Connection
  siteId?: string
  serviceId?: string
  staffId?: string

  // Calendar Settings
  firstDayOfWeek?: 'sunday' | 'monday'
  minDate?: string
  maxDate?: string
  disabledDays?: string[]
  slotInterval?: number
  slotStartHour?: number
  slotEndHour?: number
  maxSlotsPerDay?: number
  dateFormat?: 'short' | 'medium' | 'long'
  timeFormat?: '12h' | '24h'

  // Layout
  layout?: 'standard' | 'compact' | 'expanded' | 'side-by-side'
  timeSlotsColumns?: ResponsiveValue<number>
  calendarSize?: 'sm' | 'md' | 'lg'
  headerAlignment?: 'left' | 'center' | 'right'
  width?: ResponsiveValue<string>
  minHeight?: ResponsiveValue<string>
  padding?: ResponsiveValue<string>
  gap?: ResponsiveValue<string>

  // Style - Colors
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  headerBackgroundColor?: string
  headerTextColor?: string
  dayTextColor?: string
  dayHoverColor?: string
  selectedDayBgColor?: string
  selectedDayTextColor?: string
  todayBorderColor?: string
  disabledDayColor?: string
  slotBackgroundColor?: string
  slotHoverColor?: string
  slotSelectedBgColor?: string
  slotSelectedTextColor?: string
  slotUnavailableColor?: string
  borderColor?: string
  dividerColor?: string
  legendDotAvailableColor?: string
  legendDotUnavailableColor?: string

  // Style - Typography
  titleFontSize?: ResponsiveValue<string>
  titleFontWeight?: string
  titleFontFamily?: string
  subtitleFontSize?: string
  dayFontSize?: string
  timeFontSize?: string
  monthFontSize?: string

  // Style - Shape & Effects
  borderRadius?: ResponsiveValue<string>
  borderWidth?: string
  borderStyle?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  dayBorderRadius?: string
  slotBorderRadius?: string
  hoverScale?: boolean
  animateSelection?: boolean

  // Navigation
  showNavArrows?: boolean
  showMonthYear?: boolean
  showTodayButton?: boolean
  showWeekNumbers?: boolean
  allowPastDates?: boolean

  // Accessibility
  ariaLabel?: string

  // Events (internal)
  className?: string
  onDateSelect?: (date: Date) => void
  onTimeSelect?: (time: string, date: Date) => void
}

interface TimeSlot {
  time: string
  display: string
  available: boolean
}

// =============================================================================
// HELPERS
// =============================================================================

function resolveResponsive<T>(val: ResponsiveValue<T> | undefined, fallback: T): T {
  if (val === undefined || val === null) return fallback
  if (typeof val === 'object' && val !== null && ('mobile' in val || 'tablet' in val || 'desktop' in val)) {
    return (val as any).desktop ?? (val as any).tablet ?? (val as any).mobile ?? fallback
  }
  return val as T
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
}

function formatTimeHelper(hour: number, min: number, format: string): string {
  if (format === '12h') {
    const h = hour % 12 || 12
    const ampm = hour < 12 ? 'AM' : 'PM'
    return `${h}:${min.toString().padStart(2, '0')} ${ampm}`
  }
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingCalendarBlock({
  // Content
  title = 'Select Date & Time',
  subtitle,
  showHeader = true,
  showTimeSlots = true,
  showLegend = false,
  emptyDateMessage = 'Select a date to see available times',
  noSlotsMessage = 'No available time slots for this date.',
  selectedDateLabel = 'Available Times for',
  availableLabel = 'Available',
  unavailableLabel = 'Unavailable',
  todayLabel = 'Today',

  // Data
  siteId,
  serviceId,
  staffId,

  // Calendar Settings
  firstDayOfWeek = 'sunday',
  slotInterval = 30,
  slotStartHour = 9,
  slotEndHour = 17,
  dateFormat = 'medium',
  timeFormat = '24h',
  allowPastDates = false,

  // Layout
  layout = 'standard',
  timeSlotsColumns,
  calendarSize = 'md',
  headerAlignment = 'center',
  width,
  minHeight,
  padding,
  gap,

  // Colors
  primaryColor = '#8B5CF6',
  secondaryColor,
  backgroundColor,
  textColor,
  headerBackgroundColor,
  headerTextColor,
  dayTextColor,
  dayHoverColor,
  selectedDayBgColor,
  selectedDayTextColor = '#ffffff',
  todayBorderColor,
  disabledDayColor,
  slotBackgroundColor,
  slotHoverColor,
  slotSelectedBgColor,
  slotSelectedTextColor = '#ffffff',
  slotUnavailableColor,
  borderColor,
  dividerColor,
  legendDotAvailableColor,
  legendDotUnavailableColor,

  // Typography
  titleFontSize,
  titleFontWeight = '600',
  titleFontFamily,
  subtitleFontSize,
  dayFontSize,
  timeFontSize,
  monthFontSize,

  // Shape & Effects
  borderRadius,
  borderWidth = '1px',
  borderStyle = 'solid',
  shadow = 'sm',
  dayBorderRadius = '8px',
  slotBorderRadius = '6px',
  hoverScale = false,
  animateSelection = true,

  // Navigation
  showNavArrows = true,
  showMonthYear = true,
  showTodayButton = false,

  // Accessibility
  ariaLabel = 'Booking Calendar',

  // Internal
  className,
  onDateSelect,
  onTimeSelect,
}: BookingCalendarBlockProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Fetch real availability from DB when siteId and serviceId are available
  const { slots: realSlots, isLoading: isLoadingRealSlots } = useBookingSlots(siteId || '', {
    serviceId: serviceId || undefined,
    date: selectedDate,
    staffId: staffId || undefined,
  })

  // Map real slots to display format — demo only when no siteId (Studio editor)
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return []
    if (siteId) {
      return realSlots.map(s => {
        const startDate = s.start instanceof Date ? s.start : new Date(s.start)
        return {
          time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
          display: formatTimeHelper(startDate.getHours(), startDate.getMinutes(), timeFormat),
          available: s.available,
        }
      })
    }
    // Demo slots only in Studio editor (no siteId)
    const slots: TimeSlot[] = []
    for (let hour = slotStartHour; hour < slotEndHour; hour++) {
      for (let min = 0; min < 60; min += slotInterval) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          display: formatTimeHelper(hour, min, timeFormat),
          available: Math.random() > 0.3,
        })
      }
    }
    return slots
  }, [siteId, serviceId, selectedDate, realSlots, slotStartHour, slotEndHour, slotInterval, timeFormat])

  const isLoadingSlots = siteId ? isLoadingRealSlots : false

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = firstDayOfWeek === 'monday'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let startingDay = firstDay.getDay()
    if (firstDayOfWeek === 'monday') {
      startingDay = startingDay === 0 ? 6 : startingDay - 1
    }
    const totalDays = lastDay.getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < startingDay; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i))
    return days
  }, [year, month, firstDayOfWeek])

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(null); setSelectedTime(null) }

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
  const isPast = (date: Date) => {
    if (allowPastDates) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return date < today
  }
  const isSelected = (date: Date) => selectedDate?.toDateString() === date.toDateString()

  const formatTime = (hour: number, min: number): string => formatTimeHelper(hour, min, timeFormat)

  const formatDate = (date: Date): string => {
    const opts: Intl.DateTimeFormatOptions = dateFormat === 'short'
      ? { month: 'short', day: 'numeric' }
      : dateFormat === 'long'
        ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        : { weekday: 'short', month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', opts)
  }

  const handleDateSelect = useCallback((date: Date) => {
    if (isPast(date)) return
    setSelectedDate(date)
    setSelectedTime(null)
    onDateSelect?.(date)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDateSelect, allowPastDates])

  const handleTimeSelect = (slot: TimeSlot) => {
    if (!slot.available || !selectedDate) return
    setSelectedTime(slot.time)
    onTimeSelect?.(slot.time, selectedDate)
  }

  // Resolved styles
  const radius = resolveResponsive(borderRadius, '12px')
  const resolvedPadding = resolveResponsive(padding, '16px')
  const resolvedWidth = resolveResponsive(width, '100%')
  const resolvedMinHeight = resolveResponsive(minHeight, 'auto')
  const resolvedGap = resolveResponsive(gap, '16px')
  const resolvedTitleFontSize = resolveResponsive(titleFontSize, calendarSize === 'lg' ? '20px' : '16px')
  const slotCols = resolveResponsive(timeSlotsColumns, layout === 'side-by-side' ? 2 : 4)

  const accentColor = selectedDayBgColor || primaryColor
  const slotAccent = slotSelectedBgColor || primaryColor
  const todayBorder = todayBorderColor || primaryColor
  const hoverBg = dayHoverColor || `${primaryColor}15`
  const slotHover = slotHoverColor || `${primaryColor}15`
  const unavailColor = slotUnavailableColor || disabledDayColor || '#d1d5db'
  const legendAvail = legendDotAvailableColor || '#22c55e'
  const legendUnavail = legendDotUnavailableColor || unavailColor

  const isSideBySide = layout === 'side-by-side'
  const isCompact = layout === 'compact' || calendarSize === 'sm'

  return (
    <div
      className={cn('booking-calendar-block', className)}
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        border: `${borderWidth} ${borderStyle} ${borderColor || '#e5e7eb'}`,
        borderRadius: radius,
        boxShadow: SHADOW_MAP[shadow] || 'none',
        width: resolvedWidth,
        minHeight: resolvedMinHeight,
        fontFamily: titleFontFamily || undefined,
        overflow: 'hidden',
      }}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Header */}
      {showHeader && (
        <div
          style={{
            padding: resolvedPadding,
            backgroundColor: headerBackgroundColor || undefined,
            color: headerTextColor || textColor || undefined,
            borderBottom: `1px solid ${dividerColor || borderColor || '#e5e7eb'}`,
            textAlign: headerAlignment,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: headerAlignment === 'center' ? 'center' : headerAlignment === 'right' ? 'flex-end' : 'flex-start' }}>
            <Calendar style={{ width: 20, height: 20, opacity: 0.6 }} />
            <span style={{ fontWeight: titleFontWeight, fontSize: resolvedTitleFontSize }}>{title}</span>
          </div>
          {subtitle && (
            <p style={{ fontSize: subtitleFontSize || '14px', opacity: 0.7, marginTop: '4px' }}>{subtitle}</p>
          )}
        </div>
      )}

      <div style={{ display: isSideBySide ? 'flex' : 'block', gap: resolvedGap }}>
        {/* Calendar */}
        <div style={{ padding: resolvedPadding, flex: isSideBySide ? 1 : undefined }}>
          {/* Month Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            {showNavArrows && (
              <button
                onClick={goToPrevMonth}
                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}
                aria-label="Previous month"
              >
                <ChevronLeft style={{ width: 20, height: 20 }} />
              </button>
            )}
            {showMonthYear && (
              <h3 style={{ fontWeight: '600', fontSize: monthFontSize || '18px', textAlign: 'center', flex: 1, margin: 0 }}>
                {monthNames[month]} {year}
              </h3>
            )}
            {showNavArrows && (
              <button
                onClick={goToNextMonth}
                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}
                aria-label="Next month"
              >
                <ChevronRight style={{ width: 20, height: 20 }} />
              </button>
            )}
          </div>

          {showTodayButton && (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <button
                onClick={goToToday}
                style={{
                  padding: '4px 12px', borderRadius: '9999px', border: `1px solid ${primaryColor}`,
                  background: 'transparent', color: primaryColor, fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                {todayLabel}
              </button>
            </div>
          )}

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {dayNames.map((day) => (
              <div key={day} style={{ textAlign: 'center', fontSize: dayFontSize || (isCompact ? '11px' : '13px'), fontWeight: 500, opacity: 0.6, padding: '4px 0' }}>
                {isCompact ? day.charAt(0) : day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {calendarDays.map((date, idx) => (
              <div key={idx} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {date && (
                  <button
                    onClick={() => handleDateSelect(date)}
                    disabled={isPast(date)}
                    style={{
                      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: dayBorderRadius,
                      fontSize: dayFontSize || (isCompact ? '12px' : '14px'),
                      fontWeight: isSelected(date) || isToday(date) ? 600 : 400,
                      backgroundColor: isSelected(date) ? accentColor : undefined,
                      color: isSelected(date) ? selectedDayTextColor : isPast(date) ? (disabledDayColor || '#d1d5db') : (dayTextColor || undefined),
                      border: isToday(date) && !isSelected(date) ? `2px solid ${todayBorder}` : '2px solid transparent',
                      cursor: isPast(date) ? 'not-allowed' : 'pointer',
                      opacity: isPast(date) ? 0.4 : 1,
                      transition: animateSelection ? 'all 0.2s ease' : 'none',
                      transform: hoverScale && isSelected(date) ? 'scale(1.05)' : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isPast(date) && !isSelected(date)) (e.target as HTMLElement).style.backgroundColor = hoverBg }}
                    onMouseLeave={(e) => { if (!isSelected(date)) (e.target as HTMLElement).style.backgroundColor = 'transparent' }}
                    aria-label={`${date.toDateString()}${isToday(date) ? ' (Today)' : ''}${isSelected(date) ? ' (Selected)' : ''}`}
                    aria-pressed={isSelected(date)}
                  >
                    {date.getDate()}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          {showLegend && (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: legendAvail, display: 'inline-block' }} />
                {availableLabel}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: legendUnavail, display: 'inline-block' }} />
                {unavailableLabel}
              </span>
            </div>
          )}
        </div>

        {/* Time Slots */}
        {showTimeSlots && (
          <div style={{
            padding: resolvedPadding,
            borderTop: !isSideBySide ? `1px solid ${dividerColor || borderColor || '#e5e7eb'}` : undefined,
            borderLeft: isSideBySide ? `1px solid ${dividerColor || borderColor || '#e5e7eb'}` : undefined,
            flex: isSideBySide ? 1 : undefined,
          }}>
            {!selectedDate ? (
              <p style={{ textAlign: 'center', fontSize: '14px', opacity: 0.6, padding: '24px 0', margin: 0 }}>
                {emptyDateMessage}
              </p>
            ) : isLoadingSlots ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                <div style={{ width: 24, height: 24, border: `3px solid ${primaryColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Clock style={{ width: 16, height: 16, opacity: 0.6 }} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    {selectedDateLabel} {formatDate(selectedDate)}
                  </span>
                </div>

                {timeSlots.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '14px', opacity: 0.6, padding: '16px 0', margin: 0 }}>
                    {noSlotsMessage}
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${slotCols}, 1fr)`, gap: '8px' }}>
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot)}
                        disabled={!slot.available}
                        style={{
                          padding: isCompact ? '6px 8px' : '8px 12px',
                          borderRadius: slotBorderRadius,
                          fontSize: timeFontSize || (isCompact ? '12px' : '13px'),
                          fontWeight: selectedTime === slot.time ? 600 : 400,
                          backgroundColor: selectedTime === slot.time ? slotAccent : slot.available ? (slotBackgroundColor || 'transparent') : `${unavailColor}20`,
                          color: selectedTime === slot.time ? slotSelectedTextColor : slot.available ? undefined : unavailColor,
                          border: slot.available && selectedTime !== slot.time ? `1px solid ${borderColor || '#e5e7eb'}` : selectedTime === slot.time ? `1px solid ${slotAccent}` : '1px solid transparent',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          opacity: !slot.available ? 0.5 : 1,
                          textDecoration: !slot.available ? 'line-through' : 'none',
                          transition: animateSelection ? 'all 0.15s ease' : 'none',
                        }}
                        onMouseEnter={(e) => { if (slot.available && selectedTime !== slot.time) (e.target as HTMLElement).style.backgroundColor = slotHover }}
                        onMouseLeave={(e) => { if (slot.available && selectedTime !== slot.time) (e.target as HTMLElement).style.backgroundColor = slotBackgroundColor || 'transparent' }}
                        aria-label={`${slot.display}${slot.available ? '' : ' (unavailable)'}`}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION — 50+ fields with field groups
// =============================================================================

export const bookingCalendarDefinition: ComponentDefinition = {
  type: 'BookingCalendar',
  label: 'Booking Calendar',
  description: 'Interactive calendar for selecting appointment dates and times — 50+ customization options',
  category: 'interactive',
  icon: 'Calendar',
  keywords: ['booking', 'calendar', 'appointment', 'date', 'time', 'schedule', 'availability'],
  defaultProps: {
    title: 'Select Date & Time',
    showHeader: true,
    showTimeSlots: true,
    showLegend: false,
    firstDayOfWeek: 'sunday',
    slotInterval: 30,
    slotStartHour: 9,
    slotEndHour: 17,
    timeFormat: '24h',
    dateFormat: 'medium',
    layout: 'standard',
    calendarSize: 'md',
    headerAlignment: 'center',
    primaryColor: '#8B5CF6',
    selectedDayTextColor: '#ffffff',
    slotSelectedTextColor: '#ffffff',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    shadow: 'sm',
    dayBorderRadius: '8px',
    slotBorderRadius: '6px',
    hoverScale: false,
    animateSelection: true,
    showNavArrows: true,
    showMonthYear: true,
    showTodayButton: false,
    allowPastDates: false,
    titleFontWeight: '600',
  },
  fields: {
    // Content (11)
    title: { type: 'text', label: 'Title', description: 'Calendar heading text' },
    subtitle: { type: 'text', label: 'Subtitle', description: 'Optional subtitle below title' },
    showHeader: { type: 'toggle', label: 'Show Header' },
    showTimeSlots: { type: 'toggle', label: 'Show Time Slots', description: 'Display time slot picker after date selection' },
    showLegend: { type: 'toggle', label: 'Show Legend', description: 'Show available/unavailable legend' },
    emptyDateMessage: { type: 'text', label: 'Empty Date Message' },
    noSlotsMessage: { type: 'text', label: 'No Slots Message' },
    selectedDateLabel: { type: 'text', label: 'Selected Date Label' },
    availableLabel: { type: 'text', label: 'Available Label' },
    unavailableLabel: { type: 'text', label: 'Unavailable Label' },
    todayLabel: { type: 'text', label: 'Today Button Label' },

    // Data Connection (2)
    serviceId: { type: 'custom', customType: 'booking:service-selector', label: 'Service', description: 'Filter availability by service' },
    staffId: { type: 'custom', customType: 'booking:staff-selector', label: 'Staff Member', description: 'Filter availability by staff member' },

    // Calendar Settings (7)
    firstDayOfWeek: { type: 'select', label: 'First Day of Week', options: [{ label: 'Sunday', value: 'sunday' }, { label: 'Monday', value: 'monday' }] },
    slotInterval: { type: 'number', label: 'Time Slot Interval (min)', min: 5, max: 120 },
    slotStartHour: { type: 'number', label: 'Start Hour (0-23)', min: 0, max: 23 },
    slotEndHour: { type: 'number', label: 'End Hour (0-23)', min: 1, max: 24 },
    timeFormat: { type: 'select', label: 'Time Format', options: [{ label: '12-Hour (AM/PM)', value: '12h' }, { label: '24-Hour', value: '24h' }] },
    dateFormat: { type: 'select', label: 'Date Format', options: [{ label: 'Short (Jan 5)', value: 'short' }, { label: 'Medium (Mon, Jan 5)', value: 'medium' }, { label: 'Long (Monday, January 5, 2026)', value: 'long' }] },
    allowPastDates: { type: 'toggle', label: 'Allow Past Dates' },

    // Layout (8)
    layout: { type: 'select', label: 'Layout', options: [{ label: 'Standard', value: 'standard' }, { label: 'Compact', value: 'compact' }, { label: 'Expanded', value: 'expanded' }, { label: 'Side by Side', value: 'side-by-side' }] },
    calendarSize: { type: 'select', label: 'Calendar Size', options: [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }] },
    headerAlignment: { type: 'select', label: 'Header Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] },
    timeSlotsColumns: { type: 'number', label: 'Time Slot Columns', min: 1, max: 8 },
    width: { type: 'text', label: 'Width' },
    minHeight: { type: 'text', label: 'Min Height' },
    padding: { type: 'text', label: 'Padding' },
    gap: { type: 'text', label: 'Gap' },

    // Navigation (3)
    showNavArrows: { type: 'toggle', label: 'Navigation Arrows' },
    showMonthYear: { type: 'toggle', label: 'Show Month/Year' },
    showTodayButton: { type: 'toggle', label: 'Show Today Button' },

    // Colors (21)
    primaryColor: { type: 'color', label: 'Primary Color', description: 'Main accent color' },
    secondaryColor: { type: 'color', label: 'Secondary Color' },
    backgroundColor: { type: 'color', label: 'Background Color' },
    textColor: { type: 'color', label: 'Text Color' },
    headerBackgroundColor: { type: 'color', label: 'Header Background' },
    headerTextColor: { type: 'color', label: 'Header Text Color' },
    dayTextColor: { type: 'color', label: 'Day Text Color' },
    dayHoverColor: { type: 'color', label: 'Day Hover Color' },
    selectedDayBgColor: { type: 'color', label: 'Selected Day Background' },
    selectedDayTextColor: { type: 'color', label: 'Selected Day Text' },
    todayBorderColor: { type: 'color', label: 'Today Border Color' },
    disabledDayColor: { type: 'color', label: 'Disabled Day Color' },
    slotBackgroundColor: { type: 'color', label: 'Slot Background' },
    slotHoverColor: { type: 'color', label: 'Slot Hover Color' },
    slotSelectedBgColor: { type: 'color', label: 'Selected Slot Background' },
    slotSelectedTextColor: { type: 'color', label: 'Selected Slot Text' },
    slotUnavailableColor: { type: 'color', label: 'Unavailable Slot Color' },
    borderColor: { type: 'color', label: 'Border Color' },
    dividerColor: { type: 'color', label: 'Divider Color' },
    legendDotAvailableColor: { type: 'color', label: 'Legend Available Dot' },
    legendDotUnavailableColor: { type: 'color', label: 'Legend Unavailable Dot' },

    // Typography (7)
    titleFontSize: { type: 'text', label: 'Title Font Size' },
    titleFontWeight: { type: 'select', label: 'Title Font Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    titleFontFamily: { type: 'text', label: 'Title Font Family' },
    subtitleFontSize: { type: 'text', label: 'Subtitle Font Size' },
    monthFontSize: { type: 'text', label: 'Month Label Font Size' },
    dayFontSize: { type: 'text', label: 'Day Font Size' },
    timeFontSize: { type: 'text', label: 'Time Slot Font Size' },

    // Shape & Effects (8)
    borderRadius: { type: 'text', label: 'Border Radius' },
    borderWidth: { type: 'text', label: 'Border Width' },
    borderStyle: { type: 'select', label: 'Border Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' }, { label: 'None', value: 'none' }] },
    shadow: { type: 'select', label: 'Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    dayBorderRadius: { type: 'text', label: 'Day Cell Radius' },
    slotBorderRadius: { type: 'text', label: 'Slot Pill Radius' },
    hoverScale: { type: 'toggle', label: 'Hover Scale Effect' },
    animateSelection: { type: 'toggle', label: 'Animate Selection' },

    // Accessibility (1)
    ariaLabel: { type: 'text', label: 'ARIA Label' },
  },
  fieldGroups: [
    { id: 'content', label: 'Content', icon: 'Type', fields: ['title', 'subtitle', 'showHeader', 'showTimeSlots', 'showLegend', 'emptyDateMessage', 'noSlotsMessage', 'selectedDateLabel', 'availableLabel', 'unavailableLabel', 'todayLabel'], defaultExpanded: true },
    { id: 'data', label: 'Data Connection', icon: 'Database', fields: ['serviceId', 'staffId'], defaultExpanded: true },
    { id: 'settings', label: 'Calendar Settings', icon: 'Settings', fields: ['firstDayOfWeek', 'slotInterval', 'slotStartHour', 'slotEndHour', 'timeFormat', 'dateFormat', 'allowPastDates'], defaultExpanded: false },
    { id: 'layout', label: 'Layout', icon: 'Layout', fields: ['layout', 'calendarSize', 'headerAlignment', 'timeSlotsColumns', 'width', 'minHeight', 'padding', 'gap'], defaultExpanded: false },
    { id: 'navigation', label: 'Navigation', icon: 'Navigation', fields: ['showNavArrows', 'showMonthYear', 'showTodayButton'], defaultExpanded: false },
    { id: 'colors', label: 'Colors', icon: 'Palette', fields: ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor', 'headerBackgroundColor', 'headerTextColor', 'dayTextColor', 'dayHoverColor', 'selectedDayBgColor', 'selectedDayTextColor', 'todayBorderColor', 'disabledDayColor', 'slotBackgroundColor', 'slotHoverColor', 'slotSelectedBgColor', 'slotSelectedTextColor', 'slotUnavailableColor', 'borderColor', 'dividerColor', 'legendDotAvailableColor', 'legendDotUnavailableColor'], defaultExpanded: false },
    { id: 'typography', label: 'Typography', icon: 'ALargeSmall', fields: ['titleFontSize', 'titleFontWeight', 'titleFontFamily', 'subtitleFontSize', 'monthFontSize', 'dayFontSize', 'timeFontSize'], defaultExpanded: false },
    { id: 'shape', label: 'Shape & Effects', icon: 'Square', fields: ['borderRadius', 'borderWidth', 'borderStyle', 'shadow', 'dayBorderRadius', 'slotBorderRadius', 'hoverScale', 'animateSelection'], defaultExpanded: false },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', fields: ['ariaLabel'], defaultExpanded: false },
  ],
  ai: {
    description: 'Interactive booking calendar — fully customizable with 50+ properties',
    canModify: ['title', 'subtitle', 'showHeader', 'showTimeSlots', 'layout', 'primaryColor', 'backgroundColor', 'textColor', 'borderRadius', 'shadow', 'calendarSize', 'timeFormat', 'firstDayOfWeek'],
    suggestions: ['Make it minimal', 'Use side-by-side layout', 'Change to brand colors', 'Show 12-hour time format', 'Make it compact'],
  },
  render: BookingCalendarBlock,
}

export default BookingCalendarBlock
