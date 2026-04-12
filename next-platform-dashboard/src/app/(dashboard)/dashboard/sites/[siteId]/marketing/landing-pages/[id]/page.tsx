/**
 * Landing Page Detail / Edit Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing/landing-pages`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landing Pages
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
