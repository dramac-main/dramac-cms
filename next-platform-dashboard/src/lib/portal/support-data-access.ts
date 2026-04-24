import "server-only";

/**
 * Portal Support DAL (Session 4D).
 *
 * Namespaces: tickets, messages.
 *
 * Invariants (shared with Sessions 1-4C):
 *   1. `requireScope(ctx, siteId, canManageSupport)` first \u2014 denials
 *      audit + throw. Permission is platform-universal (defaults true)
 *      because filing a support ticket is how portal users ask for
 *      help. Per-site access is still enforced via `resolveSiteScope`.
 *   2. Every query filters `site_id = scope.siteId` AND
 *      `client_id = ctx.user.clientId`. This is a double-scope: the
 *      ticket must belong to both the portal user's client AND the
 *      site they have access to. Agency staff tickets against other
 *      clients are invisible.
 *   3. `withPortalEvent` wraps every operation for observability.
 *   4. Writes fire-and-forget `writePortalAudit` + `logAutomationEvent`
 *      with `source: "portal", actor_user_id: ctx.user.userId`.
 *   5. **No internal-note leak**: messages sent by sender_type='agent'
 *      are fully visible to the portal client (the current schema has
 *      no `is_internal_note` column). If that column is added later,
 *      the DAL must filter `is_internal_note = false` on every read.
 *      This invariant is a forward-contract.
 *   6. Support tables are UNPREFIXED (`support_tickets`,
 *      `ticket_messages`) \u2014 they predate the mod_* naming scheme.
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

const SUPPORT_PERM = "canManageSupport" as const;

const T = {
  tickets: "support_tickets",
  messages: "ticket_messages",
} as const;

// =============================================================================
// SHARED HELPERS
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, SUPPORT_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${SUPPORT_PERM}`,
      permissionKey: SUPPORT_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      SUPPORT_PERM,
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
    permissionKey: SUPPORT_PERM,
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

// =============================================================================
// TYPES
// =============================================================================

export type PortalTicketCategory =
  | "general"
  | "bug"
  | "feature"
  | "billing"
  | "content";
export type PortalTicketPriority = "low" | "normal" | "high" | "urgent";
export type PortalTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface PortalTicketListFilter {
  status?: PortalTicketStatus | PortalTicketStatus[] | "all";
  priority?: PortalTicketPriority | PortalTicketPriority[];
  category?: PortalTicketCategory | PortalTicketCategory[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalTicketListItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string | null;
  priority: string | null;
  status: string | null;
  assignedTo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
}

export interface PortalTicketMessage {
  id: string;
  senderType: "client" | "agent";
  senderName: string;
  message: string;
  attachments: Array<{ url: string; name: string; type: string }>;
  createdAt: string | null;
}

export interface PortalTicketDetail extends PortalTicketListItem {
  description: string;
  messages: PortalTicketMessage[];
}

export interface PortalCreateTicketInput {
  subject: string;
  description: string;
  category?: PortalTicketCategory;
  priority?: PortalTicketPriority;
}

export interface PortalReplyInput {
  message: string;
  attachments?: Array<{ url: string; name: string; type: string }>;
}

function mapTicketRow(row: any): PortalTicketListItem {
  return {
    id: String(row.id),
    ticketNumber: String(row.ticket_number ?? ""),
    subject: row.subject ?? "",
    category: row.category ?? null,
    priority: row.priority ?? null,
    status: row.status ?? null,
    assignedTo: row.assigned_to ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    resolvedAt: row.resolved_at ?? null,
  };
}

function mapMessageRow(row: any): PortalTicketMessage {
  const senderType =
    row.sender_type === "agent" ? "agent" : ("client" as const);
  return {
    id: String(row.id),
    senderType,
    senderName: row.sender_name ?? "",
    message: row.message ?? "",
    attachments: Array.isArray(row.attachments)
      ? (row.attachments as Array<{ url: string; name: string; type: string }>)
      : [],
    createdAt: row.created_at ?? null,
  };
}

// =============================================================================
// TICKETS NAMESPACE
// =============================================================================

export interface PortalSupportTicketsNamespace {
  list(
    siteId: string,
    filter?: PortalTicketListFilter,
  ): Promise<PortalTicketListItem[]>;
  detail(siteId: string, ticketId: string): Promise<PortalTicketDetail>;
  create(
    siteId: string,
    input: PortalCreateTicketInput,
  ): Promise<PortalTicketListItem>;
  reply(
    siteId: string,
    ticketId: string,
    input: PortalReplyInput,
  ): Promise<PortalTicketMessage>;
  changeStatus(
    siteId: string,
    ticketId: string,
    status: PortalTicketStatus,
  ): Promise<PortalTicketListItem>;
  close(siteId: string, ticketId: string): Promise<PortalTicketListItem>;
  reopen(siteId: string, ticketId: string): Promise<PortalTicketListItem>;
}

function createTicketsNamespace(
  ctx: PortalDALContext,
): PortalSupportTicketsNamespace {
  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.support.tickets.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.tickets)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .order("created_at", { ascending: false });

          if (filter?.status && filter.status !== "all") {
            if (Array.isArray(filter.status)) {
              q = q.in("status", filter.status);
            } else {
              q = q.eq("status", filter.status);
            }
          }
          if (filter?.priority) {
            if (Array.isArray(filter.priority)) {
              q = q.in("priority", filter.priority);
            } else {
              q = q.eq("priority", filter.priority);
            }
          }
          if (filter?.category) {
            if (Array.isArray(filter.category)) {
              q = q.in("category", filter.category);
            } else {
              q = q.eq("category", filter.category);
            }
          }
          if (filter?.search && filter.search.trim().length > 0) {
            const s = filter.search.trim().replace(/[%_]/g, "");
            q = q.ilike("subject", `%${s}%`);
          }
          if (typeof filter?.limit === "number") q = q.limit(filter.limit);
          if (typeof filter?.offset === "number" && filter.offset > 0) {
            q = q.range(
              filter.offset,
              filter.offset + (filter.limit ?? 50) - 1,
            );
          }

          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][sup] list tickets: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.support.tickets.list",
            "support_ticket",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapTicketRow);
        },
      ),

    detail: async (siteId, ticketId) =>
      withPortalEvent(
        "portal.dal.support.tickets.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data: ticket, error } = await admin
            .from(T.tickets)
            .select("*")
            .eq("id", ticketId)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .single();
          if (error || !ticket)
            throw new Error(
              `[portal][sup] ticket not found: ${error?.message ?? "none"}`,
            );
          const { data: msgs } = await admin
            .from(T.messages)
            .select("*")
            .eq("ticket_id", ticketId)
            .order("created_at", { ascending: true });
          finalizeAudit(
            ctx,
            siteId,
            "portal.support.tickets.detail",
            "support_ticket",
            ticketId,
          );
          const base = mapTicketRow(ticket);
          return {
            ...base,
            description: ticket.description ?? "",
            messages: (msgs ?? []).map(mapMessageRow),
          };
        },
      ),

    create: async (siteId, input) =>
      withPortalEvent(
        "portal.dal.support.tickets.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const subject = stringOrNull(input.subject);
          const description = stringOrNull(input.description);
          if (!subject) throw new Error("[portal][sup] subject_required");
          if (!description)
            throw new Error("[portal][sup] description_required");

          const admin = createAdminClient() as any;
          const row = {
            client_id: ctx.user.clientId,
            site_id: scope.siteId,
            ticket_number: "", // trigger-generated
            subject,
            description,
            category: input.category ?? "general",
            priority: input.priority ?? "normal",
            status: "open",
          };
          const { data, error } = await admin
            .from(T.tickets)
            .insert(row)
            .select("*")
            .single();
          if (error)
            throw new Error(`[portal][sup] create ticket: ${error.message}`);
          const mapped = mapTicketRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.support.tickets.create",
            "support_ticket",
            mapped.id,
            { category: mapped.category, priority: mapped.priority },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.support.ticket.created,
            ctx,
            {
              ticket_id: mapped.id,
              ticket_number: mapped.ticketNumber,
              subject: mapped.subject,
              category: mapped.category,
              priority: mapped.priority,
            },
            "support_ticket",
            mapped.id,
          );
          return mapped;
        },
      ),

    reply: async (siteId, ticketId, input) =>
      withPortalEvent(
        "portal.dal.support.tickets.reply",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const message = stringOrNull(input.message);
          if (!message) throw new Error("[portal][sup] message_required");

          const admin = createAdminClient() as any;
          // Double-scope check: ticket must belong to this client + site.
          const { data: ticket, error: tErr } = await admin
            .from(T.tickets)
            .select("id, status")
            .eq("id", ticketId)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .single();
          if (tErr || !ticket)
            throw new Error(
              `[portal][sup] ticket not found: ${tErr?.message ?? "none"}`,
            );

          const row = {
            ticket_id: ticketId,
            sender_type: "client",
            sender_id: ctx.user.userId,
            sender_name: "", // caller fills via display name flow; kept empty for DAL neutrality
            message,
            attachments: input.attachments ?? [],
          };
          const { data, error } = await admin
            .from(T.messages)
            .insert(row)
            .select("*")
            .single();
          if (error) throw new Error(`[portal][sup] reply: ${error.message}`);

          // Bump updated_at + transition open\u2192in_progress on first client
          // reply is the agent's responsibility \u2014 the DAL does not mutate
          // status here, we only bump updated_at.
          await admin
            .from(T.tickets)
            .update({ updated_at: new Date().toISOString() })
            .eq("id", ticketId)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId);

          const mapped = mapMessageRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.support.tickets.reply",
            "ticket_message",
            mapped.id,
            { ticket_id: ticketId },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.support.ticket.replied,
            ctx,
            {
              ticket_id: ticketId,
              message_id: mapped.id,
              sender_type: "client",
            },
            "support_ticket",
            ticketId,
          );
          return mapped;
        },
      ),

    changeStatus: async (siteId, ticketId, status) =>
      withPortalEvent(
        "portal.dal.support.tickets.changeStatus",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const patch: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
          };
          if (status === "resolved" || status === "closed") {
            patch.resolved_at = new Date().toISOString();
          } else {
            patch.resolved_at = null;
          }
          const { data, error } = await admin
            .from(T.tickets)
            .update(patch)
            .eq("id", ticketId)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(
              `[portal][sup] changeStatus: ${error?.message ?? "not_found"}`,
            );
          const mapped = mapTicketRow(data);
          finalizeAudit(
            ctx,
            siteId,
            "portal.support.tickets.status_changed",
            "support_ticket",
            ticketId,
            { status },
          );
          emitEvent(
            scope.siteId,
            EVENT_REGISTRY.support.ticket.status_changed,
            ctx,
            { ticket_id: ticketId, status },
            "support_ticket",
            ticketId,
          );
          return mapped;
        },
      ),

    close: async (siteId, ticketId) => {
      const scope = await requireScope(ctx, siteId);
      const admin = createAdminClient() as any;
      const { data, error } = await admin
        .from(T.tickets)
        .update({
          status: "closed",
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId)
        .eq("site_id", scope.siteId)
        .eq("client_id", ctx.user.clientId)
        .select("*")
        .single();
      if (error || !data)
        throw new Error(
          `[portal][sup] close: ${error?.message ?? "not_found"}`,
        );
      const mapped = mapTicketRow(data);
      finalizeAudit(
        ctx,
        siteId,
        "portal.support.tickets.closed",
        "support_ticket",
        ticketId,
      );
      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.support.ticket.closed,
        ctx,
        { ticket_id: ticketId },
        "support_ticket",
        ticketId,
      );
      return mapped;
    },

    reopen: async (siteId, ticketId) => {
      const scope = await requireScope(ctx, siteId);
      const admin = createAdminClient() as any;
      const { data, error } = await admin
        .from(T.tickets)
        .update({
          status: "open",
          resolved_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId)
        .eq("site_id", scope.siteId)
        .eq("client_id", ctx.user.clientId)
        .select("*")
        .single();
      if (error || !data)
        throw new Error(
          `[portal][sup] reopen: ${error?.message ?? "not_found"}`,
        );
      const mapped = mapTicketRow(data);
      finalizeAudit(
        ctx,
        siteId,
        "portal.support.tickets.reopened",
        "support_ticket",
        ticketId,
      );
      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.support.ticket.reopened,
        ctx,
        { ticket_id: ticketId },
        "support_ticket",
        ticketId,
      );
      return mapped;
    },
  };
}

// =============================================================================
// MESSAGES NAMESPACE (read-only helper)
// =============================================================================

export interface PortalSupportMessagesNamespace {
  list(siteId: string, ticketId: string): Promise<PortalTicketMessage[]>;
}

function createMessagesNamespace(
  ctx: PortalDALContext,
): PortalSupportMessagesNamespace {
  return {
    list: async (siteId, ticketId) =>
      withPortalEvent(
        "portal.dal.support.messages.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          // Ownership guard via parent ticket lookup.
          const { data: ticket, error: tErr } = await admin
            .from(T.tickets)
            .select("id")
            .eq("id", ticketId)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .single();
          if (tErr || !ticket)
            throw new Error(
              `[portal][sup] ticket not found: ${tErr?.message ?? "none"}`,
            );
          const { data, error } = await admin
            .from(T.messages)
            .select("*")
            .eq("ticket_id", ticketId)
            .order("created_at", { ascending: true });
          if (error)
            throw new Error(`[portal][sup] list messages: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.support.messages.list",
            "ticket_message",
            null,
            { ticket_id: ticketId, count: (data ?? []).length },
          );
          return (data ?? []).map(mapMessageRow);
        },
      ),
  };
}

// =============================================================================
// NAMESPACE FACTORY
// =============================================================================

export interface PortalSupportNamespace {
  tickets: PortalSupportTicketsNamespace;
  messages: PortalSupportMessagesNamespace;
}

export function createSupportNamespace(
  ctx: PortalDALContext,
): PortalSupportNamespace {
  return {
    tickets: createTicketsNamespace(ctx),
    messages: createMessagesNamespace(ctx),
  };
}
