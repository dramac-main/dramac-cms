/**
 * WhatsApp Media Handling
 *
 * PHASE LC-05: Download WhatsApp media and upload to Supabase Storage.
 * Server-side only.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { v4 as uuid } from 'uuid'
import { getMediaUrl } from './whatsapp-service'

// =============================================================================
// DOWNLOAD
// =============================================================================

export async function downloadWhatsAppMedia(
  mediaId: string,
  accessToken: string
): Promise<{ buffer: Buffer | null; error: string | null }> {
  try {
    // 1. Get the media URL from WhatsApp
    const { url, error: urlError } = await getMediaUrl(mediaId, accessToken)
    if (urlError || !url) {
      return { buffer: null, error: urlError || 'No media URL returned' }
    }

    // 2. Download the binary data
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      return { buffer: null, error: `Failed to download media: ${res.status}` }
    }

    const arrayBuffer = await res.arrayBuffer()
    return { buffer: Buffer.from(arrayBuffer), error: null }
  } catch (err) {
    return {
      buffer: null,
      error: err instanceof Error ? err.message : 'Failed to download media',
    }
  }
}

// =============================================================================
// UPLOAD TO SUPABASE STORAGE
// =============================================================================

export async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  siteId: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    const supabase = createAdminClient()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `chat/${siteId}/${uuid()}_${sanitizedFilename}`

    const { error: uploadError } = await supabase.storage
      .from('social-media')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      return { publicUrl: null, error: uploadError.message }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('social-media').getPublicUrl(path)

    return { publicUrl, error: null }
  } catch (err) {
    return {
      publicUrl: null,
      error: err instanceof Error ? err.message : 'Failed to upload media',
    }
  }
}

// =============================================================================
// PROCESS WHATSAPP MEDIA MESSAGE
// =============================================================================

export async function processWhatsAppMediaMessage(
  messageType: string,
  mediaPayload: {
    id: string
    mime_type?: string
    filename?: string
    caption?: string
  },
  siteId: string,
  accessToken: string
): Promise<{
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileMimeType: string | null
  caption: string | null
  error: string | null
}> {
  try {
    const { buffer, error: dlError } = await downloadWhatsAppMedia(
      mediaPayload.id,
      accessToken
    )
    if (dlError || !buffer) {
      return {
        fileUrl: null,
        fileName: null,
        fileSize: null,
        fileMimeType: null,
        caption: null,
        error: dlError || 'Failed to download media',
      }
    }

    const mimeType = mediaPayload.mime_type || 'application/octet-stream'
    const extension = mimeType.split('/')[1]?.split(';')[0] || 'bin'
    const filename =
      mediaPayload.filename || `${messageType}_${Date.now()}.${extension}`

    const { publicUrl, error: uploadError } = await uploadToSupabaseStorage(
      buffer,
      filename,
      mimeType,
      siteId
    )

    if (uploadError || !publicUrl) {
      return {
        fileUrl: null,
        fileName: null,
        fileSize: null,
        fileMimeType: null,
        caption: null,
        error: uploadError || 'Failed to upload media',
      }
    }

    return {
      fileUrl: publicUrl,
      fileName: filename,
      fileSize: buffer.length,
      fileMimeType: mimeType,
      caption: mediaPayload.caption || null,
      error: null,
    }
  } catch (err) {
    return {
      fileUrl: null,
      fileName: null,
      fileSize: null,
      fileMimeType: null,
      caption: null,
      error: err instanceof Error ? err.message : 'Failed to process media',
    }
  }
}
