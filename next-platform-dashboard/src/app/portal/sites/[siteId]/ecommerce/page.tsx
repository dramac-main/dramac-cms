/**
 * Portal Ecommerce Dashboard Page
 *
 * Renders the full EcommerceDashboard (same UI as agency) wrapped in
 * PortalProvider so the component knows it is in portal mode.
 *
 * The EcommerceDashboard detects portal context via useIsPortalView() and:
 *  - Skips the onboarding wizard
 *  - Passes portalMode=true to EcommerceSidebar
 *  - Scopes all data fetches to this client's siteId
 *
 * Permission: any of canManageProducts | canManageOrders |
 *             canManageQuotes | canManageCustomers
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PortalProvider } from "@/lib/portal/portal-context";
import { EcommerceDashboard } from "@/modules/ecommerce/components/ecommerce-dashboard";

export const metadata = {
  title: "Store | Client Portal",
  description: "Manage your store — products, orders, customers, and quotes.",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<{ view?: string }>;
}

function StoreSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-[500px] rounded-lg" />
    </div>
  );
}

export default async function PortalEcommercePage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const { view } = (await searchParams) ?? {};

  // Verify the client has access to the ecommerce module on this site.
  // We check canManageProducts as the baseline — EcommerceDashboard itself
  // gates individual tabs on the more granular permissions passed via PortalProvider.
  const { site, permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "ecommerce",
    "canManageProducts",
  );

  // Fetch the site's agency_id for EcommerceDashboard (it renders agency-scoped data)
  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("sites")
    .select("agency_id")
    .eq("id", siteId)
    .single();

  const agencyId = siteRow?.agency_id ?? site.agencyId;

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
          canManageInvoices: permissions.canManageInvoices,
        },
        siteId,
      }}
    >
      <Suspense fallback={<StoreSkeleton />}>
        <EcommerceDashboard
          siteId={siteId}
          agencyId={agencyId}
          userId={user.userId}
          userName={user.fullName}
          initialView={view}
        />
      </Suspense>
    </PortalProvider>
  );
}
