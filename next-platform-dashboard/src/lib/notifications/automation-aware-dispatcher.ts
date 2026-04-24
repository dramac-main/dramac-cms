/**
 * Notification Dispatcher
 *
 * `dispatchNotification` directly invokes the provided notification function so
 * branded emails, in-app notifications, and web push fire on every business
 * event (booking created/confirmed/cancelled, order placed, etc.). Errors are
 * caught and logged so callers are never blocked on a send failure.
 *
 * Automation workflows run in parallel via `logAutomationEvent()` at the call
 * site — the two paths are complementary, not mutually exclusive: hard-coded
 * handlers guarantee the baseline "this email always sends", automation adds
 * custom workflows on top.
 */
export async function dispatchNotification(params: {
  siteId: string;
  eventType: string;
  notificationFunction: () => Promise<unknown>;
}): Promise<void> {
  try {
    await params.notificationFunction();
  } catch (err) {
    console.error(
      `[NotificationDispatcher] Failed to dispatch ${params.eventType} for site ${params.siteId}:`,
      err,
    );
  }
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
