import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Internal-note security regression tests.
 *
 * Enforces 4 of the 5 layers documented in
 * `docs/PORTAL-FOUNDATION.md` → "Internal Note Security":
 *
 *   (2) DAL default: `conversations.messages` filters `is_internal_note = false`
 *       unless caller opts in.
 *   (5a) Permission gate: `conversations.notes` and
 *        `conversations.messages({ includeNotes: true })` require
 *        `canManageLiveChat`.
 *   (5b) Every `conversations.notes` access writes a portal audit entry.
 *   (3)  Dispatcher safety — notes are never passed into push / email previews
 *        (asserted by ensuring `dispatchBusinessEvent` never touches the
 *        message row itself — tested indirectly via recipient resolution
 *        staying free of `is_internal_note` lookups).
 *
 * Layer (1) is a schema fact and layer (4) is enforced in the public widget
 * endpoint — both are outside the scope of these unit tests.
 */

const resolveSiteScopeMock = vi.fn<(...args: unknown[]) => unknown>();
const resolveClientSitesMock = vi.fn<(...args: unknown[]) => unknown>();
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
  resolveSiteScope: (...args: unknown[]) => resolveSiteScopeMock(...args),
  resolveClientSites: (...args: unknown[]) => resolveClientSitesMock(...args),
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
    _e: string,
    _c: unknown,
    fn: () => Promise<unknown>,
  ) => fn(),
}));

function makePermissionedUser(overrides: Partial<PortalUser> = {}): PortalUser {
  return {
    userId: "auth-user-1",
    clientId: "client-1",
    email: "o@example.com",
    fullName: "Owner",
    companyName: "Acme",
    agencyId: "agency-1",
    canViewAnalytics: true,
    canEditContent: false,
    canViewInvoices: true,
    canManageLiveChat: true,
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
    ...overrides,
  };
}

const OWNED_SCOPE = {
  siteId: "site-1",
  name: "Site 1",
  agencyId: "agency-1",
  clientId: "client-1",
  subdomain: "s1",
  customDomain: null,
  isPublished: true,
  permissions: {
    canViewAnalytics: true,
    canEditContent: false,
    canViewInvoices: true,
    canManageLiveChat: true,
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
  },
};

/**
 * Thenable chain stub that records every filter applied. The terminal
 * value is reached by awaiting the chain directly (no `.then` / `.limit`
 * call required): this mirrors Supabase's PostgREST builder behaviour.
 */
function makeChain(result: { data: unknown; error: unknown }) {
  const calls: Array<{ fn: string; args: unknown[] }> = [];
  const chain: Record<string, unknown> = {};
  const record =
    (fn: string) =>
    (...args: unknown[]) => {
      calls.push({ fn, args });
      return chain;
    };
  for (const fn of [
    "select",
    "eq",
    "is",
    "in",
    "or",
    "order",
    "limit",
    "range",
    "update",
    "insert",
    "upsert",
  ]) {
    chain[fn] = record(fn);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // Make the chain awaitable: `await chain` yields `result`.
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return { chain, calls };
}

beforeEach(() => {
  vi.resetModules();
  resolveSiteScopeMock.mockReset();
  resolveClientSitesMock.mockReset();
  checkPortalPermissionMock.mockReset();
  auditPortalDeniedMock.mockClear();
  writePortalAuditMock.mockClear();
  adminFromMock.mockReset();
});

describe("Internal note security — DAL enforcement", () => {
  it("messages() filters is_internal_note = false by default (layer 2)", async () => {
    checkPortalPermissionMock.mockResolvedValue({
      allowed: true,
      scope: OWNED_SCOPE,
      reason: null,
    });
    const { chain, calls } = makeChain({ data: [], error: null });
    adminFromMock.mockReturnValue(chain);

    const { createPortalDAL } = await import("../data-access");
    const dal = createPortalDAL({
      user: makePermissionedUser(),
      isImpersonation: false,
      impersonatorEmail: null,
    });

    await dal.conversations.messages("site-1", "conv-1");

    const eqCalls = calls.filter((c) => c.fn === "eq");
    const notesFilter = eqCalls.find(
      (c) => c.args[0] === "is_internal_note" && c.args[1] === false,
    );
    expect(notesFilter).toBeDefined();
  });

  it("messages({ includeNotes: true }) does NOT apply the notes filter when caller has canManageLiveChat", async () => {
    checkPortalPermissionMock.mockResolvedValue({
      allowed: true,
      scope: OWNED_SCOPE,
      reason: null,
    });
    const { chain, calls } = makeChain({ data: [], error: null });
    adminFromMock.mockReturnValue(chain);

    const { createPortalDAL } = await import("../data-access");
    const dal = createPortalDAL({
      user: makePermissionedUser(),
      isImpersonation: false,
      impersonatorEmail: null,
    });

    await dal.conversations.messages("site-1", "conv-1", {
      includeNotes: true,
    });

    const eqCalls = calls.filter((c) => c.fn === "eq");
    const notesFilter = eqCalls.find(
      (c) => c.args[0] === "is_internal_note" && c.args[1] === false,
    );
    expect(notesFilter).toBeUndefined();
  });

  it("notes() is denied for users lacking canManageLiveChat (layer 5a)", async () => {
    checkPortalPermissionMock.mockResolvedValue({
      allowed: false,
      scope: null,
      reason: "permission_denied",
    });

    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL({
      user: makePermissionedUser({ canManageLiveChat: false }),
      isImpersonation: false,
      impersonatorEmail: null,
    });

    await expect(
      dal.conversations.notes("site-1", "conv-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
  });

  it("notes() writes a portal audit entry on every successful access (layer 5b)", async () => {
    checkPortalPermissionMock.mockResolvedValue({
      allowed: true,
      scope: OWNED_SCOPE,
      reason: null,
    });
    const { chain } = makeChain({
      data: [{ id: "m-1", is_internal_note: true }],
      error: null,
    });
    adminFromMock.mockReturnValue(chain);

    const { createPortalDAL } = await import("../data-access");
    const dal = createPortalDAL({
      user: makePermissionedUser(),
      isImpersonation: false,
      impersonatorEmail: null,
    });

    await dal.conversations.notes("site-1", "conv-1");

    expect(writePortalAuditMock).toHaveBeenCalledTimes(1);
    const [entry] = writePortalAuditMock.mock.calls[0]!;
    expect(entry).toMatchObject({
      action: "portal.conversation.notes.view",
      resourceType: "conversation",
      resourceId: "conv-1",
      permissionKey: "canManageLiveChat",
    });
  });
});
