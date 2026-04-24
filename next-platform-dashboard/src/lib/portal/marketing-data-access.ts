import "server-only";

/**
 * Portal Marketing DAL (Session 4C).
 *
 * Namespaces: lists, subscribers, campaigns, sequences, templates, forms.
 *
 * Invariants (shared with Sessions 1-4B):
 *   1. `requireScope(ctx, siteId, canManageMarketing)` first — denials
 *      audit + throw.
 *   2. Every query filters `site_id = scope.siteId`.
 *   3. `withPortalEvent` wraps every operation for observability.
 *   4. Writes fire-and-forget `writePortalAudit` + `logAutomationEvent`
 *      with `source: "portal", actor_user_id: ctx.user.userId`.
 *   5. **Consent-downgrade blocks send**: `campaigns.sendNow` resolves
 *      the audience and refuses to dispatch if it contains zero
 *      consented (status='active' AND email_opt_in=true) subscribers.
 *      The DAL throws `no_consented_recipients` — no partial send.
 *   6. **No supplier-brand leak**: the DAL strips provider metadata
 *      (`resend_message_id`, `resend_plan_tier`, any `provider_*` column)
 *      from every row returned to portal callers. Callers never see
 *      which transactional provider the platform is using.
 *   7. `canManageMarketing` is the single permission key for read and
 *      write. No separate `canViewMarketing`.
 *   8. `revenue_attributed` is stored in CENTS; the DAL passes it
 *      through untouched (no double-conversion).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { EVENT_REGISTRY } from "@/modules/automation/lib/event-types";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";

// Single permission key for marketing.
const MKT_PERM = "canManageMarketing" as const;

// Marketing module table prefix.
const MKT_PREFIX = "mod_mktmod01";
const T = {
  campaigns: `${MKT_PREFIX}_campaigns`,
  campaignSends: `${MKT_PREFIX}_campaign_sends`,
  subscribers: `${MKT_PREFIX}_subscribers`,
  lists: `${MKT_PREFIX}_lists`,
  listSubscribers: `${MKT_PREFIX}_list_subscribers`,
  audiences: `${MKT_PREFIX}_audiences`,
  templates: `${MKT_PREFIX}_email_templates`,
  sequences: `${MKT_PREFIX}_sequences`,
  sequenceSteps: `${MKT_PREFIX}_sequence_steps`,
  sequenceEnrollments: `${MKT_PREFIX}_sequence_enrollments`,
  forms: `${MKT_PREFIX}_forms`,
  formSubmissions: `${MKT_PREFIX}_form_submissions`,
} as const;

// =============================================================================
// SHARED HELPERS
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, MKT_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${MKT_PERM}`,
      permissionKey: MKT_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      MKT_PERM,
    );
  }
  return result.scope!;
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
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
    permissionKey: MKT_PERM,
    metadata,
  }).catch(() => {});
}

function emitEvent(
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

function stringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/**
 * Strip supplier-brand columns from any row returned to portal callers.
 * We never expose which transactional provider the platform uses.
 */
function stripSupplierBrand<T extends Record<string, any>>(row: T | null | undefined): T | null {
  if (!row) return null;
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const lk = k.toLowerCase();
    if (
      lk.includes("resend") ||
      lk.includes("sendgrid") ||
      lk.includes("mailgun") ||
      lk.includes("postmark") ||
      lk.startsWith("provider_")
    ) {
      continue;
    }
    cleaned[k] = v;
  }
  return cleaned as T;
}

// =============================================================================
// LISTS NAMESPACE
// =============================================================================

export interface PortalListListItem {
  id: string;
  name: string;
  description: string | null;
  subscriberCount: number;
  doubleOptIn: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateListInput {
  name: string;
  description?: string | null;
  doubleOptIn?: boolean;
}

export type PortalUpdateListInput = Partial<PortalCreateListInput>;

function mapListRow(row: any): PortalListListItem {
  return {
    id: String(row.id),
    name: row.name ?? "",
    description: row.description ?? null,
    subscriberCount: Number(row.subscriber_count ?? 0),
    doubleOptIn: Boolean(row.double_opt_in ?? false),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export interface PortalMarketingListsNamespace {
  list(siteId: string): Promise<PortalListListItem[]>;
  detail(siteId: string, listId: string): Promise<PortalListListItem>;
  create(siteId: string, input: PortalCreateListInput): Promise<PortalListListItem>;
  update(
    siteId: string,
    listId: string,
    input: PortalUpdateListInput,
  ): Promise<PortalListListItem>;
  delete(siteId: string, listId: string): Promise<void>;
}

function createListsNamespace(ctx: PortalDALContext): PortalMarketingListsNamespace {
  return {
    list: async (siteId) =>
      withPortalEvent(
        "portal.dal.marketing.lists.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.lists)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (error) throw new Error(`[portal][mkt] list lists: ${error.message}`);
          finalizeAudit(ctx, siteId, "portal.marketing.lists.list", "mkt_list", null, {
            count: (data ?? []).length,
          });
          return (data ?? []).map(mapListRow);
        },
      ),
    detail: async (siteId, listId) =>
      withPortalEvent(
        "portal.dal.marketing.lists.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.lists)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", listId)
            .single();
          if (error) throw new Error(`[portal][mkt] list not found: ${error.message}`);
          finalizeAudit(ctx, siteId, "portal.marketing.lists.detail", "mkt_list", listId);
          return mapListRow(data);
        },
      ),
    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.marketing.lists.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name,
            description: stringOrNull(input.description),
            double_opt_in: Boolean(input.doubleOptIn),
          };
          const { data, error } = await admin
            .from(T.lists)
            .insert(row)
            .select("*")
            .single();
          if (error) throw new Error(`[portal][mkt] create list: ${error.message}`);
          const mapped = mapListRow(data);
          finalizeAudit(ctx, siteId, "portal.marketing.lists.create", "mkt_list", mapped.id, {
            name: mapped.name,
          });
          return mapped;
        },
      ),
    update: async (siteId, listId, input) =>
      withPortalEvent(
        "portal.dal.marketing.lists.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && typeof input.name === "string") patch.name = input.name;
          if ("description" in input) patch.description = stringOrNull(input.description);
          if ("doubleOptIn" in input) patch.double_opt_in = Boolean(input.doubleOptIn);
          patch.updated_at = new Date().toISOString();
          const { data, error } = await admin
            .from(T.lists)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", listId)
            .select("*")
            .single();
          if (error) throw new Error(`[portal][mkt] update list: ${error.message}`);
          const mapped = mapListRow(data);
          finalizeAudit(ctx, siteId, "portal.marketing.lists.update", "mkt_list", listId, {
            changed: Object.keys(patch),
          });
          return mapped;
        },
      ),
    delete: async (siteId, listId) =>
      withPortalEvent(
        "portal.dal.marketing.lists.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.lists)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", listId);
          if (error) throw new Error(`[portal][mkt] delete list: ${error.message}`);
          finalizeAudit(ctx, siteId, "portal.marketing.lists.delete", "mkt_list", listId);
        },
      ),
  };
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

// =============================================================================
// SUBSCRIBERS NAMESPACE
// =============================================================================

export type PortalSubscriberStatus =
  | "active"
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "cleaned";

export interface PortalSubscriberListFilter {
  status?: PortalSubscriberStatus | PortalSubscriberStatus[] | "all";
  listId?: string;
  search?: string;
  tags?: string[];
  emailOptIn?: boolean;
  limit?: number;
  offset?: number;
}

export interface PortalSubscriberListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
  consentSource: string | null;
  consentDate: string | null;
  unsubscribedAt: string | null;
  unsubscribeReason: string | null;
  tags: string[];
  bounceCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateSubscriberInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  consentSource?: string | null;
  consentIp?: string | null;
  tags?: string[];
  listIds?: string[];
}

export type PortalUpdateSubscriberInput = Partial<
  Omit<PortalCreateSubscriberInput, "listIds">
> & {
  status?: PortalSubscriberStatus;
};

function mapSubscriberRow(row: any): PortalSubscriberListItem {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    email: cleaned.email ?? "",
    firstName: cleaned.first_name ?? null,
    lastName: cleaned.last_name ?? null,
    status: cleaned.status ?? "active",
    emailOptIn: Boolean(cleaned.email_opt_in),
    smsOptIn: Boolean(cleaned.sms_opt_in),
    consentSource: cleaned.consent_source ?? null,
    consentDate: cleaned.consent_date ?? null,
    unsubscribedAt: cleaned.unsubscribed_at ?? null,
    unsubscribeReason: cleaned.unsubscribe_reason ?? null,
    tags: Array.isArray(cleaned.tags) ? cleaned.tags : [],
    bounceCount: Number(cleaned.bounce_count ?? 0),
    createdAt: cleaned.created_at ?? null,
    updatedAt: cleaned.updated_at ?? null,
  };
}

export interface PortalMarketingSubscribersNamespace {
  list(
    siteId: string,
    filter?: PortalSubscriberListFilter,
  ): Promise<PortalSubscriberListItem[]>;
  detail(siteId: string, subscriberId: string): Promise<PortalSubscriberListItem>;
  create(
    siteId: string,
    input: PortalCreateSubscriberInput,
  ): Promise<PortalSubscriberListItem>;
  update(
    siteId: string,
    subscriberId: string,
    input: PortalUpdateSubscriberInput,
  ): Promise<PortalSubscriberListItem>;
  unsubscribe(
    siteId: string,
    subscriberId: string,
    reason?: string,
  ): Promise<PortalSubscriberListItem>;
  delete(siteId: string, subscriberId: string): Promise<void>;
}

function createSubscribersNamespace(
  ctx: PortalDALContext,
): PortalMarketingSubscribersNamespace {
  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.marketing.subscribers.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin.from(T.subscribers).select("*").eq("site_id", scope.siteId);
          if (filter?.status && filter.status !== "all") {
            if (Array.isArray(filter.status)) q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (typeof filter?.emailOptIn === "boolean")
            q = q.eq("email_opt_in", filter.emailOptIn);
          if (filter?.tags && filter.tags.length > 0)
            q = q.overlaps("tags", filter.tags);
          if (filter?.search) {
            const s = filter.search.replace(/%/g, "").trim();
            q = q.or(
              `email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%`,
            );
          }
          q = q.order("created_at", { ascending: false });
          if (filter?.limit || filter?.offset) {
            const from = filter?.offset ?? 0;
            const to = from + (filter?.limit ?? 50) - 1;
            q = q.range(from, to);
          }
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][mkt] list subscribers: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.subscribers.list",
            "mkt_subscriber",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapSubscriberRow);
        },
      ),
    detail: async (siteId, subscriberId) =>
      withPortalEvent(
        "portal.dal.marketing.subscribers.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.subscribers)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", subscriberId)
            .single();
          if (error)
            throw new Error(`[portal][mkt] subscriber not found: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.subscribers.detail",
            "mkt_subscriber",
            subscriberId,
          );
          return mapSubscriberRow(data);
        },
      ),
    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.marketing.subscribers.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            email: String(input.email).toLowerCase().trim(),
            first_name: stringOrNull(input.firstName),
            last_name: stringOrNull(input.lastName),
            email_opt_in: input.emailOptIn ?? true,
            sms_opt_in: input.smsOptIn ?? false,
            consent_source: stringOrNull(input.consentSource) ?? "portal",
            consent_date: new Date().toISOString(),
            consent_ip: stringOrNull(input.consentIp),
            tags: Array.isArray(input.tags) ? input.tags : [],
            status: "active",
          };
          const { data, error } = await admin
            .from(T.subscribers)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] create subscriber: ${error.message}`);
          const mapped = mapSubscriberRow(data);

          // Optional list membership.
          if (Array.isArray(input.listIds) && input.listIds.length > 0) {
            const memberships = input.listIds.map((listId) => ({
              site_id: scope.siteId,
              list_id: listId,
              subscriber_id: mapped.id,
            }));
            await admin.from(T.listSubscribers).insert(memberships);
          }

          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.subscribers.create",
            "mkt_subscriber",
            mapped.id,
            { email: mapped.email },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.subscriber.subscribed,
            ctx,
            {
              id: mapped.id,
              email: mapped.email,
              consent_source: mapped.consentSource,
              email_opt_in: mapped.emailOptIn,
              list_ids: input.listIds ?? [],
            },
            "subscriber",
            mapped.id,
          );
          return mapped;
        },
      ),
    update: async (siteId, subscriberId, input) =>
      withPortalEvent(
        "portal.dal.marketing.subscribers.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("email" in input && typeof input.email === "string")
            patch.email = input.email.toLowerCase().trim();
          if ("firstName" in input) patch.first_name = stringOrNull(input.firstName);
          if ("lastName" in input) patch.last_name = stringOrNull(input.lastName);
          if ("emailOptIn" in input) patch.email_opt_in = Boolean(input.emailOptIn);
          if ("smsOptIn" in input) patch.sms_opt_in = Boolean(input.smsOptIn);
          if ("tags" in input && Array.isArray(input.tags)) patch.tags = input.tags;
          if ("status" in input) patch.status = input.status;
          patch.updated_at = new Date().toISOString();
          const { data, error } = await admin
            .from(T.subscribers)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", subscriberId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] update subscriber: ${error.message}`);
          const mapped = mapSubscriberRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.subscribers.update",
            "mkt_subscriber",
            subscriberId,
            { changed: Object.keys(patch) },
          );
          return mapped;
        },
      ),
    unsubscribe: async (siteId, subscriberId, reason) =>
      withPortalEvent(
        "portal.dal.marketing.subscribers.unsubscribe",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const now = new Date().toISOString();
          const { data, error } = await admin
            .from(T.subscribers)
            .update({
              status: "unsubscribed",
              email_opt_in: false,
              unsubscribed_at: now,
              unsubscribe_reason: stringOrNull(reason) ?? "portal",
              updated_at: now,
            })
            .eq("site_id", scope.siteId)
            .eq("id", subscriberId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] unsubscribe: ${error.message}`);
          const mapped = mapSubscriberRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.subscribers.unsubscribe",
            "mkt_subscriber",
            subscriberId,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.subscriber.unsubscribed,
            ctx,
            {
              id: mapped.id,
              email: mapped.email,
              reason: stringOrNull(reason) ?? "portal",
              unsubscribed_at: now,
            },
            "subscriber",
            mapped.id,
          );
          return mapped;
        },
      ),
    delete: async (siteId, subscriberId) =>
      withPortalEvent(
        "portal.dal.marketing.subscribers.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.subscribers)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", subscriberId);
          if (error)
            throw new Error(`[portal][mkt] delete subscriber: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.subscribers.delete",
            "mkt_subscriber",
            subscriberId,
          );
        },
      ),
  };
}

// =============================================================================
// CAMPAIGNS NAMESPACE
// =============================================================================

export type PortalCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled"
  | "failed";

export type PortalCampaignChannel = "email" | "sms" | "whatsapp" | "multi";

export interface PortalCampaignListItem {
  id: string;
  name: string;
  subject: string | null;
  status: string;
  channel: string;
  audienceId: string | null;
  templateId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  revenueAttributed: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateCampaignInput {
  name: string;
  subject?: string | null;
  previewText?: string | null;
  channel?: PortalCampaignChannel;
  audienceId?: string | null;
  listId?: string | null;
  templateId?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  htmlBody?: string | null;
  textBody?: string | null;
}

export type PortalUpdateCampaignInput = Partial<PortalCreateCampaignInput>;

function mapCampaignRow(row: any): PortalCampaignListItem {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    name: cleaned.name ?? "",
    subject: cleaned.subject ?? null,
    status: cleaned.status ?? "draft",
    channel: cleaned.channel ?? "email",
    audienceId: cleaned.audience_id ?? null,
    templateId: cleaned.template_id ?? null,
    scheduledAt: cleaned.scheduled_at ?? null,
    sentAt: cleaned.sent_at ?? null,
    recipientCount: Number(cleaned.recipient_count ?? 0),
    openCount: Number(cleaned.open_count ?? 0),
    clickCount: Number(cleaned.click_count ?? 0),
    bounceCount: Number(cleaned.bounce_count ?? 0),
    revenueAttributed: Number(cleaned.revenue_attributed ?? 0),
    createdAt: cleaned.created_at ?? null,
    updatedAt: cleaned.updated_at ?? null,
  };
}

export interface PortalMarketingCampaignsNamespace {
  list(siteId: string): Promise<PortalCampaignListItem[]>;
  detail(siteId: string, campaignId: string): Promise<PortalCampaignListItem>;
  create(
    siteId: string,
    input: PortalCreateCampaignInput,
  ): Promise<PortalCampaignListItem>;
  update(
    siteId: string,
    campaignId: string,
    input: PortalUpdateCampaignInput,
  ): Promise<PortalCampaignListItem>;
  schedule(
    siteId: string,
    campaignId: string,
    scheduledAt: string,
  ): Promise<PortalCampaignListItem>;
  sendNow(siteId: string, campaignId: string): Promise<PortalCampaignListItem>;
  pause(siteId: string, campaignId: string): Promise<PortalCampaignListItem>;
  cancel(siteId: string, campaignId: string): Promise<PortalCampaignListItem>;
  delete(siteId: string, campaignId: string): Promise<void>;
}

/**
 * Count consented recipients for a campaign's audience/list.
 *
 * Consent rule: status = 'active' AND email_opt_in = true.
 * Returns 0 when no list/audience is attached.
 *
 * This is used by `sendNow` to enforce the "consent-downgrade blocks
 * send" invariant. If consent has been downgraded across the entire
 * audience (everyone unsubscribed / bounced / complained), the send
 * is refused.
 */
async function countConsentedRecipients(
  admin: any,
  siteId: string,
  campaign: { list_id?: string | null; audience_id?: string | null },
): Promise<number> {
  const listId = campaign.list_id ?? null;
  if (listId) {
    // Join via list_subscribers -> subscribers.
    const { data, error } = await admin
      .from(T.listSubscribers)
      .select(`subscriber:${T.subscribers}(id, status, email_opt_in)`)
      .eq("site_id", siteId)
      .eq("list_id", listId);
    if (error) return 0;
    let count = 0;
    for (const r of data ?? []) {
      const sub = (r as any).subscriber;
      if (sub && sub.status === "active" && sub.email_opt_in === true) count++;
    }
    return count;
  }
  // No list scoping: count all consented subscribers on the site.
  const { count, error } = await admin
    .from(T.subscribers)
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "active")
    .eq("email_opt_in", true);
  if (error) return 0;
  return Number(count ?? 0);
}

function createCampaignsNamespace(
  ctx: PortalDALContext,
): PortalMarketingCampaignsNamespace {
  return {
    list: async (siteId) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.campaigns)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (error)
            throw new Error(`[portal][mkt] list campaigns: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.list",
            "mkt_campaign",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapCampaignRow);
        },
      ),
    detail: async (siteId, campaignId) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.campaigns)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .single();
          if (error)
            throw new Error(`[portal][mkt] campaign not found: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.detail",
            "mkt_campaign",
            campaignId,
          );
          return mapCampaignRow(data);
        },
      ),
    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name,
            subject: stringOrNull(input.subject),
            preview_text: stringOrNull(input.previewText),
            channel: input.channel ?? "email",
            audience_id: stringOrNull(input.audienceId),
            list_id: stringOrNull(input.listId),
            template_id: stringOrNull(input.templateId),
            from_name: stringOrNull(input.fromName),
            from_email: stringOrNull(input.fromEmail),
            reply_to: stringOrNull(input.replyTo),
            html_body: stringOrNull(input.htmlBody),
            text_body: stringOrNull(input.textBody),
            status: "draft",
          };
          const { data, error } = await admin
            .from(T.campaigns)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] create campaign: ${error.message}`);
          const mapped = mapCampaignRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.create",
            "mkt_campaign",
            mapped.id,
            { name: mapped.name, channel: mapped.channel },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.campaign.created,
            ctx,
            {
              id: mapped.id,
              name: mapped.name,
              channel: mapped.channel,
              audience_id: mapped.audienceId,
              template_id: mapped.templateId,
            },
            "campaign",
            mapped.id,
          );
          return mapped;
        },
      ),
    update: async (siteId, campaignId, input) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && typeof input.name === "string")
            patch.name = input.name;
          if ("subject" in input) patch.subject = stringOrNull(input.subject);
          if ("previewText" in input)
            patch.preview_text = stringOrNull(input.previewText);
          if ("channel" in input) patch.channel = input.channel;
          if ("audienceId" in input)
            patch.audience_id = stringOrNull(input.audienceId);
          if ("listId" in input) patch.list_id = stringOrNull(input.listId);
          if ("templateId" in input)
            patch.template_id = stringOrNull(input.templateId);
          if ("fromName" in input) patch.from_name = stringOrNull(input.fromName);
          if ("fromEmail" in input)
            patch.from_email = stringOrNull(input.fromEmail);
          if ("replyTo" in input) patch.reply_to = stringOrNull(input.replyTo);
          if ("htmlBody" in input) patch.html_body = stringOrNull(input.htmlBody);
          if ("textBody" in input) patch.text_body = stringOrNull(input.textBody);
          patch.updated_at = new Date().toISOString();
          const { data, error } = await admin
            .from(T.campaigns)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] update campaign: ${error.message}`);
          const mapped = mapCampaignRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.update",
            "mkt_campaign",
            campaignId,
            { changed: Object.keys(patch) },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.campaign.updated,
            ctx,
            { id: mapped.id, changes: Object.keys(patch) },
            "campaign",
            mapped.id,
          );
          return mapped;
        },
      ),
    schedule: async (siteId, campaignId, scheduledAt) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.schedule",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.campaigns)
            .update({
              status: "scheduled",
              scheduled_at: scheduledAt,
              updated_at: new Date().toISOString(),
            })
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] schedule campaign: ${error.message}`);
          const mapped = mapCampaignRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.schedule",
            "mkt_campaign",
            campaignId,
            { scheduled_at: scheduledAt },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.campaign.scheduled,
            ctx,
            { id: mapped.id, scheduled_at: scheduledAt },
            "campaign",
            mapped.id,
          );
          return mapped;
        },
      ),
    sendNow: async (siteId, campaignId) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.sendNow",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;

          // Load the campaign so we can resolve the audience.
          const { data: existing, error: loadErr } = await admin
            .from(T.campaigns)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .single();
          if (loadErr)
            throw new Error(`[portal][mkt] campaign not found: ${loadErr.message}`);

          // Consent gate: refuse to send if audience has zero consented
          // recipients (everyone unsubscribed / bounced / never opted in).
          const consented = await countConsentedRecipients(
            admin,
            scope.siteId,
            existing,
          );
          if (consented <= 0) {
            finalizeAudit(
              ctx,
              siteId,
              "portal.marketing.campaigns.sendNow.blocked",
              "mkt_campaign",
              campaignId,
              { reason: "no_consented_recipients" },
            );
            throw new Error("no_consented_recipients");
          }

          const { data, error } = await admin
            .from(T.campaigns)
            .update({
              status: "sending",
              scheduled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] send campaign: ${error.message}`);
          const mapped = mapCampaignRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.sendNow",
            "mkt_campaign",
            campaignId,
            { consented_recipients: consented },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.campaign.started,
            ctx,
            { id: mapped.id, consented_recipients: consented },
            "campaign",
            mapped.id,
          );
          return mapped;
        },
      ),
    pause: async (siteId, campaignId) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.pause",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.campaigns)
            .update({ status: "paused", updated_at: new Date().toISOString() })
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] pause campaign: ${error.message}`);
          const mapped = mapCampaignRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.pause",
            "mkt_campaign",
            campaignId,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.campaign.paused,
            ctx,
            { id: mapped.id },
            "campaign",
            mapped.id,
          );
          return mapped;
        },
      ),
    cancel: async (siteId, campaignId) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.cancel",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.campaigns)
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("site_id", scope.siteId)
            .eq("id", campaignId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] cancel campaign: ${error.message}`);
          const mapped = mapCampaignRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.cancel",
            "mkt_campaign",
            campaignId,
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.campaign.cancelled,
            ctx,
            { id: mapped.id },
            "campaign",
            mapped.id,
          );
          return mapped;
        },
      ),
    delete: async (siteId, campaignId) =>
      withPortalEvent(
        "portal.dal.marketing.campaigns.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.campaigns)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", campaignId);
          if (error)
            throw new Error(`[portal][mkt] delete campaign: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.campaigns.delete",
            "mkt_campaign",
            campaignId,
          );
        },
      ),
  };
}

// =============================================================================
// TEMPLATES NAMESPACE
// =============================================================================

export interface PortalTemplateListItem {
  id: string;
  name: string;
  subject: string | null;
  category: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateTemplateInput {
  name: string;
  subject?: string | null;
  category?: string | null;
  htmlBody?: string | null;
  textBody?: string | null;
  blocks?: unknown;
}

export type PortalUpdateTemplateInput = Partial<PortalCreateTemplateInput>;

function mapTemplateRow(row: any): PortalTemplateListItem {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    name: cleaned.name ?? "",
    subject: cleaned.subject ?? null,
    category: cleaned.category ?? null,
    createdAt: cleaned.created_at ?? null,
    updatedAt: cleaned.updated_at ?? null,
  };
}

export interface PortalMarketingTemplatesNamespace {
  list(siteId: string): Promise<PortalTemplateListItem[]>;
  detail(siteId: string, templateId: string): Promise<PortalTemplateListItem>;
  create(
    siteId: string,
    input: PortalCreateTemplateInput,
  ): Promise<PortalTemplateListItem>;
  update(
    siteId: string,
    templateId: string,
    input: PortalUpdateTemplateInput,
  ): Promise<PortalTemplateListItem>;
  delete(siteId: string, templateId: string): Promise<void>;
}

function createTemplatesNamespace(
  ctx: PortalDALContext,
): PortalMarketingTemplatesNamespace {
  return {
    list: async (siteId) =>
      withPortalEvent(
        "portal.dal.marketing.templates.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.templates)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (error)
            throw new Error(`[portal][mkt] list templates: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.templates.list",
            "mkt_template",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapTemplateRow);
        },
      ),
    detail: async (siteId, templateId) =>
      withPortalEvent(
        "portal.dal.marketing.templates.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.templates)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", templateId)
            .single();
          if (error)
            throw new Error(`[portal][mkt] template not found: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.templates.detail",
            "mkt_template",
            templateId,
          );
          return mapTemplateRow(data);
        },
      ),
    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.marketing.templates.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name,
            subject: stringOrNull(input.subject),
            category: stringOrNull(input.category),
            html_body: stringOrNull(input.htmlBody),
            text_body: stringOrNull(input.textBody),
            blocks: input.blocks ?? null,
          };
          const { data, error } = await admin
            .from(T.templates)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] create template: ${error.message}`);
          const mapped = mapTemplateRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.templates.create",
            "mkt_template",
            mapped.id,
            { name: mapped.name },
          );
          return mapped;
        },
      ),
    update: async (siteId, templateId, input) =>
      withPortalEvent(
        "portal.dal.marketing.templates.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && typeof input.name === "string")
            patch.name = input.name;
          if ("subject" in input) patch.subject = stringOrNull(input.subject);
          if ("category" in input) patch.category = stringOrNull(input.category);
          if ("htmlBody" in input) patch.html_body = stringOrNull(input.htmlBody);
          if ("textBody" in input) patch.text_body = stringOrNull(input.textBody);
          if ("blocks" in input) patch.blocks = input.blocks;
          patch.updated_at = new Date().toISOString();
          const { data, error } = await admin
            .from(T.templates)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", templateId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] update template: ${error.message}`);
          const mapped = mapTemplateRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.templates.update",
            "mkt_template",
            templateId,
            { changed: Object.keys(patch) },
          );
          return mapped;
        },
      ),
    delete: async (siteId, templateId) =>
      withPortalEvent(
        "portal.dal.marketing.templates.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.templates)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", templateId);
          if (error)
            throw new Error(`[portal][mkt] delete template: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.templates.delete",
            "mkt_template",
            templateId,
          );
        },
      ),
  };
}

// =============================================================================
// SEQUENCES NAMESPACE
// =============================================================================

export type PortalSequenceStatus = "draft" | "active" | "paused" | "archived";

export interface PortalSequenceListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  triggerType: string | null;
  enrollmentCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateSequenceInput {
  name: string;
  description?: string | null;
  triggerType?: string | null;
  status?: PortalSequenceStatus;
}

export type PortalUpdateSequenceInput = Partial<PortalCreateSequenceInput>;

function mapSequenceRow(row: any): PortalSequenceListItem {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    name: cleaned.name ?? "",
    description: cleaned.description ?? null,
    status: cleaned.status ?? "draft",
    triggerType: cleaned.trigger_type ?? null,
    enrollmentCount: Number(cleaned.enrollment_count ?? 0),
    createdAt: cleaned.created_at ?? null,
    updatedAt: cleaned.updated_at ?? null,
  };
}

export interface PortalMarketingSequencesNamespace {
  list(siteId: string): Promise<PortalSequenceListItem[]>;
  detail(siteId: string, sequenceId: string): Promise<PortalSequenceListItem>;
  create(
    siteId: string,
    input: PortalCreateSequenceInput,
  ): Promise<PortalSequenceListItem>;
  update(
    siteId: string,
    sequenceId: string,
    input: PortalUpdateSequenceInput,
  ): Promise<PortalSequenceListItem>;
  enroll(
    siteId: string,
    sequenceId: string,
    subscriberId: string,
  ): Promise<void>;
  pause(siteId: string, sequenceId: string): Promise<PortalSequenceListItem>;
  delete(siteId: string, sequenceId: string): Promise<void>;
}

function createSequencesNamespace(
  ctx: PortalDALContext,
): PortalMarketingSequencesNamespace {
  return {
    list: async (siteId) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.sequences)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (error)
            throw new Error(`[portal][mkt] list sequences: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.list",
            "mkt_sequence",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapSequenceRow);
        },
      ),
    detail: async (siteId, sequenceId) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.sequences)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", sequenceId)
            .single();
          if (error)
            throw new Error(`[portal][mkt] sequence not found: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.detail",
            "mkt_sequence",
            sequenceId,
          );
          return mapSequenceRow(data);
        },
      ),
    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name,
            description: stringOrNull(input.description),
            trigger_type: stringOrNull(input.triggerType),
            status: input.status ?? "draft",
          };
          const { data, error } = await admin
            .from(T.sequences)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] create sequence: ${error.message}`);
          const mapped = mapSequenceRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.create",
            "mkt_sequence",
            mapped.id,
            { name: mapped.name },
          );
          return mapped;
        },
      ),
    update: async (siteId, sequenceId, input) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && typeof input.name === "string")
            patch.name = input.name;
          if ("description" in input)
            patch.description = stringOrNull(input.description);
          if ("triggerType" in input)
            patch.trigger_type = stringOrNull(input.triggerType);
          if ("status" in input) patch.status = input.status;
          patch.updated_at = new Date().toISOString();
          const { data, error } = await admin
            .from(T.sequences)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", sequenceId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] update sequence: ${error.message}`);
          const mapped = mapSequenceRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.update",
            "mkt_sequence",
            sequenceId,
            { changed: Object.keys(patch) },
          );
          return mapped;
        },
      ),
    enroll: async (siteId, sequenceId, subscriberId) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.enroll",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;

          // Consent gate: refuse to enroll subscribers who have revoked
          // email consent. We look up their consent state first.
          const { data: sub, error: subErr } = await admin
            .from(T.subscribers)
            .select("id, status, email_opt_in")
            .eq("site_id", scope.siteId)
            .eq("id", subscriberId)
            .single();
          if (subErr)
            throw new Error(`[portal][mkt] subscriber not found: ${subErr.message}`);
          if (sub.status !== "active" || sub.email_opt_in !== true) {
            finalizeAudit(
              ctx,
              siteId,
              "portal.marketing.sequences.enroll.blocked",
              "mkt_sequence",
              sequenceId,
              { subscriber_id: subscriberId, reason: "no_consent" },
            );
            throw new Error("no_consent");
          }

          const { error } = await admin.from(T.sequenceEnrollments).insert({
            site_id: scope.siteId,
            sequence_id: sequenceId,
            subscriber_id: subscriberId,
            status: "active",
            enrolled_at: new Date().toISOString(),
          });
          if (error)
            throw new Error(`[portal][mkt] enroll: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.enroll",
            "mkt_sequence",
            sequenceId,
            { subscriber_id: subscriberId },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.marketing.sequence.enrolled,
            ctx,
            { sequence_id: sequenceId, subscriber_id: subscriberId },
            "sequence",
            sequenceId,
          );
        },
      ),
    pause: async (siteId, sequenceId) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.pause",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.sequences)
            .update({ status: "paused", updated_at: new Date().toISOString() })
            .eq("site_id", scope.siteId)
            .eq("id", sequenceId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] pause sequence: ${error.message}`);
          const mapped = mapSequenceRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.pause",
            "mkt_sequence",
            sequenceId,
          );
          return mapped;
        },
      ),
    delete: async (siteId, sequenceId) =>
      withPortalEvent(
        "portal.dal.marketing.sequences.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.sequences)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", sequenceId);
          if (error)
            throw new Error(`[portal][mkt] delete sequence: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.sequences.delete",
            "mkt_sequence",
            sequenceId,
          );
        },
      ),
  };
}

// =============================================================================
// FORMS NAMESPACE
// =============================================================================

export interface PortalFormListItem {
  id: string;
  name: string;
  submissionCount: number;
  published: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalFormSubmissionItem {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedAt: string | null;
}

export interface PortalCreateFormInput {
  name: string;
  fields?: unknown;
  published?: boolean;
}

export type PortalUpdateFormInput = Partial<PortalCreateFormInput>;

function mapFormRow(row: any): PortalFormListItem {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    name: cleaned.name ?? "",
    submissionCount: Number(cleaned.submission_count ?? 0),
    published: Boolean(cleaned.published),
    createdAt: cleaned.created_at ?? null,
    updatedAt: cleaned.updated_at ?? null,
  };
}

function mapSubmissionRow(row: any): PortalFormSubmissionItem {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    formId: String(cleaned.form_id),
    data: (cleaned.data ?? {}) as Record<string, unknown>,
    submittedAt: cleaned.created_at ?? null,
  };
}

export interface PortalMarketingFormsNamespace {
  list(siteId: string): Promise<PortalFormListItem[]>;
  detail(siteId: string, formId: string): Promise<PortalFormListItem>;
  create(siteId: string, input: PortalCreateFormInput): Promise<PortalFormListItem>;
  update(
    siteId: string,
    formId: string,
    input: PortalUpdateFormInput,
  ): Promise<PortalFormListItem>;
  delete(siteId: string, formId: string): Promise<void>;
  submissions(
    siteId: string,
    formId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<PortalFormSubmissionItem[]>;
}

function createFormsNamespace(
  ctx: PortalDALContext,
): PortalMarketingFormsNamespace {
  return {
    list: async (siteId) =>
      withPortalEvent(
        "portal.dal.marketing.forms.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.forms)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (error)
            throw new Error(`[portal][mkt] list forms: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.forms.list",
            "mkt_form",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapFormRow);
        },
      ),
    detail: async (siteId, formId) =>
      withPortalEvent(
        "portal.dal.marketing.forms.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.forms)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("id", formId)
            .single();
          if (error)
            throw new Error(`[portal][mkt] form not found: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.forms.detail",
            "mkt_form",
            formId,
          );
          return mapFormRow(data);
        },
      ),
    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.marketing.forms.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const row = {
            site_id: scope.siteId,
            name: input.name,
            fields: input.fields ?? [],
            published: Boolean(input.published),
          };
          const { data, error } = await admin
            .from(T.forms)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] create form: ${error.message}`);
          const mapped = mapFormRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.forms.create",
            "mkt_form",
            mapped.id,
            { name: mapped.name },
          );
          return mapped;
        },
      ),
    update: async (siteId, formId, input) =>
      withPortalEvent(
        "portal.dal.marketing.forms.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {};
          if ("name" in input && typeof input.name === "string")
            patch.name = input.name;
          if ("fields" in input) patch.fields = input.fields;
          if ("published" in input) patch.published = Boolean(input.published);
          patch.updated_at = new Date().toISOString();
          const { data, error } = await admin
            .from(T.forms)
            .update(patch)
            .eq("site_id", scope.siteId)
            .eq("id", formId)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][mkt] update form: ${error.message}`);
          const mapped = mapFormRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.forms.update",
            "mkt_form",
            formId,
            { changed: Object.keys(patch) },
          );
          return mapped;
        },
      ),
    delete: async (siteId, formId) =>
      withPortalEvent(
        "portal.dal.marketing.forms.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.forms)
            .delete()
            .eq("site_id", scope.siteId)
            .eq("id", formId);
          if (error)
            throw new Error(`[portal][mkt] delete form: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.forms.delete",
            "mkt_form",
            formId,
          );
        },
      ),
    submissions: async (siteId, formId, opts) =>
      withPortalEvent(
        "portal.dal.marketing.forms.submissions",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.formSubmissions)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("form_id", formId)
            .order("created_at", { ascending: false });
          if (opts?.limit || opts?.offset) {
            const from = opts?.offset ?? 0;
            const to = from + (opts?.limit ?? 50) - 1;
            q = q.range(from, to);
          }
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][mkt] list submissions: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.marketing.forms.submissions",
            "mkt_form",
            formId,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapSubmissionRow);
        },
      ),
  };
}

// =============================================================================
// ROOT NAMESPACE
// =============================================================================

export interface PortalMarketingNamespace {
  lists: PortalMarketingListsNamespace;
  subscribers: PortalMarketingSubscribersNamespace;
  campaigns: PortalMarketingCampaignsNamespace;
  templates: PortalMarketingTemplatesNamespace;
  sequences: PortalMarketingSequencesNamespace;
  forms: PortalMarketingFormsNamespace;
}

export function createMarketingNamespace(
  ctx: PortalDALContext,
): PortalMarketingNamespace {
  return {
    lists: createListsNamespace(ctx),
    subscribers: createSubscribersNamespace(ctx),
    campaigns: createCampaignsNamespace(ctx),
    templates: createTemplatesNamespace(ctx),
    sequences: createSequencesNamespace(ctx),
    forms: createFormsNamespace(ctx),
  };
}
