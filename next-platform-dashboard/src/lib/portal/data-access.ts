import "server-only";

/**
 * Portal Data Access Layer (DAL).
 *
 * All portal Server Components and Server Actions that read tenant data
 * should do so through `createPortalDAL(user)`. The DAL:
 *
 *   1. Enforces permission for every read using the cached resolver.
 *   2. Applies defense-in-depth tenant filters (client_id / site_id) so that
 *      bugs in permission logic cannot leak cross-tenant data.
 *   3. Normalizes snake_case columns into camelCase fields via `mapRecord`.
 *   4. Emits a structured observability event per call.
 *   5. Fire-and-forget audits denials and sensitive views to
 *      `portal_audit_log`.
 *
 * The DAL intentionally exposes a small, task-focused surface. New reads
 * should be added here (or in a sibling module) rather than reaching for
 * the admin client directly from pages/components.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { PortalUser } from "./portal-auth";
import {
  checkPortalPermission,
  resolveClientSites,
  resolveSiteScope,
  type PortalPermissionKey,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { logPortalEvent, withPortalEvent } from "./observability";
import { toCents } from "@/lib/money";
import {
  createBookingsNamespace,
  createCustomersNamespace,
  createOrdersNamespaceExtensions,
  createPaymentsNamespace,
  createProductsNamespace,
  createQuotesNamespace,
  type PortalBookingsNamespace,
  type PortalCustomersNamespace,
  type PortalOrdersNamespaceExtensions,
  type PortalPaymentsNamespace,
  type PortalProductsNamespace,
  type PortalQuotesNamespace,
} from "./commerce-data-access";
import {
  createInvoicingNamespace,
  type PortalInvoicingNamespace,
} from "./invoicing-data-access";
import {
  createCRMNamespace,
  type PortalCRMNamespace,
} from "./crm-data-access";
import {
  createMarketingNamespace,
  type PortalMarketingNamespace,
} from "./marketing-data-access";
import {
  createSupportNamespace,
  type PortalSupportNamespace,
} from "./support-data-access";
import {
  createCommunicationsNamespace,
  type PortalCommunicationsNamespace,
} from "./communications-data-access";

// =============================================================================
// DAL CONTEXT
// =============================================================================

export interface PortalDALContext {
  user: PortalUser;
  isImpersonation: boolean;
  impersonatorEmail: string | null;
}

// =============================================================================
// DENIED ERROR
// =============================================================================

export class PortalAccessDeniedError extends Error {
  readonly code: "site_not_found" | "permission_denied";
  readonly siteId: string;
  readonly permission: PortalPermissionKey | null;
  constructor(
    code: "site_not_found" | "permission_denied",
    siteId: string,
    permission: PortalPermissionKey | null,
  ) {
    super(
      code === "site_not_found"
        ? `Portal: site ${siteId} not found for current client`
        : `Portal: permission "${permission}" denied for site ${siteId}`,
    );
    this.name = "PortalAccessDeniedError";
    this.code = code;
    this.siteId = siteId;
    this.permission = permission;
  }
}

// =============================================================================
// NORMALIZED RETURN TYPES
// =============================================================================

export interface PortalSiteSummary {
  id: string;
  name: string;
  subdomain: string | null;
  customDomain: string | null;
  isPublished: boolean;
}

export interface PortalOrderSummary {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenueCents: number;
  recentOrders: Array<{
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    status: string;
    paymentStatus: string | null;
    totalCents: number;
    createdAt: string;
  }>;
}

export interface PortalConversationSummary {
  activeConversations: number;
  pendingConversations: number;
  closedConversations: number;
  totalConversations: number;
  recentConversations: Array<{
    id: string;
    channel: string | null;
    status: string | null;
    messageCount: number;
    lastMessageAt: string | null;
    assignedAgentId: string | null;
  }>;
}

export interface PortalConversationListFilter {
  status?: "active" | "pending" | "closed" | "all";
  assignedAgentId?: string | null;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalConversationListItem {
  id: string;
  channel: string | null;
  status: string | null;
  subject: string | null;
  customerName: string | null;
  customerEmail: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  assignedAgentId: string | null;
  unreadCount: number;
  createdAt: string | null;
}

export interface PortalConversationDetail extends PortalConversationListItem {
  agencyId: string | null;
  siteId: string | null;
  closedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PortalConversationMessage {
  id: string;
  conversationId: string;
  senderType: string;
  senderId: string | null;
  senderName: string | null;
  content: string | null;
  contentType: string | null;
  isInternalNote: boolean;
  isAiGenerated: boolean;
  aiConfidence: number | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface PortalNotificationListFilter {
  unreadOnly?: boolean;
  archived?: boolean;
  type?: string;
  siteId?: string | null;
  limit?: number;
  offset?: number;
}

export interface PortalNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  isArchived: boolean;
  siteId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
}

export type PortalPreferenceChannels = {
  inApp: boolean;
  email: boolean;
  push: boolean;
};

// =============================================================================
// DAL FACTORY
// =============================================================================

export interface PortalDAL {
  ctx: PortalDALContext;
  sites: {
    list(): Promise<PortalSiteSummary[]>;
    scope(siteId: string): Promise<PortalSiteScope>;
  };
  orders: {
    summaryForSite(siteId: string): Promise<PortalOrderSummary>;
  } & PortalOrdersNamespaceExtensions;
  products: PortalProductsNamespace;
  customers: PortalCustomersNamespace;
  quotes: PortalQuotesNamespace;
  bookings: PortalBookingsNamespace;
  payments: PortalPaymentsNamespace;
  invoicing: PortalInvoicingNamespace;
  crm: PortalCRMNamespace;
  marketing: PortalMarketingNamespace;
  support: PortalSupportNamespace;
  communications: PortalCommunicationsNamespace;
  conversations: {
    summaryForSite(siteId: string): Promise<PortalConversationSummary>;
    list(
      siteId: string,
      filter?: PortalConversationListFilter,
    ): Promise<PortalConversationListItem[]>;
    detail(
      siteId: string,
      conversationId: string,
    ): Promise<PortalConversationDetail>;
    messages(
      siteId: string,
      conversationId: string,
      options?: { includeNotes?: boolean; limit?: number },
    ): Promise<PortalConversationMessage[]>;
    notes(
      siteId: string,
      conversationId: string,
    ): Promise<PortalConversationMessage[]>;
  };
  notifications: {
    list(
      filter?: PortalNotificationListFilter,
    ): Promise<PortalNotificationItem[]>;
    unreadCount(siteId?: string | null): Promise<number>;
    markRead(ids: string[]): Promise<number>;
    markAllRead(siteId?: string | null): Promise<number>;
    archive(ids: string[]): Promise<number>;
    preferences: {
      get(
        eventType: string,
        siteId: string | null,
      ): Promise<PortalPreferenceChannels>;
      set(
        eventType: string,
        siteId: string | null,
        channels: Partial<PortalPreferenceChannels>,
      ): Promise<void>;
    };
  };
}

export function createPortalDAL(ctx: PortalDALContext): PortalDAL {
  return {
    ctx,
    sites: {
      list: () => listSites(ctx),
      scope: (siteId: string) => requireScope(ctx, siteId, null),
    },
    orders: {
      summaryForSite: (siteId: string) => summaryOrders(ctx, siteId),
      ...createOrdersNamespaceExtensions(ctx),
    },
    products: createProductsNamespace(ctx),
    customers: createCustomersNamespace(ctx),
    quotes: createQuotesNamespace(ctx),
    bookings: createBookingsNamespace(ctx),
    payments: createPaymentsNamespace(ctx),
    invoicing: createInvoicingNamespace(ctx),
    crm: createCRMNamespace(ctx),
    marketing: createMarketingNamespace(ctx),
    support: createSupportNamespace(ctx),
    communications: createCommunicationsNamespace(ctx),
    conversations: {
      summaryForSite: (siteId: string) => summaryConversations(ctx, siteId),
      list: (siteId, filter) => listConversations(ctx, siteId, filter),
      detail: (siteId, conversationId) =>
        detailConversation(ctx, siteId, conversationId),
      messages: (siteId, conversationId, options) =>
        listConversationMessages(ctx, siteId, conversationId, options),
      notes: (siteId, conversationId) =>
        listConversationNotes(ctx, siteId, conversationId),
    },
    notifications: {
      list: (filter) => listNotifications(ctx, filter),
      unreadCount: (siteId) => countUnreadNotifications(ctx, siteId ?? null),
      markRead: (ids) => markNotificationsRead(ctx, ids),
      markAllRead: (siteId) => markAllNotificationsRead(ctx, siteId ?? null),
      archive: (ids) => archiveNotifications(ctx, ids),
      preferences: {
        get: (eventType, siteId) => getPreference(ctx, eventType, siteId),
        set: (eventType, siteId, channels) =>
          setPreference(ctx, eventType, siteId, channels),
      },
    },
  };
}

// =============================================================================
// INTERNAL: SITE LIST
// =============================================================================

async function listSites(ctx: PortalDALContext): Promise<PortalSiteSummary[]> {
  return withPortalEvent(
    "portal.dal.sites.list",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const sites = await resolveClientSites(ctx.user.clientId);
      return sites.map((s) => ({
        id: s.id,
        name: s.name,
        subdomain: s.subdomain,
        customDomain: s.customDomain,
        isPublished: s.isPublished,
      }));
    },
  );
}

// =============================================================================
// INTERNAL: ENFORCED SCOPE
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
  permission: PortalPermissionKey | null,
): Promise<PortalSiteScope> {
  // No-permission case: just need site access.
  if (!permission) {
    const scope = await resolveSiteScope(ctx.user.clientId, siteId);
    if (!scope) {
      await auditPortalDenied({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId,
        action: "portal.site.access",
        reason: "site_not_found",
        isImpersonation: ctx.isImpersonation,
      });
      throw new PortalAccessDeniedError("site_not_found", siteId, null);
    }
    return scope;
  }

  const result = await checkPortalPermission(ctx.user, siteId, permission);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${permission}`,
      permissionKey: permission,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      permission,
    );
  }
  return result.scope!;
}

// =============================================================================
// INTERNAL: ORDERS SUMMARY
// =============================================================================

interface OrderRow {
  id: string;
  site_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string | null;
  payment_status: string | null;
  /** DECIMAL(10,2) — Postgres may return it as number or string depending on driver. */
  total: number | string | null;
  created_at: string | null;
}

async function summaryOrders(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalOrderSummary> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");

  return withPortalEvent(
    "portal.dal.orders.summary",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();

      // Defense-in-depth: constrain by site_id AND only pull what the portal needs.
      const { data, error } = await admin
        .from("mod_ecommod01_orders")
        .select(
          "id, site_id, customer_name, customer_email, status, payment_status, total, created_at",
        )
        .eq("site_id", scope.siteId)
        .order("created_at", { ascending: false })
        .limit(500); // hard cap; summary does not need the full history

      if (error) {
        logPortalEvent({
          event: "portal.dal.orders.query_error",
          level: "error",
          ok: false,
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          siteId: scope.siteId,
          error: error.message,
        });
        throw new Error("Failed to load orders");
      }

      const rows = (data ?? []) as OrderRow[];

      let pending = 0;
      let paid = 0;
      let revenueCents = 0;
      for (const r of rows) {
        if (r.status === "pending") pending++;
        if (r.payment_status === "paid") paid++;
        if (r.payment_status === "paid") {
          // r.total is DECIMAL(10,2) in ecommerce; convert to integer cents
          // via the money helper to preserve minor-unit precision (Session 3 §4.7).
          revenueCents += Math.max(0, toCents(r.total));
        }
      }

      const recent = rows.slice(0, 5).map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        status: r.status ?? "unknown",
        paymentStatus: r.payment_status,
        totalCents: Math.max(0, toCents(r.total)),
        createdAt: r.created_at ?? "",
      }));

      // Audit this as a sensitive view (reads customer PII).
      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.orders.summary.view",
        resourceType: "order",
        permissionKey: "canManageOrders",
        metadata: { rowCount: rows.length },
      }).catch(() => {});

      return {
        totalOrders: rows.length,
        pendingOrders: pending,
        paidOrders: paid,
        totalRevenueCents: revenueCents,
        recentOrders: recent,
      };
    },
  );
}

// =============================================================================
// INTERNAL: CONVERSATIONS SUMMARY
// =============================================================================

interface ConversationRow {
  id: string;
  site_id: string | null;
  channel: string | null;
  status: string | null;
  message_count: number | null;
  last_message_at: string | null;
  assigned_agent_id: string | null;
  closed_at: string | null;
}

async function summaryConversations(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalConversationSummary> {
  const scope = await requireScope(ctx, siteId, "canManageLiveChat");

  return withPortalEvent(
    "portal.dal.conversations.summary",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();

      const { data, error } = await admin
        .from("mod_chat_conversations")
        .select(
          "id, site_id, channel, status, message_count, last_message_at, assigned_agent_id, closed_at",
        )
        .eq("site_id", scope.siteId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(500);

      if (error) {
        logPortalEvent({
          event: "portal.dal.conversations.query_error",
          level: "error",
          ok: false,
          agencyId: ctx.user.agencyId,
          clientId: ctx.user.clientId,
          siteId: scope.siteId,
          error: error.message,
        });
        throw new Error("Failed to load conversations");
      }

      const rows = (data ?? []) as ConversationRow[];

      let active = 0;
      let pending = 0;
      let closed = 0;
      for (const r of rows) {
        const status = (r.status ?? "").toLowerCase();
        if (status === "active" || status === "open") active++;
        else if (status === "pending" || status === "queued") pending++;
        else if (status === "closed" || status === "resolved") closed++;
      }

      const recent = rows.slice(0, 5).map((r) => ({
        id: r.id,
        channel: r.channel,
        status: r.status,
        messageCount: Math.max(0, Number(r.message_count ?? 0)),
        lastMessageAt: r.last_message_at,
        assignedAgentId: r.assigned_agent_id,
      }));

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.conversations.summary.view",
        resourceType: "conversation",
        permissionKey: "canManageLiveChat",
        metadata: { rowCount: rows.length },
      }).catch(() => {});

      return {
        totalConversations: rows.length,
        activeConversations: active,
        pendingConversations: pending,
        closedConversations: closed,
        recentConversations: recent,
      };
    },
  );
}

// =============================================================================
// INTERNAL: CONVERSATIONS — LIST / DETAIL / MESSAGES / NOTES
// =============================================================================

/**
 * Internal note security (5 layers):
 *   1. Storage: `is_internal_note` column on mod_chat_messages.
 *   2. Server filter: `messages()` defaults `includeNotes=false`.
 *   3. Preview safety: notes are NEVER passed through notification dispatch
 *      (handled in the dispatcher — no note content is sent via push/email).
 *   4. Public endpoints: external/visitor chat endpoints must always filter
 *      `is_internal_note = false` (enforced there, asserted by tests).
 *   5. Permission gate: `notes()` and `messages({ includeNotes: true })`
 *      both require `canManageLiveChat` on the site.
 */

interface ChatVisitorStub {
  name: string | null;
  email: string | null;
}

interface ChatConversationRow {
  id: string;
  site_id: string | null;
  channel: string | null;
  status: string | null;
  subject: string | null;
  message_count: number | null;
  last_message_at: string | null;
  assigned_agent_id: string | null;
  closed_at: string | null;
  created_at: string | null;
  unread_agent_count: number | null;
  metadata?: Record<string, unknown> | null;
  visitor?: ChatVisitorStub | ChatVisitorStub[] | null;
}

function mapConversation(row: ChatConversationRow): PortalConversationListItem {
  const visitor = Array.isArray(row.visitor) ? row.visitor[0] : row.visitor;
  return {
    id: row.id,
    channel: row.channel,
    status: row.status,
    subject: row.subject,
    customerName: visitor?.name ?? null,
    customerEmail: visitor?.email ?? null,
    messageCount: Math.max(0, Number(row.message_count ?? 0)),
    lastMessageAt: row.last_message_at,
    assignedAgentId: row.assigned_agent_id,
    unreadCount: Math.max(0, Number(row.unread_agent_count ?? 0)),
    createdAt: row.created_at,
  };
}

async function listConversations(
  ctx: PortalDALContext,
  siteId: string,
  filter?: PortalConversationListFilter,
): Promise<PortalConversationListItem[]> {
  const scope = await requireScope(ctx, siteId, "canManageLiveChat");

  return withPortalEvent(
    "portal.dal.conversations.list",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      let q = admin
        .from("mod_chat_conversations")
        .select(
          "id, site_id, channel, status, subject, message_count, last_message_at, assigned_agent_id, closed_at, created_at, unread_agent_count, metadata, visitor:mod_chat_visitors(name, email)",
        )
        .eq("site_id", scope.siteId);

      if (filter?.status && filter.status !== "all") {
        if (filter.status === "active") q = q.in("status", ["active", "open"]);
        else if (filter.status === "pending")
          q = q.in("status", ["pending", "queued"]);
        else if (filter.status === "closed")
          q = q.in("status", ["closed", "resolved"]);
      }
      if (filter?.assignedAgentId !== undefined) {
        if (filter.assignedAgentId === null)
          q = q.is("assigned_agent_id", null);
        else q = q.eq("assigned_agent_id", filter.assignedAgentId);
      }
      if (filter?.search) {
        const s = `%${filter.search.replace(/[%_]/g, "\\$&")}%`;
        q = q.or(`subject.ilike.${s}`);
      }

      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);

      const { data, error } = await q
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logPortalEvent({
          event: "portal.dal.conversations.list_error",
          level: "error",
          ok: false,
          agencyId: ctx.user.agencyId,
          siteId: scope.siteId,
          error: error.message,
        });
        throw new Error("Failed to load conversations");
      }

      return ((data ?? []) as unknown as ChatConversationRow[]).map(
        mapConversation,
      );
    },
  );
}

async function detailConversation(
  ctx: PortalDALContext,
  siteId: string,
  conversationId: string,
): Promise<PortalConversationDetail> {
  const scope = await requireScope(ctx, siteId, "canManageLiveChat");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mod_chat_conversations")
    .select(
      "id, site_id, channel, status, subject, message_count, last_message_at, assigned_agent_id, closed_at, created_at, unread_agent_count, metadata, visitor:mod_chat_visitors(name, email)",
    )
    .eq("id", conversationId)
    .eq("site_id", scope.siteId)
    .maybeSingle();

  if (error || !data) {
    throw new PortalAccessDeniedError(
      "site_not_found",
      siteId,
      "canManageLiveChat",
    );
  }

  const row = data as unknown as ChatConversationRow;
  const base = mapConversation(row);
  return {
    ...base,
    agencyId: null,
    siteId: row.site_id,
    closedAt: row.closed_at,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

interface ChatMessageRow {
  id: string;
  conversation_id: string;
  site_id: string;
  sender_type: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string | null;
  content_type: string | null;
  is_internal_note: boolean | null;
  is_ai_generated: boolean | null;
  ai_confidence: number | null;
  file_url: string | null;
  file_name: string | null;
  file_mime_type: string | null;
  status: string | null;
  created_at: string | null;
}

function mapMessage(row: ChatMessageRow): PortalConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    contentType: row.content_type,
    isInternalNote: !!row.is_internal_note,
    isAiGenerated: !!row.is_ai_generated,
    aiConfidence: row.ai_confidence,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileMimeType: row.file_mime_type,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function listConversationMessages(
  ctx: PortalDALContext,
  siteId: string,
  conversationId: string,
  options?: { includeNotes?: boolean; limit?: number },
): Promise<PortalConversationMessage[]> {
  // Including notes requires the live-chat permission (layer 5).
  const scope = await requireScope(ctx, siteId, "canManageLiveChat");
  const admin = createAdminClient();

  let q = admin
    .from("mod_chat_messages")
    .select(
      "id, conversation_id, site_id, sender_type, sender_id, sender_name, content, content_type, is_internal_note, is_ai_generated, ai_confidence, file_url, file_name, file_mime_type, status, created_at",
    )
    .eq("conversation_id", conversationId)
    .eq("site_id", scope.siteId);

  // Layer 2: default to EXCLUDING internal notes unless caller opts in.
  if (!options?.includeNotes) {
    q = q.eq("is_internal_note", false);
  }

  const { data, error } = await q
    .order("created_at", { ascending: true })
    .limit(Math.min(Math.max(options?.limit ?? 500, 1), 1000));

  if (error) throw new Error("Failed to load messages");

  return ((data ?? []) as unknown as ChatMessageRow[]).map(mapMessage);
}

async function listConversationNotes(
  ctx: PortalDALContext,
  siteId: string,
  conversationId: string,
): Promise<PortalConversationMessage[]> {
  // Layer 5: permission gate.
  const scope = await requireScope(ctx, siteId, "canManageLiveChat");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mod_chat_messages")
    .select(
      "id, conversation_id, site_id, sender_type, sender_id, sender_name, content, content_type, is_internal_note, is_ai_generated, ai_confidence, file_url, file_name, file_mime_type, status, created_at",
    )
    .eq("conversation_id", conversationId)
    .eq("site_id", scope.siteId)
    .eq("is_internal_note", true)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) throw new Error("Failed to load notes");

  writePortalAudit({
    authUserId: ctx.user.userId,
    clientId: ctx.user.clientId,
    agencyId: ctx.user.agencyId,
    siteId: scope.siteId,
    isImpersonation: ctx.isImpersonation,
    impersonatorEmail: ctx.impersonatorEmail,
    action: "portal.conversation.notes.view",
    resourceType: "conversation",
    resourceId: conversationId,
    permissionKey: "canManageLiveChat",
    metadata: { rowCount: data?.length ?? 0 },
  }).catch(() => {});

  return ((data ?? []) as unknown as ChatMessageRow[]).map(mapMessage);
}

// =============================================================================
// INTERNAL: NOTIFICATIONS — LIST / UNREAD / READ / ARCHIVE / PREFERENCES
// =============================================================================

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean | null;
  is_archived: boolean | null;
  site_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

async function listNotifications(
  ctx: PortalDALContext,
  filter?: PortalNotificationListFilter,
): Promise<PortalNotificationItem[]> {
  const admin = createAdminClient();
  let q = admin
    .from("notifications" as never)
    .select(
      "id, user_id, type, title, message, link, is_read, is_archived, site_id, resource_type, resource_id, metadata, created_at",
    )
    .eq("user_id", ctx.user.userId);

  if (filter?.unreadOnly) q = q.eq("is_read", false);
  if (filter?.archived !== undefined) q = q.eq("is_archived", filter.archived);
  else q = q.eq("is_archived", false);
  if (filter?.type) q = q.eq("type", filter.type);
  if (filter?.siteId !== undefined) {
    if (filter.siteId === null) q = q.is("site_id", null);
    else q = q.eq("site_id", filter.siteId);
  }

  const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
  const offset = Math.max(filter?.offset ?? 0, 0);

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error("Failed to load notifications");

  return ((data ?? []) as unknown as NotificationRow[]).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link,
    isRead: !!r.is_read,
    isArchived: !!r.is_archived,
    siteId: r.site_id,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    metadata: r.metadata ?? null,
    createdAt: r.created_at,
  }));
}

async function countUnreadNotifications(
  ctx: PortalDALContext,
  siteId: string | null,
): Promise<number> {
  const admin = createAdminClient();
  let q = admin
    .from("notifications" as never)
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.userId)
    .eq("is_read", false)
    .eq("is_archived", false);
  if (siteId === null) q = q.is("site_id", null);
  else if (siteId) q = q.eq("site_id", siteId);

  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

async function markNotificationsRead(
  ctx: PortalDALContext,
  ids: string[],
): Promise<number> {
  if (!ids.length) return 0;
  const admin = createAdminClient();
  const { error, count } = await admin
    .from("notifications" as never)
    .update({ is_read: true, read_at: new Date().toISOString() } as never, {
      count: "exact",
    })
    .eq("user_id", ctx.user.userId)
    .in("id", ids);
  if (error) return 0;
  return count ?? 0;
}

async function markAllNotificationsRead(
  ctx: PortalDALContext,
  siteId: string | null,
): Promise<number> {
  const admin = createAdminClient();
  let q = admin
    .from("notifications" as never)
    .update({ is_read: true, read_at: new Date().toISOString() } as never, {
      count: "exact",
    })
    .eq("user_id", ctx.user.userId)
    .eq("is_read", false);
  if (siteId === null) q = q.is("site_id", null);
  else if (siteId) q = q.eq("site_id", siteId);
  const { error, count } = await q;
  if (error) return 0;
  return count ?? 0;
}

async function archiveNotifications(
  ctx: PortalDALContext,
  ids: string[],
): Promise<number> {
  if (!ids.length) return 0;
  const admin = createAdminClient();
  const { error, count } = await admin
    .from("notifications" as never)
    .update({ is_archived: true } as never, { count: "exact" })
    .eq("user_id", ctx.user.userId)
    .in("id", ids);
  if (error) return 0;
  return count ?? 0;
}

async function getPreference(
  ctx: PortalDALContext,
  eventType: string,
  siteId: string | null,
): Promise<PortalPreferenceChannels> {
  const admin = createAdminClient();
  // Try site-scoped first.
  if (siteId) {
    const { data } = await admin
      .from("portal_notification_preferences" as never)
      .select("in_app_enabled, email_enabled, push_enabled")
      .eq("user_id", ctx.user.userId)
      .eq("event_type", eventType)
      .eq("site_id", siteId)
      .maybeSingle();
    const row = data as {
      in_app_enabled: boolean;
      email_enabled: boolean;
      push_enabled: boolean;
    } | null;
    if (row) {
      return {
        inApp: row.in_app_enabled,
        email: row.email_enabled,
        push: row.push_enabled,
      };
    }
  }
  // Fall back to global preference.
  const { data: globalData } = await admin
    .from("portal_notification_preferences" as never)
    .select("in_app_enabled, email_enabled, push_enabled")
    .eq("user_id", ctx.user.userId)
    .eq("event_type", eventType)
    .is("site_id", null)
    .maybeSingle();
  const g = globalData as {
    in_app_enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
  } | null;
  if (g) {
    return {
      inApp: g.in_app_enabled,
      email: g.email_enabled,
      push: g.push_enabled,
    };
  }
  return { inApp: true, email: true, push: true };
}

async function setPreference(
  ctx: PortalDALContext,
  eventType: string,
  siteId: string | null,
  channels: Partial<PortalPreferenceChannels>,
): Promise<void> {
  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    user_id: ctx.user.userId,
    event_type: eventType,
    site_id: siteId,
  };
  if (channels.inApp !== undefined) update.in_app_enabled = channels.inApp;
  if (channels.email !== undefined) update.email_enabled = channels.email;
  if (channels.push !== undefined) update.push_enabled = channels.push;

  await admin
    .from("portal_notification_preferences" as never)
    .upsert(update as never, {
      onConflict: "user_id,event_type,site_id",
    });
}

// =============================================================================
// EXPORTED HELPERS (for tests / introspection)
// =============================================================================

export const __internal = {
  requireScope,
};
