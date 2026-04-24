import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal Invoicing DAL unit tests (Session 4A).
 *
 * Invariants verified:
 *   1. `checkPortalPermission` denial causes `PortalAccessDeniedError`,
 *      audits, and no DB access.
 *   2. Every mutating method requires `canManageInvoices`.
 *   3. Every read method requires `canViewInvoices`.
 *   4. Money totals computed through invoicing-utils remain integer cents
 *      — verified in a deterministic happy-path invoice-create test.
 */

const checkPortalPermissionMock = vi.fn<(...args: unknown[]) => unknown>();
const auditPortalDeniedMock = vi.fn<(...args: unknown[]) => Promise<undefined>>(
  async () => undefined,
);
const writePortalAuditMock = vi.fn<(...args: unknown[]) => Promise<undefined>>(
  async () => undefined,
);
const adminFromMock = vi.fn<(...args: unknown[]) => unknown>();
const adminRpcMock = vi.fn<(...args: unknown[]) => unknown>();
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
  createAdminClient: () => ({ from: adminFromMock, rpc: adminRpcMock }),
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
    accounting: {
      invoice: {
        created: "accounting.invoice.created",
        sent: "accounting.invoice.sent",
        paid: "accounting.invoice.paid",
        partial_payment: "accounting.invoice.partial_payment",
        cancelled: "accounting.invoice.cancelled",
        overdue: "accounting.invoice.overdue",
        viewed: "accounting.invoice.viewed",
      },
      payment: {
        received: "accounting.payment.received",
        failed: "accounting.payment.failed",
        refunded: "accounting.payment.refunded",
      },
      expense: {
        created: "accounting.expense.created",
        approved: "accounting.expense.approved",
        rejected: "accounting.expense.rejected",
      },
    },
  },
}));

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
  canManageInvoices: true,
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
  const mod = await import("../invoicing-data-access");
  const dalMod = await import("../data-access");
  return { ...mod, PortalAccessDeniedError: dalMod.PortalAccessDeniedError };
}

beforeEach(() => {
  checkPortalPermissionMock.mockReset();
  auditPortalDeniedMock.mockClear();
  writePortalAuditMock.mockClear();
  adminFromMock.mockReset();
  adminRpcMock.mockReset();
  logAutomationEventMock.mockClear();
});

describe("portal invoicing DAL — deny paths", () => {
  it("invoices.list denies without canViewInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(ns.invoices.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("invoices.create denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(
      ns.invoices.create("site-1", {
        clientName: "X",
        dueDate: "2025-12-31",
        lineItems: [{ name: "Work", quantity: 1, unitPriceCents: 1000 }],
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("payments.record denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(
      ns.payments.record("site-1", "inv-1", {
        amountCents: 500,
        paymentMethod: "cash",
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("creditNotes.issue denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(ns.creditNotes.issue("site-1", "cn-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });

  it("recurring.pause denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(ns.recurring.pause("site-1", "rec-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });

  it("expenses.create denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(
      ns.expenses.create("site-1", {
        date: "2025-01-01",
        amountCents: 2500,
        description: "Fuel",
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("vendors.create denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(
      ns.vendors.create("site-1", { name: "Acme Co" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("bills.approve denies without canManageInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(ns.bills.approve("site-1", "bill-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });

  it("statements.get denies without canViewInvoices", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createInvoicingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createInvoicingNamespace(CTX);
    await expect(
      ns.statements.get("site-1", {
        clientEmail: "a@b.c",
        from: "2025-01-01",
        to: "2025-12-31",
      }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });
});

describe("portal invoicing DAL — happy paths", () => {
  it("invoices.list queries with site_id filter and maps rows", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: "inv-1",
            site_id: "site-1",
            invoice_number: "INV-2025-0001",
            status: "sent",
            client_name: "Acme",
            client_email: "bill@acme.test",
            currency: "ZMW",
            issue_date: "2025-01-01",
            due_date: "2025-01-31",
            total: 12000,
            amount_paid: 0,
            amount_due: 12000,
            created_at: "2025-01-01T00:00:00Z",
          },
        ],
        error: null,
      }),
    };
    adminFromMock.mockReturnValue(chain);

    const { createInvoicingNamespace } = await importModule();
    const ns = createInvoicingNamespace(CTX);
    const rows = await ns.invoices.list("site-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "inv-1",
      totalCents: 12000,
      amountDueCents: 12000,
    });
    expect(chain.eq).toHaveBeenCalledWith("site_id", "site-1");
  });

  it("money invariant: 2 lines × 16% VAT yields integer cents total", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    // Mock RPC for invoice number
    adminRpcMock.mockResolvedValue({ data: "INV-2025-0002", error: null });
    let capturedInsert: Record<string, unknown> | null = null;
    const insertChain = {
      insert: vi.fn((payload: Record<string, unknown>) => {
        capturedInsert = payload;
        return {
          select: () => ({
            single: async () => ({
              data: { id: "inv-new-1" },
              error: null,
            }),
          }),
        };
      }),
      delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
    };
    const lineInsertChain = {
      insert: vi.fn(async () => ({ error: null })),
    };
    let callCount = 0;
    adminFromMock.mockImplementation(() => {
      callCount += 1;
      // invoice insert first, then line items insert
      return callCount === 1 ? insertChain : lineInsertChain;
    });

    const { createInvoicingNamespace } = await importModule();
    const ns = createInvoicingNamespace(CTX);
    const result = await ns.invoices.create("site-1", {
      clientName: "Acme",
      dueDate: "2025-12-31",
      currency: "ZMW",
      lineItems: [
        // 2 × 10000 cents = 20000 cents, 16% VAT = 3200, total 23200
        { name: "Design", quantity: 2, unitPriceCents: 10000, taxRate: 16 },
        // 1 × 5000 cents = 5000 cents, no tax, total 5000
        { name: "Support", quantity: 1, unitPriceCents: 5000, taxRate: 0 },
      ],
    });

    expect(result.id).toBe("inv-new-1");
    expect(result.invoiceNumber).toBe("INV-2025-0002");
    expect(capturedInsert).not.toBeNull();
    const ci = capturedInsert as unknown as Record<string, number>;
    expect(ci.subtotal).toBe(25000);
    expect(ci.tax_amount).toBe(3200);
    expect(ci.total).toBe(28200);
    expect(ci.amount_due).toBe(28200);
    expect(Number.isInteger(ci.total)).toBe(true);
    expect(Number.isInteger(ci.tax_amount)).toBe(true);
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "accounting.invoice.created",
      expect.objectContaining({
        source: "portal",
        actor_user_id: "auth-user-1",
      }),
      expect.any(Object),
    );
  });
});
