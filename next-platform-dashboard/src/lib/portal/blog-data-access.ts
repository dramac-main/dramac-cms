import "server-only";

/**
 * Portal Blog DAL (Session 5).
 *
 * Wraps `blog_posts`, `blog_categories`, `blog_post_categories`, and
 * `blog_comments` behind the portal-first contract.
 *
 * Gated on `canEditContent`. (Session 6 may split publish-vs-draft
 * into a finer permission — we use the conservative default here.)
 *
 * Invariants:
 *   1. `requireScope(ctx, siteId, canEditContent)` first — denials
 *      audit + throw `PortalAccessDeniedError` without DB access.
 *   2. Every query filters `site_id = scope.siteId`. Portal users only
 *      see their own site's posts. (Posts live under a site, not a
 *      client — so only the site filter applies.)
 *   3. Writes audit + emit `blog.post.*` / `blog.comment.*` events
 *      with `source: "portal"`, `actor_user_id: ctx.user.userId`.
 *   4. `schedule` requires a future `publishAt` ISO timestamp.
 *      `publish` sets `status = 'published'` and `published_at = now`.
 *      `unpublish` reverts to `draft` and clears `published_at`.
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

const BLOG_PERM = "canEditContent" as const;

const T = {
  posts: "blog_posts",
  categories: "blog_categories",
  postCategories: "blog_post_categories",
  comments: "blog_comments",
} as const;

// =============================================================================
// SHARED HELPERS
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, BLOG_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${BLOG_PERM}`,
      permissionKey: BLOG_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      BLOG_PERM,
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
    permissionKey: BLOG_PERM,
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

function requireString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new Error(`[portal][blog] ${field}_required`);
  }
  return v.trim();
}

// =============================================================================
// TYPES
// =============================================================================

export type PortalBlogPostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";

export interface PortalBlogPostListFilter {
  status?: PortalBlogPostStatus | PortalBlogPostStatus[];
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export interface PortalBlogPostListItem {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  status: PortalBlogPostStatus;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalBlogPostDetail extends PortalBlogPostListItem {
  content: Record<string, unknown> | null;
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  tags: string[];
  categoryIds: string[];
  allowComments: boolean;
}

export interface PortalBlogCreateInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: Record<string, unknown>;
  contentHtml?: string;
  featuredImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  categoryIds?: string[];
  tags?: string[];
}

export interface PortalBlogUpdateInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: Record<string, unknown>;
  contentHtml?: string;
  featuredImageUrl?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  tags?: string[];
  categoryIds?: string[];
  allowComments?: boolean;
}

export interface PortalBlogCategory {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface PortalBlogComment {
  id: string;
  postId: string;
  authorName: string | null;
  authorEmail: string | null;
  content: string;
  status: string;
  createdAt: string | null;
}

function mapPostRow(row: any): PortalBlogPostListItem {
  return {
    id: String(row.id),
    siteId: row.site_id ?? "",
    title: row.title ?? "",
    slug: row.slug ?? "",
    status: (row.status ?? "draft") as PortalBlogPostStatus,
    excerpt: row.excerpt ?? null,
    featuredImageUrl: row.featured_image_url ?? null,
    publishedAt: row.published_at ?? null,
    scheduledFor: row.scheduled_for ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function mapPostDetail(
  row: any,
  categoryIds: string[] = [],
): PortalBlogPostDetail {
  return {
    ...mapPostRow(row),
    content: (row.content as Record<string, unknown> | null) ?? null,
    contentHtml: row.content_html ?? null,
    metaTitle: row.meta_title ?? null,
    metaDescription: row.meta_description ?? null,
    ogImageUrl: row.og_image_url ?? null,
    canonicalUrl: row.canonical_url ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    categoryIds,
    allowComments: row.allow_comments ?? true,
  };
}

// =============================================================================
// NAMESPACE
// =============================================================================

export interface PortalBlogNamespace {
  posts: {
    list(
      siteId: string,
      filter?: PortalBlogPostListFilter,
    ): Promise<PortalBlogPostListItem[]>;
    detail(siteId: string, postId: string): Promise<PortalBlogPostDetail>;
    create(
      siteId: string,
      input: PortalBlogCreateInput,
    ): Promise<PortalBlogPostListItem>;
    update(
      siteId: string,
      postId: string,
      patch: PortalBlogUpdateInput,
    ): Promise<PortalBlogPostListItem>;
    schedule(
      siteId: string,
      postId: string,
      publishAt: string,
    ): Promise<PortalBlogPostListItem>;
    publish(siteId: string, postId: string): Promise<PortalBlogPostListItem>;
    unpublish(siteId: string, postId: string): Promise<PortalBlogPostListItem>;
    delete(siteId: string, postId: string): Promise<{ deleted: true }>;
  };
  categories: {
    list(siteId: string): Promise<PortalBlogCategory[]>;
  };
  comments: {
    list(
      siteId: string,
      filter?: { postId?: string; status?: string },
    ): Promise<PortalBlogComment[]>;
    approve(siteId: string, commentId: string): Promise<PortalBlogComment>;
    reject(siteId: string, commentId: string): Promise<PortalBlogComment>;
    markSpam(siteId: string, commentId: string): Promise<PortalBlogComment>;
    delete(siteId: string, commentId: string): Promise<{ deleted: true }>;
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function createBlogNamespace(ctx: PortalDALContext): PortalBlogNamespace {
  async function loadPost(scope: PortalSiteScope, postId: string) {
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from(T.posts)
      .select("*")
      .eq("id", postId)
      .eq("site_id", scope.siteId)
      .maybeSingle();
    if (error || !data)
      throw new Error(
        `[portal][blog] post_not_found: ${error?.message ?? "none"}`,
      );
    return data;
  }

  async function loadCategoryIds(
    postId: string,
  ): Promise<string[]> {
    const admin = createAdminClient() as any;
    const { data } = await admin
      .from(T.postCategories)
      .select("category_id")
      .eq("post_id", postId);
    return Array.isArray(data)
      ? (data as Array<{ category_id: string }>).map((r) => r.category_id)
      : [];
  }

  async function syncCategoryLinks(
    postId: string,
    siteId: string,
    categoryIds: string[] | undefined,
  ) {
    if (!Array.isArray(categoryIds)) return;
    const admin = createAdminClient() as any;
    await admin.from(T.postCategories).delete().eq("post_id", postId);
    if (categoryIds.length === 0) return;
    const rows = categoryIds.map((cid) => ({
      post_id: postId,
      category_id: cid,
      site_id: siteId,
    }));
    await admin.from(T.postCategories).insert(rows);
  }

  const posts = {
    list: async (
      siteId: string,
      filter?: PortalBlogPostListFilter,
    ): Promise<PortalBlogPostListItem[]> =>
      withPortalEvent(
        "portal.dal.blog.posts.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.posts)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });

          if (filter?.status) {
            if (Array.isArray(filter.status))
              q = q.in("status", filter.status);
            else q = q.eq("status", filter.status);
          }
          if (filter?.search) {
            q = q.ilike("title", `%${filter.search}%`);
          }
          const limit = filter?.limit ?? 50;
          const offset = filter?.offset ?? 0;
          q = q.range(offset, offset + limit - 1);

          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][blog] list posts: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.posts.list",
            "blog_post",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapPostRow);
        },
      ),

    detail: async (
      siteId: string,
      postId: string,
    ): Promise<PortalBlogPostDetail> =>
      withPortalEvent(
        "portal.dal.blog.posts.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const row = await loadPost(scope, postId);
          const categoryIds = await loadCategoryIds(postId);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.posts.detail",
            "blog_post",
            postId,
          );
          return mapPostDetail(row, categoryIds);
        },
      ),

    create: async (
      siteId: string,
      input: PortalBlogCreateInput,
    ): Promise<PortalBlogPostListItem> =>
      withPortalEvent(
        "portal.dal.blog.posts.create",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const title = requireString(input.title, "title");
          const slug = input.slug?.trim() || slugify(title);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.posts)
            .insert({
              site_id: scope.siteId,
              title,
              slug,
              excerpt: input.excerpt ?? null,
              content: input.content ?? null,
              content_html: input.contentHtml ?? null,
              featured_image_url: input.featuredImageUrl ?? null,
              meta_title: input.metaTitle ?? null,
              meta_description: input.metaDescription ?? null,
              tags: input.tags ?? [],
              status: "draft",
              author_id: ctx.user.userId,
            })
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][blog] create: ${error?.message}`);
          await syncCategoryLinks(data.id, scope.siteId, input.categoryIds);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.post.created",
            "blog_post",
            data.id,
          );
          emit(
            scope.siteId,
            "blog.post.created",
            ctx,
            { post_id: data.id, title, slug },
            "blog_post",
            data.id,
          );
          return mapPostRow(data);
        },
      ),

    update: async (
      siteId: string,
      postId: string,
      patch: PortalBlogUpdateInput,
    ): Promise<PortalBlogPostListItem> =>
      withPortalEvent(
        "portal.dal.blog.posts.update",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadPost(scope, postId); // existence + scope gate
          const admin = createAdminClient() as any;
          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (patch.title !== undefined) updates.title = patch.title;
          if (patch.slug !== undefined) updates.slug = patch.slug;
          if (patch.excerpt !== undefined) updates.excerpt = patch.excerpt;
          if (patch.content !== undefined) updates.content = patch.content;
          if (patch.contentHtml !== undefined)
            updates.content_html = patch.contentHtml;
          if (patch.featuredImageUrl !== undefined)
            updates.featured_image_url = patch.featuredImageUrl;
          if (patch.metaTitle !== undefined)
            updates.meta_title = patch.metaTitle;
          if (patch.metaDescription !== undefined)
            updates.meta_description = patch.metaDescription;
          if (patch.ogImageUrl !== undefined)
            updates.og_image_url = patch.ogImageUrl;
          if (patch.canonicalUrl !== undefined)
            updates.canonical_url = patch.canonicalUrl;
          if (patch.tags !== undefined) updates.tags = patch.tags;
          if (patch.allowComments !== undefined)
            updates.allow_comments = patch.allowComments;

          const { data, error } = await admin
            .from(T.posts)
            .update(updates)
            .eq("id", postId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][blog] update: ${error?.message}`);
          await syncCategoryLinks(postId, scope.siteId, patch.categoryIds);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.post.updated",
            "blog_post",
            postId,
          );
          emit(
            scope.siteId,
            "blog.post.updated",
            ctx,
            { post_id: postId },
            "blog_post",
            postId,
          );
          return mapPostRow(data);
        },
      ),

    schedule: async (
      siteId: string,
      postId: string,
      publishAt: string,
    ): Promise<PortalBlogPostListItem> =>
      withPortalEvent(
        "portal.dal.blog.posts.schedule",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const when = new Date(publishAt);
          if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
            throw new Error("[portal][blog] publish_at_must_be_future");
          }
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.posts)
            .update({
              status: "scheduled",
              scheduled_for: when.toISOString(),
              published_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", postId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][blog] schedule: ${error?.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.post.scheduled",
            "blog_post",
            postId,
            { publish_at: when.toISOString() },
          );
          emit(
            scope.siteId,
            "blog.post.scheduled",
            ctx,
            { post_id: postId, publish_at: when.toISOString() },
            "blog_post",
            postId,
          );
          return mapPostRow(data);
        },
      ),

    publish: async (
      siteId: string,
      postId: string,
    ): Promise<PortalBlogPostListItem> =>
      withPortalEvent(
        "portal.dal.blog.posts.publish",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const now = new Date().toISOString();
          const { data, error } = await admin
            .from(T.posts)
            .update({
              status: "published",
              published_at: now,
              scheduled_for: null,
              updated_at: now,
            })
            .eq("id", postId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][blog] publish: ${error?.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.post.published",
            "blog_post",
            postId,
          );
          emit(
            scope.siteId,
            "blog.post.published",
            ctx,
            { post_id: postId },
            "blog_post",
            postId,
          );
          return mapPostRow(data);
        },
      ),

    unpublish: async (
      siteId: string,
      postId: string,
    ): Promise<PortalBlogPostListItem> =>
      withPortalEvent(
        "portal.dal.blog.posts.unpublish",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.posts)
            .update({
              status: "draft",
              published_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", postId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][blog] unpublish: ${error?.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.post.unpublished",
            "blog_post",
            postId,
          );
          emit(
            scope.siteId,
            "blog.post.unpublished",
            ctx,
            { post_id: postId },
            "blog_post",
            postId,
          );
          return mapPostRow(data);
        },
      ),

    delete: async (
      siteId: string,
      postId: string,
    ): Promise<{ deleted: true }> =>
      withPortalEvent(
        "portal.dal.blog.posts.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error } = await admin
            .from(T.posts)
            .delete()
            .eq("id", postId)
            .eq("site_id", scope.siteId);
          if (error)
            throw new Error(`[portal][blog] delete: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.post.deleted",
            "blog_post",
            postId,
          );
          emit(
            scope.siteId,
            "blog.post.deleted",
            ctx,
            { post_id: postId },
            "blog_post",
            postId,
          );
          return { deleted: true };
        },
      ),
  };

  const categories = {
    list: async (siteId: string): Promise<PortalBlogCategory[]> =>
      withPortalEvent(
        "portal.dal.blog.categories.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.categories)
            .select("*")
            .eq("site_id", scope.siteId)
            .order("name", { ascending: true });
          if (error)
            throw new Error(`[portal][blog] categories: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.categories.list",
            "blog_category",
            null,
          );
          return (data ?? []).map((r: any) => ({
            id: String(r.id),
            siteId: r.site_id,
            name: r.name ?? "",
            slug: r.slug ?? "",
            description: r.description ?? null,
          }));
        },
      ),
  };

  async function changeCommentStatus(
    siteId: string,
    commentId: string,
    nextStatus: string,
    eventType: string,
    action: string,
  ): Promise<PortalBlogComment> {
    const scope = await requireScope(ctx, siteId);
    const admin = createAdminClient() as any;
    // Load the comment joined to its post to verify site scope.
    const { data: existing } = await admin
      .from(T.comments)
      .select("*, post:blog_posts!inner(site_id)")
      .eq("id", commentId)
      .eq("post.site_id", scope.siteId)
      .maybeSingle();
    if (!existing)
      throw new Error("[portal][blog] comment_not_found_or_wrong_site");
    const { data, error } = await admin
      .from(T.comments)
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select("*")
      .single();
    if (error || !data)
      throw new Error(`[portal][blog] comment_status: ${error?.message}`);
    finalizeAudit(ctx, siteId, action, "blog_comment", commentId, {
      status: nextStatus,
    });
    emit(
      scope.siteId,
      eventType,
      ctx,
      { comment_id: commentId, post_id: existing.post_id },
      "blog_comment",
      commentId,
    );
    return {
      id: String(data.id),
      postId: data.post_id ?? "",
      authorName: data.author_name ?? null,
      authorEmail: data.author_email ?? null,
      content: data.content ?? "",
      status: data.status ?? "",
      createdAt: data.created_at ?? null,
    };
  }

  const comments = {
    list: async (
      siteId: string,
      filter?: { postId?: string; status?: string },
    ): Promise<PortalBlogComment[]> =>
      withPortalEvent(
        "portal.dal.blog.comments.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.comments)
            .select("*, post:blog_posts!inner(site_id)")
            .eq("post.site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (filter?.postId) q = q.eq("post_id", filter.postId);
          if (filter?.status) q = q.eq("status", filter.status);
          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][blog] comments: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.comments.list",
            "blog_comment",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map((r: any) => ({
            id: String(r.id),
            postId: r.post_id ?? "",
            authorName: r.author_name ?? null,
            authorEmail: r.author_email ?? null,
            content: r.content ?? "",
            status: r.status ?? "",
            createdAt: r.created_at ?? null,
          }));
        },
      ),

    approve: (siteId: string, commentId: string) =>
      withPortalEvent(
        "portal.dal.blog.comments.approve",
        evtCtx(ctx, siteId),
        () =>
          changeCommentStatus(
            siteId,
            commentId,
            "approved",
            "blog.comment.approved",
            "portal.blog.comment.approved",
          ),
      ),
    reject: (siteId: string, commentId: string) =>
      withPortalEvent(
        "portal.dal.blog.comments.reject",
        evtCtx(ctx, siteId),
        () =>
          changeCommentStatus(
            siteId,
            commentId,
            "rejected",
            "blog.comment.rejected",
            "portal.blog.comment.rejected",
          ),
      ),
    markSpam: (siteId: string, commentId: string) =>
      withPortalEvent(
        "portal.dal.blog.comments.markSpam",
        evtCtx(ctx, siteId),
        () =>
          changeCommentStatus(
            siteId,
            commentId,
            "spam",
            "blog.comment.marked_spam",
            "portal.blog.comment.marked_spam",
          ),
      ),
    delete: async (
      siteId: string,
      commentId: string,
    ): Promise<{ deleted: true }> =>
      withPortalEvent(
        "portal.dal.blog.comments.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data: existing } = await admin
            .from(T.comments)
            .select("id, post_id, post:blog_posts!inner(site_id)")
            .eq("id", commentId)
            .eq("post.site_id", scope.siteId)
            .maybeSingle();
          if (!existing)
            throw new Error("[portal][blog] comment_not_found_or_wrong_site");
          const { error } = await admin
            .from(T.comments)
            .delete()
            .eq("id", commentId);
          if (error)
            throw new Error(`[portal][blog] comment delete: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.blog.comment.deleted",
            "blog_comment",
            commentId,
          );
          emit(
            scope.siteId,
            "blog.comment.deleted",
            ctx,
            { comment_id: commentId, post_id: existing.post_id },
            "blog_comment",
            commentId,
          );
          return { deleted: true };
        },
      ),
  };

  return { posts, categories, comments };
}
