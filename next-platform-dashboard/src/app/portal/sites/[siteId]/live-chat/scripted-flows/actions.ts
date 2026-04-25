"use server";

/**
 * Portal Scripted Flows — server actions.
 *
 * CRUD on `mod_chat_scripted_flows`. Permission: `canManageLiveChat`.
 * All writes go through `verifyPortalModuleAccess` and are audited via
 * `writePortalAudit` (which mirrors writes to `impersonation_actions`
 * during impersonation — see Section 7).
 */

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { writePortalAudit } from "@/lib/portal/audit-log";

export type ScriptedFlowResult = { ok: true } | { ok: false; error: string };

export interface ScriptedFlowInput {
  slug: string;
  name: string;
  description?: string;
  triggerKeywords: string[];
  triggerIntents?: string[];
  isEnabled: boolean;
  priority: number;
  steps: unknown[];
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;

function validate(input: ScriptedFlowInput): string | null {
  if (!input.slug || !SLUG_PATTERN.test(input.slug)) {
    return "Slug must be lowercase letters, numbers, dashes, or underscores (2–64 chars).";
  }
  if (!input.name || input.name.trim().length < 2) {
    return "Name is required.";
  }
  if (!Array.isArray(input.steps)) {
    return "Steps must be an array.";
  }
  if (input.priority < 0 || input.priority > 1000) {
    return "Priority must be between 0 and 1000.";
  }
  return null;
}

export async function createScriptedFlow(
  siteId: string,
  input: ScriptedFlowInput,
): Promise<ScriptedFlowResult> {
  const user = await requirePortalAuth();
  await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
  );

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();
  const session = await getPortalSession();

  const { data, error } = await admin
    .from("mod_chat_scripted_flows" as never)
    .insert({
      site_id: siteId,
      slug: input.slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      trigger_keywords: input.triggerKeywords,
      trigger_intents: input.triggerIntents ?? [],
      is_enabled: input.isEnabled,
      priority: input.priority,
      steps: input.steps,
      created_by: user.userId,
    } as never)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A flow with that slug already exists for this site."
          : error.message,
    };
  }

  await writePortalAudit({
    authUserId: user.userId,
    clientId: user.clientId,
    agencyId: user.agencyId,
    siteId,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
    action: "portal.scripted_flow.create",
    resourceType: "scripted_flow",
    resourceId: (data as { id?: string } | null)?.id ?? null,
    metadata: { slug: input.slug, isEnabled: input.isEnabled },
  });

  revalidatePath(`/portal/sites/${siteId}/live-chat/scripted-flows`);
  return { ok: true };
}

export async function updateScriptedFlow(
  siteId: string,
  flowId: string,
  input: ScriptedFlowInput,
): Promise<ScriptedFlowResult> {
  const user = await requirePortalAuth();
  await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
  );

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();
  const session = await getPortalSession();

  const { error } = await admin
    .from("mod_chat_scripted_flows" as never)
    .update({
      slug: input.slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      trigger_keywords: input.triggerKeywords,
      trigger_intents: input.triggerIntents ?? [],
      is_enabled: input.isEnabled,
      priority: input.priority,
      steps: input.steps,
    } as never)
    .eq("id", flowId)
    .eq("site_id", siteId);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A flow with that slug already exists for this site."
          : error.message,
    };
  }

  await writePortalAudit({
    authUserId: user.userId,
    clientId: user.clientId,
    agencyId: user.agencyId,
    siteId,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
    action: "portal.scripted_flow.update",
    resourceType: "scripted_flow",
    resourceId: flowId,
    metadata: { slug: input.slug, isEnabled: input.isEnabled },
  });

  revalidatePath(`/portal/sites/${siteId}/live-chat/scripted-flows`);
  return { ok: true };
}

export async function toggleScriptedFlow(
  siteId: string,
  flowId: string,
  isEnabled: boolean,
): Promise<ScriptedFlowResult> {
  const user = await requirePortalAuth();
  await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
  );

  const admin = createAdminClient();
  const session = await getPortalSession();

  const { error } = await admin
    .from("mod_chat_scripted_flows" as never)
    .update({ is_enabled: isEnabled } as never)
    .eq("id", flowId)
    .eq("site_id", siteId);

  if (error) return { ok: false, error: error.message };

  await writePortalAudit({
    authUserId: user.userId,
    clientId: user.clientId,
    agencyId: user.agencyId,
    siteId,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
    action: isEnabled
      ? "portal.scripted_flow.enable"
      : "portal.scripted_flow.disable",
    resourceType: "scripted_flow",
    resourceId: flowId,
  });

  revalidatePath(`/portal/sites/${siteId}/live-chat/scripted-flows`);
  return { ok: true };
}

export async function deleteScriptedFlow(
  siteId: string,
  flowId: string,
): Promise<ScriptedFlowResult> {
  const user = await requirePortalAuth();
  await verifyPortalModuleAccess(
    user,
    siteId,
    "live-chat",
    "canManageLiveChat",
  );

  const admin = createAdminClient();
  const session = await getPortalSession();

  // Refuse to delete defaults — they re-seed automatically and the deletion
  // would silently come back. Disable instead.
  const { data: flow } = await admin
    .from("mod_chat_scripted_flows" as never)
    .select("is_default, slug")
    .eq("id" as never, flowId)
    .eq("site_id" as never, siteId)
    .maybeSingle();

  const flowRow = flow as { is_default?: boolean; slug?: string } | null;
  if (flowRow?.is_default) {
    return {
      ok: false,
      error:
        "Default flows cannot be deleted. Disable them instead — they will be re-seeded if removed.",
    };
  }

  const { error } = await admin
    .from("mod_chat_scripted_flows" as never)
    .delete()
    .eq("id", flowId)
    .eq("site_id", siteId);

  if (error) return { ok: false, error: error.message };

  await writePortalAudit({
    authUserId: user.userId,
    clientId: user.clientId,
    agencyId: user.agencyId,
    siteId,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
    action: "portal.scripted_flow.delete",
    resourceType: "scripted_flow",
    resourceId: flowId,
    metadata: { slug: flowRow?.slug ?? null },
  });

  revalidatePath(`/portal/sites/${siteId}/live-chat/scripted-flows`);
  return { ok: true };
}
