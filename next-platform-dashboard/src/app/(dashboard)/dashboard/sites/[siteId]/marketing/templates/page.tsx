/**
 * Email Templates Page
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { getTemplates } from "@/modules/marketing/actions/template-actions";
import { TemplateLibrary } from "@/modules/marketing/components/templates/template-library";
import { TemplateLibrarySkeleton } from "@/modules/marketing/components/templates/template-library-skeleton";

export const metadata: Metadata = {
  title: `Email Templates | ${PLATFORM.name}`,
  description: "Browse and manage email templates",
};

interface TemplatesPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<TemplateLibrarySkeleton />}>
        <TemplateLibraryLoader siteId={siteId} />
      </Suspense>
    </div>
  );
}

async function TemplateLibraryLoader({ siteId }: { siteId: string }) {
  const templates = await getTemplates(siteId);

  return <TemplateLibrary siteId={siteId} templates={templates} />;
}
