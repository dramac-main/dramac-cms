import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Idempotency unit tests for the notification dispatcher (Section 6).
 *
 * The contract under test: when `automation_event_dispatches.event_key`
 * insert returns Postgres 23505 (unique violation), `dispatchBusinessEvent`
 * must short-circuit and not fan out to any channel. On any other error,
 * the dispatcher fails open and proceeds.
 */

const resolveInterestedRecipientsMock =
  vi.fn<(...args: unknown[]) => Promise<unknown[]>>();
const dedupeRecipientsMock = vi.fn<(r: unknown[]) => unknown[]>((r) => r);

const createNotificationMock = vi.fn<
  (...args: unknown[]) => Promise<{ id: string }>
>(async () => ({ id: "notif-1" }));
const sendBrandedEmailMock = vi.fn<
  (...args: unknown[]) => Promise<{ id: string }>
>(async () => ({ id: "msg-1" }));
const writeSendLogMock = vi.fn<(...args: unknown[]) => Promise<{ id: string }>>(
  async () => ({ id: "log-1" }),
);
const updateSendLogStateMock = vi.fn<
  (...args: unknown[]) => Promise<undefined>
>(async () => undefined);
const sendPushToUserMock = vi.fn<
  (...args: unknown[]) => Promise<{ sent: number; failed: number }>
>(async () => ({ sent: 1, failed: 0 }));

// Insert behaviour driven per-test.
let claimInsertResult: { error: { code?: string; message?: string } | null } = {
  error: null,
};
const insertMock = vi.fn<(row: unknown) => Promise<typeof claimInsertResult>>(
  async () => claimInsertResult,
);

const adminThen = {
  select: () => adminThen,
  eq: () => adminThen,
  in: () => adminThen,
  is: () => adminThen,
  or: () => adminThen,
  order: () => adminThen,
  limit: () => adminThen,
  insert: (row: unknown) => insertMock(row),
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
  shouldSendInApp: async () => true,
  shouldSendEmail: async () => true,
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
  insertMock.mockClear();
  claimInsertResult = { error: null };
});

describe("dispatchBusinessEvent — idempotency", () => {
  it("short-circuits when claim returns 23505 (duplicate event_key)", async () => {
    claimInsertResult = { error: { code: "23505", message: "duplicate" } };
    resolveInterestedRecipientsMock.mockResolvedValue([
      { userId: "u-1", email: "a@b", recipientClass: "portal_user" },
    ]);

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    const result = await dispatchBusinessEvent({
      eventType: "new_order",
      permission: "canManageOrders",
      siteId: "site-1",
      resourceType: "order",
      resourceId: "order-1",
      title: "New order",
      message: "duplicate",
      stateHash: "paid",
    });

    expect(result.recipients).toBe(0);
    expect(result.inAppSent).toBe(0);
    expect(result.emailSent).toBe(0);
    expect(result.pushSent).toBe(0);
    expect(createNotificationMock).not.toHaveBeenCalled();
    expect(sendBrandedEmailMock).not.toHaveBeenCalled();
    expect(sendPushToUserMock).not.toHaveBeenCalled();
    // The idempotency insert was the only DB write.
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it("proceeds when claim insert succeeds (first dispatch wins)", async () => {
    claimInsertResult = { error: null };
    resolveInterestedRecipientsMock.mockResolvedValue([
      { userId: "u-1", email: "a@b", recipientClass: "portal_user" },
    ]);

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    const result = await dispatchBusinessEvent({
      eventType: "new_order",
      permission: "canManageOrders",
      siteId: "site-1",
      resourceType: "order",
      resourceId: "order-2",
      title: "New order",
      message: "first time",
      stateHash: "paid",
    });

    expect(result.recipients).toBe(1);
    expect(createNotificationMock).toHaveBeenCalledTimes(1);
  });

  it("fails open on any non-23505 claim error (transient DB issue)", async () => {
    claimInsertResult = {
      error: { code: "08006", message: "connection failure" },
    };
    resolveInterestedRecipientsMock.mockResolvedValue([
      { userId: "u-1", email: "a@b", recipientClass: "portal_user" },
    ]);

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    const result = await dispatchBusinessEvent({
      eventType: "new_order",
      permission: "canManageOrders",
      siteId: "site-1",
      resourceType: "order",
      resourceId: "order-3",
      title: "Resilient",
      message: "still fires",
      stateHash: "paid",
    });

    // Fail-open: dispatch must still happen.
    expect(result.recipients).toBe(1);
    expect(createNotificationMock).toHaveBeenCalledTimes(1);
  });

  it("derives the same event_key for identical inputs (cross-call idempotency)", async () => {
    // Simulate two callers fanning out the same event. First insert succeeds,
    // second gets 23505 — the row payload sent to insert MUST match by event_key.
    const captured: Array<{ event_key: string }> = [];
    let calls = 0;
    insertMock.mockImplementation(async (row: unknown) => {
      const r = row as { event_key: string };
      captured.push({ event_key: r.event_key });
      calls += 1;
      if (calls === 1) return { error: null };
      return { error: { code: "23505", message: "duplicate" } };
    });
    resolveInterestedRecipientsMock.mockResolvedValue([
      { userId: "u-1", email: "a@b", recipientClass: "portal_user" },
    ]);

    const { dispatchBusinessEvent } = await import(
      "../notification-dispatcher"
    );

    const opts = {
      eventType: "order_shipped" as const,
      permission: "canManageOrders" as const,
      siteId: "site-1",
      resourceType: "order",
      resourceId: "order-42",
      title: "Shipped",
      message: "Same input, same key",
      stateHash: "TRACK-XYZ",
    };

    const a = await dispatchBusinessEvent(opts);
    const b = await dispatchBusinessEvent(opts);

    expect(captured.length).toBe(2);
    expect(captured[0].event_key).toBe(captured[1].event_key);
    expect(a.recipients).toBe(1);
    expect(b.recipients).toBe(0);
  });
});
