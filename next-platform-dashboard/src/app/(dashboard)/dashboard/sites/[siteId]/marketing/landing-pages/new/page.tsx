/**
 * New Landing Page Page
 * Phase LPB-02: Studio LP Editor — Template Picker + Create
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { getSite } from "@/lib/actions/sites";
import { LPNewPageClient } from "@/modules/marketing/components/landing-pages/lp-new-page-client";

export const metadata: Metadata = {
  title: `New Landing Page | ${PLATFORM.name}`,
  description: "Create a new landing page",
};

interface NewLandingPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewLandingPage({ params }: NewLandingPageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId);

  return <LPNewPageClient siteId={siteId} siteName={site.name} />;
}
