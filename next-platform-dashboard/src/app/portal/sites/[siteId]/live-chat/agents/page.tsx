/**
 * Portal Live Chat — Agents Management
 *
 * Mounts AgentsPageWrapper within the live-chat section.
 * Permission: canManageAgents
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { ensureAdminAgent } from "@/modules/live-chat/lib/bootstrap-agent";
import { getAgents, getAgentPerformance } from "@/modules/live-chat/actions/agent-actions";
import { getDepartments } from "@/modules/live-chat/actions/department-actions";
import { AgentsPageWrapper } from "@/modules/live-chat/components/wrappers/AgentsPageWrapper";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function AgentsContent({ siteId }: { siteId: string }) {
  await ensureAdminAgent(siteId);

  const [agentsResult, departmentsResult, performanceResult] =
    await Promise.all([
      getAgents(siteId),
      getDepartments(siteId),
      getAgentPerformance(siteId),
    ]);

  return (
    <AgentsPageWrapper
      agents={agentsResult.agents}
      departments={departmentsResult.departments}
      performance={performanceResult.performance}
      siteId={siteId}
    />
  );
}

function AgentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default async function PortalLiveChatAgentsPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageAgents",
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
      <div className="container py-6">
        <Suspense fallback={<AgentsSkeleton />}>
          <AgentsContent siteId={siteId} />
        </Suspense>
      </div>
    </PortalProvider>
  );
}
