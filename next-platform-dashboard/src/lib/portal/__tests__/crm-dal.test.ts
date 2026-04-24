import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal CRM DAL unit tests (Session 4B).
 *
 * Invariants verified:
 *   1. `checkPortalPermission` denial causes `PortalAccessDeniedError`,
 *      audits, and no DB access.
 *   2. Every method (read + write) requires `canManageCrm` — the single
 *      CRM permission key exposed by portal-auth.
 *   3. Authoritative-owner rule: a portal CRM update only touches CRM
 *      tables and never reaches into commerce (orders/customers),
 *      preserving the "commerce owns orders, CRM owns identity" contract.
 *   4. Deal `amount` is DECIMAL (pass-through) — the DAL never converts
 *      to/from cents.
 *   5. Moving a deal into a won/lost stage emits both `stage_changed`
 *      and the terminal `won`/`lost` event.
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
    crm: {
      contact: {
        created: "crm.contact.created",
        updated: "crm.contact.updated",
        deleted: "crm.contact.deleted",
        merged: "crm.contact.merged",
        tag_added: "crm.contact.tag_added",
        tag_removed: "crm.contact.tag_removed",
        note_added: "crm.contact.note_added",
      },
      company: {
        created: "crm.company.created",
        updated: "crm.company.updated",
        deleted: "crm.company.deleted",
      },
      deal: {
        created: "crm.deal.created",
        updated: "crm.deal.updated",
        deleted: "crm.deal.deleted",
        stage_changed: "crm.deal.stage_changed",
        won: "crm.deal.won",
        lost: "crm.deal.lost",
        value_changed: "crm.deal.value_changed",
        owner_changed: "crm.deal.owner_changed",
      },
      activity: {
        logged: "crm.activity.logged",
        email_sent: "crm.activity.email_sent",
        call_logged: "crm.activity.call_logged",
        meeting_logged: "crm.activity.meeting_logged",
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
  canViewInvoices: false,
  canManageLiveChat: false,
  canManageOrders: false,
  canManageProducts: false,
  canManageBookings: false,
  canManageCrm: true,
  canManageAutomation: false,
  canManageQuotes: false,
  canManageAgents: false,
  canManageCustomers: false,
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
  const mod = await import("../crm-data-access");
  const dalMod = await import("../data-access");
  return { ...mod, PortalAccessDeniedError: dalMod.PortalAccessDeniedError };
}

/**
 * Fluent table-builder mock: every method returns `self` so chains like
 * `.from(t).select(...).eq(...).order(...).single()` resolve to whatever
 * terminal data we seed on `self._result`.
 */
function makeTable(terminal: { data?: any; error?: any; count?: number }) {
  const self: any = {};
  const chain =
    (key: string) =>
    (..._args: unknown[]) => {
      self._calls.push({ key, args: _args });
      return self;
    };
  self._calls = [];
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
  logAutomationEventMock.mockClear();
});

// =============================================================================
// DENY PATHS
// =============================================================================

describe("portal CRM DAL — deny paths", () => {
  it("contacts.list denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(ns.contacts.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("contacts.create denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(
      ns.contacts.create("site-1", { firstName: "Jane", email: "j@x.test" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("companies.create denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(
      ns.companies.create("site-1", { name: "Acme" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("deals.create denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(
      ns.deals.create("site-1", { name: "Big Deal", amount: 12345.67 }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("deals.markWon denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(
      ns.deals.markWon("site-1", "deal-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("activities.create denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(
      ns.activities.create("site-1", { activityType: "note" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("pipelines.list denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(ns.pipelines.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });

  it("segments.resolve denies without canManageCrm", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createCRMNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createCRMNamespace(CTX);
    await expect(
      ns.segments.resolve("site-1", { tags: ["vip"] }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });
});

// =============================================================================
// HAPPY PATHS + AUTHORITATIVE-OWNER INVARIANT
// =============================================================================

describe("portal CRM DAL — happy paths", () => {
  it("contacts.create only writes to CRM contact table (authoritative-owner)", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);

    const insertedRow = {
      id: "c-1",
      site_id: "site-1",
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@x.test",
      phone: null,
      mobile: null,
      job_title: null,
      company_id: null,
      company: null,
      status: "active",
      lead_status: "new",
      lead_score: 0,
      tags: [],
      source: "portal",
      last_contacted_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const touchedTables: string[] = [];
    adminFromMock.mockImplementation(((table: string) => {
      touchedTables.push(table);
      return makeTable({ data: insertedRow, error: null });
    }) as any);

    const { createCRMNamespace } = await importModule();
    const ns = createCRMNamespace(CTX);
    const contact = await ns.contacts.create("site-1", {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@x.test",
    });

    expect(contact.id).toBe("c-1");
    expect(contact.email).toBe("jane@x.test");

    // AUTHORITATIVE-OWNER: CRM DAL must NEVER touch commerce tables.
    for (const t of touchedTables) {
      expect(t.startsWith("mod_crmmod01_")).toBe(true);
      expect(t).not.toMatch(/^mod_ecommerce_/);
      expect(t).not.toMatch(/^ecommerce_orders/);
      expect(t).not.toMatch(/customers$/);
    }

    // Event emitted with portal source metadata.
    expect(logAutomationEventMock).toHaveBeenCalledTimes(1);
    const [siteId, eventType, payload, meta] =
      logAutomationEventMock.mock.calls[0] as [
        string,
        string,
        Record<string, unknown>,
        Record<string, unknown>,
      ];
    expect(siteId).toBe("site-1");
    expect(eventType).toBe("crm.contact.created");
    expect(payload.source).toBe("portal");
    expect(payload.actor_user_id).toBe("auth-user-1");
    expect(meta.sourceModule).toBe("portal");
    expect(meta.sourceEntityType).toBe("contact");
  });

  it("deals.create stores amount as DECIMAL pass-through (no cents conversion)", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);

    const insertedRow = {
      id: "d-1",
      site_id: "site-1",
      name: "Big Deal",
      description: null,
      pipeline_id: "p-1",
      stage_id: "s-1",
      stage: { id: "s-1", name: "Qualified", stage_type: "open", probability: 25 },
      contact_id: null,
      company_id: null,
      amount: 12345.67,
      currency: "USD",
      probability: 25,
      status: "open",
      close_reason: null,
      expected_close_date: null,
      actual_close_date: null,
      tags: [],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    let capturedInsert: any = null;
    adminFromMock.mockImplementation(((_table: string) => {
      const t = makeTable({ data: insertedRow, error: null });
      const origInsert = t.insert;
      t.insert = (row: any) => {
        capturedInsert = row;
        return origInsert(row);
      };
      return t;
    }) as any);

    const { createCRMNamespace } = await importModule();
    const ns = createCRMNamespace(CTX);
    const deal = await ns.deals.create("site-1", {
      name: "Big Deal",
      amount: 12345.67,
      currency: "USD",
      pipelineId: "p-1",
      stageId: "s-1",
    });

    // Amount is DECIMAL pass-through — not multiplied by 100.
    expect(capturedInsert.amount).toBe(12345.67);
    expect(deal.amount).toBe(12345.67);

    // Event payload carries the raw decimal amount.
    const evt = logAutomationEventMock.mock.calls[0] as any[];
    expect(evt[1]).toBe("crm.deal.created");
    expect(evt[2].amount).toBe(12345.67);
  });

  it("deals.moveStage to a won stage emits both stage_changed and won events", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);

    const priorDealRow = {
      id: "d-1",
      site_id: "site-1",
      name: "Deal",
      stage_id: "s-open",
      stage: {
        id: "s-open",
        name: "Negotiating",
        stage_type: "open",
        probability: 60,
      },
      amount: 5000,
      currency: "USD",
      status: "open",
      tags: [],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const wonStageRow = {
      id: "s-won",
      name: "Closed Won",
      probability: 100,
      stage_type: "won",
      pipeline_id: "p-1",
    };
    const updatedDealRow = {
      ...priorDealRow,
      stage_id: "s-won",
      stage: wonStageRow,
      status: "won",
      probability: 100,
      actual_close_date: "2026-02-15",
      updated_at: "2026-02-15T00:00:00Z",
    };

    let call = 0;
    adminFromMock.mockImplementation(((table: string) => {
      call += 1;
      // Sequence for moveStage():
      //   1. fetchDeal -> deals .single() -> priorDealRow
      //   2. stages lookup .single() -> wonStageRow
      //   3. deals update .single() -> updatedDealRow
      if (table.endsWith("_deals") && call === 1) {
        return makeTable({ data: priorDealRow, error: null });
      }
      if (table.endsWith("_pipeline_stages")) {
        return makeTable({ data: wonStageRow, error: null });
      }
      return makeTable({ data: updatedDealRow, error: null });
    }) as any);

    const { createCRMNamespace } = await importModule();
    const ns = createCRMNamespace(CTX);
    const result = await ns.deals.moveStage("site-1", "d-1", "s-won");

    expect(result.status).toBe("won");
    expect(result.stageId).toBe("s-won");

    const eventTypes = logAutomationEventMock.mock.calls.map(
      (c: any[]) => c[1],
    );
    expect(eventTypes).toContain("crm.deal.stage_changed");
    expect(eventTypes).toContain("crm.deal.won");
  });

  it("portal CRM contact update does not silently revert storefront data (scope check)", async () => {
    // The authoritative-owner rule says: when a portal user edits a CRM
    // contact's identity fields, those writes are confined to the CRM
    // contacts table. They do NOT cascade back into commerce customer
    // rows. We verify this by observing the tables touched during update.
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);

    const updatedRow = {
      id: "c-1",
      site_id: "site-1",
      first_name: "Jane",
      last_name: "Doe-Updated",
      email: "jane.updated@x.test",
      phone: null,
      mobile: null,
      job_title: null,
      company_id: null,
      company: null,
      status: "active",
      lead_status: "qualified",
      lead_score: 10,
      tags: ["vip"],
      source: "portal",
      last_contacted_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-02-15T00:00:00Z",
    };
    const touchedTables: string[] = [];
    adminFromMock.mockImplementation(((table: string) => {
      touchedTables.push(table);
      return makeTable({ data: updatedRow, error: null });
    }) as any);

    const { createCRMNamespace } = await importModule();
    const ns = createCRMNamespace(CTX);
    await ns.contacts.update("site-1", "c-1", {
      lastName: "Doe-Updated",
      email: "jane.updated@x.test",
      leadStatus: "qualified",
      tags: ["vip"],
    });

    // Only CRM tables ever touched.
    expect(touchedTables.length).toBeGreaterThan(0);
    for (const t of touchedTables) {
      expect(t.startsWith("mod_crmmod01_")).toBe(true);
    }
  });
});
