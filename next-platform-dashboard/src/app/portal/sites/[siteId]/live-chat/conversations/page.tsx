/**
 * Portal Live Chat Conversations List
 *
 * Mounts the existing ConversationsPageWrapper with portal access verification.
 * Permission: canManageLiveChat
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { getConversations } from "@/modules/live-chat/actions/conversation-actions";
import { getAgents } from "@/modules/live-chat/actions/agent-actions";
import { getDepartments } from "@/modules/live-chat/actions/department-actions";
import { ConversationsPageWrapper } from "@/modules/live-chat/components/wrappers/ConversationsPageWrapper";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function ConversationsContent({ siteId }: { siteId: string }) {
  const [conversationsResult, agentsResult, departmentsResult] =
    await Promise.all([
      getConversations(siteId, {}, 1, 20),
      getAgents(siteId),
      getDepartments(siteId),
    ]);

  return (
    <ConversationsPageWrapper
      initialConversations={conversationsResult.conversations}
      total={conversationsResult.total}
      agents={agentsResult.agents}
      departments={departmentsResult.departments}
      siteId={siteId}
    />
  );
}

function ConversationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-14 rounded-lg" />
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    </div>
  );
}

export default async function PortalConversationsPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
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
        },
        siteId,
      }}
    >
      <div className="container py-6">
        <Suspense fallback={<ConversationsSkeleton />}>
          <ConversationsContent siteId={siteId} />
        </Suspense>
      </div>
    </PortalProvider>
  );
}
