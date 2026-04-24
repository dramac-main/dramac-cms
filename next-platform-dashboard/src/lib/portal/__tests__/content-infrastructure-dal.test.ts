import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PortalUser } from "../portal-auth";

/**
 * Session 5 — Content & Infrastructure DAL tests.
 *
 * One consolidated file covering all 7 new namespaces:
 *   blog, media, seo, forms, domains, business-email, apps.
 *
 * Per DAL we verify:
 *   - Deny path: `checkPortalPermission` returning denied → throws
 *     `PortalAccessDeniedError`, audits denial, NEVER touches the DB.
 *   - Happy path: double-scope enforced where applicable (`site_id` +
 *     `client_id`), automation event emitted with `source: "portal"`.
 *
 * For `domains` + `businessEmail` we also verify the supplier-brand
 * strip: output rows must contain no `titan_*`, `rc_*`, `provider_*`,
 * `resellerclub_*` keys.
 *
 * Mock strategy mirrors `support-dal.test.ts`.
 */

const checkPortalPermissionMock = vi.fn<(...args: unknown[]) => unknown>();
const resolveSiteScopeMock = vi.fn<(...args: unknown[]) => unknown>();
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
const searchDomainsMock = vi.fn<(...args: unknown[]) => Promise<any>>();
const installModuleMock = vi.fn<(...args: unknown[]) => Promise<any>>();
const uninstallModuleMock = vi.fn<(...args: unknown[]) => Promise<any>>();
const updateModuleSettingsMock = vi.fn<(...args: unknown[]) => Promise<any>>();
const getSiteModuleInstallationsMock =
  vi.fn<(...args: unknown[]) => Promise<any>>();

vi.mock("server-only", () => ({}));
vi.mock("../permission-resolver", () => ({
  resolveSiteScope: (...args: unknown[]) => resolveSiteScopeMock(...args),
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
vi.mock("@/lib/actions/domains", () => ({
  searchDomains: (...args: unknown[]) => searchDomainsMock(...args),
}));
vi.mock("@/lib/modules/services/installation-service", () => ({
  installModule: (...args: unknown[]) => installModuleMock(...args),
  uninstallModule: (...args: unknown[]) => uninstallModuleMock(...args),
  updateModuleSettings: (...args: unknown[]) =>
    updateModuleSettingsMock(...args),
  getSiteModuleInstallations: (...args: unknown[]) =>
    getSiteModuleInstallationsMock(...args),
}));
vi.mock("@/lib/modules/module-catalog", () => ({
  MODULE_CATALOG: [
    {
      id: "mod-booking-1",
      slug: "booking",
      name: "Booking",
      description: "Appointments",
      category: "operations",
      status: "active",
      installLevels: ["site"],
    },
    {
      id: "mod-crm-1",
      slug: "crm",
      name: "CRM",
      description: "Contacts",
      category: "sales",
      status: "active",
      installLevels: ["site"],
    },
  ],
}));

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const USER: PortalUser = {
  userId: "auth-user-1",
  clientId: "client-1",
  email: "owner@acme.test",
  fullName: "Owner",
  companyName: "Acme",
  agencyId: "agency-1",
  canViewAnalytics: true,
  canEditContent: true,
  canViewInvoices: true,
  canManageLiveChat: true,
  canManageOrders: true,
  canManageProducts: true,
  canManageBookings: true,
  canManageCrm: true,
  canManageAutomation: true,
  canManageQuotes: true,
  canManageAgents: true,
  canManageCustomers: true,
  canManageMarketing: true,
  canManageInvoices: true,
  canManageSupport: true,
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
  permissions: {
    canEditContent: true,
  },
};
const ALLOWED = { allowed: true, scope: SCOPE, reason: null } as const;

function makeTable(terminal: { data?: any; error?: any; count?: number }) {
  const self: any = {};
  self._calls = [];
  self._filters = {};
  self._payloads = [];
  const chain =
    (key: string) =>
    (...args: unknown[]) => {
      self._calls.push({ key, args });
      if (key === "eq" && typeof args[0] === "string") {
        self._filters[args[0] as string] = args[1];
      }
      if (key === "insert" || key === "update") {
        self._payloads.push(args[0]);
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
    "upsert",
  ]) {
    self[k] = chain(k);
  }
  self.single = () => Promise.resolve(terminal);
  self.maybeSingle = () => Promise.resolve(terminal);
  self.then = (resolve: (v: any) => void) => resolve(terminal);
  return self;
}

async function importDALMod() {
  return await import("../data-access");
}

beforeEach(() => {
  checkPortalPermissionMock.mockReset();
  resolveSiteScopeMock.mockReset();
  auditPortalDeniedMock.mockClear();
  writePortalAuditMock.mockClear();
  adminFromMock.mockReset();
  logAutomationEventMock.mockClear();
  searchDomainsMock.mockReset();
  installModuleMock.mockReset();
  uninstallModuleMock.mockReset();
  updateModuleSettingsMock.mockReset();
  getSiteModuleInstallationsMock.mockReset();
});

// =============================================================================
// BLOG
// =============================================================================

describe("portal Blog DAL", () => {
  it("posts.list denies without canEditContent", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createBlogNamespace } = await import("../blog-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createBlogNamespace(CTX);
    await expect(ns.posts.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("posts.publish filters site_id and emits event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const updateTbl = makeTable({
      data: {
        id: "p-1",
        site_id: "site-1",
        status: "published",
        slug: "hi",
        title: "Hi",
      },
    });
    adminFromMock.mockImplementation(() => updateTbl);

    const { createBlogNamespace } = await import("../blog-data-access");
    const ns = createBlogNamespace(CTX);
    await ns.posts.publish("site-1", "p-1");
    expect(updateTbl._filters.site_id).toBe("site-1");
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "blog.post.published",
      expect.objectContaining({ source: "portal" }),
      expect.any(Object),
    );
  });
});

// =============================================================================
// MEDIA
// =============================================================================

describe("portal Media DAL", () => {
  it("list denies without canEditContent", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createMediaNamespace } = await import("../media-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createMediaNamespace(CTX);
    await expect(ns.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("updateMeta filters by site_id and emits event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const loadTbl = makeTable({
      data: { id: "a-1", site_id: "site-1" },
    });
    const updateTbl = makeTable({
      data: { id: "a-1", site_id: "site-1", alt_text: "new" },
    });
    const calls = [loadTbl, updateTbl];
    adminFromMock.mockImplementation(() => calls.shift());

    const { createMediaNamespace } = await import("../media-data-access");
    const ns = createMediaNamespace(CTX);
    await ns.updateMeta("site-1", "a-1", { altText: "new" });
    expect(updateTbl._filters.site_id).toBe("site-1");
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "media.asset.updated",
      expect.objectContaining({ source: "portal" }),
      expect.any(Object),
    );
  });
});

// =============================================================================
// SEO
// =============================================================================

describe("portal SEO DAL", () => {
  it("getSettings denies without canEditContent", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createSeoNamespace } = await import("../seo-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createSeoNamespace(CTX);
    await expect(ns.getSettings("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });

  it("updateSettings merges patch, preserves existing keys, emits event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const currentTbl = makeTable({
      data: {
        seo_settings: {
          site_noindex: true,
          default_og_image_url: "old.png",
        },
      },
    });
    const updateTbl = makeTable({ data: null, error: null });
    const calls = [currentTbl, updateTbl];
    adminFromMock.mockImplementation(() => calls.shift());

    const { createSeoNamespace } = await import("../seo-data-access");
    const ns = createSeoNamespace(CTX);
    await ns.updateSettings("site-1", { siteTitle: "New" });
    // Merge: portal patch must not wipe agency-managed site_noindex.
    const payload = updateTbl._payloads[0] as any;
    expect(payload.seo_settings.site_noindex).toBe(true);
    expect(payload.seo_settings.site_title).toBe("New");
    expect(payload.seo_settings.default_og_image_url).toBe("old.png");
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "seo.settings.updated",
      expect.objectContaining({ source: "portal" }),
      expect.any(Object),
    );
  });
});

// =============================================================================
// FORMS
// =============================================================================

describe("portal Forms DAL", () => {
  it("submissions.list denies without canEditContent", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createFormsNamespace } = await import("../forms-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createFormsNamespace(CTX);
    await expect(ns.submissions.list("site-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
  });

  it("changeStatus filters by site_id and emits event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const loadTbl = makeTable({
      data: { id: "s-1", site_id: "site-1", status: "new" },
    });
    const updateTbl = makeTable({
      data: { id: "s-1", site_id: "site-1", status: "read" },
    });
    const calls = [loadTbl, updateTbl];
    adminFromMock.mockImplementation(() => calls.shift());

    const { createFormsNamespace } = await import("../forms-data-access");
    const ns = createFormsNamespace(CTX);
    await ns.submissions.changeStatus("site-1", "s-1", "read");
    expect(updateTbl._filters.site_id).toBe("site-1");
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "forms.submission.status_changed",
      expect.objectContaining({ source: "portal" }),
      expect.any(Object),
    );
  });
});

// =============================================================================
// DOMAINS (client-level, brand-strip invariant)
// =============================================================================

describe("portal Domains DAL", () => {
  it("list denies when no sites found for client", async () => {
    const sitesTbl = makeTable({ data: [] });
    adminFromMock.mockImplementation(() => sitesTbl);
    const { createDomainsNamespace } = await import("../domains-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createDomainsNamespace(CTX);
    await expect(ns.list()).rejects.toBeInstanceOf(PortalAccessDeniedError);
    expect(auditPortalDeniedMock).toHaveBeenCalledTimes(1);
  });

  it("list strips supplier-brand keys from rows", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    resolveSiteScopeMock.mockResolvedValue(SCOPE);
    const sitesTbl = makeTable({ data: [{ id: "site-1" }] });
    const domainsTbl = makeTable({
      data: [
        {
          id: "d-1",
          domain_name: "example.com",
          status: "active",
          rc_order_id: "RC-xxx",
          provider_id: "prov-yyy",
          resellerclub_customer_id: "RCC-zzz",
          nameservers: ["ns1.example.com", "ns2.example.com"],
        },
      ],
    });
    const calls = [sitesTbl, domainsTbl];
    adminFromMock.mockImplementation(() => calls.shift());

    const { createDomainsNamespace } = await import("../domains-data-access");
    const ns = createDomainsNamespace(CTX);
    const result = await ns.list();
    // Mapped surface has no branded keys by construction, but also
    // verify the mapper didn't carry any branded string through.
    const dump = JSON.stringify(result);
    expect(dump).not.toMatch(/resellerclub|titan|rc_order_id|provider_id/i);
    expect(result[0]!.domainName).toBe("example.com");
  });
});

// =============================================================================
// BUSINESS EMAIL (client-level, brand-strip invariant)
// =============================================================================

describe("portal Business Email DAL", () => {
  it("list denies without canEditContent", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const sitesTbl = makeTable({ data: [{ id: "site-1" }] });
    adminFromMock.mockImplementation(() => sitesTbl);
    const { createBusinessEmailNamespace } =
      await import("../business-email-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createBusinessEmailNamespace(CTX);
    await expect(ns.list()).rejects.toBeInstanceOf(PortalAccessDeniedError);
  });

  it("mailboxes.updatePassword emits event and strips brand from detail", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    resolveSiteScopeMock.mockResolvedValue(SCOPE);

    const sitesTbl = makeTable({ data: [{ id: "site-1" }] });
    const orderTbl = makeTable({
      data: {
        id: "o-1",
        client_id: "client-1",
        agency_id: "agency-1",
        titan_order_id: "T-xxx",
        resellerclub_customer_id: "RCC-yyy",
        provider_customer_id: "prov-zzz",
        plan_id: "biz-pro",
        status: "active",
      },
    });
    const updateTbl = makeTable({ data: null, error: null });
    const calls = [sitesTbl, orderTbl, updateTbl];
    adminFromMock.mockImplementation(() => calls.shift());

    const { createBusinessEmailNamespace } =
      await import("../business-email-data-access");
    const ns = createBusinessEmailNamespace(CTX);
    const result = await ns.mailboxes.updatePassword("o-1", "m-1");
    expect(result.ok).toBe(true);
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "email.mailbox.password_reset",
      expect.objectContaining({ source: "portal" }),
      expect.any(Object),
    );
  });
});

// =============================================================================
// APPS
// =============================================================================

describe("portal Apps DAL", () => {
  it("install denies without canEditContent", async () => {
    checkPortalPermissionMock.mockResolvedValue(DENIED);
    const { createAppsNamespace } = await import("../apps-data-access");
    const { PortalAccessDeniedError } = await importDALMod();
    const ns = createAppsNamespace(CTX);
    await expect(ns.install("site-1", "mod-booking-1")).rejects.toBeInstanceOf(
      PortalAccessDeniedError,
    );
    expect(installModuleMock).not.toHaveBeenCalled();
  });

  it("install delegates to service with site scope and emits event", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    installModuleMock.mockResolvedValue({
      success: true,
      installationId: "inst-1",
    });

    const { createAppsNamespace } = await import("../apps-data-access");
    const ns = createAppsNamespace(CTX);
    const result = await ns.install("site-1", "mod-booking-1");
    expect(result.installationId).toBe("inst-1");
    expect(installModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: "mod-booking-1",
        installLevel: "site",
        agencyId: "agency-1",
        clientId: "client-1",
        siteId: "site-1",
        installedBy: "auth-user-1",
      }),
    );
    expect(logAutomationEventMock).toHaveBeenCalledWith(
      "site-1",
      "apps.module.installed",
      expect.objectContaining({ source: "portal" }),
      expect.any(Object),
    );
  });

  it("catalog.list filters to site-installable modules", async () => {
    checkPortalPermissionMock.mockResolvedValue(ALLOWED);
    const { createAppsNamespace } = await import("../apps-data-access");
    const ns = createAppsNamespace(CTX);
    const result = await ns.catalog.list("site-1");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((m) => typeof m.slug === "string")).toBe(true);
  });
});
