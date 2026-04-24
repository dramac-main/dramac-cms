import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Portal Marketing DAL unit tests (Session 4C).
 *
 * Invariants verified:
 *   1. `canManageMarketing` gates every read + write. Denials audit +
 *      throw `PortalAccessDeniedError` with no DB access.
 *   2. **Consent-downgrade blocks send**: `campaigns.sendNow` refuses
 *      to dispatch when the audience has zero consented subscribers.
 *      No send row is ever inserted.
 *   3. **No supplier-brand leak**: rows returned to portal callers
 *      never carry `resend_*` or `provider_*` columns.
 *   4. Events carry portal source metadata (`source:"portal"`,
 *      `actor_user_id`, `is_impersonation`, `meta.sourceModule:"portal"`).
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
    marketing: {
      campaign: {
        created: "marketing.campaign.created",
        updated: "marketing.campaign.updated",
        scheduled: "marketing.campaign.scheduled",
        started: "marketing.campaign.started",
        completed: "marketing.campaign.completed",
        paused: "marketing.campaign.paused",
        cancelled: "marketing.campaign.cancelled",
      },
      email: {
        sent: "marketing.email.sent",
        delivered: "marketing.email.delivered",
        opened: "marketing.email.opened",
        clicked: "marketing.email.clicked",
        bounced: "marketing.email.bounced",
        complained: "marketing.email.complained",
      },
      subscriber: {
        subscribed: "marketing.subscriber.subscribed",
        unsubscribed: "marketing.subscriber.unsubscribed",
        tagged: "marketing.subscriber.tagged",
      },
      sequence: {
        enrolled: "marketing.sequence.enrolled",
        completed: "marketing.sequence.completed",
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
  canManageMarketing: true,
  canManageInvoices: false,
  canManageSupport: false,
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
  const mod = await import("../marketing-data-access");
  const dalMod = await import("../data-access");
  return { ...mod, PortalAccessDeniedError: dalMod.PortalAccessDeniedError };
}

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

describe("portal Marketing DAL — deny paths", () => {
  it("lists.list denies without canManageMarketing", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMarketingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(ns.lists.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("subscribers.create denies without canManageMarketing", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMarketingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.subscribers.create("site-1", { email: "a@x.test" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("campaigns.sendNow denies without canManageMarketing", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMarketingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.campaigns.sendNow("site-1", "cmp-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("sequences.enroll denies without canManageMarketing", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMarketingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.sequences.enroll("site-1", "seq-1", "sub-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("templates.create denies without canManageMarketing", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMarketingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.templates.create("site-1", { name: "t" }),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("forms.submissions denies without canManageMarketing", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMarketingNamespace, PortalAccessDeniedError } =
      await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.forms.submissions("site-1", "form-1"),
    ).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });
});

// =============================================================================
// HAPPY PATHS + INVARIANTS
// =============================================================================

describe("portal Marketing DAL — happy paths", () => {
  it("subscribers.create records consent, tags source=portal, emits subscribed event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const insertedRow = {
      id: "sub-1",
      site_id: "site-1",
      email: "jane@x.test",
      first_name: "Jane",
      last_name: null,
      status: "active",
      email_opt_in: true,
      sms_opt_in: false,
      consent_source: "portal",
      consent_date: "2026-03-01T00:00:00Z",
      consent_ip: null,
      unsubscribed_at: null,
      unsubscribe_reason: null,
      tags: [],
      bounce_count: 0,
      created_at: "2026-03-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    };
    const touchedTables: string[] = [];
    adminFromMock.mockImplementation(((table: string) => {
      touchedTables.push(table);
      return makeTable({ data: insertedRow, error: null });
    }) as any);

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    const sub = await ns.subscribers.create("site-1", {
      email: "Jane@X.TEST",
      firstName: "Jane",
    });

    expect(sub.email).toBe("jane@x.test"); // lowercased
    expect(sub.consentSource).toBe("portal");
    expect(sub.status).toBe("active");

    // Every table touched is a marketing table.
    for (const t of touchedTables) {
      expect(t.startsWith("mod_mktmod01_")).toBe(true);
    }

    // Event + metadata.
    expect(logAutomationEventMock).toHaveBeenCalledTimes(1);
    const [siteId, eventType, payload, meta] =
      logAutomationEventMock.mock.calls[0] as [
        string,
        string,
        Record<string, unknown>,
        Record<string, unknown>,
      ];
    expect(siteId).toBe("site-1");
    expect(eventType).toBe("marketing.subscriber.subscribed");
    expect(payload.source).toBe("portal");
    expect(payload.actor_user_id).toBe("auth-user-1");
    expect(meta.sourceModule).toBe("portal");
    expect(meta.sourceEntityType).toBe("subscriber");
  });

  it("subscribers.detail strips supplier-brand columns (no Resend leak)", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    // The raw DB row carries provider metadata. The DAL must filter it.
    const rawRow = {
      id: "sub-1",
      site_id: "site-1",
      email: "a@x.test",
      first_name: null,
      last_name: null,
      status: "active",
      email_opt_in: true,
      sms_opt_in: false,
      consent_source: "form",
      consent_date: null,
      unsubscribed_at: null,
      unsubscribe_reason: null,
      tags: [],
      bounce_count: 0,
      created_at: null,
      updated_at: null,
      // Leak candidates — these must NOT appear on the mapped object.
      resend_message_id: "msg_123",
      resend_plan_tier: "pro",
      provider_webhook_id: "wh_42",
    };
    adminFromMock.mockImplementation(
      (() => makeTable({ data: rawRow, error: null })) as any,
    );

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    const sub = await ns.subscribers.detail("site-1", "sub-1");

    const json = JSON.stringify(sub).toLowerCase();
    expect(json).not.toContain("resend");
    expect(json).not.toContain("msg_123");
    expect(json).not.toContain("wh_42");
    expect(json).not.toContain("provider_");
  });

  it("subscribers.unsubscribe flips status + email_opt_in=false + emits event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const updatedRow = {
      id: "sub-1",
      site_id: "site-1",
      email: "a@x.test",
      first_name: null,
      last_name: null,
      status: "unsubscribed",
      email_opt_in: false,
      sms_opt_in: false,
      consent_source: "form",
      consent_date: null,
      unsubscribed_at: "2026-03-01T00:00:00Z",
      unsubscribe_reason: "user_requested",
      tags: [],
      bounce_count: 0,
      created_at: null,
      updated_at: null,
    };
    let capturedPatch: any = null;
    adminFromMock.mockImplementation((() => {
      const t = makeTable({ data: updatedRow, error: null });
      const origUpdate = t.update;
      t.update = (patch: any) => {
        capturedPatch = patch;
        return origUpdate(patch);
      };
      return t;
    }) as any);

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    const result = await ns.subscribers.unsubscribe(
      "site-1",
      "sub-1",
      "user_requested",
    );

    expect(capturedPatch.status).toBe("unsubscribed");
    expect(capturedPatch.email_opt_in).toBe(false);
    expect(capturedPatch.unsubscribed_at).toBeTruthy();
    expect(capturedPatch.unsubscribe_reason).toBe("user_requested");
    expect(result.status).toBe("unsubscribed");

    const [, eventType] = logAutomationEventMock.mock.calls[0] as any[];
    expect(eventType).toBe("marketing.subscriber.unsubscribed");
  });

  it("campaigns.sendNow BLOCKS when audience has zero consented recipients (consent-downgrade)", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const campaignRow = {
      id: "cmp-1",
      site_id: "site-1",
      name: "Newsletter",
      status: "draft",
      channel: "email",
      audience_id: null,
      list_id: "list-1",
      template_id: null,
      scheduled_at: null,
      sent_at: null,
      recipient_count: 0,
      open_count: 0,
      click_count: 0,
      bounce_count: 0,
      revenue_attributed: 0,
      created_at: null,
      updated_at: null,
    };

    let updateCalls = 0;
    adminFromMock.mockImplementation(((table: string) => {
      if (table === "mod_mktmod01_campaigns") {
        // First call is the load .single()
        const t = makeTable({ data: campaignRow, error: null });
        const origUpdate = t.update;
        t.update = (patch: any) => {
          updateCalls++;
          return origUpdate(patch);
        };
        return t;
      }
      if (table === "mod_mktmod01_list_subscribers") {
        // List has ONE member, but they've unsubscribed. Consent downgrade.
        return makeTable({
          data: [
            {
              subscriber: {
                id: "sub-1",
                status: "unsubscribed",
                email_opt_in: false,
              },
            },
          ],
          error: null,
        });
      }
      return makeTable({ data: null, error: null });
    }) as any);

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.campaigns.sendNow("site-1", "cmp-1"),
    ).rejects.toThrowError("no_consented_recipients");

    // No status mutation happened after the consent gate fired.
    expect(updateCalls).toBe(0);
    // No campaign.started event was emitted.
    const eventTypes = logAutomationEventMock.mock.calls.map((c: any) => c[1]);
    expect(eventTypes).not.toContain("marketing.campaign.started");
  });

  it("campaigns.sendNow PROCEEDS when audience has at least one consented recipient", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const campaignRow = {
      id: "cmp-1",
      site_id: "site-1",
      name: "Newsletter",
      status: "draft",
      channel: "email",
      audience_id: null,
      list_id: "list-1",
      template_id: null,
      scheduled_at: null,
      sent_at: null,
      recipient_count: 0,
      open_count: 0,
      click_count: 0,
      bounce_count: 0,
      revenue_attributed: 0,
      created_at: null,
      updated_at: null,
    };
    const sendingRow = { ...campaignRow, status: "sending" };

    let campaignCallNumber = 0;
    adminFromMock.mockImplementation(((table: string) => {
      if (table === "mod_mktmod01_campaigns") {
        campaignCallNumber++;
        // 1st call = load, 2nd call = update to sending.
        return makeTable({
          data: campaignCallNumber === 1 ? campaignRow : sendingRow,
          error: null,
        });
      }
      if (table === "mod_mktmod01_list_subscribers") {
        return makeTable({
          data: [
            {
              subscriber: {
                id: "sub-1",
                status: "active",
                email_opt_in: true,
              },
            },
          ],
          error: null,
        });
      }
      return makeTable({ data: null, error: null });
    }) as any);

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    const result = await ns.campaigns.sendNow("site-1", "cmp-1");

    expect(result.status).toBe("sending");
    const eventTypes = logAutomationEventMock.mock.calls.map((c: any) => c[1]);
    expect(eventTypes).toContain("marketing.campaign.started");
  });

  it("sequences.enroll BLOCKS subscribers who have revoked consent", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    adminFromMock.mockImplementation(((table: string) => {
      if (table === "mod_mktmod01_subscribers") {
        return makeTable({
          data: {
            id: "sub-1",
            status: "unsubscribed",
            email_opt_in: false,
          },
          error: null,
        });
      }
      return makeTable({ data: null, error: null });
    }) as any);

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    await expect(
      ns.sequences.enroll("site-1", "seq-1", "sub-1"),
    ).rejects.toThrowError("no_consent");

    const eventTypes = logAutomationEventMock.mock.calls.map((c: any) => c[1]);
    expect(eventTypes).not.toContain("marketing.sequence.enrolled");
  });

  it("campaigns.detail strips supplier-brand columns", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const rawRow = {
      id: "cmp-1",
      site_id: "site-1",
      name: "Promo",
      subject: "Hi",
      status: "sent",
      channel: "email",
      audience_id: null,
      template_id: null,
      scheduled_at: null,
      sent_at: null,
      recipient_count: 10,
      open_count: 3,
      click_count: 1,
      bounce_count: 0,
      revenue_attributed: 9900, // cents — passthrough
      created_at: null,
      updated_at: null,
      // Leak candidates.
      resend_message_id: "msg_1",
      resend_plan_tier: "pro",
      provider_batch_id: "b_1",
    };
    adminFromMock.mockImplementation(
      (() => makeTable({ data: rawRow, error: null })) as any,
    );

    const { createMarketingNamespace } = await importModule();
    const ns = createMarketingNamespace(CTX);
    const campaign = await ns.campaigns.detail("site-1", "cmp-1");

    // Money is CENTS pass-through (no double conversion).
    expect(campaign.revenueAttributed).toBe(9900);

    const json = JSON.stringify(campaign).toLowerCase();
    expect(json).not.toContain("resend");
    expect(json).not.toContain("msg_1");
    expect(json).not.toContain("provider_");
  });
});
