/**
 * Social Media Posts Page
 *
 * Phase MKT-12: Social Media Integration
 *
 * Lists all social posts with connection settings.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSocialPosts,
  getSocialConnections,
} from "@/modules/marketing/actions/social-actions";
import { SocialPostsList } from "@/modules/marketing/components/social/social-posts-list";
import { SocialConnectionsSettings } from "@/modules/marketing/components/social/social-connections-settings";

export const metadata: Metadata = {
  title: `Social Media | ${PLATFORM.name}`,
  description: "Manage social media posts and connections",
};

interface SocialPageProps {
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

export default async function SocialPage({
  params,
  searchParams,
}: SocialPageProps) {
  const { siteId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "connections" ? "connections" : "posts";

  return (
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
