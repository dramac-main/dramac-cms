# Phase 81: Media Library System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 8-10 hours

---

## 🎯 Objective

Create a comprehensive media library for managing images, videos, and files:
1. **Upload** - Drag-and-drop, bulk upload, URL import
2. **Organize** - Folders, tags, search
3. **Transform** - Resize, crop, optimize images
4. **Integrate** - Use media in visual editor and pages

---

## � USER ROLES & ACCESS

### Access Matrix

| Feature | Super Admin | Agency Owner | Agency Admin | Agency Member | Client |
|---------|-------------|--------------|--------------|---------------|--------|
| View all agency media | ✅ | ✅ | ✅ | ✅ (own sites only) | ❌ |
| Upload media | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete media | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage folders | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit metadata (tags, alt) | ✅ | ✅ | ✅ | ✅ | ❌ |
| View via portal | N/A | N/A | N/A | N/A | ✅ (own sites) |

### Permission Implementation
- Use `getCurrentUserRole()` from `@/lib/auth/permissions`
- Use `hasPermission()` with `PERMISSIONS.EDIT_CONTENT` for uploads
- Agency members only see media from sites they're assigned to
- Super admin can access ALL agencies' media (for support)

---

## 📋 Prerequisites

- [ ] Supabase Storage configured
- [ ] Visual editor functional
- [ ] Dashboard layout ready
- [ ] Permission system working (`src/lib/auth/permissions.ts`)

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ **`assets` table EXISTS** with: `id`, `site_id`, `agency_id`, `name`, `file_name`, `url`, `storage_path`, `mime_type`, `size`, `width`, `height`, `folder`, `alt_text`
- ✅ **Permission system** in `src/lib/auth/permissions.ts`
- ✅ **User roles** defined in `src/types/roles.ts`
- Basic file upload in page editor
- Supabase storage bucket exists

**What's Missing:**
- Media library UI page
- Folder/collection hierarchy table
- Drag-drop upload zone
- Image transformations
- Search and filtering
- Media picker dialog
- Role-based access checks

---

## ⚠️ IMPORTANT: USE EXISTING `assets` TABLE

**DO NOT CREATE `media_files` TABLE!** The `assets` table already exists with similar fields.

We will:
1. ✅ **USE `assets` table** as our media storage
2. ✅ **ADD missing columns** to `assets` (tags, caption, thumbnail_url)
3. ✅ **CREATE `media_folders`** for folder hierarchy (the `folder` column is just a string)

---

## 💼 Business Value

1. **Agency Efficiency** - Manage all assets in one place
2. **Storage Optimization** - Auto-compress and resize images
3. **Consistency** - Share assets across sites
4. **Performance** - Optimized images = faster sites
5. **Organization** - Find assets quickly with search

---

## 📁 Files to Create

```
src/app/(dashboard)/media/
├── page.tsx                    # Media library main page
├── upload/route.ts             # Upload API

src/lib/media/
├── media-service.ts            # CRUD operations (uses assets table!)
├── upload-service.ts           # Upload handling
├── storage-service.ts          # Supabase storage wrapper

src/components/media/
├── media-grid.tsx              # Grid of media items
├── media-upload-zone.tsx       # Drag-and-drop upload
├── media-item-card.tsx         # Individual item card
├── media-details-panel.tsx     # Side panel with details
├── folder-tree.tsx             # Folder navigation
├── media-picker-dialog.tsx     # Dialog for selecting media

Database:
├── media_folders               # NEW: Folder hierarchy
├── assets                      # EXISTING: Add missing columns
```

---

## ✅ Tasks

### Task 81.1: Database Schema (MODIFIED - Use assets table!)

**File: `migrations/media-library-tables.sql`**

```sql
-- Media folders for organization (NEW TABLE)
CREATE TABLE IF NOT EXISTS media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, parent_id, slug)
);

-- ADD MISSING COLUMNS TO EXISTING assets TABLE (NOT creating new table!)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS optimized_url TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Track where media is used (NEW TABLE)
CREATE TABLE IF NOT EXISTS media_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, -- Changed from media_id
  
  -- Where it's used
  entity_type TEXT NOT NULL, -- page, site, component
  entity_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (FIXED - references assets table, not media_files!)
CREATE INDEX IF NOT EXISTS idx_assets_agency ON assets(agency_id);
CREATE INDEX IF NOT EXISTS idx_assets_folder ON assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_site ON assets(site_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_agency ON media_folders(agency_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_asset ON media_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_entity ON media_usage(entity_type, entity_id);

-- RLS Policies for media_folders
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view their folders"
ON media_folders FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM profiles WHERE id = auth.uid()
    UNION
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Agency admins can manage folders"
ON media_folders FOR ALL
USING (
  agency_id IN (
    SELECT agency_id FROM profiles WHERE id = auth.uid()
    UNION
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
```

---

### Task 81.2: Media Service (WITH PERMISSION CHECKS!)

**File: `src/lib/media/media-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  getCurrentUserRole, 
  getCurrentUserId, 
  isSuperAdmin,
  hasPermission 
} from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/types/roles";

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
  parentId: string | null;
  name: string;
  slug: string;
  fileCount?: number;
}

export interface MediaFilters {
  folderId?: string | null;
  fileType?: string;
  search?: string;
  tags?: string[];
  siteId?: string; // Filter by specific site
}

/**
 * Get user's agency ID with role validation
 */
async function getUserAgencyContext(): Promise<{
  userId: string;
  agencyId: string | null;
  role: string | null;
  isSuperAdmin: boolean;
} | null> {
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
    
    const siteIds = memberSites?.map(s => s.id) || [];
    if (siteIds.length > 0) {
      query = query.or(`site_id.in.(${siteIds.join(",")}),site_id.is.null`);
    }
  }

  if (filters.folderId !== undefined) {
    if (filters.folderId === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", filters.folderId);
    }
  }

  if (filters.fileType) {
    query = query.ilike("mime_type", `${filters.fileType}%`);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  if (filters.siteId) {
    query = query.eq("site_id", filters.siteId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[MediaService] Error fetching files:", error);
    return { files: [], total: 0 };
  }

  return {
    files: data.map(mapToMediaFile),
    total: count || 0,
  };
}

export async function getMediaFolders(agencyId: string): Promise<MediaFolder[]> {
  const context = await getUserAgencyContext();
  if (!context) return [];

  // Permission check
  if (!context.isSuperAdmin && context.agencyId !== agencyId) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media_folders")
    .select(`
      *,
      file_count:assets(count)
    `)
    .eq("agency_id", agencyId)
    .order("name");

  if (error) {
    console.error("[MediaService] Error fetching folders:", error);
    return [];
  }

  return data.map((f) => ({
    id: f.id,
    parentId: f.parent_id,
    name: f.name,
    slug: f.slug,
    fileCount: f.file_count?.[0]?.count || 0,
  }));
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

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const { data, error } = await supabase
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
    return { success: false, error: "Failed to create folder" };
  }

  return {
    success: true,
    folder: {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      slug: data.slug,
    },
  };
}

/**
 * Update media file metadata
 * Agency members can update metadata for files they have access to
 */
export async function updateMediaFile(
  fileId: string,
  updates: { altText?: string; caption?: string; tags?: string[]; folderId?: string | null }
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

  const { error } = await supabase
    .from("assets")
    .update(updateData)
    .eq("id", fileId);

  if (error) {
    return { success: false, error: "Failed to update file" };
  }

  return { success: true };
}

/**
 * Delete media file - requires EDIT_CONTENT permission
 * Agency members CANNOT delete files
 */
export async function deleteMediaFile(fileId: string): Promise<{ success: boolean; error?: string }> {
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
  await supabase.storage.from("media").remove([file.storage_path]);

  // Delete from database
  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("id", fileId);

  if (error) {
    return { success: false, error: "Failed to delete file" };
  }

  return { success: true };
}

/**
 * Delete folder - requires admin/owner role
 */
export async function deleteFolder(folderId: string): Promise<{ success: boolean; error?: string }> {
  const context = await getUserAgencyContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  if (context.role === "agency_member" && !context.isSuperAdmin) {
    return { success: false, error: "Members cannot delete folders" };
  }

  const supabase = await createClient();

  // Get folder to verify ownership
  const { data: folder } = await supabase
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
    .select("id", { count: "exact" })
    .eq("folder_id", folderId);

  if (count && count > 0) {
    return { success: false, error: "Folder contains files. Move or delete them first." };
  }

  const { error } = await supabase
    .from("media_folders")
    .delete()
    .eq("id", folderId);

  if (error) {
    return { success: false, error: "Failed to delete folder" };
  }

  return { success: true };
}

function mapToMediaFile(data: Record<string, unknown>): MediaFile {
  return {
    id: data.id as string,
    folderId: data.folder_id as string | null,
    fileName: data.file_name as string,
    originalName: data.original_name as string,
    fileType: data.file_type as "image" | "video" | "document" | "other",
    mimeType: data.mime_type as string,
    fileSize: data.file_size as number,
    publicUrl: data.public_url as string,
    thumbnailUrl: data.thumbnail_url as string | null,
    width: data.width as number | null,
    height: data.height as number | null,
    altText: data.alt_text as string | null,
    caption: data.caption as string | null,
    tags: (data.tags as string[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
```

---

### Task 81.3: Upload Service

**File: `src/lib/media/upload-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { v4 as uuid } from "uuid";

export interface UploadResult {
  success: boolean;
  fileId?: string;
  publicUrl?: string;
  error?: string;
}

function getFileType(mimeType: string): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}

export async function uploadMediaFile(
  agencyId: string,
  file: File,
  folderId?: string
): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Generate unique filename
  const ext = file.name.split(".").pop() || "";
  const uniqueName = `${uuid()}.${ext}`;
  const storagePath = `${agencyId}/${uniqueName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("media")
    .upload(storagePath, file, {
      cacheControl: "31536000", // 1 year cache
      upsert: false,
    });

  if (uploadError) {
    console.error("[UploadService] Upload error:", uploadError);
    return { success: false, error: "Failed to upload file" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);

  // Get image dimensions if applicable
  let width: number | null = null;
  let height: number | null = null;

  if (file.type.startsWith("image/")) {
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      width = dimensions.width;
      height = dimensions.height;
    }
  }

  // Create database record
  const { data: fileRecord, error: dbError } = await supabase
    .from("assets")
    .insert({
      agency_id: agencyId,
      folder_id: folderId || null,
      uploaded_by: user.id,
      file_name: uniqueName,
      original_name: file.name,
      file_type: getFileType(file.type),
      mime_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      width,
      height,
    })
    .select()
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
    publicUrl: urlData.publicUrl,
  };
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      // Server-side: can't get dimensions easily
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadFromUrl(
  agencyId: string,
  url: string,
  folderId?: string
): Promise<UploadResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: "Failed to fetch image from URL" };
    }

    const blob = await response.blob();
    const fileName = url.split("/").pop() || "imported-image";
    const file = new File([blob], fileName, { type: blob.type });

    return uploadMediaFile(agencyId, file, folderId);
  } catch (error) {
    return { success: false, error: "Failed to import from URL" };
  }
}
```

---

### Task 81.4: Media Upload Zone Component

**File: `src/components/media/media-upload-zone.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, X, Image, FileText, Video, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/media/upload-service";
import { toast } from "sonner";

interface MediaUploadZoneProps {
  agencyId: string;
  folderId?: string;
  onUploadComplete?: () => void;
  className?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

const ACCEPTED_TYPES = {
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  "video/*": [".mp4", ".webm", ".mov"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function MediaUploadZone({
  agencyId,
  folderId,
  onUploadComplete,
  className,
}: MediaUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Initialize upload state
      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const uploadFile = newFiles[i];

        try {
          const result = await uploadMediaFile(agencyId, file, folderId);

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    progress: 100,
                    status: result.success ? "complete" : "error",
                    error: result.error,
                  }
                : f
            )
          );

          if (!result.success) {
            toast.error(`Failed to upload ${file.name}: ${result.error}`);
          }
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error", error: "Upload failed" }
                : f
            )
          );
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Clear completed files after a delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.status === "uploading"));
        onUploadComplete?.();
      }, 2000);
    },
    [agencyId, folderId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return <Image className="h-4 w-4" />;
    }
    if (["mp4", "webm", "mov"].includes(ext || "")) {
      return <Video className="h-4 w-4" />;
    }
    if (["pdf", "doc", "docx"].includes(ext || "")) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium">
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse • Max 50MB per file
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Supports: Images, Videos, PDFs, Documents
        </p>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              {file.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : file.status === "complete" ? (
                getFileIcon(file.name)
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                {file.status === "uploading" && (
                  <div className="w-full h-1 bg-muted-foreground/20 rounded mt-1">
                    <div
                      className="h-full bg-primary rounded transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.error && (
                  <p className="text-xs text-destructive mt-1">{file.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 81.5: Media Grid Component

**File: `src/components/media/media-grid.tsx`**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Image as ImageIcon, Video, FileText, File } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/lib/media/media-service";

interface MediaGridProps {
  files: MediaFile[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onItemClick: (file: MediaFile) => void;
  onDelete?: (id: string) => void;
  onMove?: (id: string) => void;
}

export function MediaGrid({
  files,
  selectedIds,
  onSelect,
  onSelectAll,
  onItemClick,
  onDelete,
  onMove,
}: MediaGridProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-8 w-8" />;
      case "video":
        return <Video className="h-8 w-8" />;
      case "document":
        return <FileText className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  if (files.length === 0) {
    return (
      <div className="py-16 text-center">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No files found</h3>
        <p className="text-sm text-muted-foreground">
          Upload files or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {files.map((file) => {
        const isSelected = selectedIds.includes(file.id);

        return (
          <div
            key={file.id}
            className={cn(
              "group relative bg-muted rounded-lg overflow-hidden cursor-pointer border-2 transition-colors",
              isSelected ? "border-primary" : "border-transparent hover:border-primary/50"
            )}
            onClick={() => onItemClick(file)}
          >
            {/* Checkbox */}
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(file.id, !!checked)}
                className="bg-white/90"
              />
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="secondary" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onMove && (
                    <DropdownMenuItem onClick={() => onMove(file.id)}>
                      Move to folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(file.publicUrl);
                    }}
                  >
                    Copy URL
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(file.id)}
                      className="text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Thumbnail */}
            <div className="aspect-square relative bg-background">
              {file.fileType === "image" ? (
                <Image
                  src={file.thumbnailUrl || file.publicUrl}
                  alt={file.altText || file.originalName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {getFileIcon(file.fileType)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-sm font-medium truncate">{file.originalName}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize)}
                </span>
                {file.width && file.height && (
                  <Badge variant="secondary" className="text-xs">
                    {file.width}×{file.height}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

### Task 81.6: Media Details Panel

**File: `src/components/media/media-details-panel.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Save, Loader2, Copy, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateMediaFile, deleteMediaFile, type MediaFile } from "@/lib/media/media-service";
import { toast } from "sonner";

interface MediaDetailsPanelProps {
  file: MediaFile;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export function MediaDetailsPanel({
  file,
  onClose,
  onUpdate,
  onDelete,
}: MediaDetailsPanelProps) {
  const [altText, setAltText] = useState(file.altText || "");
  const [caption, setCaption] = useState(file.caption || "");
  const [tags, setTags] = useState(file.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset form when file changes
  useEffect(() => {
    setAltText(file.altText || "");
    setCaption(file.caption || "");
    setTags(file.tags.join(", "));
  }, [file.id]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateMediaFile(file.id, {
      altText,
      caption,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setSaving(false);

    if (result.success) {
      toast.success("File updated");
      onUpdate();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    setDeleting(true);
    const result = await deleteMediaFile(file.id);
    setDeleting(false);

    if (result.success) {
      toast.success("File deleted");
      onDelete();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(file.publicUrl);
    toast.success("URL copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">File Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Preview */}
        {file.fileType === "image" && (
          <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
            <Image
              src={file.publicUrl}
              alt={file.altText || file.originalName}
              fill
              className="object-contain"
            />
          </div>
        )}

        {/* File Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">File Information</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="truncate max-w-[180px]">{file.originalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{file.mimeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span>{formatFileSize(file.fileSize)}</span>
            </div>
            {file.width && file.height && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensions</span>
                <span>
                  {file.width} × {file.height}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uploaded</span>
              <span>{formatDate(file.createdAt)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* URL */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">URL</h4>
          <div className="flex gap-2">
            <Input
              value={file.publicUrl}
              readOnly
              className="text-xs"
            />
            <Button variant="outline" size="icon" onClick={copyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(file.publicUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this image..."
            />
            <p className="text-xs text-muted-foreground">
              Important for SEO and accessibility
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="photo, banner, hero..."
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags for easier searching
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full text-destructive hover:text-destructive"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete File
        </Button>
      </div>
    </div>
  );
}
```

---

### Task 81.7: Media Library Page

**File: `src/app/(dashboard)/media/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderPlus,
  Upload,
  Search,
  Grid3X3,
  List,
  Filter,
  Loader2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaUploadZone } from "@/components/media/media-upload-zone";
import { MediaDetailsPanel } from "@/components/media/media-details-panel";
import {
  getMediaFiles,
  getMediaFolders,
  createFolder,
  deleteMediaFile,
  type MediaFile,
  type MediaFolder,
} from "@/lib/media/media-service";
import { getUserAgencyAndRole } from "@/lib/media/media-service";
import { toast } from "sonner";

interface UserContext {
  agencyId: string;
  role: string | null;
  canDelete: boolean;
  canCreateFolders: boolean;
}

export default function MediaLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User context
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // State
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Upload sheet
  const [uploadOpen, setUploadOpen] = useState(false);

  // Load user context on mount
  useEffect(() => {
    async function loadUserContext() {
      const context = await getUserAgencyAndRole();
      if (!context || !context.agencyId) {
        router.push("/dashboard");
        return;
      }
      setUserContext({
        agencyId: context.agencyId,
        role: context.role,
        canDelete: context.role !== "agency_member",
        canCreateFolders: context.role !== "agency_member",
      });
    }
    loadUserContext();
  }, [router]);

  useEffect(() => {
    if (userContext?.agencyId) {
      loadData();
    }
  }, [currentFolderId, fileType, search, userContext?.agencyId]);

  const loadData = async () => {
    if (!userContext?.agencyId) return;
    
    setLoading(true);
    
    const [filesResult, foldersData] = await Promise.all([
      getMediaFiles(userContext.agencyId, {
        folderId: currentFolderId,
        fileType: fileType === "all" ? undefined : fileType,
        search: search || undefined,
      }),
      getMediaFolders(userContext.agencyId),
    ]);

    setFiles(filesResult.files);
    setTotal(filesResult.total);
    setFolders(foldersData);
    setLoading(false);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? files.map((f) => f.id) : []);
  };

  const handleItemClick = (file: MediaFile) => {
    setDetailFile(file);
  };

  const handleDelete = async (id: string) => {
    if (!userContext?.canDelete) {
      toast.error("You don't have permission to delete files");
      return;
    }
    const result = await deleteMediaFile(id);
    if (result.success) {
      toast.success("File deleted");
      loadData();
      if (detailFile?.id === id) {
        setDetailFile(null);
      }
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    if (!userContext?.canDelete) {
      toast.error("You don't have permission to delete files");
      return;
    }
    if (!confirm(`Delete ${selectedIds.length} files?`)) return;

    for (const id of selectedIds) {
      await deleteMediaFile(id);
    }
    toast.success(`Deleted ${selectedIds.length} files`);
    setSelectedIds([]);
    loadData();
  };

  const handleCreateFolder = async () => {
    if (!userContext?.canCreateFolders) {
      toast.error("You don't have permission to create folders");
      return;
    }
    if (!userContext?.agencyId) return;
    
    const name = prompt("Folder name:");
    if (!name) return;

    const result = await createFolder(userContext.agencyId, name, currentFolderId || undefined);
    if (result.success) {
      toast.success("Folder created");
      loadData();
    } else {
      toast.error(result.error || "Failed to create folder");
    }
  };

  // Loading state for user context
  if (!userContext) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Media Library</h1>
              <p className="text-muted-foreground">
                {total} files {currentFolderId && "in this folder"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCreateFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Upload Files</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <MediaUploadZone
                      agencyId={agencyId}
                      folderId={currentFolderId || undefined}
                      onUploadComplete={() => {
                        loadData();
                        setUploadOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files..."
                className="pl-9"
              />
            </div>

            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Folder Breadcrumbs */}
        {currentFolderId && (
          <div className="px-6 py-2 border-b flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolderId(null)}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              All Files
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">
              {folders.find((f) => f.id === currentFolderId)?.name || "Folder"}
            </span>
          </div>
        )}

        {/* Folders */}
        {!currentFolderId && folders.length > 0 && (
          <div className="px-6 py-4 border-b">
            <h3 className="text-sm font-medium mb-3">Folders</h3>
            <div className="flex flex-wrap gap-2">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({folder.fileCount})
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Files Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MediaGrid
              files={files}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onItemClick={handleItemClick}
              onDelete={userContext.canDelete ? handleDelete : undefined}
            />
          )}
        </div>
      </div>

      {/* Details Panel */}
      {detailFile && (
        <MediaDetailsPanel
          file={detailFile}
          onClose={() => setDetailFile(null)}
          onUpdate={loadData}
          onDelete={userContext.canDelete ? () => {
            setDetailFile(null);
            loadData();
          } : undefined}
          canDelete={userContext.canDelete}
        />
      )}
    </div>
  );
}
```

---

### Task 81.8: Export Helper Function for User Context

Add this exported function to `src/lib/media/media-service.ts`:

```typescript
/**
 * Get current user's agency and role for UI permission checks
 * Used by MediaLibraryPage to determine what actions user can take
 */
export async function getUserAgencyAndRole(): Promise<{
  userId: string;
  agencyId: string | null;
  role: string | null;
  isSuperAdmin: boolean;
} | null> {
  return getUserAgencyContext();
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Upload service handles various file types
- [ ] Media service CRUD operations work
- [ ] File size formatting is correct
- [ ] Permission checks work correctly for each role

### Integration Tests
- [ ] Files upload to Supabase Storage
- [ ] Database records created correctly
- [ ] Folders organize files properly
- [ ] Search and filters work
- [ ] RLS policies enforce access control

### E2E Tests
- [ ] Drag-and-drop upload works
- [ ] Files display in grid
- [ ] Details panel shows/edits metadata
- [ ] Bulk delete works (admin/owner only)
- [ ] Folder navigation works
- [ ] Agency members can view but not delete
- [ ] Super admin can access all agencies

### Role-Based Tests
- [ ] **Super Admin**: Can view/manage ALL agencies' media
- [ ] **Agency Owner**: Full access to own agency media
- [ ] **Agency Admin**: Full access to own agency media
- [ ] **Agency Member**: Can view/upload, cannot delete/create folders
- [ ] **Client (Portal)**: No direct access (future: read-only via site)

---

## ✅ Completion Checklist

- [ ] Database schema for media (with RLS policies)
- [ ] Media service (CRUD with permission checks)
- [ ] Upload service
- [ ] Media upload zone component
- [ ] Media grid component (role-aware)
- [ ] Media details panel (role-aware delete)
- [ ] Media library page (dynamic agency context)
- [ ] Folder management (admin/owner only)
- [ ] Search and filtering
- [ ] react-dropzone package installed
- [ ] Permission system integrated

---

**Next Phase**: Phase 82 - Form Submissions System


