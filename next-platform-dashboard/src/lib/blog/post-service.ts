"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getCurrentUserRole, isSuperAdmin } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

// Helper to access tables not yet in the generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, tableName: string) {
  return supabase.from(tableName);
}

export interface BlogPost {
  id: string;
  siteId: string;
  authorId: string | null;
  authorName?: string;
  authorAvatarUrl?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Record<string, unknown>;
  contentHtml: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  publishedAt: string | null;
  scheduledFor: string | null;
  allowComments: boolean;
  isFeatured: boolean;
  readingTimeMinutes: number;
  tags: string[];
  categories: { id: string; name: string; slug: string; color: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface PostFilters {
  status?: string;
  categoryId?: string;
  search?: string;
  featured?: boolean;
}

interface UserBlogContext {
  userId: string | null;
  role: string | null;
  agencyRole: string | null;
  accessibleSiteIds: string[] | null; // null = all (super admin)
  isPortalUser: boolean;
  portalClientId: string | null;
}

/**
 * Get user context for blog access control
 */
async function getUserBlogContext(): Promise<UserBlogContext> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  const cookieStore = await cookies();
  
  // Check for portal user (client impersonation)
  const portalClientId = cookieStore.get("impersonating_client_id")?.value || null;
  
  if (portalClientId) {
    // Portal user - get their accessible sites
    const { data: client } = await supabase
      .from("clients")
      .select("id, has_portal_access")
      .eq("id", portalClientId)
      .single();
    
    if (!client?.has_portal_access) {
      return { 
        userId: null, 
        role: null, 
        agencyRole: null, 
        accessibleSiteIds: [], 
        isPortalUser: true, 
        portalClientId 
      };
    }
    
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("client_id", portalClientId);
    
    return {
      userId: null,
      role: "client",
      agencyRole: null,
      accessibleSiteIds: sites?.map(s => s.id) || [],
      isPortalUser: true,
      portalClientId
    };
  }
  
  if (!userId) {
    return { 
      userId: null, 
      role: null, 
      agencyRole: null, 
      accessibleSiteIds: [], 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  // Super admin can see all
  if (await isSuperAdmin()) {
    return { 
      userId, 
      role: "super_admin", 
      agencyRole: null, 
      accessibleSiteIds: null, 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  // Get user's agency membership
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .single();
  
  if (!membership) {
    return { 
      userId, 
      role, 
      agencyRole: null, 
      accessibleSiteIds: [], 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  // Get all sites in the agency
  const { data: sites } = await supabase
    .from("sites")
    .select("id, clients!inner(agency_id)")
    .eq("clients.agency_id", membership.agency_id);
  
  return {
    userId,
    role,
    agencyRole: membership.role,
    accessibleSiteIds: sites?.map(s => s.id) || [],
    isPortalUser: false,
    portalClientId: null
  };
}

/**
 * Check if user can access a site's blog
 */
async function canAccessSiteBlog(siteId: string): Promise<boolean> {
  const context = await getUserBlogContext();
  if (context.accessibleSiteIds === null) return true; // Super admin
  return context.accessibleSiteIds.includes(siteId);
}

/**
 * Check if user can publish posts (not just create drafts)
 * Agency members can only create drafts
 */
export async function canPublishPosts(): Promise<boolean> {
  const context = await getUserBlogContext();
  if (context.isPortalUser) return false;
  if (context.agencyRole === "member") return false;
  return true; // owner, admin, or super_admin
}

/**
 * Check if user can edit a specific post
 * Members can only edit their own posts
 */
async function canEditPost(postId: string): Promise<boolean> {
  const context = await getUserBlogContext();
  if (context.isPortalUser) return false;
  if (context.accessibleSiteIds === null) return true; // Super admin
  if (context.agencyRole === "owner" || context.agencyRole === "admin") return true;
  
  // Members can only edit their own posts
  const supabase = await createClient();
  const { data: post } = await fromTable(supabase, "blog_posts")
    .select("author_id, site_id")
    .eq("id", postId)
    .single();
  
  if (!post) return false;
  if (!context.accessibleSiteIds?.includes(post.site_id)) return false;
  return post.author_id === context.userId;
}

/**
 * Check if user can delete posts
 */
async function canDeletePosts(): Promise<boolean> {
  const context = await getUserBlogContext();
  if (context.isPortalUser) return false;
  if (context.agencyRole === "member") return false;
  return true;
}

/**
 * Check if user can manage categories
 */
export async function canManageCategories(): Promise<boolean> {
  const context = await getUserBlogContext();
  if (context.isPortalUser) return false;
  if (context.agencyRole === "member") return false;
  return true;
}

/**
 * Check current user's permission level
 */
export async function getUserPermissions(): Promise<{
  canPublish: boolean;
  canDelete: boolean;
  canManageCategories: boolean;
  isPortalUser: boolean;
}> {
  const context = await getUserBlogContext();
  return {
    canPublish: !context.isPortalUser && context.agencyRole !== "member",
    canDelete: !context.isPortalUser && context.agencyRole !== "member",
    canManageCategories: !context.isPortalUser && context.agencyRole !== "member",
    isPortalUser: context.isPortalUser,
  };
}

export async function getPosts(
  siteId: string,
  filters: PostFilters = {},
  page = 1,
  limit = 20
): Promise<{ posts: BlogPost[]; total: number }> {
  // Permission check
  if (!(await canAccessSiteBlog(siteId))) {
    console.error("[PostService] Access denied for site:", siteId);
    return { posts: [], total: 0 };
  }
  
  const supabase = await createClient();
  const offset = (page - 1) * limit;
  const context = await getUserBlogContext();

  let query = fromTable(supabase, "blog_posts")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url),
      categories:blog_post_categories(
        category:blog_categories(id, name, slug, color)
      )
    `,
      { count: "exact" }
    )
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  // Portal users can only see published posts
  if (context.isPortalUser) {
    query = query.eq("status", "published");
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.featured) {
    query = query.eq("is_featured", true);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
  }

  if (filters.categoryId) {
    // Filter by category through junction table
    const { data: postIds } = await fromTable(supabase, "blog_post_categories")
      .select("post_id")
      .eq("category_id", filters.categoryId);
    
    if (postIds && postIds.length > 0) {
      query = query.in("id", postIds.map((p: { post_id: string }) => p.post_id));
    } else {
      return { posts: [], total: 0 };
    }
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[PostService] Error:", error);
    return { posts: [], total: 0 };
  }

  return {
    posts: (data || []).map(mapToPost),
    total: count || 0,
  };
}

export async function getPost(postId: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, "blog_posts")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url),
      categories:blog_post_categories(
        category:blog_categories(id, name, slug, color)
      )
    `
    )
    .eq("id", postId)
    .single();

  if (error || !data) {
    return null;
  }
  
  // Permission check
  if (!(await canAccessSiteBlog(data.site_id))) {
    return null;
  }
  
  // Portal users can only view published posts
  const context = await getUserBlogContext();
  if (context.isPortalUser && data.status !== "published") {
    return null;
  }

  return mapToPost(data);
}

export async function getPostBySlug(siteId: string, slug: string): Promise<BlogPost | null> {
  // Permission check
  if (!(await canAccessSiteBlog(siteId))) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, "blog_posts")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url),
      categories:blog_post_categories(
        category:blog_categories(id, name, slug, color)
      )
    `
    )
    .eq("site_id", siteId)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToPost(data);
}

export async function createPost(
  siteId: string,
  post: {
    title: string;
    slug?: string;
    excerpt?: string;
    content?: Record<string, unknown>;
    contentHtml?: string;
    featuredImageUrl?: string;
    featuredImageAlt?: string;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    categoryIds?: string[];
    status?: "draft" | "scheduled" | "published";
    scheduledFor?: string;
  }
): Promise<{ success: boolean; postId?: string; error?: string }> {
  // Permission check
  if (!(await canAccessSiteBlog(siteId))) {
    return { success: false, error: "Access denied" };
  }
  
  const context = await getUserBlogContext();
  if (context.isPortalUser) {
    return { success: false, error: "Portal users cannot create posts" };
  }
  
  // Members can only create drafts
  let effectiveStatus = post.status || "draft";
  if (context.agencyRole === "member" && effectiveStatus !== "draft") {
    effectiveStatus = "draft";
    console.log("[PostService] Member attempted to publish - forcing draft status");
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Generate slug from title if not provided
  const slug =
    post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Check for duplicate slug
  const { data: existing } = await fromTable(supabase, "blog_posts")
    .select("id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .single();

  if (existing) {
    return { success: false, error: "A post with this slug already exists" };
  }

  // Calculate reading time
  const wordCount = post.contentHtml
    ? post.contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const { data, error } = await fromTable(supabase, "blog_posts")
    .insert({
      site_id: siteId,
      author_id: userId,
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content: post.content || {},
      content_html: post.contentHtml,
      featured_image_url: post.featuredImageUrl,
      featured_image_alt: post.featuredImageAlt,
      meta_title: post.metaTitle || post.title,
      meta_description: post.metaDescription || post.excerpt,
      tags: post.tags || [],
      status: effectiveStatus,
      scheduled_for: post.scheduledFor,
      published_at: effectiveStatus === "published" ? new Date().toISOString() : null,
      reading_time_minutes: readingTime,
    })
    .select()
    .single();

  if (error) {
    console.error("[PostService] Create error:", error);
    return { success: false, error: "Failed to create post" };
  }

  // Add categories
  if (post.categoryIds && post.categoryIds.length > 0) {
    await fromTable(supabase, "blog_post_categories").insert(
      post.categoryIds.map((catId) => ({
        post_id: data.id,
        category_id: catId,
      }))
    );
  }

  return { success: true, postId: data.id };
}

export async function updatePost(
  postId: string,
  updates: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: Record<string, unknown>;
    contentHtml: string;
    featuredImageUrl: string | null;
    featuredImageAlt: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    ogImageUrl: string;
    canonicalUrl: string;
    tags: string[];
    categoryIds: string[];
    status: "draft" | "scheduled" | "published" | "archived";
    scheduledFor: string;
    isFeatured: boolean;
    allowComments: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  // Permission check - can user edit this post?
  if (!(await canEditPost(postId))) {
    return { success: false, error: "Permission denied: Cannot edit this post" };
  }
  
  const context = await getUserBlogContext();
  
  // Members cannot publish - force draft status
  let effectiveStatus = updates.status;
  if (context.agencyRole === "member" && updates.status && updates.status !== "draft") {
    effectiveStatus = "draft";
    console.log("[PostService] Member attempted to change status - keeping draft");
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.contentHtml !== undefined) {
    updateData.content_html = updates.contentHtml;
    // Recalculate reading time
    const wordCount = updates.contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    updateData.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200));
  }
  if (updates.featuredImageUrl !== undefined) updateData.featured_image_url = updates.featuredImageUrl;
  if (updates.featuredImageAlt !== undefined) updateData.featured_image_alt = updates.featuredImageAlt;
  if (updates.metaTitle !== undefined) updateData.meta_title = updates.metaTitle;
  if (updates.metaDescription !== undefined) updateData.meta_description = updates.metaDescription;
  if (updates.metaKeywords !== undefined) updateData.meta_keywords = updates.metaKeywords;
  if (updates.ogImageUrl !== undefined) updateData.og_image_url = updates.ogImageUrl;
  if (updates.canonicalUrl !== undefined) updateData.canonical_url = updates.canonicalUrl;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
  if (updates.allowComments !== undefined) updateData.allow_comments = updates.allowComments;
  if (updates.scheduledFor !== undefined) updateData.scheduled_for = updates.scheduledFor;

  if (effectiveStatus !== undefined) {
    updateData.status = effectiveStatus;
    if (effectiveStatus === "published") {
      // Only set published_at if not already set
      const { data: existingPost } = await fromTable(supabase, "blog_posts")
        .select("published_at")
        .eq("id", postId)
        .single();
      
      if (!existingPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
  }

  const { error } = await fromTable(supabase, "blog_posts")
    .update(updateData)
    .eq("id", postId);

  if (error) {
    console.error("[PostService] Update error:", error);
    return { success: false, error: "Failed to update post" };
  }

  // Update categories if provided (only owner/admin can change)
  if (updates.categoryIds !== undefined && (await canManageCategories())) {
    // Remove existing
    await fromTable(supabase, "blog_post_categories").delete().eq("post_id", postId);

    // Add new
    if (updates.categoryIds.length > 0) {
      await fromTable(supabase, "blog_post_categories").insert(
        updates.categoryIds.map((catId) => ({
          post_id: postId,
          category_id: catId,
        }))
      );
    }
  }

  return { success: true };
}

export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  // Permission check - only owner/admin can delete
  if (!(await canDeletePosts())) {
    return { success: false, error: "Permission denied: Only agency owners/admins can delete posts" };
  }

  const supabase = await createClient();

  // Verify access to the post's site
  const { data: post } = await fromTable(supabase, "blog_posts")
    .select("site_id")
    .eq("id", postId)
    .single();
  
  if (!post || !(await canAccessSiteBlog(post.site_id))) {
    return { success: false, error: "Access denied" };
  }

  const { error } = await fromTable(supabase, "blog_posts").delete().eq("id", postId);

  if (error) {
    return { success: false, error: "Failed to delete post" };
  }

  return { success: true };
}

/**
 * Get accessible sites for portal users' blog view
 */
export async function getPortalBlogSites(): Promise<{
  sites: Array<{ id: string; name: string; domain: string }>;
}> {
  const context = await getUserBlogContext();
  
  if (!context.isPortalUser || !context.portalClientId) {
    return { sites: [] };
  }
  
  const supabase = await createClient();
  
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, subdomain")
    .eq("client_id", context.portalClientId)
    .order("name");
  
  return { 
    sites: (sites || []).map(s => ({ 
      id: s.id, 
      name: s.name, 
      domain: s.subdomain 
    })) 
  };
}

/**
 * Get recent posts for a site (for widgets/dashboards)
 */
export async function getRecentPosts(
  siteId: string,
  limit = 5
): Promise<BlogPost[]> {
  if (!(await canAccessSiteBlog(siteId))) {
    return [];
  }

  const supabase = await createClient();

  const { data } = await fromTable(supabase, "blog_posts")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url),
      categories:blog_post_categories(
        category:blog_categories(id, name, slug, color)
      )
    `
    )
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data || []).map(mapToPost);
}

/**
 * Get blog statistics for a site
 */
export async function getBlogStats(siteId: string): Promise<{
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  archived: number;
}> {
  if (!(await canAccessSiteBlog(siteId))) {
    return { total: 0, published: 0, draft: 0, scheduled: 0, archived: 0 };
  }

  const supabase = await createClient();

  const { data } = await fromTable(supabase, "blog_posts")
    .select("status")
    .eq("site_id", siteId);

  const posts = (data || []) as { status: string }[];
  
  return {
    total: posts.length,
    published: posts.filter((p: { status: string }) => p.status === "published").length,
    draft: posts.filter((p: { status: string }) => p.status === "draft").length,
    scheduled: posts.filter((p: { status: string }) => p.status === "scheduled").length,
    archived: posts.filter((p: { status: string }) => p.status === "archived").length,
  };
}

function mapToPost(data: Record<string, unknown>): BlogPost {
  const author = data.author as { full_name: string; avatar_url: string } | null;
  const categoriesRaw = (data.categories as Array<{ category: Record<string, unknown> }>) || [];

  return {
    id: data.id as string,
    siteId: data.site_id as string,
    authorId: data.author_id as string | null,
    authorName: author?.full_name || "Unknown",
    authorAvatarUrl: author?.avatar_url || undefined,
    title: data.title as string,
    slug: data.slug as string,
    excerpt: data.excerpt as string | null,
    content: (data.content as Record<string, unknown>) || {},
    contentHtml: data.content_html as string | null,
    featuredImageUrl: data.featured_image_url as string | null,
    featuredImageAlt: data.featured_image_alt as string | null,
    metaTitle: data.meta_title as string | null,
    metaDescription: data.meta_description as string | null,
    metaKeywords: (data.meta_keywords as string[]) || [],
    ogImageUrl: data.og_image_url as string | null,
    canonicalUrl: data.canonical_url as string | null,
    status: data.status as "draft" | "scheduled" | "published" | "archived",
    publishedAt: data.published_at as string | null,
    scheduledFor: data.scheduled_for as string | null,
    allowComments: (data.allow_comments as boolean) ?? true,
    isFeatured: (data.is_featured as boolean) ?? false,
    readingTimeMinutes: (data.reading_time_minutes as number) || 1,
    tags: (data.tags as string[]) || [],
    categories: categoriesRaw
      .filter(c => c.category)
      .map((c) => ({
        id: c.category.id as string,
        name: c.category.name as string,
        slug: c.category.slug as string,
        color: c.category.color as string,
      })),
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
