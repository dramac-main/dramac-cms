/**
 * Portal Scripted Flows — list + CRUD page.
 *
 * Permission: canManageLiveChat. Shows all flows for the site (defaults +
 * customs) with a per-row enable toggle and inline editor for the JSON
 * `steps` definition.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import { ScriptedFlowsManager } from "@/components/portal/chat/scripted-flows-manager";

export const metadata: Metadata = {
  title: "Scripted Flows | Portal",
  description: "Manage scripted chat flows that run when AI is unavailable",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function ScriptedFlowsPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
  );

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) notFound();

  const { data: flows } = await admin
    .from("mod_chat_scripted_flows" as never)
    .select(
      "id, slug, name, description, trigger_keywords, trigger_intents, is_enabled, is_default, priority, steps, usage_count, completion_count, handoff_count, last_triggered_at, updated_at",
    )
    .eq("site_id" as never, siteId)
    .order("priority" as never, { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scripted Chat Flows"
        description={`Pre-built conversation flows that run when Chiko AI is unavailable on ${site.name}. Higher priority wins when multiple flows match.`}
      />
      <ScriptedFlowsManager
        siteId={siteId}
        flows={
          ((flows ?? []) as unknown as Array<{
            id: string;
            slug: string;
            name: string;
            description: string | null;
            trigger_keywords: string[];
            trigger_intents: string[];
            is_enabled: boolean;
            is_default: boolean;
            priority: number;
            steps: unknown[];
            usage_count: number;
            completion_count: number;
            handoff_count: number;
            last_triggered_at: string | null;
            updated_at: string;
          }>) ?? []
        }
      />
    </div>
  );
}
