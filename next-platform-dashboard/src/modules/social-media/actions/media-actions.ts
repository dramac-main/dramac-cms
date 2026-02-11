'use server'

/**
 * Social Media Module - Media Library Actions
 * 
 * PHASE SM-05: Server actions for media library management
 * (folders, metadata, bulk operations)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MediaFolder } from '../types'

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
  const { deleteSocialMedia } = await import('../lib/media-upload-service')
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
  const { getMediaLibrary } = await import('../lib/media-upload-service')
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
