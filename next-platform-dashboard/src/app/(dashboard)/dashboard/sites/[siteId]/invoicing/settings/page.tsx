/**
 * Invoicing Settings Page — INV-02
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { InvoicingSettingsForm } from "@/modules/invoicing/components/invoicing-settings-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Invoicing Settings | ${PLATFORM.name}`,
  description: "Configure invoicing preferences, branding, and tax rates",
};

interface SettingsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <InvoicingSettingsForm siteId={siteId} />
      </Suspense>
    </div>
  );
}
