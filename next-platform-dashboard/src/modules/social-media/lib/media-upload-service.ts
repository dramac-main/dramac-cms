/**
 * Media Upload Service
 * 
 * PHASE SM-05: Handles file upload to Supabase Storage,
 * platform validation, and metadata extraction.
 */

import { createClient } from '@/lib/supabase/server'
import type { PostMedia, MediaLibraryItem, SocialPlatform, MediaFileType } from '../types'

const BUCKET_NAME = 'social-media'

// Platform-specific media constraints
const PLATFORM_CONSTRAINTS: Record<SocialPlatform, {
  maxImageSize: number
  maxVideoSize: number
  maxImageDimension: number
  allowedImageFormats: string[]
  allowedVideoFormats: string[]
  aspectRatios: { min: number; max: number }[]
}> = {
  facebook: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 10 * 1024 * 1024 * 1024,
    maxImageDimension: 8192,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4', 'video/mov', 'video/avi'],
    aspectRatios: [{ min: 0.5625, max: 1.91 }],
  },
  instagram: {
    maxImageSize: 8 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxImageDimension: 1440,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [
      { min: 0.5625, max: 0.5625 },
      { min: 0.8, max: 1.0 },
      { min: 1.91, max: 1.91 },
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
    aspectRatios: [{ min: 0.5625, max: 0.5625 }],
  },
  youtube: {
    maxImageSize: 2 * 1024 * 1024,
    maxVideoSize: 256 * 1024 * 1024 * 1024,
    maxImageDimension: 2560,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    aspectRatios: [{ min: 1.33, max: 1.78 }],
  },
  pinterest: {
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 2 * 1024 * 1024 * 1024,
    maxImageDimension: 10000,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [{ min: 0.5, max: 1.5 }],
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
    maxImageSize: 1 * 1024 * 1024,
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

function getFileType(mimeType: string): MediaFileType {
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'image'
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
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { media: null, libraryItem: null, error: 'Not authenticated' }

  const { siteId, tenantId, file, folderId, altText, tags } = params

  // Validate file type
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const isAudio = file.type.startsWith('audio/')
  if (!isImage && !isVideo && !isAudio) {
    return { media: null, libraryItem: null, error: 'Unsupported file type' }
  }

  // Generate storage path
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const fileId = crypto.randomUUID()
  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${siteId}/${year}/${month}/${fileId}.${ext}`

  // Decode base64 to buffer
  const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64
  const buffer = Buffer.from(base64Data, 'base64')

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { media: null, libraryItem: null, error: `Upload failed: ${uploadError.message}` }
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
  const publicUrl = urlData.publicUrl

  // Validate against all platforms
  const platformStatus: Record<string, { valid: boolean; error?: string }> = {}
  const allPlatforms: SocialPlatform[] = [
    'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok',
    'youtube', 'pinterest', 'threads', 'bluesky', 'mastodon',
  ]
  for (const platform of allPlatforms) {
    const result = validateSinglePlatform({ type: file.type, size: file.size }, platform)
    platformStatus[platform] = result
  }

  // Determine file type
  const fileType = getFileType(file.type)
  const mediaType = fileType === 'gif' ? 'gif' as const : 
                    fileType === 'video' ? 'video' as const : 'image' as const

  // Insert into social_media_library
  const libraryRecord = {
    id: fileId,
    site_id: siteId,
    tenant_id: tenantId,
    file_name: file.name,
    file_type: fileType,
    file_size: file.size,
    mime_type: file.type,
    original_url: publicUrl,
    thumbnail_url: isImage ? publicUrl : null,
    optimized_urls: {},
    width: null,
    height: null,
    duration_seconds: null,
    aspect_ratio: null,
    folder_id: folderId || null,
    tags: tags || [],
    alt_text: altText || null,
    caption: null,
    platform_status: platformStatus,
    ai_tags: [],
    ai_description: null,
    faces_detected: null,
    dominant_colors: [],
    used_in_posts: [],
    usage_count: 0,
    source: 'upload',
    source_url: null,
    uploaded_by: user.id,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }

  const { error: dbError } = await (supabase as any)
    .from('social_media_library')
    .upsert(libraryRecord, { onConflict: 'id' })

  if (dbError) {
    console.error('Failed to save media record:', dbError)
    // File was uploaded to storage, but DB record failed - still return the URL
  }

  // Build PostMedia for use in composer
  const postMedia: PostMedia = {
    id: fileId,
    type: mediaType,
    url: publicUrl,
    thumbnailUrl: isImage ? publicUrl : undefined,
    altText: altText || undefined,
  }

  // Build MediaLibraryItem
  const libraryItem: MediaLibraryItem = {
    id: fileId,
    siteId,
    tenantId,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    mimeType: file.type,
    originalUrl: publicUrl,
    thumbnailUrl: isImage ? publicUrl : null,
    optimizedUrls: {},
    width: null,
    height: null,
    durationSeconds: null,
    aspectRatio: null,
    folderId: folderId || null,
    tags: tags || [],
    altText: altText || null,
    caption: null,
    platformStatus: platformStatus as any,
    aiTags: [],
    aiDescription: null,
    facesDetected: null,
    dominantColors: [],
    usedInPosts: [],
    usageCount: 0,
    source: 'upload',
    sourceUrl: null,
    uploadedBy: user.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  return { media: postMedia, libraryItem }
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
  'use server'
  const results: PostMedia[] = []
  const errors: string[] = []

  for (const file of params.files) {
    const result = await uploadSocialMedia({
      siteId: params.siteId,
      tenantId: params.tenantId,
      file,
      folderId: params.folderId,
    })

    if (result.error) {
      errors.push(`${file.name}: ${result.error}`)
    } else if (result.media) {
      results.push(result.media)
    }
  }

  return { media: results, errors }
}

/**
 * Validate a file against a single platform's constraints
 */
function validateSinglePlatform(
  file: { type: string; size: number; width?: number; height?: number },
  platform: SocialPlatform
): { valid: boolean; error?: string } {
  const constraints = PLATFORM_CONSTRAINTS[platform]
  if (!constraints) return { valid: true }

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if (isImage) {
    if (file.size > constraints.maxImageSize) {
      return { valid: false, error: `Image too large (max ${Math.round(constraints.maxImageSize / 1024 / 1024)}MB)` }
    }
    if (!constraints.allowedImageFormats.includes(file.type)) {
      return { valid: false, error: `Image format ${file.type} not supported` }
    }
    if (file.width && file.width > constraints.maxImageDimension) {
      return { valid: false, error: `Image width exceeds ${constraints.maxImageDimension}px` }
    }
    if (file.height && file.height > constraints.maxImageDimension) {
      return { valid: false, error: `Image height exceeds ${constraints.maxImageDimension}px` }
    }
  }

  if (isVideo) {
    if (file.size > constraints.maxVideoSize) {
      return { valid: false, error: `Video too large (max ${Math.round(constraints.maxVideoSize / 1024 / 1024)}MB)` }
    }
    if (!constraints.allowedVideoFormats.includes(file.type)) {
      return { valid: false, error: `Video format ${file.type} not supported` }
    }
  }

  return { valid: true }
}

/**
 * Validate a file against platform constraints (public)
 */
export function validateMediaForPlatforms(
  file: { type: string; size: number; width?: number; height?: number },
  platforms: SocialPlatform[]
): Record<SocialPlatform, { valid: boolean; errors: string[] }> {
  const results = {} as Record<SocialPlatform, { valid: boolean; errors: string[] }>

  for (const platform of platforms) {
    const result = validateSinglePlatform(file, platform)
    results[platform] = {
      valid: result.valid,
      errors: result.error ? [result.error] : [],
    }
  }

  return results
}

/**
 * Delete a media file from storage and database
 */
export async function deleteSocialMedia(
  mediaId: string,
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()

  // Fetch media record
  const { data: record, error: fetchError } = await (supabase as any)
    .from('social_media_library')
    .select('original_url')
    .eq('id', mediaId)
    .eq('site_id', siteId)
    .single()

  if (fetchError || !record) {
    return { success: false, error: 'Media not found' }
  }

  // Extract storage path from URL
  const url = record.original_url as string
  const bucketSegment = `/storage/v1/object/public/${BUCKET_NAME}/`
  const pathIndex = url.indexOf(bucketSegment)
  if (pathIndex !== -1) {
    const storagePath = url.slice(pathIndex + bucketSegment.length)
    await supabase.storage.from(BUCKET_NAME).remove([storagePath])
  }

  // Delete from DB
  const { error: deleteError } = await (supabase as any)
    .from('social_media_library')
    .delete()
    .eq('id', mediaId)
    .eq('site_id', siteId)

  if (deleteError) {
    return { success: false, error: `DB delete failed: ${deleteError.message}` }
  }

  return { success: true }
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
  'use server'
  const supabase = await createClient()
  const page = options?.page || 1
  const limit = options?.limit || 30
  const offset = (page - 1) * limit
  const sort = options?.sort || 'created_at'
  const order = options?.order || 'desc'

  let query = (supabase as any)
    .from('social_media_library')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1)

  if (options?.folderId !== undefined) {
    if (options.folderId === null) {
      query = query.is('folder_id', null)
    } else {
      query = query.eq('folder_id', options.folderId)
    }
  }

  if (options?.fileType) {
    query = query.eq('file_type', options.fileType)
  }

  if (options?.search) {
    query = query.or(`file_name.ilike.%${options.search}%,alt_text.ilike.%${options.search}%`)
  }

  if (options?.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags)
  }

  const { data, error, count } = await query

  if (error) {
    return { items: [], total: 0, error: error.message }
  }

  // Map snake_case DB records to camelCase
  const items: MediaLibraryItem[] = (data || []).map((r: any) => ({
    id: r.id,
    siteId: r.site_id,
    tenantId: r.tenant_id,
    fileName: r.file_name,
    fileType: r.file_type,
    fileSize: r.file_size,
    mimeType: r.mime_type,
    originalUrl: r.original_url,
    thumbnailUrl: r.thumbnail_url,
    optimizedUrls: r.optimized_urls || {},
    width: r.width,
    height: r.height,
    durationSeconds: r.duration_seconds,
    aspectRatio: r.aspect_ratio,
    folderId: r.folder_id,
    tags: r.tags || [],
    altText: r.alt_text,
    caption: r.caption,
    platformStatus: r.platform_status || {},
    aiTags: r.ai_tags || [],
    aiDescription: r.ai_description,
    facesDetected: r.faces_detected,
    dominantColors: r.dominant_colors || [],
    usedInPosts: r.used_in_posts || [],
    usageCount: r.usage_count || 0,
    source: r.source || 'upload',
    sourceUrl: r.source_url,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  return { items, total: count || 0 }
}
