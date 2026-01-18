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
function getFileTypeFromMime(mimeType: string): "image" | "video" | "document" | "other" {
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
    fileType: (data.file_type as "image" | "video" | "document" | "other") || getFileTypeFromMime(mimeType),
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
  limit = 24
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

  const offset = (page - 1) * limit;

  // Build query for assets
  let query = supabase
    .from("assets")
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%`);
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
        query = query.or("mime_type.ilike.%pdf%,mime_type.ilike.%document%,mime_type.ilike.%text/%");
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
  fileId: string
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
export async function getPortalMediaStats(
  siteId?: string
): Promise<{
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
    siteIds = sites?.map(s => s.id) || [];
  }

  if (siteIds.length === 0) {
    return { totalFiles: 0, totalSize: 0, byType: [] };
  }

  // Get all assets for these sites
  const { data: assets, count } = await supabase
    .from("assets")
    .select("size, mime_type", { count: "exact" })
    .in("site_id", siteIds);

  if (!assets) {
    return { totalFiles: 0, totalSize: 0, byType: [] };
  }

  // Calculate total size
  const totalSize = assets.reduce((sum, a) => sum + (a.size || 0), 0);

  // Count by type
  const typeCounts = new Map<string, number>();
  assets.forEach(a => {
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
