# Phase 83: Blog System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 10-12 hours

---

## 🎯 Objective

Create a complete blog/CMS system for sites:
1. **Posts** - Create, edit, publish blog posts
2. **Categories** - Organize posts by category
3. **Author** - Author profiles for posts
4. **SEO** - Meta tags, slugs, featured images
5. **Rendering** - Blog pages on published sites

---

## � User Roles & Access

This phase must support ALL user types with appropriate permissions:

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **Super Admin** | All agencies | Full access to all posts, categories, authors |
| **Agency Owner** | Own agency | Full access to all agency posts |
| **Agency Admin** | Own agency | Full access, can publish posts |
| **Agency Member** | Assigned sites | Can create/edit drafts, cannot publish |
| **Client Portal** | Own sites only | View-only access to published posts |

### Permission Matrix

| Action | Super Admin | Owner | Admin | Member | Client |
|--------|-------------|-------|-------|--------|--------|
| View all posts | ✅ | ✅ Agency | ✅ Agency | ✅ Assigned | ✅ Own |
| Create post | ✅ | ✅ | ✅ | ✅ (draft) | ❌ |
| Edit any post | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit own posts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Publish posts | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete posts | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage categories | ✅ | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅ Own |

---

## 📋 Prerequisites

- [ ] Site management working
- [ ] Media library for featured images
- [ ] Visual editor foundation
- [ ] Site publishing system
- [ ] Permission system (`@/lib/auth/permissions.ts`)

---

## 🔍 Current State Analysis

**What Exists:**
- Site pages with visual editor
- Media library for images
- Page publishing
- Permission helpers in `@/lib/auth/permissions.ts`
- Client portal at `/portal/`

**What's Missing:**
- Blog post content type
- Post editor (rich text)
- Categories/tags
- Blog listing page template
- Post detail page template
- RSS feed generation
- Portal blog view for clients

---

## 💼 Business Value

1. **SEO** - Blogs are essential for organic traffic
2. **Client Need** - Every business needs content marketing
3. **Differentiation** - Built-in blog vs. external tools
4. **Agency Service** - Content creation services
5. **Engagement** - Keep visitors on site longer

---

## 📁 Files to Create

```
# Agency Dashboard (staff)
src/app/(dashboard)/sites/[siteId]/blog/
├── page.tsx                    # Posts list
├── new/page.tsx               # Create post
├── [postId]/page.tsx          # Edit post
├── categories/page.tsx        # Manage categories

# Client Portal (clients)
src/app/portal/blog/
├── page.tsx                    # Portal blog view
├── [siteId]/page.tsx           # Site-specific posts

src/lib/blog/
├── post-service.ts            # Post CRUD (with permissions!)
├── category-service.ts        # Category CRUD (with permissions!)
├── blog-renderer.ts           # Render blog pages

src/components/blog/
├── post-editor.tsx            # Rich text editor
├── post-list.tsx              # Posts data table
├── post-form.tsx              # Post metadata form
├── category-manager.tsx       # Category CRUD
├── post-seo-panel.tsx         # SEO settings

src/app/sites/[subdomain]/blog/
├── page.tsx                   # Public blog listing
├── [slug]/page.tsx            # Public post detail

Database:
├── blog_posts                 # Post content
├── blog_categories            # Categories
├── blog_post_categories       # Many-to-many
```

---

## ✅ Tasks

### Task 83.1: Database Schema

**File: `migrations/blog-system-tables.sql`**

```sql
-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- For UI badges
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  
  -- Core content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT, -- Short summary
  content JSONB NOT NULL DEFAULT '{}', -- Rich text as JSON (Tiptap/ProseMirror)
  content_html TEXT, -- Pre-rendered HTML for performance
  
  -- Media
  featured_image_url TEXT,
  featured_image_alt TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  canonical_url TEXT,
  
  -- Publishing
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, archived
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- Settings
  allow_comments BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  reading_time_minutes INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Many-to-many: posts to categories
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
  
  PRIMARY KEY (post_id, category_id)
);

-- Tags (simple array on posts, but could be separate table)
-- Using tags column on posts: tags TEXT[]

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Indexes
CREATE INDEX idx_blog_posts_site ON blog_posts(site_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(site_id, slug);
CREATE INDEX idx_blog_posts_featured ON blog_posts(site_id, is_featured);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_categories_site ON blog_categories(site_id);
CREATE INDEX idx_blog_post_categories_post ON blog_post_categories(post_id);
CREATE INDEX idx_blog_post_categories_cat ON blog_post_categories(category_id);

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Average reading speed: 200 words per minute
  RETURN GREATEST(1, CEIL(array_length(regexp_split_to_array(content_text, '\s+'), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
-- Super admins have full access
CREATE POLICY "Super admins have full access to blog posts"
ON blog_posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Agency members can view posts in their agency
CREATE POLICY "Agency members can view agency posts"
ON blog_posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Agency members can create posts (as drafts)
CREATE POLICY "Agency members can create posts"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Authors can edit their own posts
CREATE POLICY "Authors can edit own posts"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
);

-- Agency owners/admins can edit any post in their agency
CREATE POLICY "Agency owners/admins can edit any post"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- Only owners/admins can delete posts
CREATE POLICY "Agency owners/admins can delete posts"
ON blog_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- RLS Policies for blog_categories
CREATE POLICY "Super admins have full access to categories"
ON blog_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Agency members can view categories"
ON blog_categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_categories.site_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Agency owners/admins can manage categories"
ON blog_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_categories.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- RLS for blog_post_categories (junction table)
CREATE POLICY "Post category access follows post access"
ON blog_post_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM blog_posts
    WHERE blog_posts.id = blog_post_categories.post_id
  )
);
```

---

### Task 83.2: Post Service

**File: `src/lib/blog/post-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getCurrentUserRole, isSuperAdmin } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

export interface BlogPost {
  id: string;
  siteId: string;
  authorId: string | null;
  authorName?: string;
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

/**
 * Get user context for blog access control
 */
async function getUserBlogContext(): Promise<{
  userId: string | null;
  role: string | null;
  agencyRole: string | null;
  accessibleSiteIds: string[] | null; // null = all (super admin)
  isPortalUser: boolean;
  portalClientId: string | null;
}> {
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
      return { userId: null, role: null, agencyRole: null, accessibleSiteIds: [], isPortalUser: true, portalClientId };
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
    return { userId: null, role: null, agencyRole: null, accessibleSiteIds: [], isPortalUser: false, portalClientId: null };
  }
  
  // Super admin can see all
  if (await isSuperAdmin()) {
    return { userId, role: "super_admin", agencyRole: null, accessibleSiteIds: null, isPortalUser: false, portalClientId: null };
  }
  
  // Get user's agency membership
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .single();
  
  if (!membership) {
    return { userId, role, agencyRole: null, accessibleSiteIds: [], isPortalUser: false, portalClientId: null };
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
async function canPublishPosts(): Promise<boolean> {
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
  const { data: post } = await supabase
    .from("blog_posts")
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
async function canManageCategories(): Promise<boolean> {
  const context = await getUserBlogContext();
  if (context.isPortalUser) return false;
  if (context.agencyRole === "member") return false;
  return true;
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

  let query = supabase
    .from("blog_posts")
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

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[PostService] Error:", error);
    return { posts: [], total: 0 };
  }

  return {
    posts: data.map(mapToPost),
    total: count || 0,
  };
}

export async function getPost(postId: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
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

  const { data, error } = await supabase
    .from("blog_posts")
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
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .single();

  if (existing) {
    return { success: false, error: "A post with this slug already exists" };
  }

  // Calculate reading time
  const wordCount = post.contentHtml
    ? post.contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const { data, error } = await supabase
    .from("blog_posts")
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
    await supabase.from("blog_post_categories").insert(
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
    const wordCount = updates.contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).length;
    updateData.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200));
  }
  if (updates.featuredImageUrl !== undefined) updateData.featured_image_url = updates.featuredImageUrl;
  if (updates.featuredImageAlt !== undefined) updateData.featured_image_alt = updates.featuredImageAlt;
  if (updates.metaTitle !== undefined) updateData.meta_title = updates.metaTitle;
  if (updates.metaDescription !== undefined) updateData.meta_description = updates.metaDescription;
  if (updates.metaKeywords !== undefined) updateData.meta_keywords = updates.metaKeywords;
  if (updates.ogImageUrl !== undefined) updateData.og_image_url = updates.ogImageUrl;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
  if (updates.allowComments !== undefined) updateData.allow_comments = updates.allowComments;
  if (updates.scheduledFor !== undefined) updateData.scheduled_for = updates.scheduledFor;

  if (effectiveStatus !== undefined) {
    updateData.status = effectiveStatus;
    if (effectiveStatus === "published") {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("blog_posts")
    .update(updateData)
    .eq("id", postId);

  if (error) {
    console.error("[PostService] Update error:", error);
    return { success: false, error: "Failed to update post" };
  }

  // Update categories if provided (only owner/admin can change)
  if (updates.categoryIds !== undefined && (await canManageCategories())) {
    // Remove existing
    await supabase.from("blog_post_categories").delete().eq("post_id", postId);

    // Add new
    if (updates.categoryIds.length > 0) {
      await supabase.from("blog_post_categories").insert(
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
  const { data: post } = await supabase
    .from("blog_posts")
    .select("site_id")
    .eq("id", postId)
    .single();
  
  if (!post || !(await canAccessSiteBlog(post.site_id))) {
    return { success: false, error: "Access denied" };
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", postId);

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
    .select("id, name, domain")
    .eq("client_id", context.portalClientId)
    .order("name");
  
  return { sites: sites || [] };
}

function mapToPost(data: Record<string, unknown>): BlogPost {
  const author = data.author as { full_name: string; avatar_url: string } | null;
  const categoriesRaw = (data.categories as Array<{ category: Record<string, unknown> }>) || [];

  return {
    id: data.id as string,
    siteId: data.site_id as string,
    authorId: data.author_id as string | null,
    authorName: author?.full_name || "Unknown",
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
    status: data.status as "draft" | "scheduled" | "published" | "archived",
    publishedAt: data.published_at as string | null,
    scheduledFor: data.scheduled_for as string | null,
    allowComments: data.allow_comments as boolean,
    isFeatured: data.is_featured as boolean,
    readingTimeMinutes: (data.reading_time_minutes as number) || 1,
    tags: (data.tags as string[]) || [],
    categories: categoriesRaw.map((c) => ({
      id: c.category.id as string,
      name: c.category.name as string,
      slug: c.category.slug as string,
      color: c.category.color as string,
    })),
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
```

---

### Task 83.3: Category Service

**File: `src/lib/blog/category-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface BlogCategory {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  postCount: number;
}

export async function getCategories(siteId: string): Promise<BlogCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_categories")
    .select(
      `
      *,
      post_count:blog_post_categories(count)
    `
    )
    .eq("site_id", siteId)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data.map((c) => ({
    id: c.id,
    siteId: c.site_id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    color: c.color,
    postCount: c.post_count?.[0]?.count || 0,
  }));
}

export async function createCategory(
  siteId: string,
  category: { name: string; slug?: string; description?: string; color?: string }
): Promise<{ success: boolean; category?: BlogCategory; error?: string }> {
  const supabase = await createClient();

  const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({
      site_id: siteId,
      name: category.name,
      slug,
      description: category.description,
      color: category.color || "#6366f1",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Category already exists" };
    }
    return { success: false, error: "Failed to create category" };
  }

  return {
    success: true,
    category: {
      id: data.id,
      siteId: data.site_id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      color: data.color,
      postCount: 0,
    },
  };
}

export async function updateCategory(
  categoryId: string,
  updates: { name?: string; slug?: string; description?: string; color?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("blog_categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return { success: false, error: "Failed to update category" };
  }

  return { success: true };
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("blog_categories").delete().eq("id", categoryId);

  if (error) {
    return { success: false, error: "Failed to delete category" };
  }

  return { success: true };
}
```

---

### Task 83.4: Post Editor Component

**File: `src/components/blog/post-editor.tsx`**

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, html: string) => void;
  placeholder?: string;
  className?: string;
}

export function PostEditor({
  content,
  onChange,
  placeholder = "Start writing your post...",
  className,
}: PostEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content as Parameters<typeof useEditor>[0]["content"],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none min-h-[400px] max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = prompt("Enter link URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-1">
        {/* History */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("code")}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media */}
        <Button variant="ghost" size="icon" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}
```

---

### Task 83.5: Post List Component

**File: `src/components/blog/post-list.tsx`**

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Star,
  StarOff,
  Clock,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updatePost, deletePost, type BlogPost } from "@/lib/blog/post-service";
import { toast } from "sonner";

interface PostListProps {
  posts: BlogPost[];
  siteId: string;
  onRefresh: () => void;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-red-100 text-red-800",
};

export function PostList({ posts, siteId, onRefresh }: PostListProps) {
  const handleToggleFeatured = async (postId: string, currentValue: boolean) => {
    const result = await updatePost(postId, { isFeatured: !currentValue });
    if (result.success) {
      toast.success(currentValue ? "Removed from featured" : "Added to featured");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const result = await deletePost(postId);
    if (result.success) {
      toast.success("Post deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No posts yet</p>
        <Button asChild className="mt-4">
          <Link href={`/sites/${siteId}/blog/new`}>Create your first post</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Categories</TableHead>
          <TableHead className="w-24">Status</TableHead>
          <TableHead className="w-32">Date</TableHead>
          <TableHead className="w-16"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell>
              {post.featuredImageUrl ? (
                <div className="w-10 h-10 relative rounded overflow-hidden">
                  <Image
                    src={post.featuredImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                  No img
                </div>
              )}
            </TableCell>
            <TableCell>
              <div>
                <Link
                  href={`/sites/${siteId}/blog/${post.id}`}
                  className="font-medium hover:text-primary"
                >
                  {post.title}
                  {post.isFeatured && (
                    <Star className="inline h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                  )}
                </Link>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {post.excerpt || "No excerpt"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {post.categories.slice(0, 2).map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    {cat.name}
                  </Badge>
                ))}
                {post.categories.length > 2 && (
                  <Badge variant="secondary">+{post.categories.length - 2}</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={statusColors[post.status]}
              >
                {post.status === "scheduled" && <Clock className="h-3 w-3 mr-1" />}
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {post.status === "published" ? (
                  formatDate(post.publishedAt)
                ) : post.status === "scheduled" ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.scheduledFor)}
                  </span>
                ) : (
                  formatDate(post.updatedAt)
                )}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/sites/${siteId}/blog/${post.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  {post.status === "published" && (
                    <DropdownMenuItem asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleToggleFeatured(post.id, post.isFeatured)}
                  >
                    {post.isFeatured ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Remove Featured
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Make Featured
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(post.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### Task 83.6: Blog Posts Page

**File: `src/app/(dashboard)/sites/[siteId]/blog/page.tsx`**

```tsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Plus, FileText, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PostList } from "@/components/blog/post-list";
import { getPosts, type BlogPost } from "@/lib/blog/post-service";
import { getCategories, type BlogCategory } from "@/lib/blog/category-service";

export default function BlogPostsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    setLoading(true);

    const [postsResult, categoriesData] = await Promise.all([
      getPosts(siteId, {
        status: statusFilter === "all" ? undefined : statusFilter,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        search: search || undefined,
      }),
      getCategories(siteId),
    ]);

    setPosts(postsResult.posts);
    setTotal(postsResult.total);
    setCategories(categoriesData);
    setLoading(false);
  };

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Blog Posts
          </h1>
          <p className="text-muted-foreground mt-1">{total} total posts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/sites/${siteId}/blog/categories`}>Categories</Link>
          </Button>
          <Button asChild>
            <Link href={`/sites/${siteId}/blog/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadData()}
          className="max-w-sm"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PostList posts={posts} siteId={siteId} onRefresh={loadData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 83.7: Public Blog Pages

**File: `src/app/sites/[subdomain]/blog/page.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSiteBySubdomain(subdomain: string) {
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("is_published", true)
    .single();

  return data;
}

async function getBlogPosts(siteId: string) {
  const { data } = await supabase
    .from("blog_posts")
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
    .order("published_at", { ascending: false });

  return data || [];
}

export default async function PublicBlogPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await getSiteBySubdomain(subdomain);

  if (!site) {
    return <div>Site not found</div>;
  }

  const posts = await getBlogPosts(site.id);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-2">Blog</h1>
      <p className="text-xl text-gray-600 mb-12">Latest news and articles</p>

      <div className="space-y-12">
        {posts.map((post) => {
          const author = post.author as { full_name: string } | null;
          const categories = (post.categories as Array<{ category: { name: string; color: string } }>) || [];

          return (
            <article key={post.id} className="group">
              <Link href={`/sites/${subdomain}/blog/${post.slug}`}>
                {post.featured_image_url && (
                  <div className="relative aspect-[2/1] mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={post.featured_image_url}
                      alt={post.featured_image_alt || post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {categories.map((c, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      style={{
                        backgroundColor: `${c.category.color}20`,
                        color: c.category.color,
                      }}
                    >
                      {c.category.name}
                    </Badge>
                  ))}
                </div>

                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-gray-600 mt-2 line-clamp-2">{post.excerpt}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>{author?.full_name || "Unknown"}</span>
                  <span>•</span>
                  <span>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{post.reading_time_minutes} min read</span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {posts.length === 0 && (
        <p className="text-center text-gray-500">No posts yet</p>
      )}
    </div>
  );
}
```

---

**File: `src/app/sites/[subdomain]/blog/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSiteBySubdomain(subdomain: string) {
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("is_published", true)
    .single();

  return data;
}

async function getPostBySlug(siteId: string, slug: string) {
  const { data } = await supabase
    .from("blog_posts")
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
    .eq("status", "published")
    .single();

  return data;
}

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const site = await getSiteBySubdomain(subdomain);

  if (!site) {
    notFound();
  }

  const post = await getPostBySlug(site.id, slug);

  if (!post) {
    notFound();
  }

  const author = post.author as { full_name: string; avatar_url: string } | null;
  const categories = (post.categories as Array<{ category: { name: string; color: string } }>) || [];

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      {/* Back link */}
      <Link
        href={`/sites/${subdomain}/blog`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to blog
      </Link>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-4">
        {categories.map((c, i) => (
          <Badge
            key={i}
            variant="secondary"
            style={{
              backgroundColor: `${c.category.color}20`,
              color: c.category.color,
            }}
          >
            {c.category.name}
          </Badge>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-gray-500 mb-8">
        {author?.avatar_url && (
          <Image
            src={author.avatar_url}
            alt={author.full_name}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <div>
          <p className="font-medium text-gray-900">{author?.full_name || "Unknown"}</p>
          <div className="flex items-center gap-2 text-sm">
            <span>
              {new Date(post.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <span>{post.reading_time_minutes} min read</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="relative aspect-[2/1] mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.featured_image_url}
            alt={post.featured_image_alt || post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content_html || "" }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-500 mb-2">Tags:</p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const site = await getSiteBySubdomain(subdomain);
  if (!site) return {};

  const post = await getPostBySlug(site.id, slug);
  if (!post) return {};

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.og_image_url ? [post.og_image_url] : post.featured_image_url ? [post.featured_image_url] : [],
    },
  };
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Post service CRUD operations
- [ ] Category service operations
- [ ] Reading time calculation
- [ ] Permission checks for all user roles

### Integration Tests
- [ ] Post creation with categories
- [ ] Post publishing workflow
- [ ] Post search works
- [ ] Member can only create drafts
- [ ] Portal users can only view published

### E2E Tests
- [ ] Create new post
- [ ] Edit post with rich text
- [ ] Publish post (owner/admin)
- [ ] View post on public site
- [ ] Blog listing shows posts
- [ ] Member cannot publish
- [ ] Portal user can view blog

---

## ✅ Completion Checklist

- [ ] Database schema for blog
- [ ] RLS policies for all tables
- [ ] Post service with permission checks
- [ ] Category service with permission checks
- [ ] Post editor (Tiptap)
- [ ] Post list component
- [ ] Posts page (agency)
- [ ] **Portal blog page (client view)**
- [ ] Create/edit post pages
- [ ] Public blog listing
- [ ] Public post detail
- [ ] SEO metadata
- [ ] @tiptap packages installed

---

## 🔐 User Role Summary

| Role | View | Create | Edit Own | Edit Any | Publish | Delete | Categories |
|------|------|--------|----------|----------|---------|--------|------------|
| Super Admin | ✅ All | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agency Owner | ✅ Agency | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agency Admin | ✅ Agency | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agency Member | ✅ Assigned | ✅ Draft | ✅ | ❌ | ❌ | ❌ | ❌ |
| Client Portal | ✅ Published | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

**Next Phase**: Phase 84 - SEO Dashboard
