import "server-only";

/**
 * Portal Forms DAL (Session 5).
 *
 * Submissions-only surface. Form definitions remain agency-managed and
 * are NOT exposed here (that lives in the studio).
 *
 * Wraps `form_submissions`. Gated on `canEditContent`.
 *
 * Conversion flows (`convertToConversation`, `convertToContact`)
 * delegate to Session 2 conversations and Session 4 CRM DAL
 * respectively — they accept IDs and let the caller compose. This DAL
 * is deliberately narrow: it changes status, assigns, exports, and
 * fires the right events. Actual conversation or contact creation is
 * driven by the caller.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";

const FORMS_PERM = "canEditContent" as const;
const T = { submissions: "form_submissions" } as const;

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, FORMS_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${FORMS_PERM}`,
      permissionKey: FORMS_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      FORMS_PERM,
    );
  }
  return result.scope!;
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
  action: string,
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
    resourceType: "form_submission",
    resourceId,
    permissionKey: FORMS_PERM,
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
  submissionId: string,
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
      sourceEntityType: "form_submission",
      sourceEntityId: submissionId,
    },
  ).catch(() => {});
}

export type PortalFormSubmissionStatus = "new" | "read" | "archived" | "spam";

export interface PortalFormSubmission {
  id: string;
  siteId: string;
  formId: string;
  formName: string | null;
  data: Record<string, unknown>;
  pageUrl: string | null;
  status: PortalFormSubmissionStatus;
  isSpam: boolean;
  createdAt: string | null;
}

export interface PortalFormSubmissionListFilter {
  status?: PortalFormSubmissionStatus | PortalFormSubmissionStatus[];
  formId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function mapSubmission(row: any): PortalFormSubmission {
  return {
    id: String(row.id),
    siteId: row.site_id ?? "",
    formId: row.form_id ?? "",
    formName:
      (row.form_name as string) ??
      ((row.form as any)?.name as string) ??
      null,
    data: (row.data as Record<string, unknown>) ?? {},
    pageUrl: row.page_url ?? null,
    status: (row.status ?? "new") as PortalFormSubmissionStatus,
    isSpam: !!row.is_spam,
    createdAt: row.created_at ?? null,
  };
}

export interface PortalFormsNamespace {
  submissions: {
    list(
      siteId: string,
      filter?: PortalFormSubmissionListFilter,
    ): Promise<{ submissions: PortalFormSubmission[]; total: number }>;
    detail(siteId: string, submissionId: string): Promise<PortalFormSubmission>;
    changeStatus(
      siteId: string,
      submissionId: string,
      status: PortalFormSubmissionStatus,
    ): Promise<PortalFormSubmission>;
    markSpam(
      siteId: string,
      submissionId: string,
    ): Promise<PortalFormSubmission>;
    export(
      siteId: string,
      filter?: PortalFormSubmissionListFilter,
    ): Promise<{ csv: string; count: number }>;
    linkConversation(
      siteId: string,
      submissionId: string,
      conversationId: string,
    ): Promise<PortalFormSubmission>;
    linkContact(
      siteId: string,
      submissionId: string,
      contactId: string,
    ): Promise<PortalFormSubmission>;
  };
}

export function createFormsNamespace(
  ctx: PortalDALContext,
): PortalFormsNamespace {
  async function loadSubmission(scope: PortalSiteScope, submissionId: string) {
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from(T.submissions)
      .select("*")
      .eq("id", submissionId)
      .eq("site_id", scope.siteId)
      .maybeSingle();
    if (error || !data)
      throw new Error(
        `[portal][forms] submission_not_found: ${error?.message ?? "none"}`,
      );
    return data;
  }

  const submissions = {
    list: (siteId: string, filter?: PortalFormSubmissionListFilter) =>
      withPortalEvent(
        "portal.dal.forms.submissions.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.submissions)
            .select("*", { count: "exact" })
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (filter?.status) {
            if (Array.isArray(filter.status))
              q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (filter?.formId) q = q.eq("form_id", filter.formId);
          const limit = filter?.limit ?? 50;
          const offset = filter?.offset ?? 0;
          q = q.range(offset, offset + limit - 1);
          const { data, count, error } = await q;
          if (error)
            throw new Error(`[portal][forms] list: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submissions.list",
            null,
            { count: (data ?? []).length },
          );
          return {
            submissions: (data ?? []).map(mapSubmission),
            total: count ?? (data?.length ?? 0),
          };
        },
      ),

    detail: (siteId: string, submissionId: string) =>
      withPortalEvent(
        "portal.dal.forms.submissions.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const row = await loadSubmission(scope, submissionId);
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submissions.detail",
            submissionId,
          );
          return mapSubmission(row);
        },
      ),

    changeStatus: (
      siteId: string,
      submissionId: string,
      status: PortalFormSubmissionStatus,
    ) =>
      withPortalEvent(
        "portal.dal.forms.submissions.changeStatus",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadSubmission(scope, submissionId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.submissions)
            .update({ status })
            .eq("id", submissionId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(
              `[portal][forms] changeStatus: ${error?.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submission.status_changed",
            submissionId,
            { status },
          );
          emit(
            scope.siteId,
            "forms.submission.status_changed",
            ctx,
            { submission_id: submissionId, status },
            submissionId,
          );
          return mapSubmission(data);
        },
      ),

    markSpam: (siteId: string, submissionId: string) =>
      withPortalEvent(
        "portal.dal.forms.submissions.markSpam",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadSubmission(scope, submissionId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.submissions)
            .update({ status: "spam", is_spam: true })
            .eq("id", submissionId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][forms] markSpam: ${error?.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submission.marked_spam",
            submissionId,
          );
          emit(
            scope.siteId,
            "forms.submission.marked_spam",
            ctx,
            { submission_id: submissionId },
            submissionId,
          );
          return mapSubmission(data);
        },
      ),

    export: (siteId: string, filter?: PortalFormSubmissionListFilter) =>
      withPortalEvent(
        "portal.dal.forms.submissions.export",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.submissions)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (filter?.status) {
            if (Array.isArray(filter.status))
              q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (filter?.formId) q = q.eq("form_id", filter.formId);
          q = q.limit(filter?.limit ?? 10000);
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][forms] export: ${error.message}`);
          const rows = (data ?? []) as any[];
          const headers = [
            "id",
            "form_id",
            "status",
            "is_spam",
            "page_url",
            "created_at",
            "data",
          ];
          const lines = [headers.join(",")];
          for (const r of rows) {
            const fields = [
              r.id,
              r.form_id,
              r.status,
              r.is_spam ? "true" : "false",
              r.page_url ?? "",
              r.created_at ?? "",
              JSON.stringify(r.data ?? {}),
            ].map((v) => {
              const s = String(v ?? "");
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            });
            lines.push(fields.join(","));
          }
          const csv = lines.join("\n");
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submissions.exported",
            null,
            { count: rows.length },
          );
          emit(
            scope.siteId,
            "forms.submissions.exported",
            ctx,
            { count: rows.length },
            "export",
          );
          return { csv, count: rows.length };
        },
      ),

    linkConversation: (
      siteId: string,
      submissionId: string,
      conversationId: string,
    ) =>
      withPortalEvent(
        "portal.dal.forms.submissions.linkConversation",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadSubmission(scope, submissionId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.submissions)
            .update({
              linked_conversation_id: conversationId,
              status: "read",
            })
            .eq("id", submissionId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(
              `[portal][forms] linkConversation: ${error?.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submission.converted",
            submissionId,
            { conversation_id: conversationId },
          );
          emit(
            scope.siteId,
            "forms.submission.converted",
            ctx,
            {
              submission_id: submissionId,
              target: "conversation",
              conversation_id: conversationId,
            },
            submissionId,
          );
          return mapSubmission(data);
        },
      ),

    linkContact: (
      siteId: string,
      submissionId: string,
      contactId: string,
    ) =>
      withPortalEvent(
        "portal.dal.forms.submissions.linkContact",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadSubmission(scope, submissionId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.submissions)
            .update({ linked_contact_id: contactId, status: "read" })
            .eq("id", submissionId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(
              `[portal][forms] linkContact: ${error?.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.forms.submission.converted",
            submissionId,
            { contact_id: contactId },
          );
          emit(
            scope.siteId,
            "forms.submission.converted",
            ctx,
            {
              submission_id: submissionId,
              target: "contact",
              contact_id: contactId,
            },
            submissionId,
          );
          return mapSubmission(data);
        },
      ),
  };

  return { submissions };
}
