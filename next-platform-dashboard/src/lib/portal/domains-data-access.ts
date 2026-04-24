import "server-only";

/**
 * Portal Domains DAL (Session 5).
 *
 * Client-level (cross-site): domains belong to a client, not to any
 * single site. So we do not require a siteId on each call. Instead we
 * use `requireClientScope(ctx)` which: picks an accessible site under
 * the client, verifies `canEditContent` on that site, and uses it as
 * the "referrer site" for audit + event emission.
 *
 * Supplier-brand strip is applied to every row leaving this DAL —
 * ResellerClub, LogicBoxes, provider ids, etc. are never visible to
 * portal users. Free-text fields (e.g. `last_error_message`) are
 * scrubbed for brand tokens via `stripSupplierBrandDeep`.
 *
 * Writes that affect billing (register, renew, transfer) are NOT
 * executed here — they flow through the existing `domain_orders` +
 * Paddle transaction pipeline. This DAL exposes:
 *   - `list`, `detail` (read domain rows, brand-stripped)
 *   - `searchAvailability` (thin wrapper over agency `searchDomains`)
 *   - `nameservers.update` / `dns.list` / `dns.upsert` / `dns.delete`
 *     (operational self-service; emits `domain.dns.*` events)
 *
 * If a new transactional flow is needed (register-via-portal), wire it
 * through the same agency action file with a portal actor attribution.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  resolveSiteScope,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";
import {
  stripSupplierBrandDeep,
  stripSupplierBrandText,
} from "./supplier-brand";

const DOMAINS_PERM = "canEditContent" as const;
const T = {
  domains: "domains",
  dnsRecords: "domain_dns_records",
} as const;

/**
 * Client-scope gate for cross-site resources. Picks any published (or
 * first) site under the client, then checks `canEditContent` on it. The
 * chosen site acts as the audit/event attribution site.
 */
async function requireClientScope(
  ctx: PortalDALContext,
): Promise<PortalSiteScope> {
  const admin = createAdminClient();
  const { data: sites } = await admin
    .from("sites")
    .select("id")
    .eq("client_id", ctx.user.clientId)
    .eq("agency_id", ctx.user.agencyId)
    .limit(1);

  const firstSiteId = Array.isArray(sites) && sites[0]?.id;
  if (!firstSiteId) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId: null,
      action: "portal.domains.client_scope",
      permissionKey: DOMAINS_PERM,
      reason: "site_not_found",
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError("site_not_found", null, DOMAINS_PERM);
  }

  const result = await checkPortalPermission(
    ctx.user,
    firstSiteId,
    DOMAINS_PERM,
  );
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId: firstSiteId,
      action: `portal.permission.${DOMAINS_PERM}`,
      permissionKey: DOMAINS_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      "permission_denied",
      firstSiteId,
      DOMAINS_PERM,
    );
  }

  // Fall back to a constructed scope if resolveSiteScope returns null.
  const scope = await resolveSiteScope(ctx.user.clientId, firstSiteId);
  if (scope) return scope;
  return {
    siteId: firstSiteId,
    name: "",
    agencyId: ctx.user.agencyId,
    clientId: ctx.user.clientId,
    subdomain: null,
    customDomain: null,
    isPublished: false,
    permissions: result.scope!.permissions,
  };
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata?: Record<string, unknown>,
): void {
  writePortalAudit({
    authUserId: ctx.user.userId,
    clientId: ctx.user.clientId,
    agencyId: ctx.user.agencyId,
    siteId,
    isImpersonation: ctx.isImpersonation,
    impersonatorEmail: ctx.impersonatorEmail,
    action,
    resourceType,
    resourceId,
    permissionKey: DOMAINS_PERM,
    metadata,
  }).catch(() => {});
}

function evtCtx(ctx: PortalDALContext, siteId: string) {
  return {
    agencyId: ctx.user.agencyId,
    clientId: ctx.user.clientId,
    authUserId: ctx.user.userId,
    siteId,
    isImpersonation: ctx.isImpersonation,
  };
}

function emit(
  siteId: string,
  eventType: string,
  ctx: PortalDALContext,
  payload: Record<string, unknown>,
  sourceEntityType: string,
  sourceEntityId: string,
): void {
  logAutomationEvent(
    siteId,
    eventType,
    {
      ...payload,
      source: "portal",
      actor_user_id: ctx.user.userId,
      is_impersonation: ctx.isImpersonation,
    },
    {
      sourceModule: "portal",
      sourceEntityType,
      sourceEntityId,
    },
  ).catch(() => {});
}

export interface PortalDomain {
  id: string;
  domainName: string;
  status: string;
  autoRenew: boolean;
  expiresAt: string | null;
  registeredAt: string | null;
  nameservers: string[];
}

export interface PortalDnsRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: number | null;
  priority: number | null;
}

export interface PortalDomainSearchResult {
  domainName: string;
  available: boolean;
  priceCents: number | null;
  currency: string | null;
}

function mapDomain(row: any): PortalDomain {
  const cleaned: any = stripSupplierBrandDeep(row) ?? {};
  return {
    id: String(cleaned.id ?? row.id),
    domainName: cleaned.domain_name ?? "",
    status: cleaned.status ?? "",
    autoRenew: !!cleaned.auto_renew,
    expiresAt: cleaned.expires_at ?? null,
    registeredAt: cleaned.registered_at ?? null,
    nameservers: Array.isArray(cleaned.nameservers)
      ? (cleaned.nameservers as string[])
      : [],
  };
}

function mapDnsRecord(row: any): PortalDnsRecord {
  const cleaned: any = stripSupplierBrandDeep(row) ?? {};
  return {
    id: String(cleaned.id ?? row.id),
    type: cleaned.type ?? "",
    name: cleaned.name ?? "",
    value: cleaned.value ?? cleaned.content ?? "",
    ttl: cleaned.ttl ?? null,
    priority: cleaned.priority ?? null,
  };
}

export interface PortalDomainsNamespace {
  list(): Promise<PortalDomain[]>;
  detail(domainId: string): Promise<PortalDomain>;
  searchAvailability(
    keyword: string,
    tlds?: string[],
  ): Promise<PortalDomainSearchResult[]>;
  nameservers: {
    update(domainId: string, nameservers: string[]): Promise<PortalDomain>;
  };
  dns: {
    list(domainId: string): Promise<PortalDnsRecord[]>;
    upsert(
      domainId: string,
      record: Omit<PortalDnsRecord, "id"> & { id?: string },
    ): Promise<PortalDnsRecord>;
    delete(domainId: string, recordId: string): Promise<{ deleted: true }>;
  };
}

export function createDomainsNamespace(
  ctx: PortalDALContext,
): PortalDomainsNamespace {
  async function loadDomain(scope: PortalSiteScope, domainId: string) {
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from(T.domains)
      .select("*")
      .eq("id", domainId)
      .eq("client_id", ctx.user.clientId)
      .eq("agency_id", ctx.user.agencyId)
      .maybeSingle();
    if (error || !data) {
      throw new Error(
        stripSupplierBrandText(
          `[portal][domains] domain_not_found: ${error?.message ?? "none"}`,
        ),
      );
    }
    return data;
  }

  const dns = {
    list: (domainId: string) =>
      withPortalEvent(
        "portal.dal.domains.dns.list",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          await loadDomain(scope, domainId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.dnsRecords)
            .select("*")
            .eq("domain_id", domainId);
          if (error)
            throw new Error(
              stripSupplierBrandText(
                `[portal][domains] dns list: ${error.message}`,
              ),
            );
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.domains.dns.list",
            "dns_record",
            null,
            { domain_id: domainId, count: (data ?? []).length },
          );
          return (data ?? []).map(mapDnsRecord);
        },
      ),

    upsert: (
      domainId: string,
      record: Omit<PortalDnsRecord, "id"> & { id?: string },
    ) =>
      withPortalEvent(
        "portal.dal.domains.dns.upsert",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          await loadDomain(scope, domainId);
          const admin = createAdminClient() as any;
          const payload: Record<string, unknown> = {
            domain_id: domainId,
            type: record.type,
            name: record.name,
            value: record.value,
            ttl: record.ttl ?? 3600,
            priority: record.priority ?? null,
          };
          let data: any;
          let error: any;
          if (record.id) {
            ({ data, error } = await admin
              .from(T.dnsRecords)
              .update(payload)
              .eq("id", record.id)
              .eq("domain_id", domainId)
              .select("*")
              .single());
          } else {
            ({ data, error } = await admin
              .from(T.dnsRecords)
              .insert(payload)
              .select("*")
              .single());
          }
          if (error || !data)
            throw new Error(
              stripSupplierBrandText(
                `[portal][domains] dns upsert: ${error?.message}`,
              ),
            );
          const eventType = record.id
            ? "domain.dns.record_updated"
            : "domain.dns.record_created";
          finalizeAudit(
            ctx,
            scope.siteId,
            `portal.${eventType}`,
            "dns_record",
            String(data.id),
            { domain_id: domainId },
          );
          emit(
            scope.siteId,
            eventType,
            ctx,
            { domain_id: domainId, record_id: data.id, type: record.type },
            "dns_record",
            String(data.id),
          );
          return mapDnsRecord(data);
        },
      ),

    delete: (domainId: string, recordId: string) =>
      withPortalEvent(
        "portal.dal.domains.dns.delete",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          await loadDomain(scope, domainId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.dnsRecords)
            .delete()
            .eq("id", recordId)
            .eq("domain_id", domainId);
          if (error)
            throw new Error(
              stripSupplierBrandText(
                `[portal][domains] dns delete: ${error.message}`,
              ),
            );
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.domain.dns.record_deleted",
            "dns_record",
            recordId,
            { domain_id: domainId },
          );
          emit(
            scope.siteId,
            "domain.dns.record_deleted",
            ctx,
            { domain_id: domainId, record_id: recordId },
            "dns_record",
            recordId,
          );
          return { deleted: true as const };
        },
      ),
  };

  return {
    list: () =>
      withPortalEvent("portal.dal.domains.list", evtCtx(ctx, ""), async () => {
        const scope = await requireClientScope(ctx);
        const admin = createAdminClient() as any;
        const { data, error } = await admin
          .from(T.domains)
          .select("*")
          .eq("client_id", ctx.user.clientId)
          .eq("agency_id", ctx.user.agencyId)
          .order("domain_name", { ascending: true });
        if (error)
          throw new Error(
            stripSupplierBrandText(`[portal][domains] list: ${error.message}`),
          );
        finalizeAudit(
          ctx,
          scope.siteId,
          "portal.domains.list",
          "domain",
          null,
          { count: (data ?? []).length },
        );
        return (data ?? []).map(mapDomain);
      }),

    detail: (domainId: string) =>
      withPortalEvent(
        "portal.dal.domains.detail",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          const row = await loadDomain(scope, domainId);
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.domains.detail",
            "domain",
            domainId,
          );
          return mapDomain(row);
        },
      ),

    searchAvailability: (keyword: string, tlds?: string[]) =>
      withPortalEvent(
        "portal.dal.domains.searchAvailability",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          // Delegate to the agency server action. Its response is
          // brand-rich on the error path — we strip tokens from any
          // messages before the caller sees them.
          let rawResults: any[] = [];
          try {
            const mod = await import("@/lib/actions/domains");
            const res = await mod.searchDomains(keyword, tlds);
            if (res.success && Array.isArray(res.data)) {
              rawResults = res.data;
            } else {
              throw new Error(res.error ?? "search_failed");
            }
          } catch (e: any) {
            throw new Error(
              stripSupplierBrandText(
                `[portal][domains] search: ${e?.message ?? "failed"}`,
              ),
            );
          }
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.domains.searchAvailability",
            "domain_search",
            null,
            { keyword, count: rawResults.length },
          );
          return rawResults.map((r: any) => ({
            domainName: r.domainName ?? r.domain_name ?? r.domain,
            available: !!r.available,
            priceCents:
              typeof r.priceCents === "number"
                ? r.priceCents
                : typeof r.price === "number"
                  ? Math.round(r.price * 100)
                  : null,
            currency: r.currency ?? null,
          }));
        },
      ),

    nameservers: {
      update: (domainId: string, nameservers: string[]) =>
        withPortalEvent(
          "portal.dal.domains.nameservers.update",
          evtCtx(ctx, ""),
          async () => {
            const scope = await requireClientScope(ctx);
            await loadDomain(scope, domainId);
            const admin = createAdminClient() as any;
            const { data, error } = await admin
              .from(T.domains)
              .update({ nameservers })
              .eq("id", domainId)
              .eq("client_id", ctx.user.clientId)
              .select("*")
              .single();
            if (error || !data)
              throw new Error(
                stripSupplierBrandText(
                  `[portal][domains] nameservers update: ${error?.message}`,
                ),
              );
            finalizeAudit(
              ctx,
              scope.siteId,
              "portal.domain.nameservers.changed",
              "domain",
              domainId,
              { nameservers },
            );
            emit(
              scope.siteId,
              "domain.domain.nameservers_changed",
              ctx,
              { domain_id: domainId, nameservers },
              "domain",
              domainId,
            );
            return mapDomain(data);
          },
        ),
    },

    dns,
  };
}
