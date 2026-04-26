/**
 * Portal Live Chat Settings
 *
 * Widget configuration — appearance, behavior, business hours, etc.
 * Permission: canManageLiveChat
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { getWidgetSettings } from "@/modules/live-chat/actions";
import { getDepartments } from "@/modules/live-chat/actions";
import { SettingsPageWrapper } from "@/modules/live-chat/components/wrappers/SettingsPageWrapper";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded" />
        ))}
      </div>
      <Skeleton className="h-[500px] rounded-lg" />
    </div>
  );
}

export default async function PortalLiveChatSettingsPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
  );

  const [settingsResult, departmentsResult] = await Promise.all([
    getWidgetSettings(siteId),
    getDepartments(siteId),
  ]);

  if (settingsResult.error || !settingsResult.settings) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            Failed to load widget settings:{" "}
            {settingsResult.error || "Settings not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalProvider
      value={{
        isPortalView: true,
        portalUser: {
          clientId: user.clientId,
          fullName: user.fullName,
          email: user.email,
          agencyId: user.agencyId,
        },
        permissions: {
          canManageLiveChat: permissions.canManageLiveChat,
          canManageOrders: permissions.canManageOrders,
          canManageProducts: permissions.canManageProducts,
          canManageBookings: permissions.canManageBookings,
          canManageCrm: permissions.canManageCrm,
          canManageAutomation: permissions.canManageAutomation,
          canManageQuotes: permissions.canManageQuotes,
          canManageAgents: permissions.canManageAgents,
          canManageCustomers: permissions.canManageCustomers,
          canManageMarketing: permissions.canManageMarketing,
        },
        siteId,
      }}
    >
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsPageWrapper
          siteId={siteId}
          initialSettings={settingsResult.settings}
          departments={departmentsResult.departments || []}
        />
      </Suspense>
    </PortalProvider>
  );
}
