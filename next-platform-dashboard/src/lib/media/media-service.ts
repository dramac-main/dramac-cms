"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserRole,
  getCurrentUserId,
  isSuperAdmin,
} from "@/lib/auth/permissions";

// ============================================
// TYPES
// ============================================

export interface MediaFile {
  id: string;
  siteId: string | null;
  agencyId: string;
  folderId: string | null;
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
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  agencyId: string;
  parentId: string | null;
  name: string;
  slug: string;
  fileCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaFilters {
  folderId?: string | null;
  fileType?: string;
  search?: string;
  tags?: string[];
  siteId?: string;
}

export interface MediaUsage {
  id: string;
  assetId: string;
  entityType: string;
  entityId: string;
  fieldName?: string;
  createdAt: string;
}

// NOTE: media_folders and media_usage tables are created by phase-81 migration
// TypeScript types will be generated after running the migration
// Using 'as any' casts until types are regenerated

// ============================================
// INTERNAL HELPERS
// ============================================

interface UserContext {
  userId: string;
  agencyId: string | null;
  role: string | null;
  isSuperAdmin: boolean;
}

/**
 * Get user's agency ID with role validation
 */
async function getUserAgencyContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const role = await getCurrentUserRole();
  const superAdmin = await isSuperAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  return {
    userId,
    agencyId: profile?.agency_id || null,
    role,
    isSuperAdmin: superAdmin,
  };
}

/**
 * Map database record to MediaFile interface
 */
function mapToMediaFile(data: Record<string, unknown>): MediaFile {
  return {
    id: data.id as string,
    siteId: (data.site_id as string) || null,
    agencyId: data.agency_id as string,
    folderId: (data.folder_id as string) || null,
    fileName: data.file_name as string,
    originalName: (data.original_name as string) || (data.name as string) || (data.file_name as string),
    fileType: (data.file_type as "image" | "video" | "document" | "other") || "other",
    mimeType: data.mime_type as string,
    fileSize: (data.size as number) || 0,
    publicUrl: (data.url as string) || "",
    thumbnailUrl: (data.thumbnail_url as string) || null,
    width: (data.width as number) || null,
    height: (data.height as number) || null,
    altText: (data.alt_text as string) || null,
    caption: (data.caption as string) || null,
    tags: (data.tags as string[]) || [],
    uploadedBy: (data.uploaded_by as string) || null,
    createdAt: data.created_at as string,
    updatedAt: (data.updated_at as string) || (data.created_at as string),
  };
}

/**
 * Map database record to MediaFolder interface
 */
function mapToMediaFolder(data: Record<string, unknown>): MediaFolder {
  const fileCountData = data.file_count as { count: number }[] | undefined;
  return {
    id: data.id as string,
    agencyId: data.agency_id as string,
    parentId: (data.parent_id as string) || null,
    name: data.name as string,
    slug: data.slug as string,
    fileCount: fileCountData?.[0]?.count || 0,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// ============================================
// EXPORTED API - USER CONTEXT
// ============================================

/**
 * Get current user's agency and role for UI permission checks
 * Used by MediaLibraryPage to determine what actions user can take
 */
export async function getUserAgencyAndRole(): Promise<UserContext | null> {
  return getUserAgencyContext();
}

// ============================================
// EXPORTED API - MEDIA FILES
// ============================================

/**
 * Get media files with role-based filtering
 * - Super admin: Can view ALL agencies' media
 * - Agency owner/admin: All agency media
 * - Agency member: Only media from assigned sites
 */
export async function getMediaFiles(
  agencyId: string,
  filters: MediaFilters = {},
  page = 1,
  limit = 50
): Promise<{ files: MediaFile[]; total: number }> {
  const context = await getUserAgencyContext();
  if (!context) {
    console.error("[MediaService] Not authenticated");
    return { files: [], total: 0 };
  }

  // Permission check: Agency member can only view their agency's media
  if (!context.isSuperAdmin && context.agencyId !== agencyId) {
    console.error("[MediaService] Access denied - wrong agency");
    return { files: [], total: 0 };
  }

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("assets")
    .select("*", { count: "exact" })
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  // Agency members can only see media from sites they're assigned to
  if (context.role === "agency_member" && !context.isSuperAdmin) {
    // Get sites this member has access to
    const { data: memberSites } = await supabase
      .from("sites")
      .select("id")
      .eq("agency_id", agencyId);

    const siteIds = memberSites?.map((s) => s.id) || [];
    if (siteIds.length > 0) {
      query = query.or(`site_id.in.(${siteIds.join(",")}),site_id.is.null`);
    }
  }

  // Apply folder filter
  if (filters.folderId !== undefined) {
    if (filters.folderId === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", filters.folderId);
    }
  }

  // Apply file type filter
  if (filters.fileType && filters.fileType !== "all") {
    query = query.eq("file_type", filters.fileType);
  }

  // Apply search filter
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`name.ilike.${searchTerm},original_name.ilike.${searchTerm},alt_text.ilike.${searchTerm}`);
  }

  // Apply tags filter
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  // Apply site filter
  if (filters.siteId) {
    query = query.eq("site_id", filters.siteId);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[MediaService] Error fetching files:", error);
    return { files: [], total: 0 };
  }

  return {
    files: (data || []).map(mapToMediaFile),
    total: count || 0,
  };
}

/**
 * Get a single media file by ID
 */
export async function getMediaFile(fileId: string): Promise<MediaFile | null> {
  const context = await getUserAgencyContext();
  if (!context) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", fileId)
    .single();

  if (error || !data) {
    console.error("[MediaService] Error fetching file:", error);
    return null;
  }

  // Permission check
  if (!context.isSuperAdmin && data.agency_id !== context.agencyId) {
    return null;
  }

  return mapToMediaFile(data);
}

/**
 * Update media file metadata
 * Agency members can update metadata for files they have access to
 */
export async function updateMediaFile(
  fileId: string,
  updates: {
    altText?: string;
    caption?: string;
    tags?: string[];
    folderId?: string | null;
    name?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Verify user has access to this file
  const { data: file } = await supabase
    .from("assets")
    .select("agency_id, site_id")
    .eq("id", fileId)
    .single();

  if (!file) {
    return { success: false, error: "File not found" };
  }

  if (!context.isSuperAdmin && file.agency_id !== context.agencyId) {
    return { success: false, error: "Access denied" };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.altText !== undefined) updateData.alt_text = updates.altText;
  if (updates.caption !== undefined) updateData.caption = updates.caption;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.folderId !== undefined) updateData.folder_id = updates.folderId;
  if (updates.name !== undefined) updateData.name = updates.name;

  const { error } = await supabase
    .from("assets")
    .update(updateData)
    .eq("id", fileId);

  if (error) {
    console.error("[MediaService] Error updating file:", error);
    return { success: false, error: "Failed to update file" };
  }

  return { success: true };
}

/**
 * Delete media file - requires EDIT_CONTENT permission
 * Agency members CANNOT delete files
 */
export async function deleteMediaFile(
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  // Agency members cannot delete
  if (context.role === "agency_member" && !context.isSuperAdmin) {
    return { success: false, error: "Members cannot delete files" };
  }

  const supabase = await createClient();

  // Get file info first
  const { data: file } = await supabase
    .from("assets")
    .select("storage_path, agency_id")
    .eq("id", fileId)
    .single();

  if (!file) {
    return { success: false, error: "File not found" };
  }

  // Verify agency access
  if (!context.isSuperAdmin && file.agency_id !== context.agencyId) {
    return { success: false, error: "Access denied" };
  }

  // Delete from storage
  if (file.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("media")
      .remove([file.storage_path]);
    
    if (storageError) {
      console.warn("[MediaService] Failed to delete from storage:", storageError);
      // Continue anyway - the DB record should still be deleted
    }
  }

  // Delete usage records first (foreign key)
  // Using 'as any' until DB types are regenerated after running migration
  await (supabase as any).from("media_usage").delete().eq("asset_id", fileId);

  // Delete from database
  const { error } = await supabase.from("assets").delete().eq("id", fileId);

  if (error) {
    console.error("[MediaService] Error deleting file:", error);
    return { success: false, error: "Failed to delete file" };
  }

  return { success: true };
}

/**
 * Bulk delete media files
 */
export async function deleteMediaFiles(
  fileIds: string[]
): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  for (const fileId of fileIds) {
    const result = await deleteMediaFile(fileId);
    if (result.success) {
      deleted++;
    } else {
      errors.push(result.error || `Failed to delete ${fileId}`);
    }
  }

  return {
    success: errors.length === 0,
    deleted,
    errors,
  };
}

// ============================================
// EXPORTED API - FOLDERS
// ============================================

/**
 * Get all folders for an agency
 */
export async function getMediaFolders(agencyId: string): Promise<MediaFolder[]> {
  const context = await getUserAgencyContext();
  if (!context) return [];

  // Permission check
  if (!context.isSuperAdmin && context.agencyId !== agencyId) {
    return [];
  }

  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  const { data, error } = await (supabase as any)
    .from("media_folders")
    .select(
      `
      *,
      file_count:assets(count)
    `
    )
    .eq("agency_id", agencyId)
    .order("name");

  if (error) {
    console.error("[MediaService] Error fetching folders:", error);
    return [];
  }

  return (data || []).map(mapToMediaFolder);
}

/**
 * Get folder by ID
 */
export async function getMediaFolder(folderId: string): Promise<MediaFolder | null> {
  const context = await getUserAgencyContext();
  if (!context) return null;

  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  const { data, error } = await (supabase as any)
    .from("media_folders")
    .select(
      `
      *,
      file_count:assets(count)
    `
    )
    .eq("id", folderId)
    .single();

  if (error || !data) {
    return null;
  }

  // Permission check
  if (!context.isSuperAdmin && data.agency_id !== context.agencyId) {
    return null;
  }

  return mapToMediaFolder(data);
}

/**
 * Create folder - requires EDIT_CONTENT permission
 * Agency members cannot create folders
 */
export async function createFolder(
  agencyId: string,
  name: string,
  parentId?: string
): Promise<{ success: boolean; folder?: MediaFolder; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  // Permission check - only owner/admin can create folders
  if (!context.isSuperAdmin && context.agencyId !== agencyId) {
    return { success: false, error: "Access denied" };
  }

  if (context.role === "agency_member") {
    return { success: false, error: "Members cannot create folders" };
  }

  const supabase = await createClient();

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Using 'as any' until DB types are regenerated after running migration
  const { data, error } = await (supabase as any)
    .from("media_folders")
    .insert({
      agency_id: agencyId,
      parent_id: parentId || null,
      name,
      slug,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Folder already exists" };
    }
    console.error("[MediaService] Error creating folder:", error);
    return { success: false, error: "Failed to create folder" };
  }

  return {
    success: true,
    folder: {
      id: data.id,
      agencyId: data.agency_id,
      parentId: data.parent_id,
      name: data.name,
      slug: data.slug,
      fileCount: 0,
    },
  };
}

/**
 * Update folder
 */
export async function updateFolder(
  folderId: string,
  updates: { name?: string; parentId?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  if (context.role === "agency_member" && !context.isSuperAdmin) {
    return { success: false, error: "Members cannot update folders" };
  }

  const supabase = await createClient();

  // Get folder to verify ownership
  // Using 'as any' until DB types are regenerated after running migration
  const { data: folder } = await (supabase as any)
    .from("media_folders")
    .select("agency_id")
    .eq("id", folderId)
    .single();

  if (!folder) {
    return { success: false, error: "Folder not found" };
  }

  if (!context.isSuperAdmin && folder.agency_id !== context.agencyId) {
    return { success: false, error: "Access denied" };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
    updateData.slug = updates.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  if (updates.parentId !== undefined) {
    updateData.parent_id = updates.parentId;
  }

  // Using 'as any' until DB types are regenerated after running migration
  const { error } = await (supabase as any)
    .from("media_folders")
    .update(updateData)
    .eq("id", folderId);

  if (error) {
    console.error("[MediaService] Error updating folder:", error);
    return { success: false, error: "Failed to update folder" };
  }

  return { success: true };
}

/**
 * Delete folder - requires admin/owner role
 */
export async function deleteFolder(
  folderId: string
): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  if (context.role === "agency_member" && !context.isSuperAdmin) {
    return { success: false, error: "Members cannot delete folders" };
  }

  const supabase = await createClient();

  // Get folder to verify ownership
  // Using 'as any' until DB types are regenerated after running migration
  const { data: folder } = await (supabase as any)
    .from("media_folders")
    .select("agency_id")
    .eq("id", folderId)
    .single();

  if (!folder) {
    return { success: false, error: "Folder not found" };
  }

  if (!context.isSuperAdmin && folder.agency_id !== context.agencyId) {
    return { success: false, error: "Access denied" };
  }

  // Check if folder has files
  const { count } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", folderId);

  if (count && count > 0) {
    return {
      success: false,
      error: "Folder contains files. Move or delete them first.",
    };
  }

  // Check for subfolders
  // Using 'as any' until DB types are regenerated after running migration
  const { count: subCount } = await (supabase as any)
    .from("media_folders")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", folderId);

  if (subCount && subCount > 0) {
    return {
      success: false,
      error: "Folder contains subfolders. Delete them first.",
    };
  }

  // Using 'as any' until DB types are regenerated after running migration
  const { error } = await (supabase as any)
    .from("media_folders")
    .delete()
    .eq("id", folderId);

  if (error) {
    console.error("[MediaService] Error deleting folder:", error);
    return { success: false, error: "Failed to delete folder" };
  }

  return { success: true };
}

// ============================================
// EXPORTED API - MEDIA USAGE
// ============================================

/**
 * Track where a media file is used
 */
export async function trackMediaUsage(
  assetId: string,
  entityType: string,
  entityId: string,
  fieldName?: string
): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  const { error } = await (supabase as any).from("media_usage").insert({
    asset_id: assetId,
    entity_type: entityType,
    entity_id: entityId,
    field_name: fieldName,
  });

  if (error) {
    console.error("[MediaService] Error tracking usage:", error);
    return { success: false, error: "Failed to track usage" };
  }

  return { success: true };
}

/**
 * Remove media usage tracking
 */
export async function removeMediaUsage(
  assetId: string,
  entityType: string,
  entityId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  const { error } = await (supabase as any)
    .from("media_usage")
    .delete()
    .eq("asset_id", assetId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) {
    console.error("[MediaService] Error removing usage:", error);
    return { success: false, error: "Failed to remove usage" };
  }

  return { success: true };
}

/**
 * Get all usages for a media file
 */
export async function getMediaUsage(assetId: string): Promise<MediaUsage[]> {
  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  const { data, error } = await (supabase as any)
    .from("media_usage")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[MediaService] Error fetching usage:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((u: any) => ({
    id: u.id,
    assetId: u.asset_id,
    entityType: u.entity_type,
    entityId: u.entity_id,
    fieldName: u.field_name,
    createdAt: u.created_at,
  }));
}

// ============================================
// EXPORTED API - SEARCH & STATS
// ============================================

/**
 * Get unique tags for an agency
 */
export async function getAgencyTags(agencyId: string): Promise<string[]> {
  const context = await getUserAgencyContext();
  if (!context) return [];

  if (!context.isSuperAdmin && context.agencyId !== agencyId) {
    return [];
  }

  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  // The 'tags' column is added by phase-81 migration
  const { data, error } = await (supabase as any)
    .from("assets")
    .select("tags")
    .eq("agency_id", agencyId)
    .not("tags", "is", null);

  if (error) {
    console.error("[MediaService] Error fetching tags:", error);
    return [];
  }

  // Flatten and dedupe tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTags = (data || []).flatMap((d: any) => d.tags || []);
  return [...new Set(allTags)].sort() as string[];
}

/**
 * Get media statistics for an agency
 */
export async function getMediaStats(agencyId: string): Promise<{
  totalFiles: number;
  totalSize: number;
  byType: Record<string, number>;
}> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { totalFiles: 0, totalSize: 0, byType: {} };
  }

  if (!context.isSuperAdmin && context.agencyId !== agencyId) {
    return { totalFiles: 0, totalSize: 0, byType: {} };
  }

  const supabase = await createClient();

  // Get total count
  const { count: totalFiles } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  // Get total size
  const { data: sizeData } = await supabase
    .from("assets")
    .select("size")
    .eq("agency_id", agencyId);

  const totalSize = (sizeData || []).reduce((sum, d) => sum + (d.size || 0), 0);

  // Get counts by type
  // Using 'as any' until DB types are regenerated after running migration
  // The 'file_type' column is added by phase-81 migration
  const { data: typeData } = await (supabase as any)
    .from("assets")
    .select("file_type")
    .eq("agency_id", agencyId);

  const byType: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (typeData || []).forEach((d: any) => {
    const type = d.file_type || "other";
    byType[type] = (byType[type] || 0) + 1;
  });

  return {
    totalFiles: totalFiles || 0,
    totalSize,
    byType,
  };
}

/**
 * Move files to a folder
 */
export async function moveFilesToFolder(
  fileIds: string[],
  folderId: string | null
): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  if (context.role === "agency_member" && !context.isSuperAdmin) {
    return { success: false, error: "Members cannot move files" };
  }

  const supabase = await createClient();

  // Using 'as any' until DB types are regenerated after running migration
  // The 'folder_id' and 'updated_at' columns are added by phase-81 migration
  const { error } = await (supabase as any)
    .from("assets")
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .in("id", fileIds);

  if (error) {
    console.error("[MediaService] Error moving files:", error);
    return { success: false, error: "Failed to move files" };
  }

  return { success: true };
}
