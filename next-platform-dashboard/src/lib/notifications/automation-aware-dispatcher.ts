/**
 * Automation-Aware Notification Dispatcher
 *
 * Phase 5: Migration Safety — Dual-dispatch system that checks whether
 * an active automation workflow exists for a given event type before
 * calling the hardcoded notification function. If automation handles it,
 * the hardcoded call is skipped. If not, it fires as before.
 *
 * NEVER delete the hardcoded notification functions — they remain as fallback.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Check if an active system automation workflow exists for this site + event.
 * Uses a lightweight count query.
 */
async function hasActiveSystemWorkflow(
  siteId: string,
  eventType: string,
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Check for an active system workflow that handles this event type
    // Uses the is_system + system_event_type columns from Phase 3 migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase as any)
      .from("automation_workflows")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("system_event_type", eventType)
      .eq("is_system", true)
      .eq("is_active", true);

    if (error) {
      // Fail-safe: if we can't check, let the hardcoded function run
      console.warn(
        "[Dispatcher] Error checking active workflows, falling back:",
        error.message,
      );
      return false;
    }

    return (count ?? 0) > 0;
  } catch {
    // Fail-safe on exception
    return false;
  }
}

/**
 * Dispatch a notification through automation or fallback to hardcoded function.
 *
 * Call this AFTER logAutomationEvent() has already been called.
 * If an active automation workflow exists for this event, the hardcoded
 * function is skipped (automation handles it). Otherwise, the hardcoded
 * function fires as fallback.
 */
export async function dispatchNotification(params: {
  siteId: string;
  eventType: string;
  notificationFunction: () => Promise<unknown>;
}): Promise<void> {
  const { siteId, eventType, notificationFunction } = params;

  try {
    const automationHandles = await hasActiveSystemWorkflow(siteId, eventType);

    if (automationHandles) {
      // Automation engine will handle this notification
      return;
    }

    // No active automation — fall back to hardcoded notification
    await notificationFunction();
  } catch (error) {
    // Fail-safe: if dispatch check fails, try the hardcoded function
    console.error("[Dispatcher] Error in dispatch, calling fallback:", error);
    try {
      await notificationFunction();
    } catch (fallbackError) {
      console.error(
        "[Dispatcher] Fallback notification also failed:",
        fallbackError,
      );
    }
  }
}

/**
 * Dispatch a chat notification through automation or fallback.
 * Same logic as dispatchNotification but semantically separate for chat messages.
 */
export async function dispatchChatNotification(params: {
  siteId: string;
  eventType: string;
  chatFunction: () => Promise<unknown>;
}): Promise<void> {
  const { siteId, eventType, chatFunction } = params;

  try {
    const automationHandles = await hasActiveSystemWorkflow(siteId, eventType);

    if (automationHandles) {
      return;
    }

    await chatFunction();
  } catch (error) {
    console.error("[Dispatcher] Chat dispatch error, calling fallback:", error);
    try {
      await chatFunction();
    } catch (fallbackError) {
      console.error("[Dispatcher] Chat fallback also failed:", fallbackError);
    }
  }
}
