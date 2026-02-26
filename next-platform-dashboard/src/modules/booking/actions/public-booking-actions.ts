/**
 * PUBLIC Booking Module Server Actions
 * 
 * These server actions use the ADMIN client (service role) to bypass RLS.
 * They are used by public-facing booking components on published sites
 * where visitors are NOT authenticated.
 * 
 * SECURITY: These only perform READ operations + appointment creation.
 * They are scoped to a specific siteId and only return public-safe data.
 * 
 * The authenticated actions in booking-actions.ts remain for dashboard use.
 */
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewBooking } from '@/lib/services/business-notifications'
import type {
  Service,
  Staff,
  TimeSlot,
  BookingSettings,
} from '../types/booking-types'

// =============================================================================
// SCHEMA HELPERS
// =============================================================================

const BOOKING_SHORT_ID = 'bookmod01'
const TABLE_PREFIX = `mod_${BOOKING_SHORT_ID}`

/** Admin client for public-facing reads — bypasses RLS */
function getPublicClient() {
  return createAdminClient() as any
}

// =============================================================================
// PUBLIC READ ACTIONS
// =============================================================================

/**
 * Get bookable services for a site (public-facing)
 * Only returns active services that allow online booking.
 */
export async function getPublicServices(siteId: string): Promise<Service[]> {
  try {
    const supabase = getPublicClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .eq('allow_online_booking', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('[Booking Public] getPublicServices error:', error)
      return [] // Graceful fallback — never throw on public pages
    }
    
    return (data || []) as Service[]
  } catch (err) {
    console.error('[Booking Public] getPublicServices unexpected error:', err)
    return []
  }
}

/**
 * Get staff members for a site (public-facing)
 * Only returns active staff who accept bookings.
 */
export async function getPublicStaff(siteId: string): Promise<Staff[]> {
  try {
    const supabase = getPublicClient()
    
    // Fetch active, booking-accepting staff
    const { data: staffData, error: staffError } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .eq('accept_bookings', true)
      .order('name', { ascending: true })
    
    if (staffError) {
      console.error('[Booking Public] getPublicStaff error:', staffError)
      return []
    }
    
    if (!staffData || staffData.length === 0) return []
    
    // Fetch staff-service assignments
    const { data: assignmentsData } = await supabase
      .from(`${TABLE_PREFIX}_staff_services`)
      .select('staff_id, service_id, custom_price, custom_duration_minutes')
      .eq('site_id', siteId)
    
    // Fetch services for enrichment
    const { data: servicesData } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    // Create staff→services map
    const staffServicesMap = new Map<string, Service[]>()
    if (assignmentsData && servicesData) {
      const servicesById = new Map(servicesData.map((s: any) => [s.id, s]))
      assignmentsData.forEach((a: any) => {
        const service = servicesById.get(a.service_id)
        if (service) {
          const list = staffServicesMap.get(a.staff_id) || []
          list.push(service as Service)
          staffServicesMap.set(a.staff_id, list)
        }
      })
    }
    
    return staffData.map((staff: any) => ({
      ...staff,
      services: staffServicesMap.get(staff.id) || [],
    })) as Staff[]
  } catch (err) {
    console.error('[Booking Public] getPublicStaff unexpected error:', err)
    return []
  }
}

/**
 * Get booking settings for a site (public-facing)
 */
export async function getPublicSettings(siteId: string): Promise<BookingSettings | null> {
  try {
    const supabase = getPublicClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[Booking Public] getPublicSettings error:', error)
      return null
    }
    
    return data as BookingSettings
  } catch (err) {
    console.error('[Booking Public] getPublicSettings unexpected error:', err)
    return null
  }
}

/**
 * Get available time slots for a service/date (public-facing)
 * This is the most complex operation — calculates availability from rules,
 * existing appointments, and staff schedules.
 * 
 * Enforces:
 * - Past dates return empty
 * - min_booking_notice_hours: filters out slots too close to now
 * - max_booking_advance_days: rejects dates too far in the future
 * - Weekday-aware default fallback (Mon-Fri 9-5 when no rules)
 * - Buffer times around existing appointments
 * 
 * TIMEZONE FIX: Accepts a YYYY-MM-DD date string instead of a Date object.
 * All internal dates use Date.UTC() so the calendar date is never shifted
 * by timezone conversion (the root cause of the double-booking bug).
 */
export async function getPublicAvailableSlots(
  siteId: string,
  serviceId: string,
  dateStr: string,   // YYYY-MM-DD — no timezone ambiguity
  staffId?: string
): Promise<TimeSlot[]> {
  try {
    const supabase = getPublicClient()
    
    // === PARSE DATE STRING INTO UTC COMPONENTS ===
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) {
      console.error('[Booking Public] Invalid date string:', dateStr)
      return []
    }
    
    // All date construction uses Date.UTC() — no timezone shift possible
    const requestedDate = new Date(Date.UTC(year, month - 1, day))
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    
    // === SERVER-SIDE DATE VALIDATION ===
    const now = new Date()
    // Build "today" in UTC for comparison
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    
    // Reject past dates (lenient: allow today even if server is ahead)
    if (requestedDate < todayUTC) {
      return []
    }
    
    // 1. Get service details
    const { data: serviceData, error: serviceError } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('*')
      .eq('site_id', siteId)
      .eq('id', serviceId)
      .eq('is_active', true)
      .single()
    
    if (serviceError || !serviceData) {
      console.error('[Booking Public] Service not found:', serviceId, serviceError)
      return []
    }
    
    const service = serviceData as Service
    
    // 2. Get settings for slot interval, notice hours, max advance days
    const settings = await getPublicSettings(siteId)
    const slotInterval = settings?.slot_interval_minutes ?? 30
    const minNoticeHours = settings?.min_booking_notice_hours ?? 0
    const maxAdvanceDays = settings?.max_booking_advance_days ?? 365
    
    // Enforce max_booking_advance_days — reject dates too far in the future
    const maxDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000)
    if (requestedDate > maxDate) {
      return []
    }
    
    // Calculate the earliest bookable moment (now + min notice hours)
    const earliestBookableTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)
    
    // 3. Get eligible staff
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
    
    if (staffIds.length === 0) return []
    
    // 4. Get availability rules
    // Use UTC day-of-week from our constructed date (consistent with Date.UTC)
    const dayOfWeek = requestedDate.getUTCDay()
    
    const { data: availabilityRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
      .eq('rule_type', 'available')
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateStr}`)
      .order('priority', { ascending: false })
    
    // 5. Get blocked rules
    const { data: blockedRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
      .in('rule_type', ['blocked', 'holiday'])
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateStr}`)
    
    // 6. Get existing appointments for conflict checking (include buffer consideration)
    // Use the UTC day boundaries — matches how appointments are stored
    const { data: existingAppointments } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('start_time, end_time, staff_id, status')
      .eq('site_id', siteId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled')
    
    // 7. Generate slots
    const slots: TimeSlot[] = []
    const duration = service.duration_minutes
    const bufferBefore = service.buffer_before_minutes || 0
    const bufferAfter = service.buffer_after_minutes || 0
    const totalBlockedMinutes = duration + bufferBefore + bufferAfter
    
    // Weekday-aware fallback: Mon-Fri (1-5) get 9-5, weekends (0,6) get nothing
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
    const rules = (availabilityRules && availabilityRules.length > 0)
      ? availabilityRules
      : isWeekday
        ? [{ start_time: '09:00', end_time: '17:00', staff_id: null }]
        : [] // No default slots for weekends — return empty
    
    // If no rules apply (weekend with no explicit availability), return empty
    if (rules.length === 0) return []
    
    for (const rule of rules) {
      const ruleStaffId = rule.staff_id
      if (ruleStaffId && !staffIds.includes(ruleStaffId)) continue
      if (!rule.start_time || !rule.end_time) continue
      
      const startTime = parseTimeUTC(rule.start_time, year, month - 1, day)
      const endTime = parseTimeUTC(rule.end_time, year, month - 1, day)
      
      let slotStart = new Date(startTime)
      
      while (slotStart.getTime() + totalBlockedMinutes * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)
        // The full blocked window includes buffers
        const blockedStart = new Date(slotStart.getTime() - bufferBefore * 60000)
        const blockedEnd = new Date(slotEnd.getTime() + bufferAfter * 60000)
        
        const isBlocked = (blockedRules ?? []).some((block: any) => {
          if (!block.start_time || !block.end_time) return false
          const blockStart = parseTimeUTC(block.start_time, year, month - 1, day)
          const blockEnd = parseTimeUTC(block.end_time, year, month - 1, day)
          return slotStart >= blockStart && slotStart < blockEnd
        })
        
        // Check conflict with buffer times — existing appointments block
        // the window [apt.start - bufferBefore, apt.end + bufferAfter]
        const hasConflict = (existingAppointments ?? []).some((apt: any) => {
          if (ruleStaffId && apt.staff_id !== ruleStaffId) return false
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)
          // Does this slot (with its buffers) overlap with the appointment?
          return blockedStart < aptEnd && blockedEnd > aptStart
        })
        
        // Enforce min_booking_notice_hours — filter out slots too close to now
        const isTooSoon = slotStart < earliestBookableTime
        
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          available: !isBlocked && !hasConflict && !isTooSoon,
          staffId: ruleStaffId || staffIds[0],
        })
        
        slotStart = new Date(slotStart.getTime() + slotInterval * 60000)
      }
    }
    
    // Deduplicate by start time — when multiple staff generate the same time,
    // keep the slot as AVAILABLE if ANY staff member has it available.
    // This prevents random availability when processing order differs.
    const slotMap = new Map<string, TimeSlot>()
    for (const s of slots) {
      const key = s.start.toISOString()
      const existing = slotMap.get(key)
      if (!existing) {
        slotMap.set(key, s)
      } else if (s.available && !existing.available) {
        // Prefer the available version — at least one staff is free
        slotMap.set(key, s)
      }
    }
    return Array.from(slotMap.values())
  } catch (err) {
    console.error('[Booking Public] getPublicAvailableSlots unexpected error:', err)
    return []
  }
}

/**
 * Create an appointment (public-facing)
 * This is the only WRITE operation exposed publicly.
 * 
 * Server-side validations:
 * - Service must be active and bookable
 * - Start time must be in the future
 * - Start time must respect min_booking_notice_hours
 * - Start time must be within max_booking_advance_days
 * - No double-booking conflicts (with buffer times)
 */
export async function createPublicAppointment(
  siteId: string,
  input: {
    serviceId: string
    staffId?: string
    startTime: Date
    endTime: Date
    customerName: string
    customerEmail: string
    customerPhone?: string
    notes?: string
  }
): Promise<{ success: boolean; appointmentId?: string; status?: string; error?: string }> {
  try {
    const supabase = getPublicClient()
    
    // === SERVER-SIDE VALIDATION ===
    const now = new Date()
    const startTime = new Date(input.startTime)
    const endTime = new Date(input.endTime)
    
    // Reject bookings in the past
    if (startTime <= now) {
      return { success: false, error: 'Cannot book appointments in the past' }
    }
    
    // Verify service exists and is bookable
    const { data: service } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('id, name, price, duration_minutes, currency, require_confirmation, buffer_before_minutes, buffer_after_minutes')
      .eq('site_id', siteId)
      .eq('id', input.serviceId)
      .eq('is_active', true)
      .eq('allow_online_booking', true)
      .single()
    
    if (!service) {
      return { success: false, error: 'Service not available for online booking' }
    }
    
    // Get settings for validation
    const settings = await getPublicSettings(siteId)
    const minNoticeHours = settings?.min_booking_notice_hours ?? 0
    const maxAdvanceDays = settings?.max_booking_advance_days ?? 365
    
    // Enforce min_booking_notice_hours
    if (minNoticeHours > 0) {
      const earliestAllowed = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)
      if (startTime < earliestAllowed) {
        return { success: false, error: `Bookings require at least ${minNoticeHours} hours advance notice` }
      }
    }
    
    // Enforce max_booking_advance_days
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
    maxDate.setHours(23, 59, 59, 999)
    if (startTime > maxDate) {
      return { success: false, error: `Cannot book more than ${maxAdvanceDays} days in advance` }
    }
    
    // Check for conflicts with buffer times
    const bufferBefore = service.buffer_before_minutes || 0
    const bufferAfter = service.buffer_after_minutes || 0
    const blockedStart = new Date(startTime.getTime() - bufferBefore * 60000)
    const blockedEnd = new Date(endTime.getTime() + bufferAfter * 60000)
    
    let conflictQuery = supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('id')
      .eq('site_id', siteId)
      .neq('status', 'cancelled')
      .lt('start_time', blockedEnd.toISOString())
      .gt('end_time', blockedStart.toISOString())
    
    if (input.staffId) {
      conflictQuery = conflictQuery.eq('staff_id', input.staffId)
    }
    
    const { data: conflicts } = await conflictQuery
    
    if (conflicts && conflicts.length > 0) {
      return { success: false, error: 'This time slot is no longer available' }
    }
    
    // Create the appointment
    const status = service.require_confirmation ? 'pending' : 'confirmed'
    
    const { data: appointment, error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .insert({
        site_id: siteId,
        service_id: input.serviceId,
        staff_id: input.staffId || null,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        status,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone || null,
        customer_notes: input.notes || null,
        metadata: { source: 'online' },
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('[Booking Public] createPublicAppointment error:', error)
      // Handle unique constraint violation from idx_prevent_double_booking
      // This catches the race condition where two requests pass the conflict
      // check simultaneously but the DB index prevents the second insert.
      if (error.code === '23505') {
        return { success: false, error: 'This time slot is no longer available. Please select another time.' }
      }
      return { success: false, error: 'Failed to create appointment. Please try again.' }
    }
    
    // Get staff name if assigned
    let staffName: string | undefined
    if (input.staffId) {
      const { data: staff } = await supabase
        .from(`${TABLE_PREFIX}_staff`)
        .select('name')
        .eq('id', input.staffId)
        .single()
      staffName = staff?.name
    }

    // Send notifications to business owner + customer (async, non-blocking)
    notifyNewBooking({
      siteId,
      appointmentId: appointment?.id || '',
      serviceName: service.name || 'Service',
      servicePrice: service.price || 0,
      serviceDuration: service.duration_minutes || 30,
      staffName,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      startTime: input.startTime,
      endTime: input.endTime,
      status: status as 'pending' | 'confirmed',
      currency: service.currency,
    }).catch(err => console.error('[Booking Public] Notification error:', err))
    
    return { success: true, appointmentId: appointment?.id, status }
  } catch (err) {
    console.error('[Booking Public] createPublicAppointment unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse a time string (HH:MM) into a UTC Date for the given date components.
 * Uses Date.UTC() to avoid any timezone ambiguity.
 */
function parseTimeUTC(timeStr: string, year: number, month: number, day: number): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(Date.UTC(year, month, day, hours, minutes, 0, 0))
}
