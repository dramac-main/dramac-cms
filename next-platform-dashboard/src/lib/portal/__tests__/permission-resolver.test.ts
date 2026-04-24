import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Permission resolver unit tests.
 *
 * We mock the admin Supabase client and the underlying
 * `getEffectivePermissions` call so these tests are deterministic and
 * run without a database. Covers the three observable outcomes of
 * `checkPortalPermission`: allow, permission_denied, site_not_found.
 */

// ---- Mocks --------------------------------------------------------------

const adminFromMock = vi.fn();
const getEffectivePermissionsMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: adminFromMock }),
}));

vi.mock("../portal-permissions", () => ({
  getEffectivePermissions: (...args: unknown[]) =>
    getEffectivePermissionsMock(...args),
}));

// server-only is a zero-runtime guard in tests.
vi.mock("server-only", () => ({}));

// ---- Helpers ------------------------------------------------------------

const SITE_ID = "11111111-1111-1111-1111-111111111111";
const CLIENT_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_CLIENT_ID = "33333333-3333-3333-3333-333333333333";

function stubSiteRow(
  row: Record<string, unknown> | null,
  error: unknown = null,
) {
  // Chainable mock that returns the given row from `.maybeSingle()`.
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  } as const;
  adminFromMock.mockReturnValue(chain);
  return chain;
}

function defaultPermissions(overrides: Record<string, boolean> = {}) {
  return {
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
    canManageInvoices: false,
    canManageSupport: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  adminFromMock.mockReset();
  getEffectivePermissionsMock.mockReset();
});

// ---- Tests --------------------------------------------------------------

describe("checkPortalPermission", () => {
  it("returns site_not_found when the site does not belong to the client", async () => {
    stubSiteRow(null);
    const { checkPortalPermission } = await import("../permission-resolver");

    const result = await checkPortalPermission(
      { clientId: OTHER_CLIENT_ID },
      SITE_ID,
      "canManageOrders",
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("site_not_found");
    expect(result.scope).toBeNull();
    // Permission fetch must be short-circuited when the site is missing.
    expect(getEffectivePermissionsMock).not.toHaveBeenCalled();
  });

  it("returns permission_denied when the site is owned but permission flag is false", async () => {
    stubSiteRow({
      id: SITE_ID,
      name: "Acme",
      agency_id: "a",
      client_id: CLIENT_ID,
      subdomain: "acme",
      custom_domain: null,
      published: true,
    });
    getEffectivePermissionsMock.mockResolvedValue(
      defaultPermissions({ canManageOrders: false }),
    );

    const { checkPortalPermission } = await import("../permission-resolver");
    const result = await checkPortalPermission(
      { clientId: CLIENT_ID },
      SITE_ID,
      "canManageOrders",
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("permission_denied");
    expect(result.scope?.siteId).toBe(SITE_ID);
  });

  it("returns allowed with full scope when the site is owned and permission is granted", async () => {
    stubSiteRow({
      id: SITE_ID,
      name: "Acme",
      agency_id: "a",
      client_id: CLIENT_ID,
      subdomain: "acme",
      custom_domain: "acme.test",
      published: true,
    });
    getEffectivePermissionsMock.mockResolvedValue(
      defaultPermissions({ canManageOrders: true }),
    );

    const { checkPortalPermission } = await import("../permission-resolver");
    const result = await checkPortalPermission(
      { clientId: CLIENT_ID },
      SITE_ID,
      "canManageOrders",
    );

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("ok");
    expect(result.scope).toMatchObject({
      siteId: SITE_ID,
      clientId: CLIENT_ID,
      customDomain: "acme.test",
      isPublished: true,
    });
  });
});

describe("resolveSiteScope cache()", () => {
  it("returns equivalent scope objects for repeated calls in the same request", async () => {
    const chain = stubSiteRow({
      id: SITE_ID,
      name: "Acme",
      agency_id: "a",
      client_id: CLIENT_ID,
      subdomain: "acme",
      custom_domain: null,
      published: true,
    });
    getEffectivePermissionsMock.mockResolvedValue(defaultPermissions());

    const { resolveSiteScope } = await import("../permission-resolver");

    const [a, b, c] = await Promise.all([
      resolveSiteScope(CLIENT_ID, SITE_ID),
      resolveSiteScope(CLIENT_ID, SITE_ID),
      resolveSiteScope(CLIENT_ID, SITE_ID),
    ]);

    expect(a).toStrictEqual(b);
    expect(b).toStrictEqual(c);
    // Note: React's `cache()` only dedupes inside an RSC render; under
    // vitest there is no request scope, so the DB call count is not
    // deterministic. The dedup guarantee is exercised end-to-end by the
    // dashboard page smoke test in Session 6. Here we only assert that
    // repeated calls produce structurally identical scopes.
    expect(chain.maybeSingle).toHaveBeenCalled();
  });
});
