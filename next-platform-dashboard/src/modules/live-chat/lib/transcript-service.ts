/**
 * Transcript Service
 *
 * PHASE LC-07: Generate and export conversation transcripts.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// =============================================================================
// GENERATE TRANSCRIPT
// =============================================================================

export async function generateTranscript(
  conversationId: string
): Promise<{
  success: boolean
  transcript: string
  metadata: {
    conversationId: string
    visitorName: string
    visitorEmail: string
    channel: string
    startedAt: string
    endedAt: string | null
    agentName: string | null
    messageCount: number
  } | null
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, transcript: '', metadata: null, error: 'Not authenticated' }

    const db = supabase as any

    // Get conversation details
    const { data: conv } = await db
      .from('mod_chat_conversations')
      .select(`
        id, channel, status, created_at, ended_at,
        mod_chat_visitors(name, email),
        mod_chat_agents(display_name)
      `)
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, transcript: '', metadata: null, error: 'Conversation not found' }

    // Get all messages
    const { data: messages } = await db
      .from('mod_chat_messages')
      .select('sender_type, sender_name, content, content_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!messages || messages.length === 0) {
      return { success: false, transcript: '', metadata: null, error: 'No messages found' }
    }

    const visitorName = conv.mod_chat_visitors?.name || 'Unknown Visitor'
    const visitorEmail = conv.mod_chat_visitors?.email || 'N/A'
    const agentName = conv.mod_chat_agents?.display_name || null

    // Build transcript text
    const lines: string[] = [
      '═══════════════════════════════════════════',
      '         LIVE CHAT TRANSCRIPT',
      '═══════════════════════════════════════════',
      '',
      `Conversation ID: ${conversationId}`,
      `Visitor: ${visitorName} (${visitorEmail})`,
      `Agent: ${agentName || 'Unassigned'}`,
      `Channel: ${conv.channel}`,
      `Started: ${new Date(conv.created_at).toLocaleString()}`,
      `Ended: ${conv.ended_at ? new Date(conv.ended_at).toLocaleString() : 'In progress'}`,
      `Messages: ${messages.length}`,
      '',
      '───────────────────────────────────────────',
      '',
    ]

    for (const msg of messages) {
      const time = new Date(msg.created_at).toLocaleTimeString()
      const senderLabel =
        msg.sender_type === 'visitor'
          ? visitorName
          : msg.sender_type === 'system'
            ? '🤖 AI Assistant'
            : msg.sender_name || 'Agent'

      if (msg.content_type === 'text' || msg.content_type === 'note') {
        const prefix = msg.content_type === 'note' ? '[Internal Note] ' : ''
        lines.push(`[${time}] ${senderLabel}: ${prefix}${msg.content}`)
      } else if (msg.content_type === 'file' || msg.content_type === 'image') {
        lines.push(`[${time}] ${senderLabel}: [${msg.content_type.toUpperCase()}] ${msg.content}`)
      } else {
        lines.push(`[${time}] ${senderLabel}: ${msg.content}`)
      }
    }

    lines.push('')
    lines.push('───────────────────────────────────────────')
    lines.push(`Exported: ${new Date().toLocaleString()}`)

    return {
      success: true,
      transcript: lines.join('\n'),
      metadata: {
        conversationId,
        visitorName,
        visitorEmail,
        channel: conv.channel,
        startedAt: conv.created_at,
        endedAt: conv.ended_at,
        agentName,
        messageCount: messages.length,
      },
    }
  } catch (err) {
    return {
      success: false,
      transcript: '',
      metadata: null,
      error: err instanceof Error ? err.message : 'Failed to generate transcript',
    }
  }
}

// =============================================================================
// DOWNLOAD TRANSCRIPT (returns plain text for client download)
// =============================================================================

export async function downloadTranscript(
  conversationId: string
): Promise<{ success: boolean; text: string; filename: string; error?: string }> {
  const result = await generateTranscript(conversationId)

  if (!result.success) {
    return { success: false, text: '', filename: '', error: result.error }
  }

  const date = new Date().toISOString().split('T')[0]
  const filename = `transcript-${conversationId.slice(0, 8)}-${date}.txt`

  return { success: true, text: result.transcript, filename }
}
