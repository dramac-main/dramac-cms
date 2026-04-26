/**
 * Settings Page — Widget Configuration + Ask Chiko AI
 *
 * PHASE LC-04: Full widget settings with 8-tab interface
 * Also hosts Ask Chiko portal AI configuration (route consolidated to reduce
 * Vercel config.json route count — the dedicated /ask-chiko page was removed).
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { getWidgetSettings, getDepartments } from "@/modules/live-chat/actions";
import { SettingsPageWrapper } from "@/modules/live-chat/components/wrappers/SettingsPageWrapper";
import { getAskChikoSettings } from "@/modules/ask-chiko/actions";
import { AskChikoSettingsForm } from "@/modules/ask-chiko/components/ask-chiko-settings-form";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function AskChikoSection({ siteId }: { siteId: string }) {
  const settings = await getAskChikoSettings(siteId);
  return <AskChikoSettingsForm initial={settings} siteId={siteId} />;
}

export default async function SettingsPage({ params }: PageProps) {
  const { siteId } = await params;

  const [settingsResult, departmentsResult] = await Promise.all([
    getWidgetSettings(siteId),
    getDepartments(siteId),
  ]);

  if (settingsResult.error || !settingsResult.settings) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            Failed to load widget settings:{" "}
            {settingsResult.error || "Settings not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SettingsPageWrapper
        siteId={siteId}
        initialSettings={settingsResult.settings}
        departments={departmentsResult.departments || []}
      />

      <div className="container max-w-4xl">
        <Separator className="mb-8" />
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ask Chiko — Portal AI Assistant
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the AI business assistant available to your portal
            clients. Chiko answers questions about revenue, orders, bookings,
            and more.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          }
        >
          <AskChikoSection siteId={siteId} />
        </Suspense>
      </div>
    </div>
  );
}
