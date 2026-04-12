/**
 * New Social Post Page
 *
 * Phase MKT-12: Social Media Integration
 *
 * Social post composer with multi-platform support.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSocialConnections } from "@/modules/marketing/actions/social-actions";
import { SocialPostComposer } from "@/modules/marketing/components/social/social-post-composer";

export const metadata: Metadata = {
  title: `New Social Post | ${PLATFORM.name}`,
  description: "Create a new social media post",
};

interface NewSocialPostPageProps {
  params: Promise<{ siteId: string }>;
}

function ComposerSkeleton() {
  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export default async function NewSocialPostPage({
  params,
}: NewSocialPostPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing/social`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Social Posts
          </Button>
        </Link>
      </div>

      <div className="flex-1">
        <Suspense fallback={<ComposerSkeleton />}>
          <ComposerLoader siteId={siteId} />
        </Suspense>
      </div>
    </div>
  );
}

async function ComposerLoader({ siteId }: { siteId: string }) {
  const connections = await getSocialConnections(siteId);
  return <SocialPostComposer siteId={siteId} connections={connections} />;
}
