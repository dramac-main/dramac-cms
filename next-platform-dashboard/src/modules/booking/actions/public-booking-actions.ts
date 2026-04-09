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
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { formatDate, formatTime, DEFAULT_CURRENCY } from "@/lib/locale-config";
import type {
  Service,
  Staff,
  TimeSlot,
  BookingSettings,
} from "../types/booking-types";

// =============================================================================
// SCHEMA HELPERS
// =============================================================================

const BOOKING_SHORT_ID = "bookmod01";
const TABLE_PREFIX = `mod_${BOOKING_SHORT_ID}`;

/** Admin client for public-facing reads — bypasses RLS */
function getPublicClient() {
  return createAdminClient() as any;
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
    const supabase = getPublicClient();

    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select("*")
      .eq("site_id", siteId)
      .eq("is_active", true)
      .eq("allow_online_booking", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[Booking Public] getPublicServices error:", error);
      return []; // Graceful fallback — never throw on public pages
    }

    return (data || []) as Service[];
  } catch (err) {
    console.error("[Booking Public] getPublicServices unexpected error:", err);
    return [];
  }
}

/**
 * Get staff members for a site (public-facing)
 * Only returns active staff who accept bookings.
 */
export async function getPublicStaff(siteId: string): Promise<Staff[]> {
  try {
    const supabase = getPublicClient();

    // Fetch active, booking-accepting staff
    const { data: staffData, error: staffError } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .select("*")
      .eq("site_id", siteId)
      .eq("is_active", true)
      .eq("accept_bookings", true)
      .order("name", { ascending: true });

    if (staffError) {
      console.error("[Booking Public] getPublicStaff error:", staffError);
      return [];
    }

    if (!staffData || staffData.length === 0) return [];

    // Fetch staff-service assignments
    const { data: assignmentsData } = await supabase
      .from(`${TABLE_PREFIX}_staff_services`)
      .select("staff_id, service_id, custom_price, custom_duration_minutes")
      .eq("site_id", siteId);

    // Fetch services for enrichment
    const { data: servicesData } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select("*")
      .eq("site_id", siteId)
      .eq("is_active", true);

    // Create staff→services map
    const staffServicesMap = new Map<string, Service[]>();
    if (assignmentsData && servicesData) {
      const servicesById = new Map(servicesData.map((s: any) => [s.id, s]));
      assignmentsData.forEach((a: any) => {
        const service = servicesById.get(a.service_id);
        if (service) {
          const list = staffServicesMap.get(a.staff_id) || [];
          list.push(service as Service);
          staffServicesMap.set(a.staff_id, list);
        }
      });
    }

    return staffData.map((staff: any) => ({
      ...staff,
      services: staffServicesMap.get(staff.id) || [],
    })) as Staff[];
  } catch (err) {
    console.error("[Booking Public] getPublicStaff unexpected error:", err);
    return [];
  }
}

/**
 * Get booking settings for a site (public-facing)
 */
export async function getPublicSettings(
  siteId: string,
): Promise<BookingSettings | null> {
  try {
    const supabase = getPublicClient();

    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select("*")
      .eq("site_id", siteId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("[Booking Public] getPublicSettings error:", error);
      return null;
    }

    return data as BookingSettings;
  } catch (err) {
    console.error("[Booking Public] getPublicSettings unexpected error:", err);
    return null;
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
  dateStr: string, // YYYY-MM-DD — no timezone ambiguity
  staffId?: string,
): Promise<TimeSlot[]> {
  try {
    const supabase = getPublicClient();

    // === PARSE DATE STRING INTO UTC COMPONENTS ===
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) {
      console.error("[Booking Public] Invalid date string:", dateStr);
      return [];
    }

    // All date construction uses Date.UTC() — no timezone shift possible
    const requestedDate = new Date(Date.UTC(year, month - 1, day));
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // === SERVER-SIDE DATE VALIDATION ===
    const now = new Date();
    // Build "today" in UTC for comparison
    const todayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    // Reject past dates (lenient: allow today even if server is ahead)
    if (requestedDate < todayUTC) {
      return [];
    }

    // 1. Get service details
    const { data: serviceData, error: serviceError } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select("*")
      .eq("site_id", siteId)
      .eq("id", serviceId)
      .eq("is_active", true)
      .single();

    if (serviceError || !serviceData) {
      console.error(
        "[Booking Public] Service not found:",
        serviceId,
        serviceError,
      );
      return [];
    }

    const service = serviceData as Service;

    // 2. Get settings for slot interval, notice hours, max advance days
    const settings = await getPublicSettings(siteId);
    const slotInterval = settings?.slot_interval_minutes ?? 30;
    const minNoticeHours = settings?.min_booking_notice_hours ?? 0;
    const maxAdvanceDays = settings?.max_booking_advance_days ?? 365;

    // Enforce max_booking_advance_days — reject dates too far in the future
    const maxDate = new Date(
      now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000,
    );
    if (requestedDate > maxDate) {
      return [];
    }

    // Calculate the earliest bookable moment (now + min notice hours)
    const earliestBookableTime = new Date(
      now.getTime() + minNoticeHours * 60 * 60 * 1000,
    );

    // 3. Get eligible staff
    let staffIds: string[] = [];

    if (staffId) {
      staffIds = [staffId];
    } else {
      const { data: staffServices } = await supabase
        .from(`${TABLE_PREFIX}_staff_services`)
        .select("staff_id")
        .eq("site_id", siteId)
        .eq("service_id", serviceId);

      staffIds =
        staffServices?.map((ss: { staff_id: string }) => ss.staff_id) ?? [];

      if (staffIds.length === 0) {
        const { data: allStaff } = await supabase
          .from(`${TABLE_PREFIX}_staff`)
          .select("id")
          .eq("site_id", siteId)
          .eq("is_active", true)
          .eq("accept_bookings", true);

        staffIds = allStaff?.map((s: { id: string }) => s.id) ?? [];
      }
    }

    if (staffIds.length === 0) return [];

    // 4. Get availability rules
    // Use UTC day-of-week from our constructed date (consistent with Date.UTC)
    const dayOfWeek = requestedDate.getUTCDay();

    const { data: availabilityRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select("*")
      .eq("site_id", siteId)
      .eq("rule_type", "available")
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateStr}`)
      .order("priority", { ascending: false });

    // 5. Get blocked rules
    const { data: blockedRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select("*")
      .eq("site_id", siteId)
      .in("rule_type", ["blocked", "holiday"])
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateStr}`);

    // 6. Get existing appointments for conflict checking (include buffer consideration)
    // Use the UTC day boundaries — matches how appointments are stored
    const { data: existingAppointments } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select("start_time, end_time, staff_id, status")
      .eq("site_id", siteId)
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString())
      .neq("status", "cancelled");

    // 7. Generate slots
    const slots: TimeSlot[] = [];
    const duration = service.duration_minutes;
    const bufferBefore = service.buffer_before_minutes || 0;
    const bufferAfter = service.buffer_after_minutes || 0;
    const totalBlockedMinutes = duration + bufferBefore + bufferAfter;

    // Weekday-aware fallback: Mon-Fri (1-5) get 9-5, weekends (0,6) get nothing
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const rules =
      availabilityRules && availabilityRules.length > 0
        ? availabilityRules
        : isWeekday
          ? [{ start_time: "09:00", end_time: "17:00", staff_id: null }]
          : []; // No default slots for weekends — return empty

    // If no rules apply (weekend with no explicit availability), return empty
    if (rules.length === 0) return [];

    for (const rule of rules) {
      const ruleStaffId = rule.staff_id;
      if (ruleStaffId && !staffIds.includes(ruleStaffId)) continue;
      if (!rule.start_time || !rule.end_time) continue;

      const startTime = parseTimeUTC(rule.start_time, year, month - 1, day);
      const endTime = parseTimeUTC(rule.end_time, year, month - 1, day);

      let slotStart = new Date(startTime);

      while (
        slotStart.getTime() + totalBlockedMinutes * 60000 <=
        endTime.getTime()
      ) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        // The full blocked window includes buffers
        const blockedStart = new Date(
          slotStart.getTime() - bufferBefore * 60000,
        );
        const blockedEnd = new Date(slotEnd.getTime() + bufferAfter * 60000);

        const isBlocked = (blockedRules ?? []).some((block: any) => {
          if (!block.start_time || !block.end_time) return false;
          const blockStart = parseTimeUTC(
            block.start_time,
            year,
            month - 1,
            day,
          );
          const blockEnd = parseTimeUTC(block.end_time, year, month - 1, day);
          return slotStart >= blockStart && slotStart < blockEnd;
        });

        // Check conflict with buffer times — existing appointments block
        // the window [apt.start - bufferBefore, apt.end + bufferAfter]
        const hasConflict = (existingAppointments ?? []).some((apt: any) => {
          if (ruleStaffId && apt.staff_id !== ruleStaffId) return false;
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          // Does this slot (with its buffers) overlap with the appointment?
          return blockedStart < aptEnd && blockedEnd > aptStart;
        });

        // Enforce min_booking_notice_hours — filter out slots too close to now
        const isTooSoon = slotStart < earliestBookableTime;

        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          available: !isBlocked && !hasConflict && !isTooSoon,
          staffId: ruleStaffId || staffIds[0],
        });

        slotStart = new Date(slotStart.getTime() + slotInterval * 60000);
      }
    }

    // Deduplicate by start time — when multiple staff generate the same time,
    // keep the slot as AVAILABLE if ANY staff member has it available.
    // This prevents random availability when processing order differs.
    const slotMap = new Map<string, TimeSlot>();
    for (const s of slots) {
      const key = s.start.toISOString();
      const existing = slotMap.get(key);
      if (!existing) {
        slotMap.set(key, s);
      } else if (s.available && !existing.available) {
        // Prefer the available version — at least one staff is free
        slotMap.set(key, s);
      }
    }
    return Array.from(slotMap.values());
  } catch (err) {
    console.error(
      "[Booking Public] getPublicAvailableSlots unexpected error:",
      err,
    );
    return [];
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
    serviceId: string;
    staffId?: string;
    startTime: Date;
    endTime: Date;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    notes?: string;
  },
): Promise<{
  success: boolean;
  appointmentId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const supabase = getPublicClient();

    // === SERVER-SIDE VALIDATION ===
    const now = new Date();
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    // Validate required fields
    if (!input.customerName?.trim()) {
      return { success: false, error: "Customer name is required" };
    }

    // Validate email format
    if (
      !input.customerEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)
    ) {
      return { success: false, error: "A valid email address is required" };
    }

    // Validate start < end
    if (startTime >= endTime) {
      return { success: false, error: "Invalid appointment time range" };
    }

    // Reject bookings in the past
    if (startTime <= now) {
      return { success: false, error: "Cannot book appointments in the past" };
    }

    // Verify service exists and is bookable
    const { data: service } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select(
        "id, name, price, duration_minutes, currency, require_confirmation, buffer_before_minutes, buffer_after_minutes",
      )
      .eq("site_id", siteId)
      .eq("id", input.serviceId)
      .eq("is_active", true)
      .eq("allow_online_booking", true)
      .single();

    if (!service) {
      return {
        success: false,
        error: "Service not available for online booking",
      };
    }

    // Get settings for validation
    const settings = await getPublicSettings(siteId);
    const minNoticeHours = settings?.min_booking_notice_hours ?? 0;
    const maxAdvanceDays = settings?.max_booking_advance_days ?? 365;

    // Enforce min_booking_notice_hours
    if (minNoticeHours > 0) {
      const earliestAllowed = new Date(
        now.getTime() + minNoticeHours * 60 * 60 * 1000,
      );
      if (startTime < earliestAllowed) {
        return {
          success: false,
          error: `Bookings require at least ${minNoticeHours} hours advance notice`,
        };
      }
    }

    // Enforce max_booking_advance_days
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
    maxDate.setHours(23, 59, 59, 999);
    if (startTime > maxDate) {
      return {
        success: false,
        error: `Cannot book more than ${maxAdvanceDays} days in advance`,
      };
    }

    // Check for conflicts with buffer times
    const bufferBefore = service.buffer_before_minutes || 0;
    const bufferAfter = service.buffer_after_minutes || 0;
    const blockedStart = new Date(startTime.getTime() - bufferBefore * 60000);
    const blockedEnd = new Date(endTime.getTime() + bufferAfter * 60000);

    let conflictQuery = supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select("id")
      .eq("site_id", siteId)
      .neq("status", "cancelled")
      .lt("start_time", blockedEnd.toISOString())
      .gt("end_time", blockedStart.toISOString());

    if (input.staffId) {
      conflictQuery = conflictQuery.eq("staff_id", input.staffId);
    }

    const { data: conflicts } = await conflictQuery;

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: "This time slot is no longer available" };
    }

    // Create the appointment
    // auto_confirm setting overrides per-service require_confirmation
    const autoConfirm = settings?.auto_confirm ?? false;
    const status =
      autoConfirm || !service.require_confirmation ? "confirmed" : "pending";

    // Wire require_payment setting to payment_status
    const paymentStatus = settings?.require_payment
      ? "pending"
      : "not_required";
    const paymentAmount = settings?.require_payment ? service.price : null;

    const { data: appointment, error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .insert({
        site_id: siteId,
        service_id: input.serviceId,
        staff_id: input.staffId || null,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        status,
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone || null,
        customer_notes: input.notes || null,
        metadata: { source: "online" },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Booking Public] createPublicAppointment error:", error);
      // Handle unique constraint violation from idx_prevent_double_booking
      // This catches the race condition where two requests pass the conflict
      // check simultaneously but the DB index prevents the second insert.
      if (error.code === "23505") {
        return {
          success: false,
          error:
            "This time slot is no longer available. Please select another time.",
        };
      }
      return {
        success: false,
        error: "Failed to create appointment. Please try again.",
      };
    }

    // Get staff name if assigned
    let staffName: string | undefined;
    if (input.staffId) {
      const { data: staff } = await supabase
        .from(`${TABLE_PREFIX}_staff`)
        .select("name")
        .eq("id", input.staffId)
        .single();
      staffName = staff?.name;
    }

    // Emit automation event for appointment creation
    // (All notifications are handled by automation workflows — no direct calls)
    logAutomationEvent(
      siteId,
      "booking.appointment.created",
      {
        appointment_id: appointment?.id,
        service_id: input.serviceId,
        service_name: service.name,
        staff_id: input.staffId,
        staff_name: staffName,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        start_date_formatted: formatDate(input.startTime),
        start_time_formatted: formatTime(input.startTime),
        status,
        price: service.price,
        currency: service.currency,
        duration_minutes: service.duration_minutes || 30,
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: appointment?.id,
      },
    ).catch((err) =>
      console.error("[Booking Public] Automation event error:", err),
    );

    // Bridge to CRM: create contact if auto_create_crm_contact enabled (non-blocking)
    if (settings?.auto_create_crm_contact !== false) {
      import("@/modules/crm/actions/crm-bridge")
        .then(({ bridgeBookingToCRM }) =>
          bridgeBookingToCRM(siteId, {
            id: appointment?.id || "",
            customer_name: input.customerName,
            customer_email: input.customerEmail,
            customer_phone: input.customerPhone,
            service_name: service.name || "Service",
            service_price: service.price,
            currency: service.currency,
            start_time: input.startTime.toISOString(),
          }),
        )
        .catch((err) =>
          console.error("[Booking Public] CRM bridge error:", err),
        );
    }

    // Auto-create chat conversation for the booking (non-blocking)
    // Ensures a conversation exists before the customer opens the chat widget.
    // For bookings with payment required, this triggers the interactive payment flow.
    if (input.customerEmail) {
      const dateStr = formatDate(input.startTime);
      const timeStr = formatTime(input.startTime);

      import("@/modules/live-chat/lib/chat-event-bridge")
        .then(({ createConversationForEntity }) =>
          createConversationForEntity(siteId, {
            entityType: "booking",
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            bookingId: appointment?.id,
            serviceName: service.name || "Appointment",
            bookingDate: dateStr,
            bookingTime: timeStr,
            bookingStatus: status,
            paymentStatus,
            paymentAmount: paymentAmount ? String(paymentAmount) : undefined,
            currency: service.currency,
          }),
        )
        .catch((err) =>
          console.error("[Booking Public] Auto-chat creation error:", err),
        );
    }

    return {
      success: true,
      appointmentId: appointment?.id,
      status,
      paymentStatus,
      paymentAmount: paymentAmount || 0,
      currency: service.currency || DEFAULT_CURRENCY,
    };
  } catch (err) {
    console.error(
      "[Booking Public] createPublicAppointment unexpected error:",
      err,
    );
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// =============================================================================
// BOOKING PAYMENT PROOF UPLOAD
// =============================================================================

/**
 * Upload payment proof for a booking that requires advance payment.
 * Mirrors the e-commerce uploadPaymentProof() flow but for appointments.
 *
 * 1. Validates the booking exists and needs payment
 * 2. Uploads proof to payment-proofs storage bucket
 * 3. Updates appointment metadata with proof info
 * 4. Emits automation event
 * 5. Notifies business owner + chat
 */
export async function uploadBookingPaymentProof(input: {
  siteId: string;
  appointmentId: string;
  fileName: string;
  fileBase64: string;
  contentType: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getPublicClient();

    // Validate inputs
    if (!input.siteId || !input.appointmentId || !input.fileBase64) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate content type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (!allowedTypes.includes(input.contentType)) {
      return {
        success: false,
        error: "Invalid file type. Allowed: JPEG, PNG, WebP, HEIC, PDF",
      };
    }

    // Verify appointment exists, belongs to site, and payment is pending
    const { data: appointment, error: apptError } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select(
        "id, payment_status, payment_amount, customer_email, customer_name, metadata, service:mod_bookmod01_services(name, price, currency)",
      )
      .eq("id", input.appointmentId)
      .eq("site_id", input.siteId)
      .single();

    if (apptError || !appointment) {
      return { success: false, error: "Booking not found" };
    }

    if (appointment.payment_status === "paid") {
      return { success: false, error: "Payment already confirmed" };
    }

    // Decode base64 to buffer
    const fileBuffer = Buffer.from(input.fileBase64, "base64");

    // Enforce 3 MB limit
    if (fileBuffer.length > 3 * 1024 * 1024) {
      return { success: false, error: "File too large. Maximum 3 MB." };
    }

    // Determine file extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "application/pdf": "pdf",
    };
    const ext = extMap[input.contentType] || "bin";

    // Upload to payment-proofs bucket (booking sub-path)
    const storagePath = `${input.siteId}/booking-${input.appointmentId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, fileBuffer, {
        contentType: input.contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[BookingPaymentProof] Upload error:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Update appointment metadata with proof info
    const existingMetadata =
      (appointment.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      payment_proof: {
        storage_path: storagePath,
        file_name: input.fileName,
        content_type: input.contentType,
        file_size: fileBuffer.length,
        uploaded_at: new Date().toISOString(),
        status: "pending_review",
      },
    };

    await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .update({ metadata: updatedMetadata })
      .eq("id", appointment.id);

    // Emit automation event
    const serviceName = appointment.service?.name || "Appointment";
    const currency = appointment.service?.currency || DEFAULT_CURRENCY;
    const paymentAmount =
      appointment.payment_amount || appointment.service?.price || 0;

    logAutomationEvent(
      input.siteId,
      "booking.payment.proof_uploaded",
      {
        appointmentId: appointment.id,
        serviceName,
        customerEmail: appointment.customer_email,
        customerName: appointment.customer_name,
        fileName: input.fileName,
        paymentAmount,
        currency,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: appointment.id,
      },
    ).catch((err) =>
      console.error("[BookingPaymentProof] Automation event error:", err),
    );

    // Notify business owner
    try {
      const { notifyBookingPaymentProofUploaded } =
        await import("@/lib/services/business-notifications");
      await notifyBookingPaymentProofUploaded(
        input.siteId,
        serviceName,
        appointment.customer_email || "",
        appointment.customer_name || "Customer",
        `${currency} ${paymentAmount.toFixed(2)}`,
        input.fileName,
      );
    } catch (notifyErr) {
      console.error(
        "[BookingPaymentProof] Business notification error:",
        notifyErr,
      );
    }

    // Notify active chat conversation (async)
    if (appointment.customer_email) {
      import("@/modules/live-chat/lib/chat-event-bridge")
        .then(({ notifyChatBookingPaymentProofUploaded }) =>
          notifyChatBookingPaymentProofUploaded(
            input.siteId,
            appointment.customer_email,
            serviceName,
            input.fileName,
          ),
        )
        .catch((err) =>
          console.error("[BookingPaymentProof] Chat notification error:", err),
        );
    }

    return { success: true };
  } catch (error) {
    console.error("[BookingPaymentProof] Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse a time string (HH:MM) into a UTC Date for the given date components.
 * Uses Date.UTC() to avoid any timezone ambiguity.
 */
function parseTimeUTC(
  timeStr: string,
  year: number,
  month: number,
  day: number,
): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
}
