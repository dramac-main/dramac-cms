import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal Support DAL unit tests (Session 4D).
 *
 * Invariants verified:
 *   1. `canManageSupport` gates every read + write. Denials audit +
 *      throw `PortalAccessDeniedError` with no DB access.
 *   2. **Double-scope rule**: every query filters
 *      `site_id = scope.siteId` AND `client_id = ctx.user.clientId`.
 *   3. Events emit with portal source metadata.
 *   4. `create` rejects empty subject/description.
 *   5. `changeStatus` sets `resolved_at = now` when status is
 *      resolved/closed, and `null` otherwise.
 */

const checkPortalPermissionMock = vi.fn<(...args: unknown[]) => unknown>();
const auditPortalDeniedMock = vi.fn<(...args: unknown[]) => Promise<undefined>>(
  async () => undefined,
);
const writePortalAuditMock = vi.fn<(...args: unknown[]) => Promise<undefined>>(
  async () => undefined,
);
const adminFromMock = vi.fn<(...args: unknown[]) => unknown>();
const logAutomationEventMock = vi.fn<
  (...args: unknown[]) => Promise<undefined>
>(async () => undefined);

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
vi.mock("@/modules/automation/services/event-processor", () => ({
  logAutomationEvent: (...args: unknown[]) => logAutomationEventMock(...args),
}));
vi.mock("@/modules/automation/lib/event-types", () => ({
  EVENT_REGISTRY: {
    support: {
      ticket: {
        created: "support.ticket.created",
        assigned: "support.ticket.assigned",
        status_changed: "support.ticket.status_changed",
        replied: "support.ticket.replied",
        closed: "support.ticket.closed",
        reopened: "support.ticket.reopened",
      },
    },
  },
}));

const USER: PortalUser = {
  userId: "auth-user-1",
  clientId: "client-1",
  email: "owner@acme.test",
  fullName: "Owner",
  companyName: "Acme",
  agencyId: "agency-1",
  canViewAnalytics: false,
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
  const mod = await import("../support-data-access");
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
    "ilike",
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
  logAutomationEventMock.mockClear();
});

// =============================================================================
// DENY PATHS
// =============================================================================

describe("portal Support DAL — deny paths", () => {
  it("tickets.list denies without canManageSupport", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createSupportNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createSupportNamespace(CTX);
    await expect(ns.tickets.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("tickets.create denies without canManageSupport", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createSupportNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createSupportNamespace(CTX);
    await expect(
      ns.tickets.create("site-1", { subject: "x", description: "y" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("tickets.reply denies without canManageSupport", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createSupportNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createSupportNamespace(CTX);
    await expect(
      ns.tickets.reply("site-1", "t-1", { message: "hi" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });
});

// =============================================================================
// HAPPY PATHS + INVARIANTS
// =============================================================================

describe("portal Support DAL — happy paths", () => {
  const TICKET_ROW = {
    id: "t-1",
    ticket_number: "TKT-001",
    subject: "Help",
    description: "I need help",
    category: "general",
    priority: "normal",
    status: "open",
    client_id: "client-1",
    site_id: "site-1",
    assigned_to: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    resolved_at: null,
  };

  it("tickets.list filters by site_id + client_id (double-scope)", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const tables: Array<{ table: string; filters: Record<string, unknown> }> =
      [];
    adminFromMock.mockImplementation(((table: string) => {
      const t = makeTable({ data: [TICKET_ROW], error: null });
      // Snapshot filters after the chain completes.
      setImmediate(() => tables.push({ table, filters: { ...t._filters } }));
      return t;
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    const rows = await ns.tickets.list("site-1");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("t-1");
    await new Promise((r) => setImmediate(r));
    expect(tables[0].filters.site_id).toBe("site-1");
    expect(tables[0].filters.client_id).toBe("client-1");
  });

  it("tickets.create inserts row + emits support.ticket.created with portal source meta", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    let insertedRow: any = null;
    adminFromMock.mockImplementation((() => {
      const t = makeTable({ data: TICKET_ROW, error: null });
      const origInsert = t.insert;
      t.insert = (row: any) => {
        insertedRow = row;
        return origInsert(row);
      };
      return t;
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    const ticket = await ns.tickets.create("site-1", {
      subject: "Help",
      description: "I need help",
    });

    expect(ticket.id).toBe("t-1");
    expect(insertedRow.client_id).toBe("client-1");
    expect(insertedRow.site_id).toBe("site-1");
    expect(insertedRow.status).toBe("open");
    expect(insertedRow.category).toBe("general");
    expect(insertedRow.priority).toBe("normal");

    expect(logAutomationEventMock).toHaveBeenCalledTimes(1);
    const [siteId, eventType, payload, meta] =
      logAutomationEventMock.mock.calls[0] as [
        string,
        string,
        Record<string, unknown>,
        Record<string, unknown>,
      ];
    expect(siteId).toBe("site-1");
    expect(eventType).toBe("support.ticket.created");
    expect(payload.source).toBe("portal");
    expect(payload.actor_user_id).toBe("auth-user-1");
    expect(meta.sourceModule).toBe("portal");
    expect(meta.sourceEntityType).toBe("support_ticket");
  });

  it("tickets.create rejects empty subject", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    adminFromMock.mockImplementation(
      (() => makeTable({ data: null, error: null })) as any,
    );

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    await expect(
      ns.tickets.create("site-1", { subject: "   ", description: "y" }),
    ).rejects.toThrowError(/subject_required/);
  });

  it("tickets.create rejects empty description", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    adminFromMock.mockImplementation(
      (() => makeTable({ data: null, error: null })) as any,
    );

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    await expect(
      ns.tickets.create("site-1", { subject: "x", description: "" }),
    ).rejects.toThrowError(/description_required/);
  });

  it("tickets.reply inserts message with sender_type=client and emits replied event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const MSG_ROW = {
      id: "m-1",
      ticket_id: "t-1",
      sender_type: "client",
      sender_id: "auth-user-1",
      sender_name: "",
      message: "thanks",
      attachments: [],
      created_at: "2026-03-01T00:00:00Z",
    };
    let insertedMsg: any = null;
    let tableCall = 0;
    adminFromMock.mockImplementation(((table: string) => {
      tableCall++;
      if (table === "support_tickets") {
        // First call = load for double-scope check; later call = updated_at bump
        return makeTable({
          data: { id: "t-1", status: "open" },
          error: null,
        });
      }
      if (table === "ticket_messages") {
        const t = makeTable({ data: MSG_ROW, error: null });
        const origInsert = t.insert;
        t.insert = (row: any) => {
          insertedMsg = row;
          return origInsert(row);
        };
        return t;
      }
      return makeTable({ data: null, error: null });
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    const msg = await ns.tickets.reply("site-1", "t-1", { message: "thanks" });

    expect(msg.id).toBe("m-1");
    expect(insertedMsg.sender_type).toBe("client");
    expect(insertedMsg.sender_id).toBe("auth-user-1");
    expect(insertedMsg.ticket_id).toBe("t-1");
    expect(tableCall).toBeGreaterThanOrEqual(2); // ticket load + message insert

    const [, eventType] = logAutomationEventMock.mock.calls[0] as any[];
    expect(eventType).toBe("support.ticket.replied");
  });

  it("tickets.changeStatus to resolved sets resolved_at + emits status_changed", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    let capturedPatch: any = null;
    adminFromMock.mockImplementation((() => {
      const t = makeTable({
        data: { ...TICKET_ROW, status: "resolved" },
        error: null,
      });
      const origUpdate = t.update;
      t.update = (patch: any) => {
        capturedPatch = patch;
        return origUpdate(patch);
      };
      return t;
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    await ns.tickets.changeStatus("site-1", "t-1", "resolved");

    expect(capturedPatch.status).toBe("resolved");
    expect(capturedPatch.resolved_at).toBeTruthy();

    const [, eventType, payload] = logAutomationEventMock.mock
      .calls[0] as any[];
    expect(eventType).toBe("support.ticket.status_changed");
    expect(payload.status).toBe("resolved");
  });

  it("tickets.changeStatus to in_progress clears resolved_at", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    let capturedPatch: any = null;
    adminFromMock.mockImplementation((() => {
      const t = makeTable({
        data: { ...TICKET_ROW, status: "in_progress" },
        error: null,
      });
      const origUpdate = t.update;
      t.update = (patch: any) => {
        capturedPatch = patch;
        return origUpdate(patch);
      };
      return t;
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    await ns.tickets.changeStatus("site-1", "t-1", "in_progress");

    expect(capturedPatch.status).toBe("in_progress");
    expect(capturedPatch.resolved_at).toBeNull();
  });

  it("tickets.close emits support.ticket.closed + sets status=closed", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    let capturedPatch: any = null;
    adminFromMock.mockImplementation((() => {
      const t = makeTable({
        data: { ...TICKET_ROW, status: "closed" },
        error: null,
      });
      const origUpdate = t.update;
      t.update = (patch: any) => {
        capturedPatch = patch;
        return origUpdate(patch);
      };
      return t;
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    await ns.tickets.close("site-1", "t-1");

    expect(capturedPatch.status).toBe("closed");
    expect(capturedPatch.resolved_at).toBeTruthy();

    const [, eventType] = logAutomationEventMock.mock.calls[0] as any[];
    expect(eventType).toBe("support.ticket.closed");
  });

  it("tickets.reopen emits support.ticket.reopened + clears resolved_at", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    let capturedPatch: any = null;
    adminFromMock.mockImplementation((() => {
      const t = makeTable({
        data: { ...TICKET_ROW, status: "open", resolved_at: null },
        error: null,
      });
      const origUpdate = t.update;
      t.update = (patch: any) => {
        capturedPatch = patch;
        return origUpdate(patch);
      };
      return t;
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    await ns.tickets.reopen("site-1", "t-1");

    expect(capturedPatch.status).toBe("open");
    expect(capturedPatch.resolved_at).toBeNull();

    const [, eventType] = logAutomationEventMock.mock.calls[0] as any[];
    expect(eventType).toBe("support.ticket.reopened");
  });

  it("tickets.detail loads ticket + messages with double-scope filter", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const MSG_ROWS = [
      {
        id: "m-1",
        sender_type: "client",
        sender_name: "Owner",
        message: "hi",
        attachments: [],
        created_at: "2026-03-01T00:00:00Z",
      },
      {
        id: "m-2",
        sender_type: "agent",
        sender_name: "Support",
        message: "hello",
        attachments: [],
        created_at: "2026-03-01T01:00:00Z",
      },
    ];
    const filterSnapshots: Record<string, unknown>[] = [];
    adminFromMock.mockImplementation(((table: string) => {
      if (table === "support_tickets") {
        const t = makeTable({ data: TICKET_ROW, error: null });
        setImmediate(() => filterSnapshots.push({ ...t._filters }));
        return t;
      }
      if (table === "ticket_messages") {
        return makeTable({ data: MSG_ROWS, error: null });
      }
      return makeTable({ data: null, error: null });
    }) as any);

    const { createSupportNamespace } = await importModule();
    const ns = createSupportNamespace(CTX);
    const detail = await ns.tickets.detail("site-1", "t-1");

    expect(detail.id).toBe("t-1");
    expect(detail.description).toBe("I need help");
    expect(detail.messages).toHaveLength(2);
    expect(detail.messages[0].senderType).toBe("client");
    expect(detail.messages[1].senderType).toBe("agent");

    await new Promise((r) => setImmediate(r));
    expect(filterSnapshots[0].site_id).toBe("site-1");
    expect(filterSnapshots[0].client_id).toBe("client-1");
    expect(filterSnapshots[0].id).toBe("t-1");
  });
});
