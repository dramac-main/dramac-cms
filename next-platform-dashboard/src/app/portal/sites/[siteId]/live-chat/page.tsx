/**
 * Portal Live Chat Overview
 *
 * Mounts the existing LiveChatOverviewWrapper with portal access verification.
 * Permission: canManageLiveChat
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { bootstrapLiveChatAgent } from "@/modules/live-chat/lib/bootstrap-agent";
import { getConversationStats } from "@/modules/live-chat/actions/conversation-actions";
import { getConversations } from "@/modules/live-chat/actions/conversation-actions";
import { getAgents } from "@/modules/live-chat/actions/agent-actions";
import { LiveChatOverviewWrapper } from "@/modules/live-chat/components/wrappers/LiveChatOverviewWrapper";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function LiveChatOverviewContent({
  siteId,
  userId,
  displayName,
  email,
}: {
  siteId: string;
  userId: string;
  displayName: string;
  email: string;
}) {
  // Auto-create agent record for portal user on first access (Phase 4A)
  await bootstrapLiveChatAgent(siteId, userId, {
    displayName,
    email,
    role: "agent",
  });

  const [statsResult, conversationsResult, agentsResult] = await Promise.all([
    getConversationStats(siteId),
    getConversations(siteId, { status: "active" }, 1, 5),
    getAgents(siteId),
  ]);

  return (
    <LiveChatOverviewWrapper
      stats={statsResult.stats}
      recentConversations={conversationsResult.conversations}
      agents={agentsResult.agents}
      siteId={siteId}
    />
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}

export default async function PortalLiveChatOverviewPage({
  params,
}: PageProps) {
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
        <Suspense fallback={<OverviewSkeleton />}>
          <LiveChatOverviewContent
            siteId={siteId}
            userId={user.userId}
            displayName={user.fullName}
            email={user.email}
          />
        </Suspense>
      </div>
    </PortalProvider>
  );
}
