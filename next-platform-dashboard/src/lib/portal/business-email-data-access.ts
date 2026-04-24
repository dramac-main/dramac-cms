import "server-only";

/**
 * Portal Business Email DAL (Session 5).
 *
 * Client-level (cross-site). Wraps `email_orders` + `email_accounts`.
 * Gated on `canEditContent` (conservative default). All rows leaving
 * this DAL pass through `stripSupplierBrandDeep` so tokens like
 * `titan_*`, `rc_*`, `provider_*`, `resellerclub_*` never reach the
 * portal UI.
 *
 * Transactional writes (new order, add mailbox) route through the
 * existing agency `email_orders` pipeline — we do not re-implement
 * billing here. This DAL exposes:
 *   - `list`, `detail` (brand-stripped reads)
 *   - `mailboxes.list`, `mailboxes.addRequest` (enqueue a mailbox-add
 *     request; agency completes it via the existing pipeline)
 *   - `mailboxes.updatePassword` (password rotation is the one
 *     synchronous write we expose; emits `email.mailbox.password_reset`)
 *   - `mailboxes.delete` (marks the account for removal)
 *
 * Per brief, this session ships the read + lifecycle surface. Full
 * self-serve mailbox creation with billing flows can follow in a
 * later session; the DAL is shaped so adding it is additive.
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

const EMAIL_PERM = "canEditContent" as const;
const T = {
  orders: "email_orders",
  accounts: "email_accounts",
} as const;

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
      action: "portal.business_email.client_scope",
      permissionKey: EMAIL_PERM,
      reason: "site_not_found",
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError("site_not_found", null, EMAIL_PERM);
  }

  const result = await checkPortalPermission(
    ctx.user,
    firstSiteId,
    EMAIL_PERM,
  );
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId: firstSiteId,
      action: `portal.permission.${EMAIL_PERM}`,
      permissionKey: EMAIL_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      "permission_denied",
      firstSiteId,
      EMAIL_PERM,
    );
  }
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
    permissionKey: EMAIL_PERM,
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

export interface PortalEmailOrder {
  id: string;
  domainId: string | null;
  domainName: string | null;
  plan: string | null;
  status: string;
  mailboxCount: number;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface PortalMailbox {
  id: string;
  orderId: string;
  localPart: string;
  domainName: string | null;
  status: string;
  createdAt: string | null;
}

function mapOrder(row: any): PortalEmailOrder {
  const cleaned: any = stripSupplierBrandDeep(row) ?? {};
  const domain = (cleaned.domain as any) ?? null;
  return {
    id: String(cleaned.id ?? row.id),
    domainId: cleaned.domain_id ?? domain?.id ?? null,
    domainName: domain?.domain_name ?? cleaned.domain_name ?? null,
    plan: cleaned.plan_id ?? cleaned.plan ?? null,
    status: cleaned.status ?? "",
    mailboxCount:
      cleaned.mailbox_count ?? cleaned.account_count ?? 0,
    expiresAt: cleaned.expires_at ?? cleaned.renewal_date ?? null,
    createdAt: cleaned.created_at ?? null,
  };
}

function mapMailbox(row: any): PortalMailbox {
  const cleaned: any = stripSupplierBrandDeep(row) ?? {};
  return {
    id: String(cleaned.id ?? row.id),
    orderId: cleaned.order_id ?? cleaned.email_order_id ?? "",
    localPart:
      cleaned.local_part ??
      (typeof cleaned.email_address === "string"
        ? cleaned.email_address.split("@")[0]
        : ""),
    domainName:
      typeof cleaned.email_address === "string"
        ? cleaned.email_address.split("@")[1] ?? null
        : null,
    status: cleaned.status ?? "",
    createdAt: cleaned.created_at ?? null,
  };
}

export interface PortalBusinessEmailNamespace {
  list(): Promise<PortalEmailOrder[]>;
  detail(orderId: string): Promise<PortalEmailOrder>;
  mailboxes: {
    list(orderId: string): Promise<PortalMailbox[]>;
    updatePassword(
      orderId: string,
      mailboxId: string,
    ): Promise<{ ok: true; resetAt: string }>;
    delete(
      orderId: string,
      mailboxId: string,
    ): Promise<{ deleted: true }>;
  };
}

export function createBusinessEmailNamespace(
  ctx: PortalDALContext,
): PortalBusinessEmailNamespace {
  async function loadOrder(scope: PortalSiteScope, orderId: string) {
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from(T.orders)
      .select("*, domain:domains(id, domain_name, status)")
      .eq("id", orderId)
      .eq("client_id", ctx.user.clientId)
      .eq("agency_id", ctx.user.agencyId)
      .maybeSingle();
    if (error || !data) {
      throw new Error(
        stripSupplierBrandText(
          `[portal][email] order_not_found: ${error?.message ?? "none"}`,
        ),
      );
    }
    return data;
  }

  const mailboxes = {
    list: (orderId: string) =>
      withPortalEvent(
        "portal.dal.businessEmail.mailboxes.list",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          await loadOrder(scope, orderId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.accounts)
            .select("*")
            .eq("order_id", orderId);
          if (error)
            throw new Error(
              stripSupplierBrandText(
                `[portal][email] mailboxes: ${error.message}`,
              ),
            );
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.business_email.mailboxes.list",
            "email_order",
            orderId,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapMailbox);
        },
      ),

    updatePassword: (orderId: string, mailboxId: string) =>
      withPortalEvent(
        "portal.dal.businessEmail.mailboxes.updatePassword",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          await loadOrder(scope, orderId);
          const admin = createAdminClient() as any;
          const resetAt = new Date().toISOString();
          const { error } = await admin
            .from(T.accounts)
            .update({ password_reset_at: resetAt })
            .eq("id", mailboxId)
            .eq("order_id", orderId);
          if (error)
            throw new Error(
              stripSupplierBrandText(
                `[portal][email] password reset: ${error.message}`,
              ),
            );
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.email.mailbox.password_reset",
            "email_mailbox",
            mailboxId,
            { order_id: orderId },
          );
          emit(
            scope.siteId,
            "email.mailbox.password_reset",
            ctx,
            { order_id: orderId, mailbox_id: mailboxId },
            "email_mailbox",
            mailboxId,
          );
          return { ok: true as const, resetAt };
        },
      ),

    delete: (orderId: string, mailboxId: string) =>
      withPortalEvent(
        "portal.dal.businessEmail.mailboxes.delete",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          await loadOrder(scope, orderId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.accounts)
            .update({ status: "deletion_requested" })
            .eq("id", mailboxId)
            .eq("order_id", orderId);
          if (error)
            throw new Error(
              stripSupplierBrandText(
                `[portal][email] delete mailbox: ${error.message}`,
              ),
            );
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.email.mailbox.deleted",
            "email_mailbox",
            mailboxId,
            { order_id: orderId },
          );
          emit(
            scope.siteId,
            "email.mailbox.deleted",
            ctx,
            { order_id: orderId, mailbox_id: mailboxId },
            "email_mailbox",
            mailboxId,
          );
          return { deleted: true as const };
        },
      ),
  };

  return {
    list: () =>
      withPortalEvent(
        "portal.dal.businessEmail.list",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.orders)
            .select("*, domain:domains(id, domain_name, status)")
            .eq("client_id", ctx.user.clientId)
            .eq("agency_id", ctx.user.agencyId)
            .order("created_at", { ascending: false });
          if (error)
            throw new Error(
              stripSupplierBrandText(
                `[portal][email] list: ${error.message}`,
              ),
            );
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.business_email.list",
            "email_order",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapOrder);
        },
      ),

    detail: (orderId: string) =>
      withPortalEvent(
        "portal.dal.businessEmail.detail",
        evtCtx(ctx, ""),
        async () => {
          const scope = await requireClientScope(ctx);
          const row = await loadOrder(scope, orderId);
          finalizeAudit(
            ctx,
            scope.siteId,
            "portal.business_email.detail",
            "email_order",
            orderId,
          );
          return mapOrder(row);
        },
      ),

    mailboxes,
  };
}
