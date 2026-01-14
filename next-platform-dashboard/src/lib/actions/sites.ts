"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createSiteSchema, updateSiteSchema } from "@/lib/validations/site";
import type { SiteFilters } from "@/types/site";
import type { Json } from "@/types/database";

// Get all sites for the current organization
export async function getSites(filters?: SiteFilters) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No organization found");

  let query = supabase
    .from("sites")
    .select(`
      *,
      client:clients(id, name, company)
    `)
    .eq("agency_id", profile.agency_id);

  // Apply filters
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,subdomain.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "published") {
      query = query.eq("published", true);
    } else if (filters.status === "draft") {
      query = query.eq("published", false);
    }
  }

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get single site by ID
export async function getSite(siteId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sites")
    .select(`
      *,
      client:clients(id, name, company),
      pages(id, name, slug, is_homepage, created_at)
    `)
    .eq("id", siteId)
    .single();

  if (error) throw error;
  return data;
}

// Check if subdomain is available
export async function checkSubdomain(subdomain: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id")
    .eq("subdomain", subdomain.toLowerCase())
    .limit(1);

  if (error) throw error;
  return { available: !data || data.length === 0 };
}

// Create new site
export async function createSiteAction(formData: unknown) {
  const validated = createSiteSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) return { error: "No organization found" };

  // Check subdomain availability
  const { available } = await checkSubdomain(validated.data.subdomain);
  if (!available) {
    return { error: "Subdomain is already taken" };
  }

  // Create site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name: validated.data.name,
      subdomain: validated.data.subdomain.toLowerCase(),
      client_id: validated.data.client_id,
      agency_id: profile.agency_id,
      settings: validated.data.description ? { description: validated.data.description } : {},
      published: false,
    })
    .select()
    .single();

  if (siteError) {
    return { error: siteError.message };
  }

  // Create default homepage
  const { error: pageError } = await supabase.from("pages").insert({
    site_id: site.id,
    name: "Home",
    slug: "/",
    is_homepage: true,
  });

  if (pageError) {
    // Cleanup site if page creation fails
    await supabase.from("sites").delete().eq("id", site.id);
    return { error: "Failed to create homepage" };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/clients/${validated.data.client_id}`);
  return { success: true, data: site };
}

// Update site
export async function updateSiteAction(siteId: string, formData: unknown) {
  const validated = updateSiteSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  // Check subdomain if being changed
  if (validated.data.subdomain) {
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id, subdomain")
      .eq("id", siteId)
      .single();

    if (existingSite && existingSite.subdomain !== validated.data.subdomain) {
      const { available } = await checkSubdomain(validated.data.subdomain);
      if (!available) {
        return { error: "Subdomain is already taken" };
      }
    }
  }

  const { data, error } = await supabase
    .from("sites")
    .update({
      name: validated.data.name,
      subdomain: validated.data.subdomain?.toLowerCase(),
      custom_domain: validated.data.custom_domain,
      published: validated.data.published,
      seo_title: validated.data.seo_title,
      seo_description: validated.data.seo_description,
      seo_image: validated.data.seo_image,
      settings: validated.data.settings as Json | undefined,
    })
    .eq("id", siteId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true, data };
}

// Delete site
export async function deleteSiteAction(siteId: string) {
  const supabase = await createClient();

  // Delete pages first (cascade should handle this but being explicit)
  await supabase.from("pages").delete().eq("site_id", siteId);

  const { error } = await supabase.from("sites").delete().eq("id", siteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  return { success: true };
}

// Publish/unpublish site
export async function publishSiteAction(siteId: string, publish: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .update({
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", siteId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true, data };
}
