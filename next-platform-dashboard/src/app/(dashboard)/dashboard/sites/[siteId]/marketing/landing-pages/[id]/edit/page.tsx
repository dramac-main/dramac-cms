/**
 * Landing Page Edit Page
 * Phase LPB-02: Studio LP Editor — Full-screen Editor
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PLATFORM } from "@/lib/constants/platform";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/actions/sites";
import { getLandingPage } from "@/modules/marketing/actions/landing-page-actions";
import { LPEditorPage } from "@/modules/marketing/components/landing-pages/lp-editor-page";
import type { LandingPageStudio } from "@/modules/marketing/types/lp-builder-types";

export const metadata: Metadata = {
  title: `Edit Landing Page | ${PLATFORM.name}`,
  description: "Edit landing page in Studio editor",
};

interface LandingPageEditProps {
  params: Promise<{ siteId: string; id: string }>;
}

export default async function LandingPageEditPage({
  params,
}: LandingPageEditProps) {
  const { siteId, id } = await params;

  // Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [site, landingPage] = await Promise.all([
    getSite(siteId),
    getLandingPage(id),
  ]);

  if (!landingPage) notFound();

  return (
    <LPEditorPage
      landingPage={landingPage as unknown as LandingPageStudio}
      siteId={siteId}
      siteName={site.name}
      siteSubdomain={site.subdomain}
      siteCustomDomain={site.custom_domain}
      siteSettings={(site.settings as Record<string, unknown>) ?? null}
    />
  );
}
