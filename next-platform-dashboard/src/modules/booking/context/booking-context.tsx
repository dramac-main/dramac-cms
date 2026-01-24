/**
 * Booking Context Provider
 * 
 * Phase EM-51: Booking Module
 * 
 * Following CRM context pattern exactly.
 * Provides centralized state management for the Booking module.
 */
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type {
  BookingContextValue,
  BookingSettings,
  Service,
  ServiceInput,
  ServiceUpdate,
  Staff,
  StaffInput,
  StaffUpdate,
  Appointment,
  AppointmentInput,
  AppointmentUpdate,
  Calendar,
  CalendarInput,
  CalendarUpdate,
  BookingView,
  CancelledBy
} from '../types/booking-types'
import {
  getServices,
  getStaff,
  getAppointments,
  getCalendars,
  getSettings,
  createService,
  updateService,
  deleteService,
  createStaff,
  updateStaff,
  deleteStaff,
  createAppointment,
  updateAppointment,
  cancelAppointment as cancelAppointmentAction,
  deleteAppointment,
  createCalendar,
  updateCalendar,
  deleteCalendar
} from '../actions/booking-actions'

// =============================================================================
// CONTEXT
// =============================================================================

const BookingContext = createContext<BookingContextValue | null>(null)

// =============================================================================
// PROVIDER PROPS
// =============================================================================

interface BookingProviderProps {
  children: ReactNode
  siteId: string
  settings?: BookingSettings | null
}

// =============================================================================
// PROVIDER
// =============================================================================

export function BookingProvider({ children, siteId, settings: initialSettings }: BookingProviderProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [settings, setSettings] = useState<BookingSettings | null>(initialSettings ?? null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI State
  const [activeView, setActiveView] = useState<BookingView>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  
  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------
  
  const refreshServices = useCallback(async () => {
    try {
      const data = await getServices(siteId)
      setServices(data)
    } catch (err) {
      console.error('[Booking] Error fetching services:', err)
    }
  }, [siteId])
  
  const refreshStaff = useCallback(async () => {
    try {
      const data = await getStaff(siteId)
      setStaff(data)
    } catch (err) {
      console.error('[Booking] Error fetching staff:', err)
    }
  }, [siteId])
  
  const refreshAppointments = useCallback(async (options?: { startDate?: Date; endDate?: Date }) => {
    try {
      const data = await getAppointments(siteId, options)
      setAppointments(data)
    } catch (err) {
      console.error('[Booking] Error fetching appointments:', err)
    }
  }, [siteId])
  
  const refreshCalendars = useCallback(async () => {
    try {
      const data = await getCalendars(siteId)
      setCalendars(data)
    } catch (err) {
      console.error('[Booking] Error fetching calendars:', err)
    }
  }, [siteId])
  
  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        refreshServices(),
        refreshStaff(),
        refreshAppointments(),
        refreshCalendars()
      ])
      
      // Also refresh settings if not provided initially
      if (!initialSettings) {
        const settingsData = await getSettings(siteId)
        if (settingsData) {
          setSettings(settingsData)
        }
      }
    } catch (err) {
      console.error('[Booking] Error refreshing data:', err)
      setError('Failed to load booking data')
    } finally {
      setIsLoading(false)
    }
  }, [refreshServices, refreshStaff, refreshAppointments, refreshCalendars, siteId, initialSettings])
  
  // ---------------------------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    refreshAll()
  }, [refreshAll])
  
  // ---------------------------------------------------------------------------
  // SERVICE CRUD
  // ---------------------------------------------------------------------------
  
  const addService = useCallback(async (input: Partial<ServiceInput>): Promise<Service> => {
    const service = await createService(siteId, input)
    setServices(prev => [...prev, service])
    return service
  }, [siteId])
  
  const editService = useCallback(async (id: string, updates: ServiceUpdate): Promise<Service> => {
    const service = await updateService(siteId, id, updates)
    setServices(prev => prev.map(s => s.id === id ? service : s))
    return service
  }, [siteId])
  
  const removeService = useCallback(async (id: string): Promise<void> => {
    await deleteService(siteId, id)
    setServices(prev => prev.filter(s => s.id !== id))
    if (selectedService?.id === id) {
      setSelectedService(null)
    }
  }, [siteId, selectedService])
  
  // ---------------------------------------------------------------------------
  // STAFF CRUD
  // ---------------------------------------------------------------------------
  
  const addStaff = useCallback(async (input: Partial<StaffInput>): Promise<Staff> => {
    const staffMember = await createStaff(siteId, input)
    setStaff(prev => [...prev, staffMember])
    return staffMember
  }, [siteId])
  
  const editStaff = useCallback(async (id: string, updates: StaffUpdate): Promise<Staff> => {
    const staffMember = await updateStaff(siteId, id, updates)
    // Update staff in state with full data including services
    setStaff(prev => prev.map(s => s.id === id ? staffMember : s))
    return staffMember
  }, [siteId])
  
  const removeStaff = useCallback(async (id: string): Promise<void> => {
    await deleteStaff(siteId, id)
    setStaff(prev => prev.filter(s => s.id !== id))
    if (selectedStaff?.id === id) {
      setSelectedStaff(null)
    }
  }, [siteId, selectedStaff])
  
  // ---------------------------------------------------------------------------
  // APPOINTMENT CRUD
  // ---------------------------------------------------------------------------
  
  const addAppointment = useCallback(async (input: Partial<AppointmentInput>): Promise<Appointment> => {
    const appointment = await createAppointment(siteId, input)
    setAppointments(prev => [...prev, appointment])
    return appointment
  }, [siteId])
  
  const editAppointment = useCallback(async (id: string, updates: AppointmentUpdate): Promise<Appointment> => {
    const appointment = await updateAppointment(siteId, id, updates)
    setAppointments(prev => prev.map(a => a.id === id ? appointment : a))
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(appointment)
    }
    return appointment
  }, [siteId, selectedAppointment])
  
  const removeAppointment = useCallback(async (id: string): Promise<void> => {
    await deleteAppointment(siteId, id)
    setAppointments(prev => prev.filter(a => a.id !== id))
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(null)
    }
  }, [siteId, selectedAppointment])
  
  const cancelAppointment = useCallback(async (
    id: string,
    cancelledBy: CancelledBy,
    reason?: string
  ): Promise<Appointment> => {
    const appointment = await cancelAppointmentAction(siteId, id, cancelledBy, reason)
    setAppointments(prev => prev.map(a => a.id === id ? appointment : a))
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(appointment)
    }
    return appointment
  }, [siteId, selectedAppointment])
  
  // ---------------------------------------------------------------------------
  // CALENDAR CRUD
  // ---------------------------------------------------------------------------
  
  const addCalendar = useCallback(async (input: Partial<CalendarInput>): Promise<Calendar> => {
    const calendar = await createCalendar(siteId, input)
    setCalendars(prev => [...prev, calendar])
    return calendar
  }, [siteId])
  
  const editCalendar = useCallback(async (id: string, updates: CalendarUpdate): Promise<Calendar> => {
    const calendar = await updateCalendar(siteId, id, updates)
    setCalendars(prev => prev.map(c => c.id === id ? calendar : c))
    return calendar
  }, [siteId])
  
  const removeCalendar = useCallback(async (id: string): Promise<void> => {
    await deleteCalendar(siteId, id)
    setCalendars(prev => prev.filter(c => c.id !== id))
  }, [siteId])
  
  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------
  
  const value: BookingContextValue = {
    // State
    siteId,
    settings,
    services,
    staff,
    appointments,
    calendars,
    isLoading,
    error,
    
    // UI State
    activeView,
    selectedDate,
    selectedAppointment,
    selectedService,
    selectedStaff,
    
    // UI Actions
    setActiveView,
    setSelectedDate,
    setSelectedAppointment,
    setSelectedService,
    setSelectedStaff,
    
    // Service CRUD
    addService,
    editService,
    removeService,
    
    // Staff CRUD
    addStaff,
    editStaff,
    removeStaff,
    
    // Appointment CRUD
    addAppointment,
    editAppointment,
    removeAppointment,
    cancelAppointment,
    
    // Calendar CRUD
    addCalendar,
    editCalendar,
    removeCalendar,
    
    // Data Fetching
    refreshServices,
    refreshStaff,
    refreshAppointments,
    refreshCalendars,
    refreshAll
  }
  
  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext)
  
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  
  return context
}

// Optional hook (doesn't throw)
export function useBookingOptional(): BookingContextValue | null {
  return useContext(BookingContext)
}

// Hook for specific appointment
export function useAppointment(appointmentId: string): {
  appointment: Appointment | null
  isLoading: boolean
} {
  const { appointments, isLoading } = useBooking()
  const appointment = appointments.find(a => a.id === appointmentId) ?? null
  return { appointment, isLoading }
}

// Hook for specific service
export function useService(serviceId: string): {
  service: Service | null
  isLoading: boolean
} {
  const { services, isLoading } = useBooking()
  const service = services.find(s => s.id === serviceId) ?? null
  return { service, isLoading }
}

// Hook for specific staff member
export function useStaffMember(staffId: string): {
  staffMember: Staff | null
  isLoading: boolean
} {
  const { staff, isLoading } = useBooking()
  const staffMember = staff.find(s => s.id === staffId) ?? null
  return { staffMember, isLoading }
}

// Hook for appointments on a specific date
export function useAppointmentsForDate(date: Date): {
  appointments: Appointment[]
  isLoading: boolean
} {
  const { appointments, isLoading } = useBooking()
  
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  
  const filtered = appointments.filter(a => {
    const startTime = new Date(a.start_time)
    return startTime >= dayStart && startTime <= dayEnd
  })
  
  return { appointments: filtered, isLoading }
}

// Hook for appointments for a staff member
export function useStaffAppointments(staffId: string): {
  appointments: Appointment[]
  isLoading: boolean
} {
  const { appointments, isLoading } = useBooking()
  const filtered = appointments.filter(a => a.staff_id === staffId)
  return { appointments: filtered, isLoading }
}
