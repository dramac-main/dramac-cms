/**
 * Calendar View Component
 * 
 * Phase EM-51: Booking Module
 * Displays appointments in a weekly calendar grid format
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBooking } from '../../context/booking-context'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment, Staff, AppointmentStatus } from '../../types/booking-types'

interface CalendarViewProps {
  onAppointmentClick?: (appointment: Appointment) => void
  onSlotClick?: (date: Date, time: string) => void
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(hour: number, format: '12h' | '24h' = '12h'): string {
  if (format === '24h') {
    return `${hour.toString().padStart(2, '0')}:00`
  }
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:00 ${period}`
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-500'
    case 'pending':
      return 'bg-yellow-500'
    case 'completed':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-red-500'
    case 'no_show':
      return 'bg-gray-500'
    default:
      return 'bg-gray-400'
  }
}

export function CalendarView({ onAppointmentClick, onSlotClick }: CalendarViewProps) {
  const {
    appointments,
    staff,
    services,
    settings,
    isLoading,
    selectedDate,
    setSelectedDate,
    refreshAll,
  } = useBooking()
  
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  
  // Get current week dates
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  
  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate)
  }
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }
  
  const goToToday = () => {
    setSelectedDate(new Date())
  }
  
  // Filter appointments by staff
  const filteredAppointments = useMemo(() => {
    if (staffFilter === 'all') return appointments
    return appointments.filter((apt) => apt.staff_id === staffFilter)
  }, [appointments, staffFilter])
  
  // Get appointments for a specific date and hour
  const getAppointmentsForSlot = (date: Date, hour: number): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredAppointments.filter((apt) => {
      const aptDate = apt.start_time.split('T')[0]
      const aptHour = new Date(apt.start_time).getHours()
      return aptDate === dateStr && aptHour === hour
    })
  }
  
  // Get service name
  const getServiceName = (serviceId: string): string => {
    const service = services.find((s) => s.id === serviceId)
    return service?.name || 'Unknown'
  }
  
  // Get staff member
  const getStaffMember = (staffId?: string | null): Staff | undefined => {
    if (!staffId) return undefined
    return staff.find((s) => s.id === staffId)
  }
  
  // Format date header
  const formatDateHeader = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  
  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  return (
    <div className="p-6 h-full">
      <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            
            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className="rounded-r-none"
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="rounded-l-none"
              >
                Week
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Staff filter */}
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.filter((s) => s.is_active).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          
          <h3 className="font-semibold">
            {viewMode === 'week' ? (
              <>
                {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {weekDates[0].getMonth() !== weekDates[6].getMonth() && (
                  <> - {weekDates[6].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</>
                )}
              </>
            ) : (
              selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            )}
          </h3>
          
          <div className="w-[200px]" /> {/* Spacer for centering */}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-auto">
        {viewMode === 'week' ? (
          <div className="min-w-[800px]">
            {/* Week header */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
              <div className="p-2 text-sm font-medium text-muted-foreground border-r">
                Time
              </div>
              {weekDates.map((date, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-2 text-center border-r last:border-r-0',
                    isToday(date) && 'bg-primary/5'
                  )}
                >
                  <div className="text-sm font-medium">{SHORT_DAYS[i]}</div>
                  <div
                    className={cn(
                      'text-lg font-semibold',
                      isToday(date) && 'text-primary'
                    )}
                  >
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Time grid */}
            <div className="divide-y">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[60px]">
                  <div className="p-2 text-sm text-muted-foreground border-r flex items-start">
                    {formatHour(hour, settings?.time_format)}
                  </div>
                  {weekDates.map((date, dayIndex) => {
                    const slotAppointments = getAppointmentsForSlot(date, hour)
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'p-1 border-r last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors',
                          isToday(date) && 'bg-primary/5'
                        )}
                        onClick={() => {
                          const slotDate = new Date(date)
                          slotDate.setHours(hour, 0, 0, 0)
                          onSlotClick?.(slotDate, `${hour.toString().padStart(2, '0')}:00`)
                        }}
                      >
                        {slotAppointments.map((apt) => {
                          const staffMember = getStaffMember(apt.staff_id)
                          return (
                            <div
                              key={apt.id}
                              className={cn(
                                'rounded-md p-1 mb-1 text-xs text-white cursor-pointer',
                                getStatusColor(apt.status)
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                onAppointmentClick?.(apt)
                              }}
                            >
                              <div className="font-medium truncate">
                                {apt.customer_name}
                              </div>
                              <div className="truncate opacity-90">
                                {getServiceName(apt.service_id)}
                              </div>
                              {staffMember && (
                                <div className="truncate opacity-75">
                                  {staffMember.name}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Day view */
          <div>
            {/* Day header */}
            <div className="grid grid-cols-2 border-b sticky top-0 bg-background z-10">
              <div className="p-2 text-sm font-medium text-muted-foreground border-r">
                Time
              </div>
              <div className="p-2 text-center">
                <div className="text-lg font-semibold">
                  {DAYS[selectedDate.getDay()]}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateHeader(selectedDate)}
                </div>
              </div>
            </div>
            
            {/* Time slots */}
            <div className="divide-y">
              {HOURS.map((hour) => {
                const slotAppointments = getAppointmentsForSlot(selectedDate, hour)
                return (
                  <div key={hour} className="grid grid-cols-2 min-h-[80px]">
                    <div className="p-2 text-sm text-muted-foreground border-r flex items-start">
                      {formatHour(hour, settings?.time_format)}
                    </div>
                    <div
                      className="p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        const slotDate = new Date(selectedDate)
                        slotDate.setHours(hour, 0, 0, 0)
                        onSlotClick?.(slotDate, `${hour.toString().padStart(2, '0')}:00`)
                      }}
                    >
                      {slotAppointments.map((apt) => {
                        const staffMember = getStaffMember(apt.staff_id)
                        const startTime = new Date(apt.start_time)
                        const endTime = new Date(apt.end_time)
                        return (
                          <div
                            key={apt.id}
                            className={cn(
                              'rounded-md p-2 mb-1 text-white cursor-pointer',
                              getStatusColor(apt.status)
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick?.(apt)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{apt.customer_name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {apt.status === 'no_show' ? 'No Show' : apt.status}
                              </Badge>
                            </div>
                            <div className="text-sm opacity-90 mt-1">
                              {getServiceName(apt.service_id)}
                            </div>
                            <div className="text-sm opacity-75">
                              {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </div>
                            {staffMember && (
                              <div className="text-sm opacity-75 mt-1">
                                Staff: {staffMember.name}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
