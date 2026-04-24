import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal Communications DAL unit tests (Session 4D).
 *
 * Invariants verified:
 *   1. `canViewAnalytics` gates access (observability surface).
 *   2. Double-scope rule: `site_id = scope.siteId` AND
 *      `client_id = ctx.user.clientId` on every query.
 *   3. **No supplier-brand leak**: `provider`, `provider_message_id`,
 *      and any column containing resend/sendgrid/mailgun/postmark/twilio
 *      is stripped from returned entries.
 *   4. `stats` aggregates byChannel + byState correctly.
 *   5. DAL is read-only — no insert/update operations exposed.
 */

const checkPortalPermissionMock = vi.fn<(...args: unknown[]) => unknown>();
const auditPortalDeniedMock = vi.fn<(...args: unknown[]) => Promise<undefined>>(
  async () => undefined,
);
const writePortalAuditMock = vi.fn<(...args: unknown[]) => Promise<undefined>>(
  async () => undefined,
);
const adminFromMock = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("server-only", () => ({}));
vi.mock("../permission-resolver", () => ({
  resolveSiteScope: vi.fn(),
  resolveClientSites: vi.fn(),
  checkPortalPermission: (...args: unknown[]) =>
    checkPortalPermissionMock(...args),
}));
vi.mock("../audit-log", () => ({
  auditPortalDenied: (...args: unknown[]) => auditPortalDeniedMock(...args),
  writePortalAudit: (...args: unknown[]) => writePortalAuditMock(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: adminFromMock }),
}));
vi.mock("../observability", () => ({
  logPortalEvent: vi.fn(),
  withPortalEvent: async (
    _event: string,
    _ctx: unknown,
    fn: () => Promise<unknown>,
  ) => fn(),
}));

const USER: PortalUser = {
  userId: "auth-user-1",
  clientId: "client-1",
  email: "owner@acme.test",
  fullName: "Owner",
  companyName: "Acme",
  agencyId: "agency-1",
  canViewAnalytics: true,
  canEditContent: false,
  canViewInvoices: false,
  canManageLiveChat: false,
  canManageOrders: false,
  canManageProducts: false,
  canManageBookings: false,
  canManageCrm: false,
  canManageAutomation: false,
  canManageQuotes: false,
  canManageAgents: false,
  canManageCustomers: false,
  canManageMarketing: false,
  canManageInvoices: false,
  canManageSupport: true,
};
const CTX = { user: USER, isImpersonation: false, impersonatorEmail: null };
const DENIED = {
  allowed: false,
  scope: null,
  reason: "permission_denied" as const,
};
const SCOPE = {
  siteId: "site-1",
  clientId: "client-1",
  agencyId: "agency-1",
  isPublished: true,
};
const ALLOWED = { allowed: true, scope: SCOPE, reason: null } as const;

async function importModule() {
  const mod = await import("../communications-data-access");
  const dalMod = await import("../data-access");
  return { ...mod, PortalAccessDeniedError: dalMod.PortalAccessDeniedError };
}

function makeTable(terminal: { data?: any; error?: any; count?: number }) {
  const self: any = {};
  self._calls = [];
  self._filters = {};
  const chain =
    (key: string) =>
    (...args: unknown[]) => {
      self._calls.push({ key, args });
      if (key === "eq" && typeof args[0] === "string") {
        self._filters[args[0]] = args[1];
      }
      return self;
    };
  for (const k of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "or",
    "order",
    "range",
    "gte",
    "lte",
    "overlaps",
    "not",
    "limit",
  ]) {
    self[k] = chain(k);
  }
  self.single = () => Promise.resolve(terminal);
  self.then = (resolve: (v: any) => void) => resolve(terminal);
  return self;
}

beforeEach(() => {
  checkPortalPermissionMock.mockReset();
  auditPortalDeniedMock.mockClear();
  writePortalAuditMock.mockClear();
  adminFromMock.mockReset();
});

// =============================================================================
// DENY PATHS
// =============================================================================

describe("portal Communications DAL — deny paths", () => {
  it("sendLog.list denies without canViewAnalytics", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCommunicationsNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCommunicationsNamespace(CTX);
    await expect(ns.sendLog.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("sendLog.detail denies without canViewAnalytics", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCommunicationsNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCommunicationsNamespace(CTX);
    await expect(
      ns.sendLog.detail("site-1", "log-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("sendLog.stats denies without canViewAnalytics", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCommunicationsNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCommunicationsNamespace(CTX);
    await expect(ns.sendLog.stats("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });
});

// =============================================================================
// HAPPY PATHS + INVARIANTS
// =============================================================================

describe("portal Communications DAL — happy paths", () => {
  const LOG_ROW = {
    id: "log-1",
    created_at: "2026-03-01T00:00:00Z",
    event_type: "invoice.created",
    recipient_class: "portal_client",
    channel: "email",
    delivery_state: "delivered",
    attempt: 1,
    latency_ms: 450,
    error_code: null,
    error_message: null,
    metadata: { template: "invoice-new" },
    // Leak candidates — DAL must strip these.
    provider: "resend",
    provider_message_id: "msg_abc123",
    provider_batch_id: "batch_1",
    resend_account: "primary",
    sendgrid_id: "sg_1",
    mailgun_domain: "x.com",
    postmark_stream: "outbound",
    twilio_sid: "TW_1",
  };

  it("sendLog.list strips provider + provider_* + brand columns", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    adminFromMock.mockImplementation(
      (() => makeTable({ data: [LOG_ROW], error: null })) as any,
    );

    const { createCommunicationsNamespace } = await importModule();
    const ns = createCommunicationsNamespace(CTX);
    const entries = await ns.sendLog.list("site-1");

    expect(entries).toHaveLength(1);
    const json = JSON.stringify(entries[0]).toLowerCase();
    expect(json).not.toContain("resend");
    expect(json).not.toContain("msg_abc123");
    expect(json).not.toContain("provider");
    expect(json).not.toContain("sendgrid");
    expect(json).not.toContain("mailgun");
    expect(json).not.toContain("postmark");
    expect(json).not.toContain("twilio");

    // Core fields preserved.
    expect(entries[0].id).toBe("log-1");
    expect(entries[0].channel).toBe("email");
    expect(entries[0].deliveryState).toBe("delivered");
    expect(entries[0].eventType).toBe("invoice.created");
    expect(entries[0].latencyMs).toBe(450);
  });

  it("sendLog.list filters by site_id + client_id (double-scope)", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const snapshots: Record<string, unknown>[] = [];
    adminFromMock.mockImplementation((() => {
      const t = makeTable({ data: [LOG_ROW], error: null });
      setImmediate(() => snapshots.push({ ...t._filters }));
      return t;
    }) as any);

    const { createCommunicationsNamespace } = await importModule();
    const ns = createCommunicationsNamespace(CTX);
    await ns.sendLog.list("site-1");

    await new Promise((r) => setImmediate(r));
    expect(snapshots[0].site_id).toBe("site-1");
    expect(snapshots[0].client_id).toBe("client-1");
  });

  it("sendLog.list accepts array channel + deliveryState filters", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const calls: Array<{ key: string; args: unknown[] }> = [];
    adminFromMock.mockImplementation((() => {
      const t = makeTable({ data: [], error: null });
      const origIn = t.in;
      t.in = (col: string, vals: unknown[]) => {
        calls.push({ key: "in", args: [col, vals] });
        return origIn(col, vals);
      };
      return t;
    }) as any);

    const { createCommunicationsNamespace } = await importModule();
    const ns = createCommunicationsNamespace(CTX);
    await ns.sendLog.list("site-1", {
      channel: ["email", "sms"],
      deliveryState: ["delivered", "bounced"],
    });

    const cols = calls.map((c) => c.args[0]);
    expect(cols).toContain("channel");
    expect(cols).toContain("delivery_state");
  });

  it("sendLog.detail double-scope-checks site_id + client_id", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const snapshots: Record<string, unknown>[] = [];
    adminFromMock.mockImplementation((() => {
      const t = makeTable({ data: LOG_ROW, error: null });
      setImmediate(() => snapshots.push({ ...t._filters }));
      return t;
    }) as any);

    const { createCommunicationsNamespace } = await importModule();
    const ns = createCommunicationsNamespace(CTX);
    const entry = await ns.sendLog.detail("site-1", "log-1");

    expect(entry.id).toBe("log-1");
    const json = JSON.stringify(entry).toLowerCase();
    expect(json).not.toContain("provider");
    expect(json).not.toContain("resend");

    await new Promise((r) => setImmediate(r));
    expect(snapshots[0].site_id).toBe("site-1");
    expect(snapshots[0].client_id).toBe("client-1");
    expect(snapshots[0].id).toBe("log-1");
  });

  it("sendLog.stats aggregates byChannel + byState correctly", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const ROWS = [
      { channel: "email", delivery_state: "delivered" },
      { channel: "email", delivery_state: "delivered" },
      { channel: "email", delivery_state: "bounced" },
      { channel: "sms", delivery_state: "sent" },
      { channel: "in_app", delivery_state: "delivered" },
    ];
    adminFromMock.mockImplementation(
      (() => makeTable({ data: ROWS, error: null })) as any,
    );

    const { createCommunicationsNamespace } = await importModule();
    const ns = createCommunicationsNamespace(CTX);
    const stats = await ns.sendLog.stats("site-1");

    expect(stats.totalCount).toBe(5);
    expect(stats.byChannel.email).toBe(3);
    expect(stats.byChannel.sms).toBe(1);
    expect(stats.byChannel.in_app).toBe(1);
    expect(stats.byState.delivered).toBe(3);
    expect(stats.byState.bounced).toBe(1);
    expect(stats.byState.sent).toBe(1);
  });
});
