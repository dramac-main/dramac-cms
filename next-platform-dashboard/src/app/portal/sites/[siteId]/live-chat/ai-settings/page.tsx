/**
 * Portal Chiko AI Settings
 *
 * Dedicated portal surface for the per-site Chiko AI disable toggle
 * (Session 2 Communication Overhaul — Focus Area 4.4).
 *
 * Permission: canManageLiveChat
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import { ChikoAiSettingsForm } from "@/components/portal/chat/chiko-ai-settings-form";

export const metadata: Metadata = {
  title: "Chiko AI Settings | Portal",
  description: "Control Chiko auto-responses per site",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function ChikoAiSettingsPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  await verifyPortalModuleAccess(user, siteId, "live-chat", "canManageLiveChat");

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) notFound();

  const { data: settings } = await admin
    .from("mod_chat_widget_settings")
    .select(
      "site_id, ai_auto_response_enabled, ai_assistant_name, ai_response_tone, ai_handoff_message",
    )
    .eq("site_id", siteId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chiko AI Settings"
        description={`Control how Chiko AI responds on ${site.name}. Disabling turns off all auto-responses — a human agent will reply instead.`}
      />
      <ChikoAiSettingsForm
        siteId={siteId}
        initial={{
          aiAutoResponseEnabled:
            settings?.ai_auto_response_enabled !== false, // default true
          assistantName: settings?.ai_assistant_name || "Chiko",
          responseTone: settings?.ai_response_tone || "friendly",
          handoffMessage: settings?.ai_handoff_message || "",
        }}
      />
    </div>
  );
}
