import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal DAL unit tests.
 *
 * These tests exercise the cross-tenant protection guarantee of the DAL:
 * when a portal user requests a siteId they don't own, the DAL must
 * throw `PortalAccessDeniedError` and emit an audit entry — never return
 * data. This is the single most important invariant of Session 1.
 */

// ---- Mocks --------------------------------------------------------------

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

// Observability is pure side-effects; keep it quiet and pass-through.
vi.mock("../observability", () => ({
  logPortalEvent: vi.fn(),
  withPortalEvent: async (
    _event: string,
    _ctx: unknown,
    fn: () => Promise<unknown>,
  ) => fn(),
}));

// ---- Fixtures -----------------------------------------------------------

const USER: PortalUser = {
  userId: "auth-user-1",
  clientId: "client-1",
  email: "owner@acme.test",
  fullName: "Owner One",
  companyName: "Acme",
  agencyId: "agency-1",
  canViewAnalytics: true,
  canEditContent: false,
  canViewInvoices: true,
  canManageLiveChat: true,
  canManageOrders: true,
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

const CTX = {
  user: USER,
  isImpersonation: false,
  impersonatorEmail: null,
};

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
    canManageOrders: true,
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
  },
};

beforeEach(() => {
  vi.resetModules();
  resolveSiteScopeMock.mockReset();
  resolveClientSitesMock.mockReset();
  checkPortalPermissionMock.mockReset();
  auditPortalDeniedMock.mockClear();
  writePortalAuditMock.mockClear();
  adminFromMock.mockReset();
});

// ---- Tests --------------------------------------------------------------

describe("PortalDAL cross-tenant protection", () => {
  it("orders.summaryForSite throws and audits when the site is not owned", async () => {
    checkPortalPermissionMock.mockResolvedValue({
      allowed: false,
      scope: null,
      reason: "site_not_found",
    });

    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);

    await expect(
      dal.orders.summaryForSite("someone-elses-site"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);

    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    const [entry] = auditPortalDeniedMock.mock.calls[0];
    expect(entry).toMatchObject({
      clientId: USER.clientId,
      siteId: "someone-elses-site",
      action: "portal.permission.canManageOrders",
      reason: "site_not_found",
    });
    // The DB must never have been reached for a denied request.
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("conversations.summaryForSite throws permission_denied when flag is off", async () => {
    checkPortalPermissionMock.mockResolvedValue({
      allowed: false,
      scope: OWNED_SCOPE,
      reason: "permission_denied",
    });

    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);

    await expect(
      dal.conversations.summaryForSite("site-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);

    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portal.permission.canManageLiveChat",
        reason: "permission_denied",
        siteId: "site-1",
      }),
    );
  });

  it("sites.list returns empty array when the client owns no sites", async () => {
    resolveClientSitesMock.mockResolvedValue([]);
    const { createPortalDAL } = await import("../data-access");
    const dal = createPortalDAL(CTX);

    await expect(dal.sites.list()).resolves.toEqual([]);
  });

  it("sites.list forwards the resolver shape unchanged", async () => {
    const rows = [
      {
        id: "s1",
        name: "S1",
        subdomain: "s1",
        customDomain: null,
        isPublished: true,
      },
      {
        id: "s2",
        name: "S2",
        subdomain: null,
        customDomain: "s2.test",
        isPublished: false,
      },
    ];
    resolveClientSitesMock.mockResolvedValue(rows);

    const { createPortalDAL } = await import("../data-access");
    const dal = createPortalDAL(CTX);

    await expect(dal.sites.list()).resolves.toEqual(rows);
  });
});
