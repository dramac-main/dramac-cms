"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getCurrentUserRole, isSuperAdmin } from "@/lib/auth/permissions";
import { v4 as uuid } from "uuid";

// ============================================
// TYPES
// ============================================

export interface UploadResult {
  success: boolean;
  fileId?: string;
  publicUrl?: string;
  error?: string;
}

export interface UploadOptions {
  siteId?: string;
  folderId?: string;
  altText?: string;
  tags?: string[];
}

// ============================================
// HELPERS
// ============================================

/**
 * Determine file type from MIME type
 */
function getFileType(mimeType: string): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("text/")
  ) {
    return "document";
  }
  return "other";
}

/**
 * Generate a unique filename while preserving extension
 */
function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const uniqueId = uuid();
  return ext ? `${uniqueId}.${ext}` : uniqueId;
}

/**
 * Sanitize filename for storage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

/**
 * Get user's agency ID
 */
async function getUserAgencyId(): Promise<string | null> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  return profile?.agency_id || null;
}

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Upload a media file to Supabase Storage
 * This is designed to be called from API routes that handle FormData
 */
export async function uploadMediaFile(
  agencyId: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  fileSize: number,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user belongs to this agency
  const userAgencyId = await getUserAgencyId();
  const superAdmin = await isSuperAdmin();
  
  if (!superAdmin && userAgencyId !== agencyId) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  // Check if media bucket exists, create if needed
  const { data: buckets } = await supabase.storage.listBuckets();
  const mediaBucket = buckets?.find((b) => b.name === "media");

  if (!mediaBucket) {
    // Try to create bucket
    const { error: createError } = await supabase.storage.createBucket("media", {
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

    if (createError) {
      console.error("[UploadService] Failed to create media bucket:", createError);
      return { 
        success: false, 
        error: "Media storage bucket not configured. Please contact support." 
      };
    }
  }

  // Generate unique filename
  const uniqueName = generateUniqueFileName(fileName);
  const storagePath = `${agencyId}/${uniqueName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: "31536000", // 1 year cache
      upsert: false,
    });

  if (uploadError) {
    console.error("[UploadService] Upload error:", uploadError);
    return { success: false, error: "Failed to upload file" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Create database record
  // Using 'as any' until DB types are regenerated after running migration
  const { data: fileRecord, error: dbError } = await (supabase as any)
    .from("assets")
    .insert({
      agency_id: agencyId,
      site_id: options.siteId || null,
      folder_id: options.folderId || null,
      uploaded_by: userId,
      name: fileName,
      file_name: uniqueName,
      original_name: fileName,
      file_type: getFileType(mimeType),
      mime_type: mimeType,
      size: fileSize,
      storage_path: storagePath,
      url: publicUrl,
      alt_text: options.altText || null,
      tags: options.tags || [],
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("[UploadService] DB error:", dbError);
    // Try to clean up uploaded file
    await supabase.storage.from("media").remove([storagePath]);
    return { success: false, error: "Failed to save file record" };
  }

  return {
    success: true,
    fileId: fileRecord.id,
    publicUrl,
  };
}

/**
 * Upload multiple files
 */
export async function uploadMediaFiles(
  agencyId: string,
  files: Array<{
    buffer: ArrayBuffer;
    name: string;
    type: string;
    size: number;
  }>,
  options: UploadOptions = {}
): Promise<{ results: UploadResult[]; successCount: number; errorCount: number }> {
  const results: UploadResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const result = await uploadMediaFile(
      agencyId,
      file.buffer,
      file.name,
      file.type,
      file.size,
      options
    );
    results.push(result);
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  return { results, successCount, errorCount };
}

/**
 * Upload from URL (import external image)
 */
export async function uploadFromUrl(
  agencyId: string,
  url: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "DramaCMS/1.0",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch image from URL" };
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    // Extract filename from URL
    const urlParts = new URL(url);
    let fileName = urlParts.pathname.split("/").pop() || "imported-file";
    
    // Add extension if missing
    if (!fileName.includes(".")) {
      const ext = contentType.split("/")[1]?.split(";")[0];
      if (ext) {
        fileName = `${fileName}.${ext}`;
      }
    }

    return uploadMediaFile(
      agencyId,
      buffer,
      fileName,
      contentType,
      buffer.byteLength,
      options
    );
  } catch (error) {
    console.error("[UploadService] URL import error:", error);
    return { success: false, error: "Failed to import from URL" };
  }
}

/**
 * Update image dimensions after upload (called from client-side after reading image)
 */
export async function updateImageDimensions(
  fileId: string,
  width: number,
  height: number
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("assets")
    .update({ width, height, updated_at: new Date().toISOString() })
    .eq("id", fileId);

  if (error) {
    console.error("[UploadService] Error updating dimensions:", error);
    return { success: false, error: "Failed to update dimensions" };
  }

  return { success: true };
}

/**
 * Validate file before upload
 */
export async function validateFile(
  file: { name: string; type: string; size: number },
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  const maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB default
  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum size of ${maxMB}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  return { valid: true };
}

/**
 * Generate a pre-signed upload URL for direct client uploads
 * This is useful for large files to avoid server memory issues
 */
export async function getUploadUrl(
  agencyId: string,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; uploadUrl?: string; path?: string; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user belongs to this agency
  const userAgencyId = await getUserAgencyId();
  const superAdmin = await isSuperAdmin();
  
  if (!superAdmin && userAgencyId !== agencyId) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();
  
  const uniqueName = generateUniqueFileName(fileName);
  const storagePath = `${agencyId}/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error("[UploadService] Error creating signed URL:", error);
    return { success: false, error: "Failed to create upload URL" };
  }

  return {
    success: true,
    uploadUrl: data.signedUrl,
    path: storagePath,
  };
}

/**
 * Confirm upload after using pre-signed URL
 */
export async function confirmUpload(
  agencyId: string,
  storagePath: string,
  originalName: string,
  mimeType: string,
  fileSize: number,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Get public URL
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Create database record
  // Using 'as any' until DB types are regenerated after running migration
  const { data: fileRecord, error: dbError } = await (supabase as any)
    .from("assets")
    .insert({
      agency_id: agencyId,
      site_id: options.siteId || null,
      folder_id: options.folderId || null,
      uploaded_by: userId,
      name: originalName,
      file_name: storagePath.split("/").pop(),
      original_name: originalName,
      file_type: getFileType(mimeType),
      mime_type: mimeType,
      size: fileSize,
      storage_path: storagePath,
      url: publicUrl,
      alt_text: options.altText || null,
      tags: options.tags || [],
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("[UploadService] DB error:", dbError);
    return { success: false, error: "Failed to save file record" };
  }

  return {
    success: true,
    fileId: fileRecord.id,
    publicUrl,
  };
}
