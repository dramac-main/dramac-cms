"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";

// ============================================
// TYPES
// ============================================

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

export interface StorageListResult {
  files: StorageFile[];
  error?: string;
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * List files in a storage path
 */
export async function listStorageFiles(
  bucket: string,
  path: string
): Promise<StorageListResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { files: [], error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(bucket).list(path, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    console.error("[StorageService] List error:", error);
    return { files: [], error: error.message };
  }

  // Map storage response to our type
  return {
    files: (data || []).map((file) => ({
      name: file.name,
      id: file.id || "",
      updated_at: file.updated_at || new Date().toISOString(),
      created_at: file.created_at || new Date().toISOString(),
      last_accessed_at: file.last_accessed_at || new Date().toISOString(),
      metadata: {
        size: file.metadata?.size || 0,
        mimetype: file.metadata?.mimetype || "application/octet-stream",
        cacheControl: file.metadata?.cacheControl || "no-cache",
      },
    })),
  };
}

/**
 * Delete a file from storage
 */
export async function deleteStorageFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("[StorageService] Delete error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete multiple files from storage
 */
export async function deleteStorageFiles(
  bucket: string,
  paths: string[]
): Promise<{ success: boolean; deleted: number; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, deleted: 0, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    console.error("[StorageService] Bulk delete error:", error);
    return { success: false, deleted: 0, error: error.message };
  }

  return { success: true, deleted: data?.length || 0 };
}

/**
 * Move/rename a file in storage
 */
export async function moveStorageFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).move(fromPath, toPath);

  if (error) {
    console.error("[StorageService] Move error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Copy a file in storage
 */
export async function copyStorageFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).copy(fromPath, toPath);

  if (error) {
    console.error("[StorageService] Copy error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get public URL for a file
 */
export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("[StorageService] Signed URL error:", error);
    return { error: error.message };
  }

  return { url: data.signedUrl };
}

/**
 * Download a file
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<{ data?: Blob; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    console.error("[StorageService] Download error:", error);
    return { error: error.message };
  }

  return { data };
}

// ============================================
// IMAGE TRANSFORMATIONS
// ============================================

/**
 * Get transformed image URL (resize, crop, etc.)
 * Supabase supports image transformations via URL parameters
 */
export function getTransformedImageUrl(
  publicUrl: string,
  options: {
    width?: number;
    height?: number;
    resize?: "cover" | "contain" | "fill";
    quality?: number;
    format?: "webp" | "png" | "jpeg";
  }
): string {
  const url = new URL(publicUrl);
  
  // Supabase image transformation parameters
  const params: string[] = [];
  
  if (options.width) {
    params.push(`width=${options.width}`);
  }
  if (options.height) {
    params.push(`height=${options.height}`);
  }
  if (options.resize) {
    params.push(`resize=${options.resize}`);
  }
  if (options.quality) {
    params.push(`quality=${options.quality}`);
  }
  if (options.format) {
    params.push(`format=${options.format}`);
  }

  if (params.length > 0) {
    // Supabase uses /render/image/... endpoint for transformations
    // Replace /object/public/ with /render/image/public/
    const transformedPath = url.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    url.pathname = transformedPath;
    url.search = params.join("&");
  }

  return url.toString();
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(
  publicUrl: string,
  size: number = 200
): string {
  return getTransformedImageUrl(publicUrl, {
    width: size,
    height: size,
    resize: "cover",
    quality: 80,
    format: "webp",
  });
}

/**
 * Generate optimized image URL for web display
 */
export function getOptimizedImageUrl(
  publicUrl: string,
  maxWidth: number = 1920
): string {
  return getTransformedImageUrl(publicUrl, {
    width: maxWidth,
    quality: 85,
    format: "webp",
  });
}

// ============================================
// STORAGE STATS
// ============================================

/**
 * Get storage usage for an agency
 */
export async function getStorageUsage(
  agencyId: string
): Promise<{ used: number; files: number; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { used: 0, files: 0, error: "Not authenticated" };
  }

  // Verify access
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", userId)
      .single();

    if (profile?.agency_id !== agencyId) {
      return { used: 0, files: 0, error: "Access denied" };
    }
  }

  const supabase = await createClient();

  // Get total size from assets table
  const { data, error } = await supabase
    .from("assets")
    .select("size")
    .eq("agency_id", agencyId);

  if (error) {
    console.error("[StorageService] Usage query error:", error);
    return { used: 0, files: 0, error: error.message };
  }

  const totalSize = (data || []).reduce((sum, file) => sum + (file.size || 0), 0);

  return {
    used: totalSize,
    files: data?.length || 0,
  };
}

/**
 * Check if storage quota is exceeded
 */
export async function checkStorageQuota(
  agencyId: string,
  additionalBytes: number = 0
): Promise<{ allowed: boolean; used: number; limit: number; error?: string }> {
  // Default limit: 5GB per agency (can be configured per plan)
  const DEFAULT_LIMIT = 5 * 1024 * 1024 * 1024;

  const usage = await getStorageUsage(agencyId);
  
  if (usage.error) {
    return { allowed: false, used: 0, limit: DEFAULT_LIMIT, error: usage.error };
  }

  const totalAfterUpload = usage.used + additionalBytes;
  
  return {
    allowed: totalAfterUpload <= DEFAULT_LIMIT,
    used: usage.used,
    limit: DEFAULT_LIMIT,
  };
}

// ============================================
// BUCKET MANAGEMENT (Admin only)
// ============================================

/**
 * Ensure media bucket exists (run during setup)
 */
export async function ensureMediaBucket(): Promise<{ success: boolean; error?: string }> {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();

  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const mediaBucket = buckets?.find((b) => b.name === "media");

  if (mediaBucket) {
    return { success: true };
  }

  // Create bucket
  const { error } = await supabase.storage.createBucket("media", {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      "image/*",
      "video/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/*",
    ],
  });

  if (error) {
    console.error("[StorageService] Bucket creation error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Clean up orphaned files (files in storage but not in database)
 */
export async function cleanupOrphanedFiles(
  agencyId: string
): Promise<{ deleted: number; error?: string }> {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    return { deleted: 0, error: "Super admin access required" };
  }

  const supabase = await createClient();

  // List all files in agency folder
  const { data: storageFiles, error: listError } = await supabase.storage
    .from("media")
    .list(agencyId);

  if (listError) {
    return { deleted: 0, error: listError.message };
  }

  if (!storageFiles || storageFiles.length === 0) {
    return { deleted: 0 };
  }

  // Get all file paths from database
  const { data: dbFiles } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("agency_id", agencyId);

  const dbPaths = new Set((dbFiles || []).map((f) => f.storage_path));

  // Find orphaned files
  const orphanedPaths = storageFiles
    .filter((f) => !dbPaths.has(`${agencyId}/${f.name}`))
    .map((f) => `${agencyId}/${f.name}`);

  if (orphanedPaths.length === 0) {
    return { deleted: 0 };
  }

  // Delete orphaned files
  const { error: deleteError } = await supabase.storage
    .from("media")
    .remove(orphanedPaths);

  if (deleteError) {
    return { deleted: 0, error: deleteError.message };
  }

  return { deleted: orphanedPaths.length };
}
