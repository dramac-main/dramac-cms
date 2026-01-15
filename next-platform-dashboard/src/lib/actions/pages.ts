"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createPageSchema,
  updatePageSchema,
  type CreatePageFormData,
  type UpdatePageFormData,
} from "@/lib/validations/page";
import type { Page } from "@/types/page";
import type { Json } from "@/types/database";

// Helper to get current user's agency
async function getAgencyId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  return profile?.agency_id || null;
}

export async function getPages(siteId: string): Promise<Page[]> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();

  if (!agencyId) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", siteId)
    .order("is_homepage", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPage(pageId: string): Promise<Page | null> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();

  if (!agencyId) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("pages")
    .select(
      `
      *,
      site:sites(id, name, subdomain, agency_id)
    `
    )
    .eq("id", pageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  // Verify agency access
  if (data.site?.agency_id !== agencyId) {
    throw new Error("Unauthorized");
  }

  return data;
}

export async function getPageWithContent(pageId: string): Promise<{
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  content: Record<string, unknown> | null;
  site?: { id: string; name: string; subdomain: string; agency_id: string };
} | null> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();

  if (!agencyId) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("pages")
    .select(
      `
      *,
      site:sites(id, name, subdomain, agency_id),
      page_content(content)
    `
    )
    .eq("id", pageId)
    .single();

  if (error) {
    console.error('[getPageWithContent] Query error:', error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  console.log('[getPageWithContent] Page data retrieved for:', pageId);
  console.log('[getPageWithContent] page_content data:', data.page_content);
  console.log('[getPageWithContent] page_content type:', typeof data.page_content);
  console.log('[getPageWithContent] Is array:', Array.isArray(data.page_content));

  // Verify agency access
  if (data.site?.agency_id !== agencyId) {
    throw new Error("Unauthorized");
  }

  // Extract content from page_content relation
  // Handle both object (from join) and array (from old queries) formats
  let content: Record<string, unknown> | null = null;
  
  if (data.page_content) {
    if (Array.isArray(data.page_content) && data.page_content.length > 0) {
      // Array format: page_content is an array, extract first item
      content = (data.page_content[0] as { content: Record<string, unknown> }).content;
    } else if (typeof data.page_content === 'object' && 'content' in data.page_content) {
      // Object format: page_content is an object with content property
      content = (data.page_content as { content: Record<string, unknown> }).content;
    }
  }

  console.log('[getPageWithContent] Extracted content:', content ? 'Content exists' : 'No content');
  if (content) {
    console.log('[getPageWithContent] Content keys:', Object.keys(content));
  }

  return {
    ...data,
    content,
  };
}

export async function createPageAction(
  siteId: string,
  formData: CreatePageFormData
): Promise<{ data?: Page; error?: string }> {
  const supabase = await createClient();

  try {
    const validatedFields = createPageSchema.parse(formData);
    const agencyId = await getAgencyId();

    if (!agencyId) {
      return { error: "Not authenticated" };
    }

    // Verify site belongs to agency
    const { data: site } = await supabase
      .from("sites")
      .select("id, agency_id")
      .eq("id", siteId)
      .single();

    if (!site || site.agency_id !== agencyId) {
      return { error: "Site not found" };
    }

    // Check for duplicate slug
    const { data: existingPage } = await supabase
      .from("pages")
      .select("id")
      .eq("site_id", siteId)
      .eq("slug", validatedFields.slug)
      .single();

    if (existingPage) {
      return { error: "A page with this slug already exists" };
    }

    // If this is set as homepage, unset other homepages
    if (validatedFields.is_homepage) {
      await supabase
        .from("pages")
        .update({ is_homepage: false })
        .eq("site_id", siteId)
        .eq("is_homepage", true);
    }

    const { data, error } = await supabase
      .from("pages")
      .insert({
        site_id: siteId,
        name: validatedFields.name,
        slug: validatedFields.slug,
        is_homepage: validatedFields.is_homepage,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/sites/${siteId}`);
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to create page" };
  }
}

export async function updatePageAction(
  pageId: string,
  formData: UpdatePageFormData
): Promise<{ data?: Page; error?: string }> {
  const supabase = await createClient();

  try {
    const validatedFields = updatePageSchema.parse(formData);
    const agencyId = await getAgencyId();

    if (!agencyId) {
      return { error: "Not authenticated" };
    }

    // Get page and verify ownership
    const { data: existingPage } = await supabase
      .from("pages")
      .select("*, site:sites(agency_id)")
      .eq("id", pageId)
      .single();

    if (!existingPage || existingPage.site?.agency_id !== agencyId) {
      return { error: "Page not found" };
    }

    // If setting as homepage, unset other homepages
    if (validatedFields.is_homepage) {
      await supabase
        .from("pages")
        .update({ is_homepage: false })
        .eq("site_id", existingPage.site_id)
        .eq("is_homepage", true)
        .neq("id", pageId);
    }

    const { data, error } = await supabase
      .from("pages")
      .update(validatedFields)
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/sites/${existingPage.site_id}`);
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update page" };
  }
}

export async function deletePageAction(
  pageId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const agencyId = await getAgencyId();

    if (!agencyId) {
      return { error: "Not authenticated" };
    }

    // Get page and verify ownership + not homepage
    const { data: page } = await supabase
      .from("pages")
      .select("*, site:sites(agency_id)")
      .eq("id", pageId)
      .single();

    if (!page || page.site?.agency_id !== agencyId) {
      return { error: "Page not found" };
    }

    if (page.is_homepage) {
      return { error: "Cannot delete the homepage. Set another page as homepage first." };
    }

    const { error } = await supabase.from("pages").delete().eq("id", pageId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/sites/${page.site_id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to delete page" };
  }
}

export async function savePageContentAction(
  pageId: string,
  content: Json
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const agencyId = await getAgencyId();

    if (!agencyId) {
      console.error('[savePageContentAction] Not authenticated');
      return { error: "Not authenticated" };
    }

    console.log('[savePageContentAction] Saving content for page:', pageId);

    // Verify ownership
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("site:sites(agency_id)")
      .eq("id", pageId)
      .single();

    if (pageError) {
      console.error('[savePageContentAction] Page query error:', pageError);
      return { error: pageError.message };
    }

    if (!page || page.site?.agency_id !== agencyId) {
      console.error('[savePageContentAction] Unauthorized access');
      return { error: "Page not found" };
    }

    // Check if page_content exists
    const { data: existingContent, error: checkError } = await supabase
      .from("page_content")
      .select("id")
      .eq("page_id", pageId)
      .maybeSingle();

    if (checkError) {
      console.error('[savePageContentAction] Error checking existing content:', checkError);
      return { error: checkError.message };
    }

    if (existingContent) {
      console.log('[savePageContentAction] Updating existing content');
      // Update existing content
      const { error } = await supabase
        .from("page_content")
        .update({ content: content as Json, updated_at: new Date().toISOString() })
        .eq("page_id", pageId);

      if (error) {
        console.error('[savePageContentAction] Update error:', error);
        return { error: error.message };
      }
    } else {
      console.log('[savePageContentAction] Inserting new content');
      // Insert new content
      const { error } = await supabase
        .from("page_content")
        .insert({ page_id: pageId, content: content as Json });

      if (error) {
        console.error('[savePageContentAction] Insert error:', error);
        return { error: error.message };
      }
    }

    console.log('[savePageContentAction] Save completed successfully');
    
    // Revalidate the editor page to ensure fresh data on next load
    try {
      const { data: pageData } = await supabase
        .from("pages")
        .select("site_id")
        .eq("id", pageId)
        .single();
      
      if (pageData) {
        revalidatePath(`/dashboard/sites/${pageData.site_id}/editor`);
        console.log('[savePageContentAction] Cache revalidated for site:', pageData.site_id);
      }
    } catch (revalidateError) {
      console.error('[savePageContentAction] Revalidation error:', revalidateError);
      // Don't fail the save if revalidation fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('[savePageContentAction] Unexpected error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to save page content" };
  }
}

export async function setHomepageAction(
  pageId: string
): Promise<{ success?: boolean; error?: string }> {
  return updatePageAction(pageId, { is_homepage: true });
}
