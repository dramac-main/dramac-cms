/**
 * Automation-Aware Notification Dispatcher
 *
 * dispatchNotification  → no-op; automation workflows handle email / in-app.
 * dispatchChatNotification → ACTIVE; chat bridge messages are direct DB inserts
 *   into mod_chat_messages and must fire regardless of automation.  Automation
 *   handles emails but cannot insert real-time proactive chat messages.
 */

/**
 * @deprecated Automation is the sole path for email/in-app notifications.
 * This is intentionally a no-op — keep for compatibility.
 */
export async function dispatchNotification(_params: {
  siteId: string;
  eventType: string;
  notificationFunction: () => Promise<unknown>;
}): Promise<void> {
  // No-op: automation workflows handle all email/in-app notifications.
}

/**
 * Dispatch a proactive chat bridge message.
 *
 * Unlike email/in-app notifications, chat bridge messages are real-time DB
 * inserts that must be fired directly — they cannot go through automation.
 * This function calls chatFunction() and swallows errors so callers are
 * never blocked.
 */
export async function dispatchChatNotification(params: {
  siteId: string;
  eventType: string;
  chatFunction: () => Promise<unknown>;
}): Promise<void> {
  try {
    await params.chatFunction();
  } catch (err) {
    console.error(
      `[ChatDispatcher] Failed to send chat notification for event ${params.eventType}:`,
      err,
    );
  }
}
