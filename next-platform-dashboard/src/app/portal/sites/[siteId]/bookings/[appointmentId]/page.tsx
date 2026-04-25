import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import {
  createPortalDAL,
  PortalAccessDeniedError,
} from "@/lib/portal/data-access";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { BookingDetailClient } from "./booking-detail-client";

export const metadata: Metadata = {
  title: "Booking | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string; appointmentId: string }>;
}

export default async function PortalBookingDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, appointmentId } = await params;
  await verifyPortalModuleAccess(user, siteId, "booking", "canManageBookings");

  return (
    <Suspense fallback={<PortalPanelSkeleton rows={8} />}>
      <BookingLoader siteId={siteId} appointmentId={appointmentId} />
    </Suspense>
  );
}

async function BookingLoader({
  siteId,
  appointmentId,
}: {
  siteId: string;
  appointmentId: string;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const booking = await dal.bookings.detail(siteId, appointmentId);
    return <BookingDetailClient siteId={siteId} booking={booking} />;
  } catch (err) {
    if (
      err instanceof PortalAccessDeniedError &&
      err.code === "site_not_found"
    ) {
      notFound();
    }
    return (
      <PortalErrorState
        title="Couldn’t load booking"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
