import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal Commerce DAL unit tests (Session 3).
 *
 * These tests exercise the cross-tenant protection guarantee for every
 * commerce namespace — orders (list/detail/updateStatus), products,
 * customers, quotes, bookings, and payment proofs. The key invariant is
 * that when `checkPortalPermission` denies a request, the DAL must
 * throw `PortalAccessDeniedError`, write an audit entry, and never reach
 * the database.
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
const logAutomationEventMock = vi.fn<
  (...args: unknown[]) => Promise<undefined>
>(async () => undefined);

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
    ecommerce: {
      order: {
        status_changed: "ecommerce.order.status_changed",
        shipped: "ecommerce.order.shipped",
        refunded: "ecommerce.order.refunded",
      },
      payment: {
        proof_approved: "ecommerce.payment.proof_approved",
        proof_rejected: "ecommerce.payment.proof_rejected",
      },
      quote: {
        sent: "ecommerce.quote.sent",
        accepted: "ecommerce.quote.accepted",
        rejected: "ecommerce.quote.rejected",
        converted_to_order: "ecommerce.quote.converted_to_order",
      },
      product: {
        stock_adjusted: "ecommerce.product.stock_adjusted",
        low_stock: "ecommerce.product.low_stock",
      },
    },
    booking: {
      appointment: {
        status_changed: "booking.appointment.status_changed",
        cancelled: "booking.appointment.cancelled",
      },
    },
  },
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
  canManageProducts: true,
  canManageBookings: true,
  canManageCrm: true,
  canManageAutomation: false,
  canManageQuotes: true,
  canManageAgents: false,
  canManageCustomers: true,
  canManageMarketing: false,
  canManageInvoices: false,
  canManageSupport: false,
};

const CTX = {
  user: USER,
  isImpersonation: false,
  impersonatorEmail: null,
};

const DENIED = {
  allowed: false,
  scope: null,
  reason: "site_not_found" as const,
};

beforeEach(() => {
  vi.resetModules();
  resolveSiteScopeMock.mockReset();
  resolveClientSitesMock.mockReset();
  checkPortalPermissionMock.mockReset();
  auditPortalDeniedMock.mockClear();
  writePortalAuditMock.mockClear();
  adminFromMock.mockReset();
  logAutomationEventMock.mockClear();
});

// ---- Cross-tenant denial tests -----------------------------------------

describe("Portal Commerce DAL cross-tenant protection", () => {
  it("orders.list throws + audits + never touches DB on deny", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(dal.orders.list("foreign-site")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "foreign-site",
        action: "portal.permission.canManageOrders",
        reason: "site_not_found",
      }),
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("orders.detail denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.orders.detail("foreign-site", "ord-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("orders.updateStatus denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.orders.updateStatus("foreign-site", "ord-1", {
        status: "processing",
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("products.list denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(dal.products.list("foreign-site")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portal.permission.canManageProducts",
      }),
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("products.adjustInventory denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.products.adjustInventory("foreign-site", "prod-1", {
        delta: -5,
        reason: "hack",
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("customers.list denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(dal.customers.list("foreign-site")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portal.permission.canManageCustomers",
      }),
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("quotes.list denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(dal.quotes.list("foreign-site")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "portal.permission.canManageQuotes" }),
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("quotes.convertToOrder denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.quotes.convertToOrder("foreign-site", "q-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("bookings.list denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(dal.bookings.list("foreign-site")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portal.permission.canManageBookings",
      }),
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("bookings.updateStatus denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.bookings.updateStatus("foreign-site", "appt-1", {
        status: "cancelled",
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("payments.listProofs denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.payments.listProofs("foreign-site"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(auditPortalDeniedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portal.permission.canManageOrders",
      }),
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("payments.approveProof denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.payments.approveProof("foreign-site", "pp-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("payments.rejectProof denies", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createPortalDAL, PortalAccessDeniedError } =
      await import("../data-access");
    const dal = createPortalDAL(CTX);
    await expect(
      dal.payments.rejectProof("foreign-site", "pp-1", { reason: "bad" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });
});
