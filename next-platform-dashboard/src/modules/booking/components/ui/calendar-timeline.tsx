"use client"

/**
 * Calendar Timeline
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Weekly calendar view with time slots and appointments
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Appointment, AppointmentStatus } from '../../types/booking-types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface CalendarTimelineProps {
  /** Appointments to display */
  appointments: Appointment[]
  /** Selected date */
  selectedDate?: Date
  /** Date change handler */
  onDateChange?: (date: Date) => void
  /** Appointment click handler */
  onAppointmentClick?: (appointment: Appointment) => void
  /** Time slot click handler */
  onTimeSlotClick?: (date: Date, hour: number) => void
  /** Start hour (24h format) */
  startHour?: number
  /** End hour (24h format) */
  endHour?: number
  /** Loading state */
  isLoading?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// STATUS COLORS
// =============================================================================

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
  confirmed: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
  completed: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  cancelled: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300',
  no_show: 'bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-300',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getWeekDates(date: Date): Date[] {
  const week: Date[] = []
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay()) // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    week.push(d)
  }
  
  return week
}

function formatTime(hour: number): string {
  const h = hour % 12 || 12
  const period = hour < 12 ? 'AM' : 'PM'
  return `${h}:00 ${period}`
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function getAppointmentPosition(
  appointment: Appointment,
  day: Date,
  startHour: number,
  endHour: number
): { top: number; height: number } | null {
  const start = new Date(appointment.start_time)
  const end = new Date(appointment.end_time)
  
  if (!isSameDay(start, day)) return null
  
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const endMinutes = end.getHours() * 60 + end.getMinutes()
  const dayStart = startHour * 60
  const dayEnd = endHour * 60
  const totalMinutes = dayEnd - dayStart
  
  const top = ((startMinutes - dayStart) / totalMinutes) * 100
  const height = ((endMinutes - startMinutes) / totalMinutes) * 100
  
  return { top: Math.max(0, top), height: Math.min(height, 100 - top) }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CalendarTimeline({
  appointments,
  selectedDate = new Date(),
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  startHour = 8,
  endHour = 20,
  isLoading = false,
  className,
}: CalendarTimelineProps) {
  const [currentDate, setCurrentDate] = React.useState(selectedDate)
  const weekDates = getWeekDates(currentDate)
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const today = new Date()

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    onDateChange?.(new Date())
  }

  // Get current time position
  const now = new Date()
  const currentTimePosition = React.useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes()
    const dayStart = startHour * 60
    const dayEnd = endHour * 60
    if (minutes < dayStart || minutes > dayEnd) return null
    return ((minutes - dayStart) / (dayEnd - dayStart)) * 100
  }, [now, startHour, endHour])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[140px] text-center">
                {weekDates[0].toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric' })}
                {' - '}
                {weekDates[6].toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 border-r" /> {/* Time column header */}
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, today)
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "p-2 text-center border-r last:border-r-0",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className="text-xs text-muted-foreground uppercase">
                      {date.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'short' })}
                    </div>
                    <div className={cn(
                      "text-lg font-semibold mt-1",
                      isToday && "text-primary"
                    )}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="relative">
              {/* Hours */}
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                  {/* Time label */}
                  <div className="p-2 border-r text-xs text-muted-foreground text-right pr-3">
                    {formatTime(hour)}
                  </div>
                  
                  {/* Day columns */}
                  {weekDates.map((date, dayIndex) => {
                    const isToday = isSameDay(date, today)
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "border-r last:border-r-0 h-12 relative",
                          isToday && "bg-primary/5",
                          onTimeSlotClick && "cursor-pointer hover:bg-accent/50"
                        )}
                        onClick={() => onTimeSlotClick?.(date, hour)}
                      />
                    )
                  })}
                </div>
              ))}

              {/* Current time indicator */}
              {currentTimePosition !== null && (
                <div 
                  className="absolute left-[calc(12.5%)] right-0 z-10 pointer-events-none"
                  style={{ top: `${currentTimePosition}%` }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}

              {/* Appointments overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="grid grid-cols-8 h-full">
                  <div /> {/* Time column spacer */}
                  {weekDates.map((date, dayIndex) => (
                    <div key={dayIndex} className="relative">
                      {appointments.map((appointment) => {
                        const position = getAppointmentPosition(appointment, date, startHour, endHour)
                        if (!position) return null
                        
                        return (
                          <TooltipProvider key={appointment.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-md border-l-2 px-1.5 py-0.5 text-xs overflow-hidden pointer-events-auto cursor-pointer",
                                    statusColors[appointment.status]
                                  )}
                                  style={{ 
                                    top: `${position.top}%`, 
                                    height: `${position.height}%`,
                                    minHeight: '20px',
                                  }}
                                  onClick={() => onAppointmentClick?.(appointment)}
                                >
                                  <div className="font-medium truncate">
                                    {appointment.customer_name}
                                  </div>
                                  {position.height > 10 && appointment.service && (
                                    <div className="truncate opacity-80">
                                      {appointment.service.name}
                                    </div>
                                  )}
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[200px]">
                                <div className="space-y-1">
                                  <p className="font-medium">{appointment.customer_name}</p>
                                  {appointment.service && (
                                    <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                                  )}
                                  <p className="text-xs">
                                    {new Date(appointment.start_time).toLocaleTimeString(DEFAULT_LOCALE, { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                    {' - '}
                                    {new Date(appointment.end_time).toLocaleTimeString(DEFAULT_LOCALE, { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </p>
                                  {appointment.staff && (
                                    <p className="text-xs flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {appointment.staff.name}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPACT DAY VIEW
// =============================================================================

export interface DayTimelineProps {
  /** Date to display */
  date: Date
  /** Appointments for this day */
  appointments: Appointment[]
  /** Appointment click handler */
  onAppointmentClick?: (appointment: Appointment) => void
  /** Additional class names */
  className?: string
}

export function DayTimeline({
  date,
  appointments,
  onAppointmentClick,
  className,
}: DayTimelineProps) {
  const dayAppointments = appointments
    .filter(apt => isSameDay(new Date(apt.start_time), date))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  if (dayAppointments.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", className)}>
        <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No appointments</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {dayAppointments.map((appointment, index) => (
        <motion.div
          key={appointment.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg border-l-2 cursor-pointer hover:bg-accent/50 transition-colors",
            statusColors[appointment.status]
          )}
          onClick={() => onAppointmentClick?.(appointment)}
        >
          <div className="flex-shrink-0 text-sm">
            <Clock className="h-4 w-4 inline mr-1" />
            {new Date(appointment.start_time).toLocaleTimeString(DEFAULT_LOCALE, { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{appointment.customer_name}</p>
            {appointment.service && (
              <p className="text-xs opacity-80 truncate">{appointment.service.name}</p>
            )}
          </div>
          {appointment.staff && (
            <div className="text-xs text-muted-foreground">
              {appointment.staff.name}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

export function CalendarTimelineSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="min-h-[400px] bg-muted/20 animate-pulse" />
      </CardContent>
    </Card>
  )
}
