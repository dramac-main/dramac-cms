/**
 * Landing Page Detail / Edit Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLATFORM } from "@/lib/constants/platform";
import { Skeleton } from "@/components/ui/skeleton";
import { getLandingPage } from "@/modules/marketing/actions/landing-page-actions";
import { LandingPageEditor } from "@/modules/marketing/components/landing-pages/landing-page-editor";

export const metadata: Metadata = {
  title: `Edit Landing Page | ${PLATFORM.name}`,
  description: "Edit landing page",
};

interface LandingPageDetailProps {
  params: Promise<{ siteId: string; id: string }>;
}

async function LandingPageContent({
  siteId,
  id,
}: {
  siteId: string;
  id: string;
}) {
  const landingPage = await getLandingPage(id);
  if (!landingPage) notFound();

  return <LandingPageEditor siteId={siteId} landingPage={landingPage} />;
}

export default async function LandingPageDetailPage({
  params,
}: LandingPageDetailProps) {
  const { siteId, id } = await params;

  return (
    <div className="flex-1 p-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        <LandingPageContent siteId={siteId} id={id} />
      </Suspense>
    </div>
  );
}
