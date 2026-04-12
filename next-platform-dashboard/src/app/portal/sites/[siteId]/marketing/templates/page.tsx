/**
 * Portal - Email Templates
 *
 * Permission: canManageMarketing
 */
import { Suspense } from "react";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { getTemplates } from "@/modules/marketing/actions/template-actions";
import { TemplateLibrary } from "@/modules/marketing/components/templates/template-library";
import { TemplateLibrarySkeleton } from "@/modules/marketing/components/templates/template-library-skeleton";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function TemplateLibraryLoader({ siteId }: { siteId: string }) {
  const templates = await getTemplates(siteId);
  return <TemplateLibrary siteId={siteId} templates={templates} />;
}

export default async function PortalTemplatesPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "marketing",
    "canManageMarketing",
  );

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
      <div className="flex-1 p-6">
        <Suspense fallback={<TemplateLibrarySkeleton />}>
          <TemplateLibraryLoader siteId={siteId} />
        </Suspense>
      </div>
    </PortalProvider>
  );
}
