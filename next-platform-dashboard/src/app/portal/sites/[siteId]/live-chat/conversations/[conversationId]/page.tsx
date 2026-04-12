/**
 * Portal Conversation Detail View
 *
 * Mounts the existing ConversationViewWrapper with portal access verification.
 * Permission: canManageLiveChat
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { getConversation } from "@/modules/live-chat/actions/conversation-actions";
import { getMessages } from "@/modules/live-chat/actions/message-actions";
import { getAgents } from "@/modules/live-chat/actions/agent-actions";
import { getDepartments } from "@/modules/live-chat/actions/department-actions";
import { getCannedResponses } from "@/modules/live-chat/actions/canned-response-actions";
import { getVisitor } from "@/modules/live-chat/actions/visitor-actions";
import { ConversationViewWrapper } from "@/modules/live-chat/components/wrappers/ConversationViewWrapper";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string; conversationId: string }>;
}

async function ConversationContent({
  siteId,
  conversationId,
  userId,
  userName,
}: {
  siteId: string;
  conversationId: string;
  userId: string;
  userName: string;
}) {
  const [
    conversationResult,
    messagesResult,
    agentsResult,
    departmentsResult,
    cannedResult,
  ] = await Promise.all([
    getConversation(conversationId),
    getMessages(conversationId, 1, 50),
    getAgents(siteId),
    getDepartments(siteId),
    getCannedResponses(siteId),
  ]);

  if (!conversationResult.conversation) {
    redirect(`/portal/sites/${siteId}/live-chat/conversations`);
  }

  const conversation = conversationResult.conversation;

  // Fetch visitor if available
  let visitor = null;
  if (conversation.visitorId) {
    const visitorResult = await getVisitor(conversation.visitorId);
    visitor = visitorResult.visitor || null;
  }

  return (
    <ConversationViewWrapper
      conversation={conversation}
      initialMessages={messagesResult.messages}
      agents={agentsResult.agents}
      departments={departmentsResult.departments}
      cannedResponses={cannedResult.responses}
      visitor={visitor}
      siteId={siteId}
      totalMessages={messagesResult.total}
      userId={userId}
      userName={userName}
    />
  );
}

function ConversationViewSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col border-r">
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-48 rounded-lg" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="w-80 p-4 space-y-4 hidden lg:block">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  );
}

export default async function PortalConversationViewPage({
  params,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, conversationId } = await params;

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
          canManageMarketing: permissions.canManageMarketing,
        },
        siteId,
      }}
    >
      <Suspense fallback={<ConversationViewSkeleton />}>
        <ConversationContent
          siteId={siteId}
          conversationId={conversationId}
          userId={user.userId}
          userName={user.fullName}
        />
      </Suspense>
    </PortalProvider>
  );
}
