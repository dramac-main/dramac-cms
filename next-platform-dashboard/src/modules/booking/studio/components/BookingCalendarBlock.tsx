/**
 * Booking Calendar Block - Studio Component
 * 
 * Embeddable calendar widget for public booking pages.
 * Allows visitors to select dates and times for appointments.
 */
'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface BookingCalendarBlockProps {
  siteId?: string
  serviceId?: string
  staffId?: string
  showHeader?: boolean
  showTimeSlots?: boolean
  primaryColor?: string
  borderRadius?: ResponsiveValue<string>
  className?: string
  onDateSelect?: (date: Date) => void
  onTimeSelect?: (time: string, date: Date) => void
}

interface TimeSlot {
  time: string
  available: boolean
  staffId?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingCalendarBlock({
  siteId,
  serviceId,
  staffId,
  showHeader = true,
  showTimeSlots = true,
  primaryColor = '#8B5CF6',
  borderRadius,
  className,
  onDateSelect,
  onTimeSelect,
}: BookingCalendarBlockProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  
  // Get calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDay = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    const days: (Date | null)[] = []
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Add actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }, [year, month])
  
  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  // Check if date is past
  const isPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }
  
  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }
  
  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    if (isPast(date)) return
    setSelectedDate(date)
    setSelectedTime(null)
    onDateSelect?.(date)
    
    // Load time slots for selected date
    if (showTimeSlots && siteId) {
      setIsLoadingSlots(true)
      // Simulated - in production, fetch from API
      setTimeout(() => {
        const slots: TimeSlot[] = []
        for (let hour = 9; hour < 17; hour++) {
          for (let min = 0; min < 60; min += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
            slots.push({
              time,
              available: Math.random() > 0.3, // Random for demo
            })
          }
        }
        setTimeSlots(slots)
        setIsLoadingSlots(false)
      }, 500)
    }
  }, [showTimeSlots, siteId, onDateSelect])
  
  // Handle time selection
  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return
    setSelectedTime(time)
    onTimeSelect?.(time, selectedDate)
  }
  
  // Responsive border radius
  const radius = typeof borderRadius === 'object' 
    ? borderRadius.mobile 
    : borderRadius || '12px'

  return (
    <div 
      className={cn("booking-calendar-block bg-card border shadow-sm", className)}
      style={{ 
        borderRadius: radius,
        '--primary-color': primaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Select Date & Time</span>
          </div>
        </div>
      )}
      
      {/* Calendar */}
      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h3 className="font-semibold text-lg">
            {monthNames[month]} {year}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => (
            <div key={index} className="aspect-square">
              {date && (
                <button
                  onClick={() => handleDateSelect(date)}
                  disabled={isPast(date)}
                  className={cn(
                    "w-full h-full flex items-center justify-center rounded-md text-sm font-medium transition-all",
                    isPast(date) && "text-muted-foreground/50 cursor-not-allowed",
                    !isPast(date) && !isSelected(date) && "hover:bg-muted cursor-pointer",
                    isToday(date) && !isSelected(date) && "border border-primary",
                    isSelected(date) && "text-white"
                  )}
                  style={{
                    backgroundColor: isSelected(date) ? primaryColor : undefined
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
      {showTimeSlots && selectedDate && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              Available Times for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={cn(
                    "py-2 px-3 rounded-md text-sm font-medium transition-all",
                    !slot.available && "bg-muted text-muted-foreground/50 cursor-not-allowed line-through",
                    slot.available && selectedTime !== slot.time && "border hover:border-primary cursor-pointer",
                    selectedTime === slot.time && "text-white"
                  )}
                  style={{
                    backgroundColor: selectedTime === slot.time ? primaryColor : undefined,
                    borderColor: slot.available && selectedTime !== slot.time ? undefined : undefined
                  }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
          
          {timeSlots.length === 0 && !isLoadingSlots && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No available time slots for this date.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION
// =============================================================================

export const bookingCalendarDefinition: Omit<ComponentDefinition, 'module' | 'render'> & { render?: React.ComponentType<BookingCalendarBlockProps> } = {
  type: 'BookingCalendarBlock',
  label: 'Booking Calendar',
  description: 'Interactive calendar for selecting appointment dates and times',
  category: 'interactive',
  icon: 'Calendar',
  defaultProps: {
    showHeader: true,
    showTimeSlots: true,
    primaryColor: '#8B5CF6',
    borderRadius: { mobile: '8px', tablet: '12px', desktop: '12px' },
  },
  fields: {
    serviceId: {
      type: 'custom',
      customType: 'booking:service-selector',
      label: 'Service',
      description: 'Filter availability by service',
    },
    staffId: {
      type: 'custom',
      customType: 'booking:staff-selector',
      label: 'Staff Member',
      description: 'Filter availability by staff member',
    },
    showHeader: {
      type: 'toggle',
      label: 'Show Header',
      description: 'Display the calendar header',
    },
    showTimeSlots: {
      type: 'toggle',
      label: 'Show Time Slots',
      description: 'Display available time slots after date selection',
    },
    primaryColor: {
      type: 'color',
      label: 'Primary Color',
      description: 'Accent color for selected states',
    },
    borderRadius: {
      type: 'spacing',
      label: 'Border Radius',
      description: 'Corner roundness',
    },
  },
  ai: {
    description: 'Interactive booking calendar showing available dates and times',
    canModify: ['showHeader', 'showTimeSlots', 'primaryColor', 'borderRadius'],
    suggestions: [
      'Make it minimal',
      'Add more visual emphasis',
      'Change to brand colors',
    ],
  },
  render: BookingCalendarBlock,
}

export default BookingCalendarBlock
