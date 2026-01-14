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

export async function setHomepageAction(
  pageId: string
): Promise<{ success?: boolean; error?: string }> {
  return updatePageAction(pageId, { is_homepage: true });
}
