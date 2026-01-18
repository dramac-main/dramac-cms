"use server";

import { createClient } from "@/lib/supabase/server";
import { canManageCategories } from "./post-service";

export interface BlogCategory {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

// Database row types for blog tables (not yet in generated types)
interface BlogCategoryRow {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToCategory(row: BlogCategoryRow & { post_count?: { count: number }[] }): BlogCategory {
  return {
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color || "#6366f1",
    postCount: row.post_count?.[0]?.count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCategories(siteId: string): Promise<BlogCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("blog_categories")
    .select(`*, post_count:blog_post_categories(count)`)
    .eq("site_id", siteId)
    .order("name");

  if (error || !data) {
    console.error("[CategoryService] Error fetching categories:", error);
    return [];
  }

  return (data as (BlogCategoryRow & { post_count?: { count: number }[] })[]).map(mapRowToCategory);
}

export async function getCategory(categoryId: string): Promise<BlogCategory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("blog_categories")
    .select(`*, post_count:blog_post_categories(count)`)
    .eq("id", categoryId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapRowToCategory(data as BlogCategoryRow & { post_count?: { count: number }[] });
}

export async function createCategory(
  siteId: string,
  category: { 
    name: string; 
    slug?: string; 
    description?: string; 
    color?: string 
  }
): Promise<{ success: boolean; category?: BlogCategory; error?: string }> {
  // Permission check
  if (!(await canManageCategories())) {
    return { success: false, error: "Permission denied: Cannot manage categories" };
  }

  const supabase = await createClient();

  // Generate slug from name if not provided
  const slug = category.slug || 
    category.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // Check for duplicate slug
  const { data: existing } = await supabase.from("blog_categories")
    .select("id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .single();

  if (existing) {
    return { success: false, error: "A category with this slug already exists" };
  }

  const { data, error } = await supabase.from("blog_categories")
    .insert({
      site_id: siteId,
      name: category.name,
      slug,
      description: category.description || null,
      color: category.color || "#6366f1",
    })
    .select()
    .single();

  if (error) {
    console.error("[CategoryService] Create error:", error);
    if (error.code === "23505") {
      return { success: false, error: "Category already exists" };
    }
    return { success: false, error: "Failed to create category" };
  }

  const row = data as BlogCategoryRow;
  return {
    success: true,
    category: {
      id: row.id,
      siteId: row.site_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color || "#6366f1",
      postCount: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export async function updateCategory(
  categoryId: string,
  updates: { 
    name?: string; 
    slug?: string; 
    description?: string; 
    color?: string 
  }
): Promise<{ success: boolean; error?: string }> {
  // Permission check
  if (!(await canManageCategories())) {
    return { success: false, error: "Permission denied: Cannot manage categories" };
  }

  const supabase = await createClient();

  // If updating slug, check for duplicates
  if (updates.slug) {
    const { data: category } = await supabase.from("blog_categories")
      .select("site_id")
      .eq("id", categoryId)
      .single();

    if (category) {
      const { data: existing } = await supabase.from("blog_categories")
        .select("id")
        .eq("site_id", (category as { site_id: string }).site_id)
        .eq("slug", updates.slug)
        .neq("id", categoryId)
        .single();

      if (existing) {
        return { success: false, error: "A category with this slug already exists" };
      }
    }
  }

  const { error } = await supabase.from("blog_categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    console.error("[CategoryService] Update error:", error);
    return { success: false, error: "Failed to update category" };
  }

  return { success: true };
}

export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  // Permission check
  if (!(await canManageCategories())) {
    return { success: false, error: "Permission denied: Cannot manage categories" };
  }

  const supabase = await createClient();

  // Check if category has posts
  const { data: postCategories } = await supabase.from("blog_post_categories")
    .select("post_id")
    .eq("category_id", categoryId)
    .limit(1);

  if (postCategories && postCategories.length > 0) {
    return { 
      success: false, 
      error: "Cannot delete category with associated posts. Remove posts from this category first." 
    };
  }

  const { error } = await supabase.from("blog_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("[CategoryService] Delete error:", error);
    return { success: false, error: "Failed to delete category" };
  }

  return { success: true };
}

/**
 * Get categories with their associated post counts for a site
 */
export async function getCategoriesWithStats(
  siteId: string
): Promise<Array<BlogCategory & { recentPosts: number }>> {
  const categories = await getCategories(siteId);
  
  // Categories already include post count, just add recent posts count
  const supabase = await createClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const categoriesWithStats = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase.from("blog_post_categories")
        .select("post_id, blog_posts!inner(created_at)", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .gte("blog_posts.created_at", thirtyDaysAgo.toISOString());

      return {
        ...cat,
        recentPosts: count || 0,
      };
    })
  );

  return categoriesWithStats;
}

/**
 * Bulk update category colors
 */
export async function updateCategoryColors(
  updates: Array<{ id: string; color: string }>
): Promise<{ success: boolean; error?: string }> {
  // Permission check
  if (!(await canManageCategories())) {
    return { success: false, error: "Permission denied: Cannot manage categories" };
  }

  const supabase = await createClient();

  const errors: string[] = [];

  for (const update of updates) {
    const { error } = await supabase.from("blog_categories")
      .update({ color: update.color, updated_at: new Date().toISOString() })
      .eq("id", update.id);

    if (error) {
      errors.push(`Failed to update category ${update.id}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join("; ") };
  }

  return { success: true };
}

/**
 * Reorder categories (if you implement a sort_order field)
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // Permission check
  if (!(await canManageCategories())) {
    return { success: false, error: "Permission denied: Cannot manage categories" };
  }

  const supabase = await createClient();

  const errors: string[] = [];

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase.from("blog_categories")
      .update({ 
        sort_order: i,
        updated_at: new Date().toISOString() 
      })
      .eq("id", orderedIds[i]);

    if (error) {
      errors.push(`Failed to reorder category ${orderedIds[i]}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join("; ") };
  }

  return { success: true };
}
