"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { writePortalAudit } from "@/lib/portal/audit-log";
import { revalidatePath } from "next/cache";

export interface ChikoAiSettingsUpdate {
  aiAutoResponseEnabled: boolean;
  assistantName: string;
  responseTone: string;
  handoffMessage: string;
}

export async function updateChikoAiSettings(
  siteId: string,
  update: ChikoAiSettingsUpdate,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requirePortalAuth();
  await verifyPortalModuleAccess(user, siteId, "live-chat", "canManageLiveChat");

  const admin = createAdminClient();

  // Capture prior state for audit trail
  const { data: prior } = await admin
    .from("mod_chat_widget_settings")
    .select("ai_auto_response_enabled")
    .eq("site_id", siteId)
    .maybeSingle();

  const { error } = await admin
    .from("mod_chat_widget_settings")
    .upsert(
      {
        site_id: siteId,
        ai_auto_response_enabled: update.aiAutoResponseEnabled,
        ai_assistant_name: update.assistantName || "Chiko",
        ai_response_tone: update.responseTone || "friendly",
        ai_handoff_message: update.handoffMessage || null,
      },
      { onConflict: "site_id" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  await writePortalAudit({
    authUserId: user.userId,
    clientId: user.clientId,
    agencyId: user.agencyId,
    siteId,
    action: update.aiAutoResponseEnabled
      ? "portal.chat.ai.enabled"
      : "portal.chat.ai.disabled",
    resourceType: "site",
    resourceId: siteId,
    permissionKey: "canManageLiveChat",
    metadata: {
      previousEnabled: prior?.ai_auto_response_enabled ?? true,
      nextEnabled: update.aiAutoResponseEnabled,
      assistantName: update.assistantName,
    },
  });

  revalidatePath(`/portal/sites/${siteId}/live-chat/ai-settings`);
  return { ok: true };
}
