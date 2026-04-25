/**
 * Portal Bookings — portal-first list page (Session 6A).
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL } from "@/lib/portal/data-access";
import { PageHeader } from "@/components/layout/page-header";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { BookingsListClient } from "./bookings-list-client";
import { BookingsCalendarView } from "./bookings-calendar-view";
import type {
  PortalAppointmentStatus,
  PortalBookingListFilter,
} from "@/lib/portal/commerce-data-access";

export const metadata: Metadata = {
  title: "Bookings | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<{
    status?: string;
    from?: string;
    to?: string;
    page?: string;
    view?: string;
    month?: string;
  }>;
}

const PAGE_SIZE = 25;
const BOOKING_STATUS_VALUES = new Set<string>([
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
]);

function sanitiseIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const t = Date.parse(value);
  return Number.isFinite(t) ? value : undefined;
}

export default async function PortalBookingsPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const sp = (await searchParams) ?? {};

  await verifyPortalModuleAccess(user, siteId, "booking", "canManageBookings");

  const view = sp.view === "calendar" ? "calendar" : "list";
  const statusRaw =
    sp.status && BOOKING_STATUS_VALUES.has(sp.status) ? sp.status : "all";
  const status = statusRaw as PortalAppointmentStatus | "all";
  const from = sanitiseIsoDate(sp.from);
  const to = sanitiseIsoDate(sp.to);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  // Calendar mode: ignore pagination and filter to the visible month
  const monthParam = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  let calendarFrom: string | undefined;
  let calendarTo: string | undefined;
  if (view === "calendar") {
    const ref = monthParam
      ? new Date(
          parseInt(monthParam.slice(0, 4), 10),
          parseInt(monthParam.slice(5, 7), 10) - 1,
          1,
        )
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    // expand to grid bounds (6 weeks)
    const gridStart = new Date(ref);
    gridStart.setDate(gridStart.getDate() - ref.getDay());
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridEnd.getDate() + 41);
    calendarFrom = gridStart.toISOString();
    calendarTo = gridEnd.toISOString();
  }

  const filter: PortalBookingListFilter =
    view === "calendar"
      ? {
          status,
          from: calendarFrom,
          to: calendarTo,
          limit: 200,
          offset: 0,
        }
      : {
          status,
          from,
          to,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="View and manage appointments across services and staff"
      />
      <Suspense fallback={<PortalPanelSkeleton rows={6} />}>
        <BookingsLoader
          siteId={siteId}
          filter={filter}
          page={page}
          activeStatus={statusRaw}
          activeFrom={from ?? ""}
          activeTo={to ?? ""}
          view={view}
          month={monthParam}
        />
      </Suspense>
    </div>
  );
}

async function BookingsLoader({
  siteId,
  filter,
  page,
  activeStatus,
  activeFrom,
  activeTo,
  view,
  month,
}: {
  siteId: string;
  filter: PortalBookingListFilter;
  page: number;
  activeStatus: string;
  activeFrom: string;
  activeTo: string;
  view: "list" | "calendar";
  month: string | null;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const bookings = await dal.bookings.list(siteId, filter);
    if (view === "calendar") {
      return (
        <BookingsCalendarView
          siteId={siteId}
          bookings={bookings}
          initialMonth={month ?? undefined}
        />
      );
    }
    const hasMore = bookings.length === (filter.limit ?? PAGE_SIZE);
    return (
      <BookingsListClient
        siteId={siteId}
        bookings={bookings}
        currentPage={page}
        pageSize={filter.limit ?? PAGE_SIZE}
        hasMore={hasMore}
        activeStatus={activeStatus}
        activeFrom={activeFrom}
        activeTo={activeTo}
      />
    );
  } catch (err) {
    return (
      <PortalErrorState
        title="Couldn’t load bookings"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
