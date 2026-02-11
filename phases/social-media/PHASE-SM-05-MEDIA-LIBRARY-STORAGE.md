# PHASE SM-05: Media Library & Storage

**Phase**: SM-05  
**Name**: Media Library & Supabase Storage Integration  
**Independence**: Fully independent — no other SM phase required  
**Connection Points**: Provides real media URLs used by SM-02 (Publishing) and the post composer  
**Estimated Files**: ~10 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
memory-bank/techContext.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/types/index.ts (MediaLibraryItem, MediaFolder, PostMedia types)
src/modules/social-media/components/ui/composer-media-uploader.tsx
src/modules/social-media/components/PostComposerEnhanced.tsx
src/modules/social-media/components/PostComposer.tsx
src/components/media/media-upload-zone.tsx (platform media library — reference)
migrations/em-54-social-media-flat-tables.sql (social_media_library table)
```

---

## Context

The post composer has a media upload UI that creates blob/object URLs with a comment "In a real app, upload to storage and get URLs". The `social_media_library` table exists but has no data and no upload service. This phase builds real Supabase Storage upload, media management, and the missing Media Library page.

### Current State
- `PostComposerEnhanced` creates `URL.createObjectURL(file)` — blob URLs that don't persist
- `PostComposer` same blob URL pattern
- `composer-media-uploader.tsx` UI component handles drag & drop, file validation
- `social_media_library` table exists with full schema
- No Supabase Storage bucket configured for social media
- No media management page exists (listed in manifest nav but no route)

### Target State
- Media uploads go to Supabase Storage bucket `social-media`
- Thumbnails auto-generated for images and videos
- Platform compatibility validation (dimensions, file size, aspect ratio)
- Media Library page with folder management, search, tagging
- Composer uses real uploaded URLs instead of blob URLs
- AI-powered auto-tagging and alt text generation (basic)
- Media reuse across posts

---

## Task 1: Create Supabase Storage Bucket

### Create migration `migrations/sm-05-media-storage.sql`

```sql
-- ============================================================================
-- PHASE SM-05: Social Media Storage Bucket
-- Creates the Supabase Storage bucket for social media assets
-- ============================================================================

-- Create storage bucket (run via Supabase Dashboard or API)
-- Note: Supabase storage buckets are typically created via the Dashboard
-- or the management API, not via SQL migrations. This SQL creates
-- the necessary policies assuming the bucket exists.

-- Storage policies for the 'social-media' bucket
-- (Create the bucket named 'social-media' in Supabase Dashboard first)

-- Allow authenticated users to upload
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- Upload policy: authenticated users can upload to their site's folder
CREATE POLICY "Social media upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'social-media' AND
    auth.role() = 'authenticated'
  );

-- Read policy: anyone can read (public bucket for serving to platforms)
CREATE POLICY "Social media public read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'social-media'
  );

-- Delete policy: authenticated users can delete their uploads
CREATE POLICY "Social media delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'social-media' AND
    auth.role() = 'authenticated'
  );

-- Update policy: authenticated users can update their uploads
CREATE POLICY "Social media update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'social-media' AND
    auth.role() = 'authenticated'
  );

-- Add media_folders table if not exists
CREATE TABLE IF NOT EXISTS public.social_media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.social_media_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1',
  item_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_media_folders_policy ON public.social_media_folders
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );
```

---

## Task 2: Create Media Upload Service

### Create `src/modules/social-media/lib/media-upload-service.ts`

```typescript
'use server'

/**
 * Media Upload Service
 * 
 * PHASE SM-05: Handles file upload to Supabase Storage,
 * thumbnail generation, platform validation, and metadata extraction.
 */

import { createClient } from '@/lib/supabase/server'
import type { PostMedia, MediaLibraryItem, SocialPlatform, MediaFileType } from '../types'

const BUCKET_NAME = 'social-media'

// Platform-specific media constraints
const PLATFORM_CONSTRAINTS: Record<SocialPlatform, {
  maxImageSize: number // bytes
  maxVideoSize: number // bytes
  maxImageDimension: number // pixels
  allowedImageFormats: string[]
  allowedVideoFormats: string[]
  aspectRatios: { min: number; max: number }[]
}> = {
  facebook: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxImageDimension: 8192,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4', 'video/mov', 'video/avi'],
    aspectRatios: [{ min: 0.5625, max: 1.91 }], // 9:16 to ~2:1
  },
  instagram: {
    maxImageSize: 8 * 1024 * 1024, // 8MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB (Reels)
    maxImageDimension: 1440,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [
      { min: 0.5625, max: 0.5625 }, // 9:16 (Stories/Reels)
      { min: 0.8, max: 1.0 }, // 4:5 to 1:1 (Feed)
      { min: 1.91, max: 1.91 }, // 1.91:1 (Landscape)
    ],
  },
  twitter: {
    maxImageSize: 5 * 1024 * 1024,
    maxVideoSize: 512 * 1024 * 1024,
    maxImageDimension: 4096,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4'],
    aspectRatios: [{ min: 0.5, max: 3 }],
  },
  // ... Define for all 10 platforms
  linkedin: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 5 * 1024 * 1024 * 1024,
    maxImageDimension: 4096,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif'],
    allowedVideoFormats: ['video/mp4'],
    aspectRatios: [{ min: 0.5625, max: 2.4 }],
  },
  tiktok: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 4 * 1024 * 1024 * 1024,
    maxImageDimension: 1080,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/webm'],
    aspectRatios: [{ min: 0.5625, max: 0.5625 }], // 9:16 only
  },
  youtube: {
    maxImageSize: 2 * 1024 * 1024,
    maxVideoSize: 256 * 1024 * 1024 * 1024,
    maxImageDimension: 2560,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    aspectRatios: [{ min: 1.33, max: 1.78 }], // 4:3 to 16:9
  },
  pinterest: {
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 2 * 1024 * 1024 * 1024,
    maxImageDimension: 10000,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [{ min: 0.5, max: 1.5 }], // 2:3 recommended
  },
  threads: {
    maxImageSize: 8 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxImageDimension: 1440,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [{ min: 0.5625, max: 1.91 }],
  },
  bluesky: {
    maxImageSize: 1 * 1024 * 1024, // 1MB
    maxVideoSize: 50 * 1024 * 1024,
    maxImageDimension: 2000,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4'],
    aspectRatios: [{ min: 0.5, max: 2.5 }],
  },
  mastodon: {
    maxImageSize: 16 * 1024 * 1024,
    maxVideoSize: 40 * 1024 * 1024,
    maxImageDimension: 4096,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4', 'video/webm', 'video/ogg'],
    aspectRatios: [{ min: 0.3, max: 3.0 }],
  },
}

/**
 * Upload a file to Supabase Storage and create a media library entry
 */
export async function uploadSocialMedia(params: {
  siteId: string
  tenantId: string
  file: { name: string; type: string; size: number; base64: string }
  folderId?: string
  altText?: string
  tags?: string[]
}): Promise<{ media: PostMedia | null; libraryItem: MediaLibraryItem | null; error?: string }> {
  // Implementation:
  // 1. Validate file type and size
  // 2. Generate storage path: social-media/{siteId}/{year}/{month}/{uuid}_{filename}
  // 3. Decode base64 to buffer
  // 4. Upload to Supabase Storage bucket
  // 5. Get public URL
  // 6. Extract dimensions (for images, from buffer or first frame)
  // 7. Validate against platform constraints and record results
  // 8. Insert into social_media_library table with metadata
  // 9. Return PostMedia object (for use in composer) and MediaLibraryItem (for library)
}

/**
 * Upload multiple files at once
 */
export async function uploadMultipleSocialMedia(params: {
  siteId: string
  tenantId: string
  files: Array<{ name: string; type: string; size: number; base64: string }>
  folderId?: string
}): Promise<{ media: PostMedia[]; errors: string[] }> {
  // Upload each file, collect results
}

/**
 * Validate a file against platform constraints
 */
export function validateMediaForPlatforms(
  file: { type: string; size: number; width?: number; height?: number },
  platforms: SocialPlatform[]
): Record<SocialPlatform, { valid: boolean; errors: string[] }> {
  // Check each platform's constraints and return validation results
}

/**
 * Delete a media file from storage and database
 */
export async function deleteSocialMedia(mediaId: string, siteId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Fetch media record
  // 2. Delete from Supabase Storage
  // 3. Delete from social_media_library table
  // 4. Check if used in any posts — warn if so
}

/**
 * Get all media for a site with pagination, filtering, search
 */
export async function getMediaLibrary(siteId: string, options?: {
  folderId?: string | null
  fileType?: MediaFileType
  search?: string
  tags?: string[]
  page?: number
  limit?: number
  sort?: 'created_at' | 'file_name' | 'usage_count' | 'file_size'
  order?: 'asc' | 'desc'
}): Promise<{ items: MediaLibraryItem[]; total: number; error?: string }> {
  // Query social_media_library with filters and pagination
}
```

---

## Task 3: Create Media Library Actions

### Create `src/modules/social-media/actions/media-actions.ts`

```typescript
'use server'

/**
 * Social Media Module - Media Library Actions
 * 
 * PHASE SM-05: Server actions for media library management
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Folder CRUD
export async function createMediaFolder(siteId: string, name: string, parentId?: string): Promise<...>
export async function getMediaFolders(siteId: string): Promise<...>
export async function renameMediaFolder(folderId: string, name: string): Promise<...>
export async function deleteMediaFolder(folderId: string): Promise<...>
export async function moveMediaToFolder(mediaIds: string[], folderId: string | null): Promise<...>

// Media operations
export async function updateMediaMetadata(mediaId: string, updates: { altText?: string; tags?: string[]; caption?: string }): Promise<...>
export async function bulkDeleteMedia(mediaIds: string[], siteId: string): Promise<...>
export async function searchMedia(siteId: string, query: string): Promise<...>
export async function getMediaUsage(mediaId: string): Promise<{ posts: string[]; count: number }>
```

---

## Task 4: Create Media Library Page

### Create `src/app/(dashboard)/dashboard/sites/[siteId]/social/media/page.tsx`

A full media management page with:

**Layout:**
- Left sidebar: folder tree navigation
- Main area: grid/list view of media items
- Top bar: search, filter by type, sort, upload button, view toggle

**Features:**
1. **Upload zone**: Drag & drop area at the top (or dialog trigger)
2. **Grid view**: Thumbnail grid with hover actions (preview, copy URL, delete)
3. **List view**: Table with columns: thumbnail, name, type, size, dimensions, used in, uploaded, tags
4. **Folder management**: Create folder, rename, delete, drag items between folders
5. **Search**: Full-text search by file name, tags, alt text
6. **Filter**: By file type (image, video, gif, audio), by folder
7. **Bulk actions**: Select multiple → delete, move to folder, add tags
8. **Detail panel**: Click item → shows preview, metadata, platform compatibility, usage
9. **Platform validation**: Shows which platforms the media is compatible with (green/red per platform)

**Server component pattern** (consistent with other social pages):
```tsx
import { getMediaLibrary } from '@/modules/social-media/lib/media-upload-service'
import { getMediaFolders } from '@/modules/social-media/actions/media-actions'
// Fetch data server-side, pass to client component
```

---

## Task 5: Create Media Library Component

### Create `src/modules/social-media/components/MediaLibrary.tsx`

Client component for the media library page.

**Implementation Requirements:**
- Grid/list toggle view
- Drag & drop upload zone
- Folder sidebar with tree navigation
- Search bar with debounce
- Filter dropdown (All, Images, Videos, GIFs)
- Sort dropdown (Newest, Oldest, Name, Size, Most Used)
- Bulk selection with checkbox + bulk actions bar
- Click item → detail slide-over panel
- Platform compatibility badges per media item
- Uses shadcn Dialog for upload, AlertDialog for delete confirmation
- Uses `framer-motion` for grid animations
- Uses Lucide icons throughout
- Uses semantic Tailwind tokens

### Create `src/modules/social-media/components/MediaLibraryWrapper.tsx`

Client wrapper with server action callbacks.

---

## Task 6: Update Composer — Real Media Upload

### Modify `src/modules/social-media/components/ui/composer-media-uploader.tsx`

Replace blob URL creation with real Supabase Storage upload:

1. **On file drop/select:**
   - Convert file to base64
   - Call `uploadSocialMedia()` server action
   - Show upload progress (spinner per file)
   - On success: use the returned public URL (not blob URL)
   - On error: show error toast, remove file from list
2. **Validate against selected platforms:**
   - Call `validateMediaForPlatforms()` for selected target accounts' platforms
   - Show warnings for incompatible media (e.g., "Image too large for Bluesky (max 1MB)")
3. **Media library picker:**
   - Add "Choose from Library" button that opens a media library picker dialog
   - Shows existing media from `social_media_library`
   - Select items → inserts their URLs into the composer

### Modify `src/modules/social-media/components/PostComposerEnhanced.tsx`

1. Remove the comment "In a real app, upload to storage and get URLs"
2. Ensure media URLs are real Supabase Storage URLs
3. Add "Media Library" button next to the file upload button

---

## Task 7: Update Layout Navigation

### Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx`

Add the Media nav item if not already present:
```typescript
{ href: `/dashboard/sites/${siteId}/social/media`, label: 'Media', icon: Image },
```

Import `Image` from `lucide-react` (rename to avoid conflict with Next.js Image):
```typescript
import { Image as ImageIcon } from 'lucide-react'
```

Check if the nav items already include Media — if not, add it.

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ Supabase Storage bucket 'social-media' created
□ Migration SQL runs successfully (storage policies, media_folders table)
□ Uploading an image in the composer stores it in Supabase Storage
□ Uploaded image has a real public URL (not blob URL)
□ Media appears in social_media_library table after upload
□ Media Library page renders with grid/list views
□ Folder creation, rename, delete works
□ Moving media between folders works
□ Search by filename works
□ Filter by type (images, videos) works
□ Sort options (newest, name, size) work
□ Bulk select + delete works
□ Detail panel shows metadata, dimensions, platform compatibility
□ Platform compatibility validation shows correct results per platform
□ "Choose from Library" button in composer opens picker
□ Selecting from library inserts correct URL into composer
□ Deleting media from library removes from storage
□ Media nav item visible in social module navigation
□ No blob URLs used anywhere in the publish flow
□ No "In a real app" comments remain
□ Commit: git commit -m "feat(social-media): PHASE-SM-05: Media Library & Storage"
```
