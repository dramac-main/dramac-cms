/**
 * Portal Marketing Module Layout
 *
 * Persistent navigation for all portal marketing pages.
 * Mirrors the dashboard marketing layout but uses portal auth.
 */
import { redirect, notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, GitBranch } from "lucide-react";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { MarketingNav } from "@/modules/marketing/components/hub/marketing-nav";

interface PortalMarketingLayoutProps {
  children: ReactNode;
  params: Promise<{ siteId: string }>;
}

function NavSkeleton() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-8 w-20" />
      ))}
    </div>
  );
}

export default async function PortalMarketingLayout({
  children,
  params,
}: PortalMarketingLayoutProps) {
  const { siteId } = await params;
  const user = await requirePortalAuth();

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "marketing",
    "canManageMarketing",
  );

  const portalBase = `/portal/sites/${siteId}/marketing`;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
        <div className="container">
          {/* Row 1: Back + Title + Quick actions */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href={`/portal/sites/${siteId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-lg font-semibold">Marketing</h1>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`${portalBase}/campaigns/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </Link>
              <Link href={`${portalBase}/sequences/new`}>
                <Button variant="outline" size="sm">
                  <GitBranch className="h-4 w-4 mr-2" />
                  New Sequence
                </Button>
              </Link>
            </div>
          </div>

          {/* Row 2: Navigation tabs */}
          <div className="flex items-center -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-muted">
            <Suspense fallback={<NavSkeleton />}>
              <MarketingNav siteId={siteId} basePath={portalBase} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
