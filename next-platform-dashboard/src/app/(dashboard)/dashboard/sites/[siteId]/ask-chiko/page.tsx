/**
 * Ask Chiko Agency Configuration Page
 *
 * Route: /dashboard/sites/[siteId]/ask-chiko
 *
 * Allows agency admins to configure the Ask Chiko AI assistant for each site:
 *  - Enable / disable
 *  - Response tone
 *  - Custom instructions injected into every conversation
 *  - Allowed data sources (limit what Chiko can access)
 *  - Monthly message quota
 */

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { getSite } from "@/lib/actions/sites";
import { PLATFORM } from "@/lib/constants/platform";
import { getAskChikoSettings } from "./actions";
import { AskChikoSettingsForm } from "./ask-chiko-settings-form";

export const metadata: Metadata = {
  title: `Ask Chiko Settings | ${PLATFORM.name}`,
  description: "Configure the Ask Chiko AI assistant for this site.",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

async function SettingsContent({ siteId }: { siteId: string }) {
  const settings = await getAskChikoSettings(siteId);
  return <AskChikoSettingsForm initial={settings} siteId={siteId} />;
}

export default async function AskChikoSettingsPage({ params }: PageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      {/* Back nav */}
      <div>
        <Link href={`/dashboard/sites/${siteId}?tab=modules`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Ask Chiko Settings"
        description={`Configure the AI assistant for ${site.name}. Changes take effect immediately for portal clients.`}
      />

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent siteId={siteId} />
      </Suspense>
    </div>
  );
}
