/**
 * Automation-Aware Notification Dispatcher
 *
 * Phase 5 → RETIRED: The automation engine is now the SOLE notification path.
 * logAutomationEvent() triggers workflows which send emails/notifications.
 *
 * These functions are kept as no-ops so existing call sites don't need
 * immediate refactoring. They will be removed in a future cleanup pass.
 *
 * If a workflow fails, the failure is logged in workflow_executions.
 * There is no hardcoded fallback — this is intentional so failures surface
 * in the automation execution history rather than being silently masked.
 */

/**
 * @deprecated Automation is the sole notification path. This is a no-op.
 */
export async function dispatchNotification(_params: {
  siteId: string;
  eventType: string;
  notificationFunction: () => Promise<unknown>;
}): Promise<void> {
  // No-op: automation workflows handle all notifications.
  // The notificationFunction is intentionally NOT called.
}

/**
 * @deprecated Automation is the sole notification path. This is a no-op.
 */
export async function dispatchChatNotification(_params: {
  siteId: string;
  eventType: string;
  chatFunction: () => Promise<unknown>;
}): Promise<void> {
  // No-op: automation workflows handle all chat notifications.
}
