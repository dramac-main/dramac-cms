/**
 * Portal - Social Media
 *
 * Permission: canManageMarketing
 */
import { Suspense } from "react";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import {
  getSocialPosts,
  getSocialConnections,
} from "@/modules/marketing/actions/social-actions";
import { SocialPostsList } from "@/modules/marketing/components/social/social-posts-list";
import { SocialConnectionsSettings } from "@/modules/marketing/components/social/social-connections-settings";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

async function SocialPostsLoader({ siteId }: { siteId: string }) {
  const { posts, total } = await getSocialPosts(siteId, { limit: 50 });
  return <SocialPostsList siteId={siteId} posts={posts} total={total} />;
}

async function ConnectionsLoader({ siteId }: { siteId: string }) {
  const connections = await getSocialConnections(siteId);
  return (
    <SocialConnectionsSettings siteId={siteId} connections={connections} />
  );
}

export default async function PortalSocialPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "connections" ? "connections" : "posts";

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
        <Tabs defaultValue={activeTab}>
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="connections">
              <Settings className="mr-2 h-4 w-4" />
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <Suspense fallback={<PostsSkeleton />}>
              <SocialPostsLoader siteId={siteId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <Suspense fallback={<PostsSkeleton />}>
              <ConnectionsLoader siteId={siteId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </PortalProvider>
  );
}
