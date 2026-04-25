import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Section 7 — `writePortalAudit` impersonation mirror tests.
 *
 * Contract under test: when a write happens while impersonating
 * (isImpersonation === true) AND the action did not just fail (result === "ok")
 * AND the action is not a pure read verb, the row is mirrored into
 * `impersonation_actions`. Pure reads must NOT be mirrored. Failed actions
 * must NOT be mirrored. Non-impersonation writes must NOT be mirrored.
 */

vi.mock("server-only", () => ({}));

interface InsertedRow {
  table: string;
  row: Record<string, unknown>;
}
const inserts: InsertedRow[] = [];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => {
        inserts.push({ table, row });
        return { error: null };
      },
    }),
  }),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (k: string) =>
      k === "x-forwarded-for" ? "203.0.113.5" : k === "user-agent" ? "test-ua" : null,
  }),
}));

vi.mock("../observability", () => ({
  logPortalEvent: vi.fn(),
}));

beforeEach(() => {
  inserts.length = 0;
  vi.resetModules();
});

function tables() {
  return inserts.map((i) => i.table);
}

describe("writePortalAudit — impersonation mirror", () => {
  it("mirrors successful WRITE actions into impersonation_actions when impersonating", async () => {
    const { writePortalAudit } = await import("../audit-log");

    await writePortalAudit({
      authUserId: "admin-1",
      clientId: "client-1",
      agencyId: "agency-1",
      siteId: "site-1",
      isImpersonation: true,
      impersonatorEmail: "admin@agency.test",
      action: "portal.scripted_flow.create",
      resourceType: "scripted_flow",
      resourceId: "flow-1",
      result: "ok",
    });

    expect(tables()).toContain("portal_audit_log");
    expect(tables()).toContain("impersonation_actions");

    const mirror = inserts.find((i) => i.table === "impersonation_actions")!;
    expect(mirror.row.impersonator_user_id).toBe("admin-1");
    expect(mirror.row.impersonated_client_id).toBe("client-1");
    expect(mirror.row.action_type).toBe("portal.scripted_flow.create");
    const meta = mirror.row.metadata as Record<string, unknown>;
    expect(meta.impersonatorEmail).toBe("admin@agency.test");
    expect(meta.ipAddress).toBe("203.0.113.5");
  });

  it("does NOT mirror pure read verbs (.view/.list/.read/.search/.count)", async () => {
    const { writePortalAudit } = await import("../audit-log");

    for (const verb of [
      "portal.orders.view",
      "portal.orders.list",
      "portal.support.read",
      "portal.products.search",
      "portal.audit.count",
    ]) {
      await writePortalAudit({
        authUserId: "admin-1",
        clientId: "client-1",
        agencyId: "agency-1",
        siteId: "site-1",
        isImpersonation: true,
        action: verb,
        result: "ok",
      });
    }

    // Each iteration must write to portal_audit_log but never to the mirror.
    expect(tables().filter((t) => t === "portal_audit_log").length).toBe(5);
    expect(tables()).not.toContain("impersonation_actions");
  });

  it("does NOT mirror when not impersonating, even on a write action", async () => {
    const { writePortalAudit } = await import("../audit-log");

    await writePortalAudit({
      authUserId: "user-1",
      clientId: "client-1",
      agencyId: "agency-1",
      action: "portal.scripted_flow.create",
      result: "ok",
      // isImpersonation omitted -> defaults to false
    });

    expect(tables()).toEqual(["portal_audit_log"]);
  });

  it("does NOT mirror failed actions (result !== ok)", async () => {
    const { writePortalAudit } = await import("../audit-log");

    await writePortalAudit({
      authUserId: "admin-1",
      clientId: "client-1",
      agencyId: "agency-1",
      isImpersonation: true,
      action: "portal.scripted_flow.create",
      result: "denied",
      permissionKey: "canManageLiveChat",
    });

    expect(tables()).toEqual(["portal_audit_log"]);
  });
});
