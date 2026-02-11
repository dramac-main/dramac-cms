/**
 * WhatsApp Cloud API Service
 *
 * PHASE LC-05: Server-side only — NEVER import on client.
 * Handles all interactions with the Meta WhatsApp Business Cloud API.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { WhatsAppTemplateMessage } from '../types'

// =============================================================================
// CONFIG
// =============================================================================

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'

export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  )
}

function getGlobalCredentials() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  }
}

// =============================================================================
// PER-SITE CREDENTIALS
// =============================================================================

export async function getPerSiteCredentials(siteId: string): Promise<{
  phoneNumberId: string
  accessToken: string
  businessAccountId: string
}> {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('mod_chat_widget_settings')
      .select('whatsapp_phone_number_id, whatsapp_business_account_id')
      .eq('site_id', siteId)
      .single()

    if (data?.whatsapp_phone_number_id) {
      return {
        phoneNumberId: data.whatsapp_phone_number_id,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        businessAccountId: data.whatsapp_business_account_id || '',
      }
    }
  } catch {
    // Fall through to global
  }

  const global = getGlobalCredentials()
  return {
    phoneNumberId: global.phoneNumberId,
    accessToken: global.accessToken,
    businessAccountId: global.businessAccountId,
  }
}

// =============================================================================
// SEND MESSAGES
// =============================================================================

async function sendWhatsAppRequest(
  phoneNumberId: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<{ messageId: string | null; error: string | null }> {
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const errMsg = errData?.error?.message || `WhatsApp API error: ${res.status}`
      console.error('[WhatsApp] Send error:', errMsg)
      return { messageId: null, error: errMsg }
    }

    const data = await res.json()
    return {
      messageId: data?.messages?.[0]?.id || null,
      error: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown WhatsApp API error'
    console.error('[WhatsApp] Send error:', msg)
    return { messageId: null, error: msg }
  }
}

export async function sendTextMessage(
  to: string,
  text: string,
  phoneNumberId?: string,
  accessToken?: string
): Promise<{ messageId: string | null; error: string | null }> {
  const creds = getGlobalCredentials()
  return sendWhatsAppRequest(
    phoneNumberId || creds.phoneNumberId,
    accessToken || creds.accessToken,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }
  )
}

export async function sendImageMessage(
  to: string,
  imageUrl: string,
  caption?: string,
  phoneNumberId?: string,
  accessToken?: string
): Promise<{ messageId: string | null; error: string | null }> {
  const creds = getGlobalCredentials()
  return sendWhatsAppRequest(
    phoneNumberId || creds.phoneNumberId,
    accessToken || creds.accessToken,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, ...(caption ? { caption } : {}) },
    }
  )
}

export async function sendDocumentMessage(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string,
  phoneNumberId?: string,
  accessToken?: string
): Promise<{ messageId: string | null; error: string | null }> {
  const creds = getGlobalCredentials()
  return sendWhatsAppRequest(
    phoneNumberId || creds.phoneNumberId,
    accessToken || creds.accessToken,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        ...(caption ? { caption } : {}),
      },
    }
  )
}

export async function sendTemplateMessage(
  to: string,
  template: WhatsAppTemplateMessage,
  phoneNumberId?: string,
  accessToken?: string
): Promise<{ messageId: string | null; error: string | null }> {
  const creds = getGlobalCredentials()
  return sendWhatsAppRequest(
    phoneNumberId || creds.phoneNumberId,
    accessToken || creds.accessToken,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: template.language,
        ...(template.components ? { components: template.components } : {}),
      },
    }
  )
}

export async function sendReaction(
  to: string,
  messageId: string,
  emoji: string,
  phoneNumberId?: string,
  accessToken?: string
): Promise<{ messageId: string | null; error: string | null }> {
  const creds = getGlobalCredentials()
  return sendWhatsAppRequest(
    phoneNumberId || creds.phoneNumberId,
    accessToken || creds.accessToken,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'reaction',
      reaction: { message_id: messageId, emoji },
    }
  )
}

// =============================================================================
// MARK AS READ
// =============================================================================

export async function markAsRead(
  messageId: string,
  phoneNumberId?: string,
  accessToken?: string
): Promise<void> {
  const creds = getGlobalCredentials()
  try {
    await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId || creds.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || creds.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    )
  } catch {
    // Non-critical, log and continue
    console.error('[WhatsApp] Failed to mark as read:', messageId)
  }
}

// =============================================================================
// MEDIA
// =============================================================================

export async function getMediaUrl(
  mediaId: string,
  accessToken?: string
): Promise<{ url: string | null; error: string | null }> {
  const token = accessToken || getGlobalCredentials().accessToken
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return { url: null, error: `Failed to get media URL: ${res.status}` }
    }
    const data = await res.json()
    return { url: data.url || null, error: null }
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Failed to get media URL',
    }
  }
}

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// =============================================================================

export async function verifyWebhookSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const appSecret = getGlobalCredentials().appSecret
  if (!appSecret) return false

  try {
    // Use Web Crypto for HMAC SHA-256 (Edge runtime compatible)
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const computed = `sha256=${Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`

    return computed === signature
  } catch {
    console.error('[WhatsApp] Signature verification failed')
    return false
  }
}

// =============================================================================
// TEMPLATE FETCHING
// =============================================================================

export async function getMessageTemplates(
  businessAccountId?: string,
  accessToken?: string
): Promise<{
  templates: Array<{
    name: string
    language: string
    status: string
    components: unknown[]
  }>
  error: string | null
}> {
  const creds = getGlobalCredentials()
  const baId = businessAccountId || creds.businessAccountId
  const token = accessToken || creds.accessToken

  if (!baId || !token) {
    return { templates: [], error: 'WhatsApp Business Account not configured' }
  }

  try {
    const res = await fetch(
      `${WHATSAPP_API_URL}/${baId}/message_templates?limit=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (!res.ok) {
      return { templates: [], error: `Failed to fetch templates: ${res.status}` }
    }
    const data = await res.json()
    const templates = (data.data || []).map(
      (t: Record<string, unknown>) => ({
        name: t.name as string,
        language: (t.language as string) || 'en_US',
        status: t.status as string,
        components: (t.components as unknown[]) || [],
      })
    )
    return { templates, error: null }
  } catch (err) {
    return {
      templates: [],
      error: err instanceof Error ? err.message : 'Failed to fetch templates',
    }
  }
}
