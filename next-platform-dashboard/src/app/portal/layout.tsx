import { getPortalSession } from "@/lib/portal/portal-auth";
import { getClientInfo } from "@/lib/portal/portal-service";
import { getUnreadNotificationCount } from "@/lib/portal/notification-service";
import { getTicketStats } from "@/lib/portal/support-service";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalLayoutClient } from "@/components/portal/portal-layout-client";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();
  
  // If no user and not impersonating, this will be handled by individual pages
  // (login page doesn't need auth, but other pages do)
  
  if (!session.user) {
    // Allow login page to render without auth
    return children;
  }

  const [clientInfo, unreadCount, ticketStats] = await Promise.all([
    getClientInfo(session.user.clientId),
    session.isImpersonating ? Promise.resolve(0) : getUnreadNotificationCount(session.user.clientId),
    getTicketStats(session.user.clientId),
  ]);

  const openTicketCount = ticketStats.open + ticketStats.inProgress;

  return (
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
}
