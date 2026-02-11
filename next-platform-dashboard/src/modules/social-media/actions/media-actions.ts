'use server'

/**
 * Social Media Module - Media Library Actions
 * 
 * PHASE SM-05: Server actions for media library management
 * (upload, delete, getLibrary, folders, metadata, bulk operations)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PostMedia, MediaLibraryItem, MediaFolder, SocialPlatform, MediaFileType } from '../types'
import { validateSinglePlatform, getFileType } from '../lib/media-upload-service'

const BUCKET_NAME = 'social-media'

// ============================================================================
// MEDIA UPLOAD / DELETE / GET
// ============================================================================

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
 * Delete a media file from storage and database
 */
export async function deleteSocialMedia(
  mediaId: string,
  siteId: string
): Promise<{ success: boolean; error?: string }> {
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

// ============================================================================
// FOLDER CRUD
// ============================================================================

export async function createMediaFolder(
  siteId: string,
  name: string,
  parentId?: string
): Promise<{ folder: MediaFolder | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { folder: null, error: 'Not authenticated' }

  // Get tenant_id from site
  const { data: site } = await supabase
    .from('sites')
    .select('client_id, clients(agency_id)')
    .eq('id', siteId)
    .single()

  const tenantId = (site as any)?.clients?.agency_id || user.id

  const { data, error } = await (supabase as any)
    .from('social_media_folders')
    .insert({
      site_id: siteId,
      tenant_id: tenantId,
      name,
      parent_id: parentId || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { folder: null, error: error.message }
  }

  revalidatePath(`/dashboard/sites/${siteId}/social/media`)

  return {
    folder: {
      id: data.id,
      siteId: data.site_id,
      tenantId: data.tenant_id,
      name: data.name,
      parentId: data.parent_id,
      color: data.color,
      createdBy: data.created_by,
      createdAt: data.created_at,
    },
  }
}

export async function getMediaFolders(
  siteId: string
): Promise<{ folders: MediaFolder[]; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('social_media_folders')
    .select('*')
    .eq('site_id', siteId)
    .order('name', { ascending: true })

  if (error) {
    return { folders: [], error: error.message }
  }

  const folders: MediaFolder[] = (data || []).map((r: any) => ({
    id: r.id,
    siteId: r.site_id,
    tenantId: r.tenant_id,
    name: r.name,
    parentId: r.parent_id,
    color: r.color,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }))

  return { folders }
}

export async function renameMediaFolder(
  folderId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('social_media_folders')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', folderId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteMediaFolder(
  folderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Move all items in this folder to root (null folder_id)
  await (supabase as any)
    .from('social_media_library')
    .update({ folder_id: null })
    .eq('folder_id', folderId)

  const { error } = await (supabase as any)
    .from('social_media_folders')
    .delete()
    .eq('id', folderId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function moveMediaToFolder(
  mediaIds: string[],
  folderId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('social_media_library')
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .in('id', mediaIds)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ============================================================================
// MEDIA OPERATIONS
// ============================================================================

export async function updateMediaMetadata(
  mediaId: string,
  updates: { altText?: string; tags?: string[]; caption?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (updates.altText !== undefined) dbUpdates.alt_text = updates.altText
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags
  if (updates.caption !== undefined) dbUpdates.caption = updates.caption

  const { error } = await (supabase as any)
    .from('social_media_library')
    .update(dbUpdates)
    .eq('id', mediaId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function bulkDeleteMedia(
  mediaIds: string[],
  siteId: string
): Promise<{ deleted: number; errors: string[] }> {
  let deleted = 0
  const errors: string[] = []

  for (const id of mediaIds) {
    const result = await deleteSocialMedia(id, siteId)
    if (result.success) {
      deleted++
    } else {
      errors.push(result.error || `Failed to delete ${id}`)
    }
  }

  revalidatePath(`/dashboard/sites/${siteId}/social/media`)
  return { deleted, errors }
}

export async function searchMedia(
  siteId: string,
  query: string
): Promise<{ items: any[]; error?: string }> {
  return getMediaLibrary(siteId, { search: query })
}

export async function getMediaUsage(
  mediaId: string
): Promise<{ posts: string[]; count: number }> {
  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('social_media_library')
    .select('used_in_posts, usage_count')
    .eq('id', mediaId)
    .single()

  return {
    posts: data?.used_in_posts || [],
    count: data?.usage_count || 0,
  }
}
