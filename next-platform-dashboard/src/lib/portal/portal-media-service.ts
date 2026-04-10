"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// ============================================
// TYPES
// ============================================

export interface PortalMediaFile {
  id: string;
  siteId: string | null;
  fileName: string;
  originalName: string;
  fileType: "image" | "video" | "document" | "other";
  mimeType: string;
  fileSize: number;
  publicUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  tags: string[];
  createdAt: string;
}

export interface PortalMediaFilters {
  search?: string;
  fileType?: string;
}

// ============================================
// HELPER: Get Portal Client ID
// ============================================

async function getPortalClientId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("impersonating_client_id")?.value || null;
}

/**
 * Determine file type from MIME type
 */
function getFileTypeFromMime(
  mimeType: string,
): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text/") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}

/**
 * Map database record to PortalMediaFile
 */
function mapToPortalMediaFile(data: Record<string, unknown>): PortalMediaFile {
  const mimeType = (data.mime_type as string) || "application/octet-stream";
  return {
    id: data.id as string,
    siteId: (data.site_id as string) || null,
    fileName: data.file_name as string,
    originalName: (data.name as string) || (data.file_name as string),
    fileType:
      (data.file_type as "image" | "video" | "document" | "other") ||
      getFileTypeFromMime(mimeType),
    mimeType,
    fileSize: (data.size as number) || 0,
    publicUrl: (data.url as string) || "",
    thumbnailUrl: (data.thumbnail_url as string) || null,
    width: (data.width as number) || null,
    height: (data.height as number) || null,
    altText: (data.alt_text as string) || null,
    caption: (data.caption as string) || null,
    tags: (data.tags as string[]) || [],
    createdAt: data.created_at as string,
  };
}

// ============================================
// EXPORTED API
// ============================================

/**
 * Get the agency ID for the current portal client.
 * Needed for media upload components.
 */
export async function getPortalAgencyId(): Promise<string | null> {
  const clientId = await getPortalClientId();
  if (!clientId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();

  return data?.agency_id || null;
}

/**
 * Get the subdomain for a portal site (for blog preview URLs).
 * Only returns if the site belongs to the current portal client.
 */
export async function getPortalSiteSubdomain(
  siteId: string,
): Promise<string | null> {
  const clientId = await getPortalClientId();
  if (!clientId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("subdomain")
    .eq("id", siteId)
    .eq("client_id", clientId)
    .single();

  return data?.subdomain || null;
}

/**
 * Check if a portal client's site is published.
 * Returns false if the site is not found or not published.
 */
export async function getPortalSitePublishStatus(
  siteId: string,
): Promise<boolean> {
  const clientId = await getPortalClientId();
  if (!clientId) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("published")
    .eq("id", siteId)
    .eq("client_id", clientId)
    .single();

  return data?.published ?? false;
}

/**
 * Delete a portal media file (only if the site belongs to the client)
 */
export async function deletePortalMedia(
  fileId: string,
): Promise<{ success: boolean; error?: string }> {
  const clientId = await getPortalClientId();
  if (!clientId) return { success: false, error: "Not authenticated" };

  const supabase = await createClient();

  // Get the file with its site to verify ownership
  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("id, storage_path, site:sites!inner(client_id)")
    .eq("id", fileId)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: "File not found" };
  }

  const siteData = asset.site as { client_id: string } | null;
  if (!siteData || siteData.client_id !== clientId) {
    return { success: false, error: "Access denied" };
  }

  // Delete from storage if path exists
  if (asset.storage_path) {
    await supabase.storage.from("media").remove([asset.storage_path]);
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from("assets")
    .delete()
    .eq("id", fileId);

  if (deleteError) {
    return { success: false, error: "Failed to delete file" };
  }

  return { success: true };
}

/**
 * Get sites that the portal client has access to (for site selector)
 */
export async function getPortalMediaSites(): Promise<{
  sites: Array<{ id: string; name: string }>;
}> {
  const clientId = await getPortalClientId();
  if (!clientId) {
    return { sites: [] };
  }

  const supabase = await createClient();

  // Get sites belonging to this client
  const { data, error } = await supabase
    .from("sites")
    .select("id, name")
    .eq("client_id", clientId)
    .order("name");

  if (error) {
    console.error("[PortalMediaService] Error fetching sites:", error);
    return { sites: [] };
  }

  return {
    sites: data || [],
  };
}

/**
 * Get media files for a specific site (portal read-only view)
 * Only returns files for sites the client owns
 */
export async function getPortalMedia(
  siteId: string,
  filters: PortalMediaFilters = {},
  page = 1,
  limit = 24,
): Promise<{ files: PortalMediaFile[]; total: number }> {
  const clientId = await getPortalClientId();
  if (!clientId) {
    console.error("[PortalMediaService] Not authenticated");
    return { files: [], total: 0 };
  }

  const supabase = await createClient();

  // First verify this site belongs to the client
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, client_id")
    .eq("id", siteId)
    .single();

  if (siteError || !site || site.client_id !== clientId) {
    console.error("[PortalMediaService] Site not found or access denied");
    return { files: [], total: 0 };
  }

  // Get the agency_id for this site so we can also show agency-level assets
  const { data: siteDetail } = await supabase
    .from("sites")
    .select("agency_id")
    .eq("id", siteId)
    .single();

  const agencyId = siteDetail?.agency_id;

  const offset = (page - 1) * limit;

  // Build query for assets — include both site-specific AND agency-level assets
  let query = supabase
    .from("assets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Show assets that belong to this site OR agency-level assets (site_id is null)
  if (agencyId) {
    query = query.or(
      `site_id.eq.${siteId},and(site_id.is.null,agency_id.eq.${agencyId})`,
    );
  } else {
    query = query.eq("site_id", siteId);
  }

  // Apply filters
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%`,
    );
  }

  if (filters.fileType) {
    // Filter by file type based on MIME type patterns
    switch (filters.fileType) {
      case "image":
        query = query.ilike("mime_type", "image/%");
        break;
      case "video":
        query = query.ilike("mime_type", "video/%");
        break;
      case "document":
        query = query.or(
          "mime_type.ilike.%pdf%,mime_type.ilike.%document%,mime_type.ilike.%text/%",
        );
        break;
      case "other":
        query = query
          .not("mime_type", "ilike", "image/%")
          .not("mime_type", "ilike", "video/%")
          .not("mime_type", "ilike", "%pdf%")
          .not("mime_type", "ilike", "%document%");
        break;
    }
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[PortalMediaService] Error fetching media:", error);
    return { files: [], total: 0 };
  }

  return {
    files: (data || []).map(mapToPortalMediaFile),
    total: count || 0,
  };
}

/**
 * Get a single media file (for preview)
 * Only returns if the file belongs to a site the client owns
 */
export async function getPortalMediaFile(
  fileId: string,
): Promise<PortalMediaFile | null> {
  const clientId = await getPortalClientId();
  if (!clientId) {
    return null;
  }

  const supabase = await createClient();

  // Get the file with its site
  const { data, error } = await supabase
    .from("assets")
    .select("*, site:sites!inner(client_id)")
    .eq("id", fileId)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if the site belongs to this client
  const siteData = data.site as { client_id: string } | null;
  if (!siteData || siteData.client_id !== clientId) {
    return null;
  }

  return mapToPortalMediaFile(data);
}

/**
 * Get media stats for a client's sites
 */
export async function getPortalMediaStats(siteId?: string): Promise<{
  totalFiles: number;
  totalSize: number;
  byType: { type: string; count: number }[];
}> {
  const clientId = await getPortalClientId();
  if (!clientId) {
    return { totalFiles: 0, totalSize: 0, byType: [] };
  }

  const supabase = await createClient();

  // If siteId provided, verify ownership
  if (siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("client_id")
      .eq("id", siteId)
      .single();

    if (!site || site.client_id !== clientId) {
      return { totalFiles: 0, totalSize: 0, byType: [] };
    }
  }

  // Get all sites for client if no specific site
  let siteIds: string[] = [];
  if (siteId) {
    siteIds = [siteId];
  } else {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("client_id", clientId);
    siteIds = sites?.map((s) => s.id) || [];
  }

  if (siteIds.length === 0) {
    return { totalFiles: 0, totalSize: 0, byType: [] };
  }

  // Get the agency_id for the client
  const { data: clientData } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();
  const agencyId = clientData?.agency_id;

  // Get all assets for these sites + agency-level assets
  let assetQuery = supabase
    .from("assets")
    .select("size, mime_type", { count: "exact" });

  if (agencyId) {
    assetQuery = assetQuery.or(
      `site_id.in.(${siteIds.join(",")}),and(site_id.is.null,agency_id.eq.${agencyId})`,
    );
  } else {
    assetQuery = assetQuery.in("site_id", siteIds);
  }

  const { data: assets, count } = await assetQuery;

  if (!assets) {
    return { totalFiles: 0, totalSize: 0, byType: [] };
  }

  // Calculate total size
  const totalSize = assets.reduce((sum, a) => sum + (a.size || 0), 0);

  // Count by type
  const typeCounts = new Map<string, number>();
  assets.forEach((a) => {
    const type = getFileTypeFromMime(a.mime_type || "");
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  const byType = Array.from(typeCounts.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  return {
    totalFiles: count || 0,
    totalSize,
    byType,
  };
}

// ============================================
// SITE IMAGES DISCOVERY
// ============================================

export interface DiscoveredImage {
  url: string;
  source: "page" | "blog";
  pageName?: string;
  postTitle?: string;
}

/**
 * Discover all image URLs used on a site (from page content and blog posts).
 * Returns unique image URLs found in the site's content.
 */
export async function discoverSiteImages(
  siteId: string,
): Promise<DiscoveredImage[]> {
  const clientId = await getPortalClientId();
  if (!clientId) return [];

  const supabase = await createClient();

  // Verify this site belongs to the client
  const { data: site } = await supabase
    .from("sites")
    .select("id, client_id")
    .eq("id", siteId)
    .eq("client_id", clientId)
    .single();

  if (!site) return [];

  const images: DiscoveredImage[] = [];
  const seenUrls = new Set<string>();

  // 1. Scan page content for image URLs
  const { data: pages } = await supabase
    .from("pages")
    .select("id, name")
    .eq("site_id", siteId);

  if (pages) {
    for (const page of pages) {
      const { data: content } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_id", page.id)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (content?.content) {
        const contentStr = JSON.stringify(content.content);
        // Extract image URLs from JSON (Unsplash, Supabase, etc.)
        const urlRegex =
          /https?:\/\/[^"\\]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"\\]*)?\b/gi;
        const matches = contentStr.match(urlRegex) || [];
        for (const url of matches) {
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            images.push({ url, source: "page", pageName: page.name });
          }
        }
        // Also match Unsplash URLs without file extensions
        const unsplashRegex = /https:\/\/images\.unsplash\.com\/[^"\\]+/gi;
        const unsplashMatches = contentStr.match(unsplashRegex) || [];
        for (const url of unsplashMatches) {
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            images.push({ url, source: "page", pageName: page.name });
          }
        }
      }
    }
  }

  // 2. Scan blog posts for featured images
  const { data: posts } = await (supabase as any)
    .from("blog_posts")
    .select("title, featured_image_url")
    .eq("site_id", siteId)
    .not("featured_image_url", "is", null);

  if (posts) {
    for (const post of posts) {
      const url = post.featured_image_url as string;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        images.push({ url, source: "blog", postTitle: post.title as string });
      }
    }
  }

  return images;
}
