/**
 * Booking Module Server Actions
 * 
 * Phase EM-51: Booking Module
 * 
 * All server-side operations for the Booking module.
 * Following CRM actions pattern exactly.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from '@/lib/locale-config'
import { notifyBookingCancelled } from '@/lib/services/business-notifications'
import type {
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
  Availability,
  AvailabilityInput,
  AvailabilityUpdate,
  BookingSettings,
  BookingSettingsUpdate,
  TimeSlot,
  StaffService,
  StaffServiceInput,
  Reminder,
  ReminderInput,
  CancelledBy
} from '../types/booking-types'

// =============================================================================
// SCHEMA HELPERS
// =============================================================================

const BOOKING_SHORT_ID = 'bookmod01'
const TABLE_PREFIX = `mod_${BOOKING_SHORT_ID}`

// Helper to get untyped Supabase client for dynamic module tables
async function getModuleClient() {
  const supabase = await createClient()
  // Use 'as any' to bypass TypeScript's strict table type checking
  // Module tables are dynamically created and not in the generated types
  return supabase as any
}

// =============================================================================
// SERVICES ACTIONS
// =============================================================================

export async function getServices(siteId: string): Promise<Service[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('[Booking] getServices error:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Service[]
}

export async function getService(siteId: string, serviceId: string): Promise<Service | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', serviceId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('[Booking] getService error:', error)
    throw new Error(error.message)
  }
  
  return data as Service
}

export async function createService(siteId: string, input: Partial<ServiceInput>): Promise<Service> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .insert({
      site_id: siteId,
      name: input.name || 'New Service',
      slug: input.slug || input.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null,
      description: input.description || null,
      duration_minutes: input.duration_minutes ?? 60,
      buffer_before_minutes: input.buffer_before_minutes ?? 0,
      buffer_after_minutes: input.buffer_after_minutes ?? 0,
      price: input.price ?? null,
      currency: input.currency || DEFAULT_CURRENCY,
      max_attendees: input.max_attendees ?? 1,
      allow_online_booking: input.allow_online_booking ?? true,
      require_confirmation: input.require_confirmation ?? false,
      require_payment: input.require_payment ?? false,
      color: input.color || '#3B82F6',
      image_url: input.image_url || null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      custom_fields: input.custom_fields || {}
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] createService error:', error)
    throw new Error(error.message)
  }
  
  return data as Service
}

export async function updateService(
  siteId: string,
  serviceId: string,
  updates: ServiceUpdate
): Promise<Service> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', serviceId)
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] updateService error:', error)
    throw new Error(error.message)
  }
  
  return data as Service
}

export async function deleteService(siteId: string, serviceId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', serviceId)
  
  if (error) {
    console.error('[Booking] deleteService error:', error)
    throw new Error(error.message)
  }
}

// =============================================================================
// STAFF ACTIONS
// =============================================================================

export async function getStaff(siteId: string): Promise<Staff[]> {
  const supabase = await getModuleClient()
  
  // Fetch staff members
  const { data: staffData, error: staffError } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .select('*')
    .eq('site_id', siteId)
    .order('name', { ascending: true })
  
  if (staffError) {
    console.error('[Booking] getStaff error:', staffError)
    throw new Error(staffError.message)
  }
  
  if (!staffData || staffData.length === 0) return []
  
  // Fetch all staff service assignments for this site
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from(`${TABLE_PREFIX}_staff_services`)
    .select(`
      staff_id,
      service_id,
      custom_price,
      custom_duration_minutes
    `)
    .eq('site_id', siteId)
  
  if (assignmentsError) {
    console.error('[Booking] getStaff assignments error:', assignmentsError)
    // Continue without assignments rather than failing
  }
  
  // Fetch all services for this site
  const { data: servicesData, error: servicesError } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .select('*')
    .eq('site_id', siteId)
  
  if (servicesError) {
    console.error('[Booking] getStaff services error:', servicesError)
  }
  
  // Create a map of staff_id to services
  const staffServicesMap = new Map<string, Service[]>()
  
  if (assignmentsData && servicesData) {
    const servicesById = new Map(servicesData.map((s: any) => [s.id, s]))
    
    assignmentsData.forEach((assignment: any) => {
      const service = servicesById.get(assignment.service_id)
      if (service) {
        const staffServices = staffServicesMap.get(assignment.staff_id) || []
        staffServices.push(service as Service)
        staffServicesMap.set(assignment.staff_id, staffServices)
      }
    })
  }
  
  // Enrich staff with their assigned services
  return staffData.map((staff: any) => ({
    ...staff,
    services: staffServicesMap.get(staff.id) || []
  })) as Staff[]
}

export async function getStaffMember(siteId: string, staffId: string): Promise<Staff | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', staffId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[Booking] getStaffMember error:', error)
    throw new Error(error.message)
  }
  
  return data as Staff
}

export async function createStaff(siteId: string, input: Partial<StaffInput>): Promise<Staff> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .insert({
      site_id: siteId,
      user_id: input.user_id || null,
      name: input.name || 'New Staff Member',
      email: input.email || null,
      phone: input.phone || null,
      avatar_url: input.avatar_url || null,
      bio: input.bio || null,
      default_availability: input.default_availability || {},
      timezone: input.timezone || DEFAULT_TIMEZONE,
      accept_bookings: input.accept_bookings ?? true,
      is_active: input.is_active ?? true
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] createStaff error:', error)
    throw new Error(error.message)
  }
  
  return data as Staff
}

export async function updateStaff(
  siteId: string,
  staffId: string,
  updates: StaffUpdate
): Promise<Staff> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', staffId)
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] updateStaff error:', error)
    throw new Error(error.message)
  }
  
  // Fetch staff with services to return complete data
  const { data: assignmentsData } = await supabase
    .from(`${TABLE_PREFIX}_staff_services`)
    .select(`
      service_id,
      custom_price,
      custom_duration_minutes
    `)
    .eq('site_id', siteId)
    .eq('staff_id', staffId)
  
  // Fetch the actual services
  let services: Service[] = []
  if (assignmentsData && assignmentsData.length > 0) {
    const serviceIds = assignmentsData.map((a: any) => a.service_id)
    const { data: servicesData } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('*')
      .in('id', serviceIds)
      .eq('site_id', siteId)
    
    if (servicesData) {
      services = servicesData as Service[]
    }
  }
  
  return {
    ...data,
    services
  } as Staff
}

export async function deleteStaff(siteId: string, staffId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', staffId)
  
  if (error) {
    console.error('[Booking] deleteStaff error:', error)
    throw new Error(error.message)
  }
}

// =============================================================================
// STAFF-SERVICE ASSIGNMENT ACTIONS
// =============================================================================

export async function getStaffServices(siteId: string): Promise<StaffService[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_staff_services`)
    .select(`
      *,
      staff:${TABLE_PREFIX}_staff(*),
      service:${TABLE_PREFIX}_services(*)
    `)
    .eq('site_id', siteId)
  
  if (error) {
    console.error('[Booking] getStaffServices error:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as StaffService[]
}

export async function assignStaffToService(
  siteId: string,
  staffId: string,
  serviceId: string,
  options?: { custom_price?: number; custom_duration_minutes?: number }
): Promise<StaffService> {
  const supabase = await getModuleClient()
  
  // Use upsert to handle cases where assignment already exists
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_staff_services`)
    .upsert({
      site_id: siteId,
      staff_id: staffId,
      service_id: serviceId,
      custom_price: options?.custom_price || null,
      custom_duration_minutes: options?.custom_duration_minutes || null
    }, {
      onConflict: 'staff_id,service_id'
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] assignStaffToService error:', error)
    throw new Error(error.message)
  }
  
  return data as StaffService
}

export async function removeStaffFromService(
  siteId: string,
  staffId: string,
  serviceId: string
): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_staff_services`)
    .delete()
    .eq('site_id', siteId)
    .eq('staff_id', staffId)
    .eq('service_id', serviceId)
  
  if (error) {
    console.error('[Booking] removeStaffFromService error:', error)
    throw new Error(error.message)
  }
}

// =============================================================================
// APPOINTMENTS ACTIONS
// =============================================================================

export async function getAppointments(
  siteId: string,
  options?: { startDate?: Date; endDate?: Date; status?: string; staffId?: string }
): Promise<Appointment[]> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .select(`
      *,
      service:${TABLE_PREFIX}_services(*),
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .eq('site_id', siteId)
    .order('start_time', { ascending: true })
  
  if (options?.startDate) {
    query = query.gte('start_time', options.startDate.toISOString())
  }
  
  if (options?.endDate) {
    query = query.lte('start_time', options.endDate.toISOString())
  }
  
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  
  if (options?.staffId) {
    query = query.eq('staff_id', options.staffId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('[Booking] getAppointments error:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Appointment[]
}

export async function getAppointment(
  siteId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .select(`
      *,
      service:${TABLE_PREFIX}_services(*),
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .eq('site_id', siteId)
    .eq('id', appointmentId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[Booking] getAppointment error:', error)
    throw new Error(error.message)
  }
  
  return data as Appointment
}

export async function createAppointment(
  siteId: string,
  input: Partial<AppointmentInput>
): Promise<Appointment> {
  const supabase = await getModuleClient()
  
  // Validate required fields
  if (!input.service_id) {
    throw new Error('Service is required to create an appointment')
  }
  
  if (!input.start_time || !input.end_time) {
    throw new Error('Start time and end time are required')
  }
  
  // Check availability
  const isAvailable = await checkSlotAvailability(
    siteId,
    input.service_id,
    input.staff_id || null,
    new Date(input.start_time),
    new Date(input.end_time)
  )
  
  if (!isAvailable) {
    throw new Error('Selected time slot is not available')
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .insert({
      site_id: siteId,
      service_id: input.service_id,
      staff_id: input.staff_id || null,
      calendar_id: input.calendar_id || null,
      customer_name: input.customer_name || 'Guest',
      customer_email: input.customer_email || null,
      customer_phone: input.customer_phone || null,
      customer_notes: input.customer_notes || null,
      crm_contact_id: input.crm_contact_id || null,
      start_time: input.start_time,
      end_time: input.end_time,
      timezone: input.timezone || DEFAULT_TIMEZONE,
      status: input.status || 'pending',
      payment_status: input.payment_status || 'not_required',
      payment_amount: input.payment_amount || null,
      metadata: input.metadata || {},
      custom_fields: input.custom_fields || {}
    })
    .select(`
      *,
      service:${TABLE_PREFIX}_services(*),
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .single()
  
  if (error) {
    console.error('[Booking] createAppointment error:', error)
    throw new Error(error.message)
  }
  
  return data as Appointment
}

export async function updateAppointment(
  siteId: string,
  appointmentId: string,
  updates: AppointmentUpdate
): Promise<Appointment> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', appointmentId)
    .select(`
      *,
      service:${TABLE_PREFIX}_services(*),
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .single()
  
  if (error) {
    console.error('[Booking] updateAppointment error:', error)
    throw new Error(error.message)
  }
  
  return data as Appointment
}

export async function cancelAppointment(
  siteId: string,
  appointmentId: string,
  cancelledBy: CancelledBy,
  reason?: string
): Promise<Appointment> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason || null
    })
    .eq('site_id', siteId)
    .eq('id', appointmentId)
    .select(`
      *,
      service:${TABLE_PREFIX}_services(*),
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .single()
  
  if (error) {
    console.error('[Booking] cancelAppointment error:', error)
    throw new Error(error.message)
  }
  
  // Send cancellation notifications (async, don't block)
  const appointment = data as Appointment
  notifyBookingCancelled({
    siteId,
    appointmentId,
    serviceName: (appointment as any).service?.name || 'Service',
    servicePrice: (appointment as any).service?.price || 0,
    serviceDuration: (appointment as any).service?.duration_minutes || 30,
    staffName: (appointment as any).staff?.name,
    customerName: appointment.customer_name || 'Customer',
    customerEmail: appointment.customer_email || '',
    startTime: new Date(appointment.start_time),
    cancelledBy,
    reason,
    currency: (appointment as any).service?.currency,
  }).catch(err => console.error('[Booking] Cancellation notification error:', err))

  return appointment
}

export async function deleteAppointment(
  siteId: string,
  appointmentId: string
): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', appointmentId)
  
  if (error) {
    console.error('[Booking] deleteAppointment error:', error)
    throw new Error(error.message)
  }
}

// =============================================================================
// CALENDARS ACTIONS
// =============================================================================

export async function getCalendars(siteId: string): Promise<Calendar[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_calendars`)
    .select(`
      *,
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .eq('site_id', siteId)
    .order('name', { ascending: true })
  
  if (error) {
    console.error('[Booking] getCalendars error:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Calendar[]
}

export async function createCalendar(
  siteId: string,
  input: Partial<CalendarInput>
): Promise<Calendar> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_calendars`)
    .insert({
      site_id: siteId,
      name: input.name || 'New Calendar',
      description: input.description || null,
      type: input.type || 'staff',
      staff_id: input.staff_id || null,
      timezone: input.timezone || DEFAULT_TIMEZONE,
      external_calendar_url: input.external_calendar_url || null,
      external_calendar_type: input.external_calendar_type || null,
      is_active: input.is_active ?? true
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] createCalendar error:', error)
    throw new Error(error.message)
  }
  
  return data as Calendar
}

export async function updateCalendar(
  siteId: string,
  calendarId: string,
  updates: CalendarUpdate
): Promise<Calendar> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_calendars`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', calendarId)
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] updateCalendar error:', error)
    throw new Error(error.message)
  }
  
  return data as Calendar
}

export async function deleteCalendar(
  siteId: string,
  calendarId: string
): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_calendars`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', calendarId)
  
  if (error) {
    console.error('[Booking] deleteCalendar error:', error)
    throw new Error(error.message)
  }
}

// =============================================================================
// AVAILABILITY ACTIONS
// =============================================================================

export async function getAvailability(
  siteId: string,
  filters?: { staffId?: string; serviceId?: string; calendarId?: string }
): Promise<Availability[]> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_availability`)
    .select('*')
    .eq('site_id', siteId)
  
  if (filters?.staffId) {
    query = query.eq('staff_id', filters.staffId)
  }
  if (filters?.serviceId) {
    query = query.eq('service_id', filters.serviceId)
  }
  if (filters?.calendarId) {
    query = query.eq('calendar_id', filters.calendarId)
  }
  
  const { data, error } = await query.order('priority', { ascending: false })
  
  if (error) {
    console.error('[Booking] getAvailability error:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Availability[]
}

export async function createAvailability(
  siteId: string,
  input: Partial<AvailabilityInput>
): Promise<Availability> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_availability`)
    .insert({
      site_id: siteId,
      calendar_id: input.calendar_id || null,
      staff_id: input.staff_id || null,
      service_id: input.service_id || null,
      rule_type: input.rule_type || 'available',
      day_of_week: input.day_of_week ?? null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      specific_date: input.specific_date || null,
      valid_from: input.valid_from || null,
      valid_until: input.valid_until || null,
      priority: input.priority || 0,
      label: input.label || null
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] createAvailability error:', error)
    throw new Error(error.message)
  }
  
  return data as Availability
}

export async function deleteAvailability(
  siteId: string,
  availabilityId: string
): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_availability`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', availabilityId)
  
  if (error) {
    console.error('[Booking] deleteAvailability error:', error)
    throw new Error(error.message)
  }
}

export async function updateAvailability(
  siteId: string,
  availabilityId: string,
  updates: Partial<AvailabilityInput>
): Promise<Availability> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_availability`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', availabilityId)
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] updateAvailability error:', error)
    throw new Error(error.message)
  }
  
  return data as Availability
}

// =============================================================================
// SETTINGS ACTIONS
// =============================================================================

export async function getSettings(siteId: string): Promise<BookingSettings | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('[Booking] getSettings error:', error)
    throw new Error(error.message)
  }
  
  return data as BookingSettings
}

export async function updateSettings(
  siteId: string,
  updates: BookingSettingsUpdate
): Promise<BookingSettings> {
  const supabase = await getModuleClient()
  
  // Upsert settings (create if not exists)
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .upsert({
      site_id: siteId,
      ...updates
    }, {
      onConflict: 'site_id'
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] updateSettings error:', error)
    throw new Error(error.message)
  }
  
  return data as BookingSettings
}

// =============================================================================
// REMINDERS ACTIONS
// =============================================================================

export async function getReminders(
  siteId: string,
  appointmentId: string
): Promise<Reminder[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_reminders`)
    .select('*')
    .eq('site_id', siteId)
    .eq('appointment_id', appointmentId)
    .order('send_at', { ascending: true })
  
  if (error) {
    console.error('[Booking] getReminders error:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Reminder[]
}

export async function createReminder(
  siteId: string,
  input: Partial<ReminderInput>
): Promise<Reminder> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_reminders`)
    .insert({
      site_id: siteId,
      appointment_id: input.appointment_id,
      send_at: input.send_at,
      type: input.type || 'email',
      status: 'pending',
      subject: input.subject || null,
      body: input.body || null
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Booking] createReminder error:', error)
    throw new Error(error.message)
  }
  
  return data as Reminder
}

// =============================================================================
// AVAILABILITY CALCULATION
// =============================================================================

export async function getAvailableSlots(
  siteId: string,
  serviceId: string,
  date: Date,
  staffId?: string
): Promise<TimeSlot[]> {
  const supabase = await getModuleClient()
  
  try {
    // 1. Get service details
    const service = await getService(siteId, serviceId)
    if (!service) {
      throw new Error('Service not found')
    }
    
    // 2. Get settings
    const settings = await getSettings(siteId)
    const slotInterval = settings?.slot_interval_minutes ?? 30
    
    // 3. Get staff who can provide this service
    let staffIds: string[] = []
    
    if (staffId) {
      staffIds = [staffId]
    } else {
      const { data: staffServices } = await supabase
        .from(`${TABLE_PREFIX}_staff_services`)
        .select('staff_id')
        .eq('site_id', siteId)
        .eq('service_id', serviceId)
      
      staffIds = staffServices?.map((ss: { staff_id: string }) => ss.staff_id) ?? []
      
      // If no staff assignments, get all active staff
      if (staffIds.length === 0) {
        const { data: allStaff } = await supabase
          .from(`${TABLE_PREFIX}_staff`)
          .select('id')
          .eq('site_id', siteId)
          .eq('is_active', true)
          .eq('accept_bookings', true)
        
        staffIds = allStaff?.map((s: { id: string }) => s.id) ?? []
      }
    }
    
    if (staffIds.length === 0) {
      return []
    }
    
    // 4. Get availability rules
    const dayOfWeek = date.getDay()
    const dateString = date.toISOString().split('T')[0]
    
    const { data: availabilityRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
      .eq('rule_type', 'available')
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`)
      .order('priority', { ascending: false })
    
    // 5. Get blocked rules
    const { data: blockedRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
      .in('rule_type', ['blocked', 'holiday'])
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`)
    
    // 6. Get existing appointments for this date
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    const { data: existingAppointments } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('*')
      .eq('site_id', siteId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled')
    
    // 7. Generate slots
    const slots: TimeSlot[] = []
    const duration = service.duration_minutes
    const bufferBefore = service.buffer_before_minutes
    const bufferAfter = service.buffer_after_minutes
    const totalMinutes = duration + bufferBefore + bufferAfter
    
    // If no availability rules, use default business hours
    const rules = (availabilityRules && availabilityRules.length > 0)
      ? availabilityRules
      : [{ start_time: '09:00', end_time: '17:00', staff_id: null }]
    
    for (const rule of rules) {
      // Check if rule applies to any of our staff
      const ruleStaffId = rule.staff_id
      if (ruleStaffId && !staffIds.includes(ruleStaffId)) continue
      
      if (!rule.start_time || !rule.end_time) continue
      
      const startTime = parseTime(rule.start_time, date)
      const endTime = parseTime(rule.end_time, date)
      
      let slotStart = new Date(startTime)
      
      while (slotStart.getTime() + totalMinutes * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)
        
        // Check if slot is blocked
        const isBlocked = (blockedRules ?? []).some((block: any) => {
          if (!block.start_time || !block.end_time) return false
          const blockStart = parseTime(block.start_time, date)
          const blockEnd = parseTime(block.end_time, date)
          return slotStart >= blockStart && slotStart < blockEnd
        })
        
        // Check if slot conflicts with existing appointment
        const hasConflict = (existingAppointments ?? []).some((apt: any) => {
          if (ruleStaffId && apt.staff_id !== ruleStaffId) return false
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)
          return slotStart < aptEnd && slotEnd > aptStart
        })
        
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          available: !isBlocked && !hasConflict,
          staffId: ruleStaffId ?? undefined
        })
        
        // Move to next slot
        slotStart = new Date(slotStart.getTime() + slotInterval * 60000)
      }
    }
    
    return slots
  } catch (error) {
    console.error('[Booking] getAvailableSlots error:', error)
    throw error
  }
}

async function checkSlotAvailability(
  siteId: string,
  serviceId: string,
  staffId: string | null,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const supabase = await getModuleClient()
    
    // Check for conflicting appointments
    let query = supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('id')
      .eq('site_id', siteId)
      .neq('status', 'cancelled')
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString())
    
    if (staffId) {
      query = query.eq('staff_id', staffId)
    }
    
    const { data: conflicts } = await query
    
    return (conflicts?.length ?? 0) === 0
  } catch {
    return false
  }
}

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

// =============================================================================
// STATS ACTIONS
// =============================================================================

export async function getBookingStats(siteId: string): Promise<{
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  cancelledAppointments: number
  completedAppointments: number
  noShowAppointments: number
  todayAppointments: number
  upcomingThisWeek: number
  totalServices: number
  activeServices: number
  totalStaff: number
  activeStaff: number
}> {
  const supabase = await getModuleClient()
  
  // Get appointment counts by status
  const { data: appointments, error: aptsError } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .select('id, status, start_time')
    .eq('site_id', siteId)
  
  if (aptsError) {
    console.error('[Booking] getBookingStats error:', aptsError)
    throw new Error(aptsError.message)
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  
  const stats = {
    totalAppointments: appointments?.length ?? 0,
    pendingAppointments: appointments?.filter((a: any) => a.status === 'pending').length ?? 0,
    confirmedAppointments: appointments?.filter((a: any) => a.status === 'confirmed').length ?? 0,
    cancelledAppointments: appointments?.filter((a: any) => a.status === 'cancelled').length ?? 0,
    completedAppointments: appointments?.filter((a: any) => a.status === 'completed').length ?? 0,
    noShowAppointments: appointments?.filter((a: any) => a.status === 'no_show').length ?? 0,
    todayAppointments: appointments?.filter((a: any) => {
      const startTime = new Date(a.start_time)
      return startTime >= today && startTime < tomorrow
    }).length ?? 0,
    upcomingThisWeek: appointments?.filter((a: any) => {
      const startTime = new Date(a.start_time)
      return startTime >= today && startTime < weekFromNow && a.status !== 'cancelled'
    }).length ?? 0,
    totalServices: 0,
    activeServices: 0,
    totalStaff: 0,
    activeStaff: 0
  }
  
  // Get service counts
  const { data: services } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .select('id, is_active')
    .eq('site_id', siteId)
  
  stats.totalServices = services?.length ?? 0
  stats.activeServices = services?.filter((s: any) => s.is_active).length ?? 0
  
  // Get staff counts
  const { data: staff } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .select('id, is_active')
    .eq('site_id', siteId)
  
  stats.totalStaff = staff?.length ?? 0
  stats.activeStaff = staff?.filter((s: any) => s.is_active).length ?? 0
  
  return stats
}

// =============================================================================
// SEARCH ACTION
// =============================================================================

export async function searchBookings(
  siteId: string,
  query: string
): Promise<{
  appointments: Appointment[]
  services: Service[]
  staff: Staff[]
}> {
  const supabase = await getModuleClient()
  const searchQuery = `%${query.toLowerCase()}%`
  
  // Search appointments by customer name or email
  const { data: appointments } = await supabase
    .from(`${TABLE_PREFIX}_appointments`)
    .select(`
      *,
      service:${TABLE_PREFIX}_services(*),
      staff:${TABLE_PREFIX}_staff(*)
    `)
    .eq('site_id', siteId)
    .or(`customer_name.ilike.${searchQuery},customer_email.ilike.${searchQuery}`)
    .limit(10)
  
  // Search services by name
  const { data: services } = await supabase
    .from(`${TABLE_PREFIX}_services`)
    .select('*')
    .eq('site_id', siteId)
    .ilike('name', searchQuery)
    .limit(10)
  
  // Search staff by name or email
  const { data: staff } = await supabase
    .from(`${TABLE_PREFIX}_staff`)
    .select('*')
    .eq('site_id', siteId)
    .or(`name.ilike.${searchQuery},email.ilike.${searchQuery}`)
    .limit(10)
  
  return {
    appointments: (appointments || []) as Appointment[],
    services: (services || []) as Service[],
    staff: (staff || []) as Staff[]
  }
}

// =============================================================================
// INITIALIZE BOOKING FOR SITE
// =============================================================================

export async function initializeBookingForSite(siteId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  // Check if settings exist
  const existingSettings = await getSettings(siteId)
  
  if (!existingSettings) {
    // Create default settings
    await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .insert({
        site_id: siteId,
        currency: DEFAULT_CURRENCY,
        timezone: DEFAULT_TIMEZONE,
        date_format: 'YYYY-MM-DD',
        time_format: '12h',
        min_booking_notice_hours: 24,
        max_booking_advance_days: 90,
        cancellation_notice_hours: 24,
        slot_interval_minutes: 30,
        reminder_hours: [24, 1],
        auto_confirm: false,
        confirmation_email_enabled: true,
        accent_color: '#3B82F6',
        require_payment: false,
        auto_create_crm_contact: true
      })
    
    console.log(`[Booking] Initialized settings for site ${siteId}`)
  }
}
