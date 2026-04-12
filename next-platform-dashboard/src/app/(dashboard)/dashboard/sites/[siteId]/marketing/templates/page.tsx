/**
 * Email Templates Page
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketing Hub
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<TemplateLibrarySkeleton />}>
          <TemplateLibraryLoader siteId={siteId} />
        </Suspense>
      </div>
    </div>
  );
}

async function TemplateLibraryLoader({ siteId }: { siteId: string }) {
  const templates = await getTemplates(siteId);

  return <TemplateLibrary siteId={siteId} templates={templates} />;
}
