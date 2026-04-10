/**
 * Automation Engine — public API for emitting automation events.
 *
 * Re-exports the event processor's `logAutomationEvent` under the alias
 * `emitAutomationEvent` so that other modules (live-chat, booking, etc.)
 * can trigger automation workflows with a clean import path.
 */

import { logAutomationEvent } from "@/modules/automation/services/event-processor";

/**
 * Emit an automation event that triggers matching workflows.
 *
 * @param siteId - The site to scope the event to
 * @param eventType - Dot-separated event type (e.g. "booking.payment.proof_uploaded")
 * @param payload - Arbitrary event data passed to workflow actions
 */
export async function emitAutomationEvent(
  siteId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await logAutomationEvent(siteId, eventType, payload, {
    sourceModule: "automation-engine",
  });
}
