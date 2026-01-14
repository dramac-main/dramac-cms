import { createAdminClient } from "@/lib/supabase/admin";
import { triggerRevalidation } from "@/lib/renderer/revalidate";

export interface PublishResult {
  success: boolean;
  publishedAt: string | null;
  error?: string;
  url?: string;
}

export async function publishSite(siteId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    // Get site details
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("subdomain, custom_domain, client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, publishedAt: null, error: "Site not found" };
    }

    // Verify at least one page exists
    const { count: pageCount } = await supabase
      .from("pages")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId);

    if (!pageCount || pageCount === 0) {
      return { 
        success: false, 
        publishedAt: null, 
        error: "Site must have at least one page" 
      };
    }

    // Update site to published
    const publishedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        published: true,
        published_at: publishedAt,
      })
      .eq("id", siteId);

    if (updateError) {
      return { success: false, publishedAt: null, error: "Failed to publish site" };
    }

    // Trigger revalidation
    await triggerRevalidation("site", site.subdomain);

    // Determine URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
    const url = site.custom_domain || `${site.subdomain}.${baseUrl}`;

    return {
      success: true,
      publishedAt,
      url: `https://${url}`,
    };
  } catch (error) {
    console.error("Publish site error:", error);
    return { success: false, publishedAt: null, error: "Unexpected error" };
  }
}

export async function unpublishSite(siteId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    const { data: site } = await supabase
      .from("sites")
      .select("subdomain")
      .eq("id", siteId)
      .single();

    const { error } = await supabase
      .from("sites")
      .update({
        published: false,
        published_at: null,
      })
      .eq("id", siteId);

    if (error) {
      return { success: false, publishedAt: null, error: "Failed to unpublish site" };
    }

    // Trigger revalidation to clear cache
    if (site?.subdomain) {
      await triggerRevalidation("site", site.subdomain);
    }

    return { success: true, publishedAt: null };
  } catch (_error) {
    return { success: false, publishedAt: null, error: "Unexpected error" };
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
      return { success: false, publishedAt: null, error: "Page not found" };
    }

    const publishedAt = new Date().toISOString();

    // Trigger page revalidation
    if (page?.site?.subdomain) {
      await triggerRevalidation("page", page.site.subdomain, page.slug);
    }

    return { success: true, publishedAt };
  } catch (_error) {
    return { success: false, publishedAt: null, error: "Unexpected error" };
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
      return { success: false, publishedAt: null, error: "Page not found" };
    }

    if (page?.site?.subdomain) {
      await triggerRevalidation("page", page.site.subdomain, page.slug);
    }

    return { success: true, publishedAt: null };
  } catch (error) {
    return { success: false, publishedAt: null, error: "Unexpected error" };
  }
}
