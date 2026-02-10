import { getPortalSession } from "@/lib/portal/portal-auth";
import { getClientInfo } from "@/lib/portal/portal-service";
import { getUnreadNotificationCount } from "@/lib/portal/notification-service";
import { getTicketStats } from "@/lib/portal/support-service";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalLayoutClient } from "@/components/portal/portal-layout-client";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { ServerBrandingStyle } from "@/components/providers/server-branding-style";
import { getAgencyBranding, getAgencyBrandingBySlug } from "@/lib/queries/branding";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();
  
  if (!session.user) {
    // For login page: try to get agency branding from URL search params
    // Portal login URLs can include ?agency=slug for branding
    const headersList = await headers();
    const url = headersList.get("x-url") || headersList.get("referer") || "";
    const urlObj = url ? (() => { try { return new URL(url); } catch { return null; } })() : null;
    const agencySlug = urlObj?.searchParams?.get("agency") || null;

    if (agencySlug) {
      const branding = await getAgencyBrandingBySlug(agencySlug);
      if (branding) {
        return (
          <>
            <ServerBrandingStyle branding={branding} />
            <BrandingProvider agencyId={branding.agency_id} initialBranding={branding}>
              {children}
            </BrandingProvider>
          </>
        );
      }
    }

    return children;
  }

  const [clientInfo, unreadCount, ticketStats] = await Promise.all([
    getClientInfo(session.user.clientId),
    session.isImpersonating ? Promise.resolve(0) : getUnreadNotificationCount(session.user.clientId),
    getTicketStats(session.user.clientId),
  ]);

  const openTicketCount = ticketStats.open + ticketStats.inProgress;
  const agencyId = clientInfo?.agencyId;

  // Server-side branding fetch — eliminates color flash on portal load
  // Same pattern as dashboard layout: SSR inject CSS vars before hydration
  const initialBranding = agencyId ? await getAgencyBranding(agencyId) : null;

  const portalContent = (
    <PortalLayoutClient
      user={session.user}
      openTicketCount={openTicketCount}
      isImpersonating={session.isImpersonating}
      headerComponent={
        <PortalHeader 
          user={session.user}
          agencyName={clientInfo?.agencyName || "Agency"}
          isImpersonating={session.isImpersonating}
          impersonatorEmail={session.impersonatorEmail || undefined}
          clientName={session.user.fullName}
          unreadNotifications={unreadCount}
        />
      }
    >
      {children}
    </PortalLayoutClient>
  );

  return agencyId ? (
    <>
      <ServerBrandingStyle branding={initialBranding} />
      <BrandingProvider agencyId={agencyId} initialBranding={initialBranding}>
        {portalContent}
      </BrandingProvider>
    </>
  ) : (
    portalContent
  );
}
