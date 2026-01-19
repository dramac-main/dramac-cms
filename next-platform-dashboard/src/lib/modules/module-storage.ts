/**
 * Module Storage Service
 * 
 * Handles file storage for modules with:
 * - Per-module, per-site storage buckets
 * - Quota management
 * - File type validation
 * - Signed URLs for secure access
 * 
 * @module module-storage
 */

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface StorageBucket {
  id: string;
  moduleId: string;
  siteId: string;
  bucketName: string;
  maxSizeBytes: number;
  usedSizeBytes: number;
  fileCount: number;
  lastAccessedAt?: string;
  createdAt: string;
}

export interface StorageFile {
  name: string;
  id: string;
  path: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageQuota {
  maxBytes: number;
  usedBytes: number;
  usedPercent: number;
  remainingBytes: number;
  fileCount: number;
}

export interface UploadResult {
  success: boolean;
  file?: StorageFile;
  error?: string;
  path?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: Blob;
  contentType?: string;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_SIZE_BYTES = 104857600; // 100MB
const MAX_FILE_SIZE_BYTES = 52428800; // 50MB per file
const ALLOWED_CONTENT_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  // Documents
  "application/pdf",
  "application/json",
  "text/plain",
  "text/csv",
  "text/html",
  "text/css",
  // Data
  "application/xml",
  "application/zip",
  // Media
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "video/webm",
]);

// ============================================================================
// Bucket Management
// ============================================================================

/**
 * Get or create a storage bucket for a module
 */
export async function getOrCreateBucket(
  moduleId: string,
  siteId: string
): Promise<StorageBucket> {
  const supabase = await createClient();
  const bucketName = generateBucketName(moduleId, siteId);

  // Try to get existing bucket record
  const { data: existing } = await supabase
    .from("module_storage_buckets")
    .select("*")
    .eq("module_id", moduleId)
    .eq("site_id", siteId)
    .single();

  if (existing) {
    return {
      id: existing.id,
      moduleId: existing.module_id || moduleId,
      siteId: existing.site_id || siteId,
      bucketName: existing.bucket_name || "",
      maxSizeBytes: existing.max_size_bytes ?? 0,
      usedSizeBytes: existing.used_size_bytes ?? 0,
      fileCount: existing.file_count ?? 0,
      lastAccessedAt: existing.last_accessed_at ?? undefined,
      createdAt: existing.created_at || "",
    };
  }

  // Create bucket record
  const { data: newBucket, error } = await supabase
    .from("module_storage_buckets")
    .insert({
      module_id: moduleId,
      site_id: siteId,
      bucket_name: bucketName,
      max_size_bytes: DEFAULT_MAX_SIZE_BYTES,
      used_size_bytes: 0,
      file_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bucket: ${error.message}`);
  }

  // Create actual storage bucket in Supabase (if needed)
  // Note: In production, you might create buckets ahead of time or use a single bucket with folder structure
  try {
    await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
    });
  } catch {
    // Bucket might already exist
  }

  return {
    id: newBucket.id,
    moduleId: newBucket.module_id || moduleId,
    siteId: newBucket.site_id || siteId,
    bucketName: newBucket.bucket_name || "",
    maxSizeBytes: newBucket.max_size_bytes ?? 0,
    usedSizeBytes: newBucket.used_size_bytes ?? 0,
    fileCount: newBucket.file_count ?? 0,
    lastAccessedAt: newBucket.last_accessed_at ?? undefined,
    createdAt: newBucket.created_at || "",
  };
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(
  moduleId: string,
  siteId: string
): Promise<StorageQuota> {
  const bucket = await getOrCreateBucket(moduleId, siteId);

  return {
    maxBytes: bucket.maxSizeBytes,
    usedBytes: bucket.usedSizeBytes,
    usedPercent: (bucket.usedSizeBytes / bucket.maxSizeBytes) * 100,
    remainingBytes: bucket.maxSizeBytes - bucket.usedSizeBytes,
    fileCount: bucket.fileCount,
  };
}

/**
 * Update storage usage statistics
 */
async function updateStorageUsage(
  moduleId: string,
  siteId: string
): Promise<void> {
  const supabase = await createClient();
  const bucketName = generateBucketName(moduleId, siteId);

  try {
    // List all files to calculate usage
    const { data: files } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 10000 });

    let totalSize = 0;
    let fileCount = 0;

    if (files) {
      for (const file of files) {
        if (file.metadata?.size) {
          totalSize += file.metadata.size;
          fileCount++;
        }
      }
    }

    // Update bucket record
    await supabase
      .from("module_storage_buckets")
      .update({
        used_size_bytes: totalSize,
        file_count: fileCount,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("module_id", moduleId)
      .eq("site_id", siteId);
  } catch (error) {
    console.error("[ModuleStorage] Failed to update usage:", error);
  }
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Upload a file to module storage
 */
export async function uploadFile(
  moduleId: string,
  siteId: string,
  path: string,
  file: Blob | ArrayBuffer | string,
  options: {
    contentType?: string;
    upsert?: boolean;
  } = {}
): Promise<UploadResult> {
  const supabase = await createClient();

  // Get bucket and check quota
  const bucket = await getOrCreateBucket(moduleId, siteId);
  const fileSize = file instanceof Blob ? file.size : 
    file instanceof ArrayBuffer ? file.byteLength :
    new TextEncoder().encode(file).length;

  // Check file size limit
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size (${formatBytes(fileSize)}) exceeds maximum (${formatBytes(MAX_FILE_SIZE_BYTES)})`,
    };
  }

  // Check quota
  if (bucket.usedSizeBytes + fileSize > bucket.maxSizeBytes) {
    return {
      success: false,
      error: `Storage quota exceeded. Used: ${formatBytes(bucket.usedSizeBytes)}, ` +
             `Max: ${formatBytes(bucket.maxSizeBytes)}, ` +
             `File: ${formatBytes(fileSize)}`,
    };
  }

  // Validate content type
  const contentType = options.contentType || 
    (file instanceof Blob ? file.type : "application/octet-stream");
  
  if (!isContentTypeAllowed(contentType)) {
    return {
      success: false,
      error: `Content type "${contentType}" is not allowed`,
    };
  }

  // Sanitize path
  const sanitizedPath = sanitizePath(path);

  try {
    const { data, error } = await supabase.storage
      .from(bucket.bucketName)
      .upload(sanitizedPath, file, {
        contentType,
        upsert: options.upsert || false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update usage stats
    await updateStorageUsage(moduleId, siteId);

    return {
      success: true,
      path: data.path,
      file: {
        name: sanitizedPath.split("/").pop() || sanitizedPath,
        id: data.id,
        path: data.path,
        size: fileSize,
        contentType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Download a file from module storage
 */
export async function downloadFile(
  moduleId: string,
  siteId: string,
  path: string
): Promise<DownloadResult> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);
  const sanitizedPath = sanitizePath(path);

  try {
    const { data, error } = await supabase.storage
      .from(bucket.bucketName)
      .download(sanitizedPath);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update last accessed
    await supabase
      .from("module_storage_buckets")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("module_id", moduleId)
      .eq("site_id", siteId);

    return {
      success: true,
      data,
      contentType: data.type,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * Delete a file from module storage
 */
export async function deleteFile(
  moduleId: string,
  siteId: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);
  const sanitizedPath = sanitizePath(path);

  try {
    const { error } = await supabase.storage
      .from(bucket.bucketName)
      .remove([sanitizedPath]);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update usage stats
    await updateStorageUsage(moduleId, siteId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Delete multiple files from module storage
 */
export async function deleteFiles(
  moduleId: string,
  siteId: string,
  paths: string[]
): Promise<{ success: boolean; deleted: number; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);
  const sanitizedPaths = paths.map(sanitizePath);

  try {
    const { error } = await supabase.storage
      .from(bucket.bucketName)
      .remove(sanitizedPaths);

    if (error) {
      return { success: false, deleted: 0, error: error.message };
    }

    // Update usage stats
    await updateStorageUsage(moduleId, siteId);

    return { success: true, deleted: sanitizedPaths.length };
  } catch (error) {
    return {
      success: false,
      deleted: 0,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * List files in module storage
 */
export async function listFiles(
  moduleId: string,
  siteId: string,
  options: {
    path?: string;
    limit?: number;
    offset?: number;
    sortBy?: { column: "name" | "created_at" | "updated_at"; order: "asc" | "desc" };
  } = {}
): Promise<{ success: boolean; files?: StorageFile[]; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);

  try {
    const { data, error } = await supabase.storage
      .from(bucket.bucketName)
      .list(options.path || "", {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const files: StorageFile[] = (data || [])
      .filter(f => f.name !== ".emptyFolderPlaceholder")
      .map(f => ({
        name: f.name,
        id: f.id || f.name,
        path: options.path ? `${options.path}/${f.name}` : f.name,
        size: f.metadata?.size || 0,
        contentType: f.metadata?.mimetype || "application/octet-stream",
        createdAt: f.created_at || new Date().toISOString(),
        updatedAt: f.updated_at || new Date().toISOString(),
      }));

    return { success: true, files };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "List failed",
    };
  }
}

/**
 * Get a signed URL for a file
 */
export async function getSignedUrl(
  moduleId: string,
  siteId: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; expiresAt?: string; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);
  const sanitizedPath = sanitizePath(path);

  try {
    const { data, error } = await supabase.storage
      .from(bucket.bucketName)
      .createSignedUrl(sanitizedPath, expiresIn);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create signed URL",
    };
  }
}

/**
 * Get a public URL for a file (if bucket is public)
 */
export async function getPublicUrl(
  moduleId: string,
  siteId: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);
  const sanitizedPath = sanitizePath(path);

  try {
    const { data } = supabase.storage
      .from(bucket.bucketName)
      .getPublicUrl(sanitizedPath);

    return {
      success: true,
      url: data.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get public URL",
    };
  }
}

/**
 * Copy a file within module storage
 */
export async function copyFile(
  moduleId: string,
  siteId: string,
  sourcePath: string,
  destPath: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);

  try {
    const { error } = await supabase.storage
      .from(bucket.bucketName)
      .copy(sanitizePath(sourcePath), sanitizePath(destPath));

    if (error) {
      return { success: false, error: error.message };
    }

    await updateStorageUsage(moduleId, siteId);

    return { success: true, path: destPath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Copy failed",
    };
  }
}

/**
 * Move/rename a file
 */
export async function moveFile(
  moduleId: string,
  siteId: string,
  sourcePath: string,
  destPath: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = await createClient();
  const bucket = await getOrCreateBucket(moduleId, siteId);

  try {
    const { error } = await supabase.storage
      .from(bucket.bucketName)
      .move(sanitizePath(sourcePath), sanitizePath(destPath));

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, path: destPath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Move failed",
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate bucket name from module and site IDs
 */
function generateBucketName(moduleId: string, siteId: string): string {
  // Supabase bucket names must be lowercase and use hyphens
  const sanitizedModuleId = moduleId.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const sanitizedSiteId = siteId.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `module-${sanitizedModuleId}-${sanitizedSiteId}`.substring(0, 63);
}

/**
 * Sanitize file path
 */
function sanitizePath(path: string): string {
  return path
    .replace(/\\/g, "/") // Convert backslashes
    .replace(/^\/+/, "") // Remove leading slashes
    .replace(/\/+/g, "/") // Remove duplicate slashes
    .replace(/\.\./g, "") // Remove path traversal
    .trim();
}

/**
 * Check if content type is allowed
 */
function isContentTypeAllowed(contentType: string): boolean {
  // Allow all content types if the exact type is in the list
  if (ALLOWED_CONTENT_TYPES.has(contentType)) return true;

  // Allow any image/* or text/* types
  if (contentType.startsWith("image/") || contentType.startsWith("text/")) {
    return true;
  }

  return false;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from path
 */
function getFileExtension(path: string): string {
  const parts = path.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    // Documents
    pdf: "application/pdf",
    json: "application/json",
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    css: "text/css",
    xml: "application/xml",
    zip: "application/zip",
    // Media
    mp3: "audio/mpeg",
    wav: "audio/wav",
    mp4: "video/mp4",
    webm: "video/webm",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}
