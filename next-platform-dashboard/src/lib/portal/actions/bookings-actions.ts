"use server";

/**
 * Portal Bookings — server actions (Session 6A).
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import type { PortalAppointmentStatus } from "@/lib/portal/commerce-data-access";

export type BookingActionResult = { ok: true } | { ok: false; error: string };

async function dal() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  return createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
}

const ALLOWED_STATUSES: readonly PortalAppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
];

function isValidIsoDate(value: string): boolean {
  const t = Date.parse(value);
  return Number.isFinite(t);
}

export async function updateBookingStatusAction(input: {
  siteId: string;
  appointmentId: string;
  status: PortalAppointmentStatus;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
}): Promise<BookingActionResult> {
  try {
    if (!ALLOWED_STATUSES.includes(input.status)) {
      return { ok: false, error: "Invalid status." };
    }
    if (input.status === "rescheduled") {
      if (!input.startsAt || !input.endsAt) {
        return {
          ok: false,
          error: "Rescheduling requires new start and end times.",
        };
      }
      if (!isValidIsoDate(input.startsAt) || !isValidIsoDate(input.endsAt)) {
        return { ok: false, error: "Invalid start or end time." };
      }
      if (Date.parse(input.endsAt) <= Date.parse(input.startsAt)) {
        return { ok: false, error: "End time must be after start time." };
      }
    }
    const d = await dal();
    await d.bookings.updateStatus(input.siteId, input.appointmentId, {
      status: input.status,
      reason: input.reason?.trim() || undefined,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
    revalidatePath(`/portal/sites/${input.siteId}/bookings`);
    revalidatePath(
      `/portal/sites/${input.siteId}/bookings/${input.appointmentId}`,
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update booking.",
    };
  }
}
