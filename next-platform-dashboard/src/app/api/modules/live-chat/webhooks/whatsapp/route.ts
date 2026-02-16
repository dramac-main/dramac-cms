/**
 * WhatsApp Webhook Route
 *
 * PHASE LC-05: Handles Meta WhatsApp Cloud API webhook callbacks.
 * - GET: Webhook verification challenge
 * - POST: Incoming messages and status updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyWebhookSignature,
  markAsRead,
  getPerSiteCredentials,
} from '@/modules/live-chat/lib/whatsapp-service'
import { processWhatsAppMediaMessage } from '@/modules/live-chat/lib/whatsapp-media'
import type {
  WhatsAppWebhookPayload,
  WhatsAppIncomingMessage,
  WhatsAppMessageStatus,
  MessageContentType,
} from '@/modules/live-chat/types'

// =============================================================================
// GET — Webhook Verification
// =============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge || '', { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// =============================================================================
// POST — Incoming Events
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify signature — ALWAYS require it when app secret is configured.
    // Without this check, an attacker could omit the header to bypass verification.
    const signature = request.headers.get('x-hub-signature-256') || ''
    const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET
    if (appSecret) {
      if (!signature) {
        console.error('[WhatsApp Webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
      }
      const valid = await verifyWebhookSignature(rawBody, signature)
      if (!valid) {
        console.error('[WhatsApp Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    } else {
      console.warn('[WhatsApp Webhook] No app secret configured — signature verification skipped')
    }

    const payload: WhatsAppWebhookPayload = JSON.parse(rawBody)

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    // Process asynchronously but respond fast
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue

        const { metadata, messages, statuses, contacts } = change.value

        if (messages) {
          for (const message of messages) {
            await processIncomingMessage(
              message,
              metadata,
              contacts || []
            )
          }
        }

        if (statuses) {
          for (const status of statuses) {
            await processMessageStatus(status)
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('[WhatsApp Webhook] Error:', err)
    // Always return 200 to prevent retries
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}

// =============================================================================
// PROCESS INCOMING MESSAGE
// =============================================================================

async function processIncomingMessage(
  message: WhatsAppIncomingMessage,
  metadata: { display_phone_number: string; phone_number_id: string },
  contacts: Array<{ profile: { name: string }; wa_id: string }>
) {
  const supabase = createAdminClient() as any

  try {
    // 1. Find which site this message belongs to
    const { data: widgetSettings } = await supabase
      .from('mod_chat_widget_settings')
      .select('site_id')
      .eq('whatsapp_phone_number_id', metadata.phone_number_id)
      .single()

    if (!widgetSettings?.site_id) {
      // Try matching by global env var
      if (
        metadata.phone_number_id !== process.env.WHATSAPP_PHONE_NUMBER_ID
      ) {
        console.error(
          '[WhatsApp] No site found for phone_number_id:',
          metadata.phone_number_id
        )
        return
      }
      // If it's the global phone number, pick the first site with WhatsApp enabled
      const { data: fallbackSettings } = await supabase
        .from('mod_chat_widget_settings')
        .select('site_id')
        .eq('whatsapp_enabled', true)
        .limit(1)
        .single()

      if (!fallbackSettings?.site_id) {
        console.error('[WhatsApp] No site with WhatsApp enabled')
        return
      }
      widgetSettings.site_id = fallbackSettings.site_id
    }

    const siteId = widgetSettings.site_id
    const visitorPhone = message.from
    const visitorName =
      contacts[0]?.profile?.name || `+${visitorPhone}`

    // 2. Find or create visitor
    let visitorId: string

    const { data: existingVisitor } = await supabase
      .from('mod_chat_visitors')
      .select('id')
      .eq('site_id', siteId)
      .eq('whatsapp_phone', visitorPhone)
      .single()

    if (existingVisitor) {
      visitorId = existingVisitor.id

      // Update last seen and visit count
      await supabase
        .from('mod_chat_visitors')
        .update({
          name: visitorName,
          last_seen_at: new Date().toISOString(),
          total_visits: supabase.rpc ? undefined : 1, // Increment handled below
        })
        .eq('id', visitorId)
    } else {
      const { data: newVisitor } = await supabase
        .from('mod_chat_visitors')
        .insert({
          site_id: siteId,
          name: visitorName,
          whatsapp_phone: visitorPhone,
          channel: 'whatsapp',
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_visits: 1,
          total_conversations: 0,
          total_messages: 0,
          tags: [],
          custom_data: {},
        })
        .select('id')
        .single()

      if (!newVisitor) {
        console.error('[WhatsApp] Failed to create visitor')
        return
      }
      visitorId = newVisitor.id
    }

    // 3. Find or create conversation
    const windowExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: existingConv } = await supabase
      .from('mod_chat_conversations')
      .select('id')
      .eq('site_id', siteId)
      .eq('visitor_id', visitorId)
      .eq('channel', 'whatsapp')
      .in('status', ['pending', 'active', 'waiting'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let conversationId: string

    if (existingConv) {
      conversationId = existingConv.id

      // Extend WhatsApp window
      await supabase
        .from('mod_chat_conversations')
        .update({ whatsapp_window_expires_at: windowExpiry })
        .eq('id', conversationId)
    } else {
      const { data: newConv } = await supabase
        .from('mod_chat_conversations')
        .insert({
          site_id: siteId,
          visitor_id: visitorId,
          channel: 'whatsapp',
          status: 'pending',
          priority: 'normal',
          message_count: 0,
          unread_agent_count: 0,
          unread_visitor_count: 0,
          tags: [],
          metadata: {},
          whatsapp_window_expires_at: windowExpiry,
        })
        .select('id')
        .single()

      if (!newConv) {
        console.error('[WhatsApp] Failed to create conversation')
        return
      }
      conversationId = newConv.id

      // Increment visitor conversation count
      await supabase.rpc('increment_field', {
        table_name: 'mod_chat_visitors',
        field_name: 'total_conversations',
        row_id: visitorId,
      }).catch(() => {
        // RPC might not exist, fallback ignored
      })
    }

    // 4. Process message content
    let content: string | null = null
    let contentType: MessageContentType = 'text'
    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileSize: number | null = null
    let fileMimeType: string | null = null

    switch (message.type) {
      case 'text':
        content = message.text?.body || ''
        contentType = 'text'
        break

      case 'image':
        if (message.image) {
          const creds = await getPerSiteCredentials(siteId)
          const media = await processWhatsAppMediaMessage(
            'image',
            message.image,
            siteId,
            creds.accessToken
          )
          fileUrl = media.fileUrl
          fileName = media.fileName
          fileSize = media.fileSize
          fileMimeType = media.fileMimeType
          content = media.caption || 'Image'
          contentType = 'image'
        }
        break

      case 'document':
        if (message.document) {
          const creds = await getPerSiteCredentials(siteId)
          const media = await processWhatsAppMediaMessage(
            'document',
            { ...message.document, caption: message.document.caption },
            siteId,
            creds.accessToken
          )
          fileUrl = media.fileUrl
          fileName = media.fileName || message.document.filename
          fileSize = media.fileSize
          fileMimeType = media.fileMimeType
          content = media.caption || message.document.filename || 'Document'
          contentType = 'file'
        }
        break

      case 'audio':
        if (message.audio) {
          const creds = await getPerSiteCredentials(siteId)
          const media = await processWhatsAppMediaMessage(
            'audio',
            message.audio,
            siteId,
            creds.accessToken
          )
          fileUrl = media.fileUrl
          fileName = media.fileName
          fileSize = media.fileSize
          fileMimeType = media.fileMimeType
          content = 'Audio message'
          contentType = 'audio'
        }
        break

      case 'video':
        if (message.video) {
          const creds = await getPerSiteCredentials(siteId)
          const media = await processWhatsAppMediaMessage(
            'video',
            message.video,
            siteId,
            creds.accessToken
          )
          fileUrl = media.fileUrl
          fileName = media.fileName
          fileSize = media.fileSize
          fileMimeType = media.fileMimeType
          content = media.caption || 'Video'
          contentType = 'video'
        }
        break

      case 'location':
        if (message.location) {
          content = JSON.stringify({
            latitude: message.location.latitude,
            longitude: message.location.longitude,
            name: message.location.name,
            address: message.location.address,
          })
          contentType = 'location'
        }
        break

      default:
        content = `Unsupported message type: ${message.type}`
        contentType = 'text'
    }

    // 5. Insert message
    await supabase.from('mod_chat_messages').insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: 'visitor',
      sender_name: visitorName,
      content,
      content_type: contentType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      file_mime_type: fileMimeType,
      status: 'delivered',
      is_internal_note: false,
      whatsapp_message_id: message.id,
      is_ai_generated: false,
    })

    // 6. Update conversation last message
    await supabase
      .from('mod_chat_conversations')
      .update({
        last_message_text: (content || '').slice(0, 500),
        last_message_at: new Date().toISOString(),
        last_message_by: 'visitor',
        message_count: supabase.rpc ? undefined : 1,
        unread_agent_count: supabase.rpc ? undefined : 1,
      })
      .eq('id', conversationId)

    // 7. Mark as read in WhatsApp
    const creds = await getPerSiteCredentials(siteId)
    await markAsRead(message.id, creds.phoneNumberId, creds.accessToken)
  } catch (err) {
    console.error('[WhatsApp] processIncomingMessage error:', err)
  }
}

// =============================================================================
// PROCESS MESSAGE STATUS
// =============================================================================

async function processMessageStatus(status: WhatsAppMessageStatus) {
  const supabase = createAdminClient() as any

  try {
    const statusMap: Record<string, string> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    }

    const mappedStatus = statusMap[status.status]
    if (!mappedStatus) return

    const updateData: Record<string, unknown> = {
      whatsapp_status: mappedStatus,
      status: mappedStatus,
    }

    if (status.errors && status.errors.length > 0) {
      updateData.metadata = {
        whatsapp_error: {
          code: status.errors[0].code,
          title: status.errors[0].title,
        },
      }
    }

    await supabase
      .from('mod_chat_messages')
      .update(updateData)
      .eq('whatsapp_message_id', status.id)
  } catch (err) {
    console.error('[WhatsApp] processMessageStatus error:', err)
  }
}
