/**
 * New Landing Page Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
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
    <div className="flex-1 p-6">
      <LandingPageEditor siteId={siteId} />
    </div>
  );
}
