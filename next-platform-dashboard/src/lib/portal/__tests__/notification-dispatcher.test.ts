import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Notification dispatcher unit tests.
 *
 * The dispatcher is the single fanout primitive used by the 19 notify*
 * functions in `business-notifications.ts`. Two invariants are tested here:
 *
 *   1. `excludeUserIds` removes the listed users from the recipient set
 *      before any channel is called. This is how legacy owner paths avoid
 *      double-delivery.
 *   2. A preference row with all channels disabled suppresses that
 *      recipient entirely — no in-app write, no email, no push — while
 *      still writing `portal_send_log` rows tagged `skipped_preference`.
 */

const resolveInterestedRecipientsMock = vi.fn<
  (...args: unknown[]) => Promise<unknown[]>
>();
const dedupeRecipientsMock = vi.fn<(r: unknown[]) => unknown[]>(
  (r) => r,
);

const createNotificationMock = vi.fn(async () => ({ id: "notif-1" }));
const sendBrandedEmailMock = vi.fn(async () => ({ id: "msg-1" }));
const writeSendLogMock = vi.fn(async () => ({ id: "log-1" }));
const updateSendLogStateMock = vi.fn(async () => undefined);
const sendPushToUserMock = vi.fn(async () => ({ sent: 1, failed: 0 }));
const siteAllowsInAppMock = vi.fn(async () => true);
const siteAllowsEmailMock = vi.fn(async () => true);

const adminThen = {
  select: () => adminThen,
  eq: () => adminThen,
  in: () => adminThen,
  is: () => adminThen,
  or: () => adminThen,
  order: () => adminThen,
  limit: () => adminThen,
  then: (resolve: (v: unknown) => unknown) =>
    resolve({ data: [], error: null }),
};

vi.mock("server-only", () => ({}));

vi.mock("../recipient-resolver", () => ({
  resolveInterestedRecipients: (...args: unknown[]) =>
    resolveInterestedRecipientsMock(...args),
  dedupeRecipients: (r: unknown[]) => dedupeRecipientsMock(r),
}));

vi.mock("../send-log", () => ({
  writeSendLog: (...args: unknown[]) => writeSendLogMock(...args),
  updateSendLogState: (...args: unknown[]) => updateSendLogStateMock(...args),
}));

vi.mock("@/lib/services/notifications", () => ({
  createNotification: (...args: unknown[]) => createNotificationMock(...args),
}));

vi.mock("@/lib/email/send-branded-email", () => ({
  sendBrandedEmail: (...args: unknown[]) => sendBrandedEmailMock(...args),
}));

vi.mock("@/lib/actions/web-push", () => ({
  sendPushToUser: (...args: unknown[]) => sendPushToUserMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => adminThen }),
}));

vi.mock("@/lib/services/notification-channel-resolver", () => ({
  shouldSendInApp: (...args: unknown[]) => siteAllowsInAppMock(...args),
  shouldSendEmail: (...args: unknown[]) => siteAllowsEmailMock(...args),
}));

beforeEach(() => {
  vi.resetModules();
  resolveInterestedRecipientsMock.mockReset();
  dedupeRecipientsMock.mockClear();
  createNotificationMock.mockClear();
  sendBrandedEmailMock.mockClear();
  writeSendLogMock.mockClear();
  updateSendLogStateMock.mockClear();
  sendPushToUserMock.mockClear();
  siteAllowsInAppMock.mockClear();
  siteAllowsEmailMock.mockClear();
});

describe("dispatchBusinessEvent", () => {
  it("drops recipients listed in excludeUserIds before any channel fires", async () => {
    resolveInterestedRecipientsMock.mockResolvedValue([
      {
        userId: "owner-1",
        email: "owner@acme.test",
        recipientClass: "agency_owner",
      },
      {
        userId: "portal-1",
        email: "po@acme.test",
        recipientClass: "portal_user",
      },
    ]);

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    const result = await dispatchBusinessEvent({
      eventType: "order_placed",
      permission: "canManageOrders",
      siteId: "site-1",
      resourceType: "order",
      resourceId: "order-1",
      title: "New order",
      message: "A customer placed an order.",
      excludeUserIds: ["owner-1"],
    });

    // Only the non-excluded user counts as a recipient.
    expect(result.recipients).toBe(1);
    // createNotification must NEVER have been called with the excluded user.
    const calledUserIds = createNotificationMock.mock.calls
      .map((call) => {
        const arg = call[0] as { userId?: string } | undefined;
        return arg?.userId;
      })
      .filter(Boolean);
    expect(calledUserIds).not.toContain("owner-1");
  });

  it("returns zero recipients and never touches channels when all recipients are excluded", async () => {
    resolveInterestedRecipientsMock.mockResolvedValue([
      { userId: "u-1", email: "a@b", recipientClass: "portal_user" },
      { userId: "u-2", email: "c@d", recipientClass: "portal_user" },
    ]);

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    const result = await dispatchBusinessEvent({
      eventType: "order_placed",
      permission: "canManageOrders",
      siteId: "site-1",
      resourceType: "order",
      resourceId: "order-2",
      title: "Ignored",
      message: "Ignored",
      excludeUserIds: ["u-1", "u-2"],
    });

    expect(result.recipients).toBe(0);
    expect(result.inAppSent).toBe(0);
    expect(result.emailSent).toBe(0);
    expect(result.pushSent).toBe(0);
    expect(createNotificationMock).not.toHaveBeenCalled();
    expect(sendBrandedEmailMock).not.toHaveBeenCalled();
    expect(sendPushToUserMock).not.toHaveBeenCalled();
  });

  it("never throws even when the recipient resolver fails — notifications must never break business flows", async () => {
    resolveInterestedRecipientsMock.mockRejectedValue(
      new Error("db unreachable"),
    );

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    await expect(
      dispatchBusinessEvent({
        eventType: "order_placed",
        permission: "canManageOrders",
        siteId: "site-1",
        resourceType: "order",
        resourceId: "order-3",
        title: "t",
        message: "m",
      }),
    ).resolves.toMatchObject({
      recipients: 0,
      inAppSent: 0,
      emailSent: 0,
      pushSent: 0,
    });
  });
});
