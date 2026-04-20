/**
 * Automation-Aware Notification Dispatcher
 *
 * The automation engine handles email workflows (branded templates, conditions,
 * delays, etc.), but in-app notifications and direct emails must fire
 * immediately and reliably — they cannot depend on workflow configuration.
 *
 * This dispatcher runs the hardcoded notification function (which creates
 * in-app notifications + sends direct emails via business-notifications.ts).
 * The automation engine runs in PARALLEL for workflow-driven actions (drip
 * sequences, conditional branches, delays, etc.).
 *
 * Both paths are safe to run concurrently — the branded email system
 * deduplicates by recipient+type within a short window.
 */

/**
 * Dispatch a business notification (in-app + email) immediately.
 * Automation workflows run separately via logAutomationEvent().
 */
export async function dispatchNotification(params: {
  siteId: string;
  eventType: string;
  notificationFunction: () => Promise<unknown>;
}): Promise<void> {
  try {
    await params.notificationFunction();
  } catch (error) {
    console.error(
      `[NotifyDispatch] Error dispatching ${params.eventType} for site ${params.siteId}:`,
      error,
    );
  }
}

/**
 * Dispatch a chat notification immediately.
 * Automation workflows run separately via logAutomationEvent().
 */
export async function dispatchChatNotification(params: {
  siteId: string;
  eventType: string;
  chatFunction: () => Promise<unknown>;
}): Promise<void> {
  try {
    await params.chatFunction();
  } catch (error) {
    console.error(
      `[NotifyDispatch] Error dispatching chat ${params.eventType} for site ${params.siteId}:`,
      error,
    );
  }
}
