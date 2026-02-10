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
 */
export async function getPublicAvailableSlots(
  siteId: string,
  serviceId: string,
  date: Date,
  staffId?: string
): Promise<TimeSlot[]> {
  try {
    const supabase = getPublicClient()
    
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
    
    // 2. Get settings for slot interval
    const settings = await getPublicSettings(siteId)
    const slotInterval = settings?.slot_interval_minutes ?? 30
    
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
    
    // 6. Get existing appointments for conflict checking
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
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
    const totalMinutes = duration + bufferBefore + bufferAfter
    
    const rules = (availabilityRules && availabilityRules.length > 0)
      ? availabilityRules
      : [{ start_time: '09:00', end_time: '17:00', staff_id: null }]
    
    for (const rule of rules) {
      const ruleStaffId = rule.staff_id
      if (ruleStaffId && !staffIds.includes(ruleStaffId)) continue
      if (!rule.start_time || !rule.end_time) continue
      
      const startTime = parseTime(rule.start_time, date)
      const endTime = parseTime(rule.end_time, date)
      
      let slotStart = new Date(startTime)
      
      while (slotStart.getTime() + totalMinutes * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)
        
        const isBlocked = (blockedRules ?? []).some((block: any) => {
          if (!block.start_time || !block.end_time) return false
          const blockStart = parseTime(block.start_time, date)
          const blockEnd = parseTime(block.end_time, date)
          return slotStart >= blockStart && slotStart < blockEnd
        })
        
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
          staffId: ruleStaffId || staffIds[0],
        })
        
        slotStart = new Date(slotStart.getTime() + slotInterval * 60000)
      }
    }
    
    // Deduplicate by start time and return only available
    const seen = new Set<string>()
    return slots.filter(s => {
      const key = s.start.toISOString()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (err) {
    console.error('[Booking Public] getPublicAvailableSlots unexpected error:', err)
    return []
  }
}

/**
 * Create an appointment (public-facing)
 * This is the only WRITE operation exposed publicly.
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
    
    // Verify service exists and is bookable
    const { data: service } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('id, name, price, duration_minutes, currency, require_confirmation')
      .eq('site_id', siteId)
      .eq('id', input.serviceId)
      .eq('is_active', true)
      .eq('allow_online_booking', true)
      .single()
    
    if (!service) {
      return { success: false, error: 'Service not available for online booking' }
    }
    
    // Check for conflicts (only check same staff if staffId provided)
    let conflictQuery = supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('id')
      .eq('site_id', siteId)
      .neq('status', 'cancelled')
      .lt('start_time', input.endTime.toISOString())
      .gt('end_time', input.startTime.toISOString())
    
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
      serviceDuration: service.duration || 30,
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

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}
