/**
 * New Landing Page Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { LandingPageEditor } from "@/modules/marketing/components/landing-pages/landing-page-editor";

export const metadata: Metadata = {
  title: `New Landing Page | ${PLATFORM.name}`,
  description: "Create a new landing page",
};

interface NewLandingPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewLandingPage({ params }: NewLandingPageProps) {
  const { siteId } = await params;

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
        <LandingPageEditor siteId={siteId} />
      </div>
    </div>
  );
}
