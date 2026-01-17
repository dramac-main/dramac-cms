"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface PublishResult {
  success: boolean;
  error?: string;
  siteUrl?: string;
  publishedAt?: string;
}

export interface SitePublishStatus {
  isPublished: boolean;
  publishedAt: string | null;
  subdomain: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  siteUrl: string;
}

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";

export async function publishSite(siteId: string): Promise<PublishResult> {
  try {
    const supabase = createAdminClient();

    // Get site data with pages
    const { data: site, error: fetchError } = await supabase
      .from("sites")
      .select("id, subdomain, pages(id)")
      .eq("id", siteId)
      .single();

    if (fetchError || !site) {
      return { success: false, error: "Site not found" };
    }

    // Check if site has at least one page
    const hasPages = site.pages && site.pages.length > 0;
    if (!hasPages) {
      return { success: false, error: "Site has no pages to publish" };
    }

    // Check if any page has content (via page_content table)
    const { count } = await supabase
      .from("page_content")
      .select("*", { count: "exact", head: true })
      .in("page_id", site.pages.map((p: { id: string }) => p.id));

    if (!count || count === 0) {
      return { success: false, error: "Site has no content to publish" };
    }

    // Update site as published
    const publishedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        published: true,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq("id", siteId);

    if (updateError) {
      console.error("[PublishService] Update error:", updateError);
      return { success: false, error: "Failed to publish site" };
    }

    // Generate site URL
    const siteUrl = `https://${site.subdomain}.${BASE_DOMAIN}`;

    revalidatePath(`/sites/${siteId}`);

    return {
      success: true,
      siteUrl,
      publishedAt,
    };
  } catch (error) {
    console.error("[PublishService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unpublishSite(siteId: string): Promise<PublishResult> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("sites")
      .update({
        published: false,
        published_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (error) {
      console.error("[PublishService] Unpublish error:", error);
      return { success: false, error: "Failed to unpublish site" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch (error) {
    console.error("[PublishService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getSitePublishStatus(siteId: string): Promise<SitePublishStatus | null> {
  try {
    const supabase = createAdminClient();

    const { data: site, error } = await supabase
      .from("sites")
      .select("published, published_at, subdomain, custom_domain, custom_domain_verified")
      .eq("id", siteId)
      .single();

    if (error || !site) {
      return null;
    }

    const siteUrl = site.custom_domain && site.custom_domain_verified
      ? `https://${site.custom_domain}`
      : `https://${site.subdomain}.${BASE_DOMAIN}`;

    return {
      isPublished: site.published || false,
      publishedAt: site.published_at,
      subdomain: site.subdomain,
      customDomain: site.custom_domain,
      customDomainVerified: site.custom_domain_verified || false,
      siteUrl,
    };
  } catch (error) {
    console.error("[PublishService] Status error:", error);
    return null;
  }
}

export async function checkSubdomainAvailability(subdomain: string, excludeSiteId?: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("sites")
      .select("id")
      .eq("subdomain", subdomain.toLowerCase());

    if (excludeSiteId) {
      query = query.neq("id", excludeSiteId);
    }

    const { data } = await query.single();
    return !data; // Available if no site found
  } catch {
    return true; // Assume available on error
  }
}

export async function updateSubdomain(siteId: string, subdomain: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      return { success: false, error: "Invalid subdomain format" };
    }

    // Check availability
    const isAvailable = await checkSubdomainAvailability(subdomain, siteId);
    if (!isAvailable) {
      return { success: false, error: "Subdomain already taken" };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("sites")
      .update({ subdomain: subdomain.toLowerCase() })
      .eq("id", siteId);

    if (error) {
      return { success: false, error: "Failed to update subdomain" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function publishPage(pageId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    const { data: page } = await supabase
      .from("pages")
      .select("slug, site:sites(subdomain)")
      .eq("id", pageId)
      .single();

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    const publishedAt = new Date().toISOString();

    return { success: true, publishedAt };
  } catch (_error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function unpublishPage(pageId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    const { data: page } = await supabase
      .from("pages")
      .select("slug, site:sites(subdomain)")
      .eq("id", pageId)
      .single();

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    return { success: true };
  } catch (_error) {
    return { success: false, error: "Unexpected error" };
  }
}
