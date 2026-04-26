import { getPortalSession } from "@/lib/portal/portal-auth";
import {
  getClientInfo,
  getClientInstalledModules,
} from "@/lib/portal/portal-service";
import { getUnreadNotificationCount } from "@/lib/portal/notification-service";
import { getTicketStats } from "@/lib/portal/support-service";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalLayoutClient } from "@/components/portal/portal-layout-client";
import { PortalPushBanner } from "@/components/portal/portal-push-banner";
import { PortalCommandPalette } from "@/components/portal/portal-command-palette";
import { PwaInstallDetector } from "@/components/portal/pwa-install-detector";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { ServerBrandingStyle } from "@/components/providers/server-branding-style";
import {
  getAgencyBranding,
  getAgencyBrandingBySlug,
} from "@/lib/queries/branding";
import { resolveClientSites } from "@/lib/portal/permission-resolver";
import { resolveActiveSiteId } from "@/lib/portal/active-site";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();

  if (!session.user) {
    // Check if user is on a public portal route (login/verify).
    // x-pathname is injected by middleware/proxy as a request header,
    // which makes it visible to RSCs via headers(). Do NOT use referer
    // (it's the previous page) or response headers (not visible to RSCs).
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const search = headersList.get("x-search") || "";

    const isPublicPortalRoute =
      pathname === "/portal/login" ||
      pathname === "/portal/verify" ||
      pathname.startsWith("/portal/login/") ||
      pathname.startsWith("/portal/verify/");

    // Redirect unauthenticated users to portal login for protected routes
    if (!isPublicPortalRoute && pathname.startsWith("/portal")) {
      redirect("/portal/login");
    }

    // For login page: try to get agency branding from ?agency=slug query param
    const agencySlug = search
      ? new URLSearchParams(search).get("agency")
      : null;

    if (agencySlug) {
      const branding = await getAgencyBrandingBySlug(agencySlug);
      if (branding) {
        return (
          <>
            <ServerBrandingStyle branding={branding} />
            <BrandingProvider
              agencyId={branding.agency_id}
              initialBranding={branding}
            >
              {children}
            </BrandingProvider>
          </>
        );
      }
    }

    return children;
  }

  const [clientInfo, unreadCount, ticketStats, modulesData, switcherSites] =
    await Promise.all([
      getClientInfo(session.user.clientId),
      session.isImpersonating
        ? Promise.resolve(0)
        : getUnreadNotificationCount(session.user.clientId),
      getTicketStats(session.user.clientId),
      getClientInstalledModules(session.user.clientId),
      resolveClientSites(session.user.clientId),
    ]);

  const openTicketCount = ticketStats.open + ticketStats.inProgress;
  const agencyId = clientInfo?.agencyId;
  const installedModules = modulesData.slugs;
  // If client has exactly one site, nav links go directly to that site
  const singleSiteId =
    modulesData.siteIds.length === 1 ? modulesData.siteIds[0] : undefined;

  // Resolve active site for switcher highlighting.
  const activeSiteId = await resolveActiveSiteId(
    session.user.clientId,
    switcherSites[0]?.id,
  );

  const switcherOptions = switcherSites.map((s) => ({
    id: s.id,
    name: s.name,
    subdomain: s.subdomain,
    customDomain: s.customDomain,
    isPublished: s.isPublished,
  }));

  // Server-side branding fetch — eliminates color flash on portal load
  // Same pattern as dashboard layout: SSR inject CSS vars before hydration
  const initialBranding = agencyId ? await getAgencyBranding(agencyId) : null;

  const portalContent = (
    <PortalLayoutClient
      user={session.user}
      openTicketCount={openTicketCount}
      isImpersonating={session.isImpersonating}
      installedModules={installedModules}
      singleSiteId={singleSiteId}
      headerComponent={
        <PortalHeader
          user={session.user}
          agencyName={clientInfo?.agencyName || "Agency"}
          isImpersonating={session.isImpersonating}
          impersonatorEmail={session.impersonatorEmail || undefined}
          clientName={session.user.fullName}
          unreadNotifications={unreadCount}
          sites={switcherOptions}
          activeSiteId={activeSiteId}
          clientId={session.user.clientId}
          agencyId={agencyId ?? ""}
          authUserId={session.user.userId}
        />
      }
    >
      <PortalPushBanner />
      <PwaInstallDetector />
      {children}
      <PortalCommandPalette />
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
