'use client'

/**
 * Live Chat Module — Conversations Realtime Hook
 *
 * Subscribes to conversation-level updates for the agent dashboard.
 * Listens for new conversations, status changes, and assignment changes.
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { mapRecord } from '../lib/map-db-record'
import type { ChatConversation } from '../types'

interface ConversationsRealtimeCallbacks {
  onNewConversation: (conv: ChatConversation) => void
  onConversationUpdate: (conv: ChatConversation) => void
  onConversationDeleted?: (convId: string) => void
}

export function useConversationsRealtime(
  siteId: string | null,
  callbacks: ConversationsRealtimeCallbacks
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!siteId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`conversations:${siteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mod_chat_conversations',
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          const conv = mapRecord<ChatConversation>(payload.new as Record<string, unknown>)
          callbacksRef.current.onNewConversation(conv)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mod_chat_conversations',
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          const conv = mapRecord<ChatConversation>(payload.new as Record<string, unknown>)
          callbacksRef.current.onConversationUpdate(conv)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'mod_chat_conversations',
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          if (callbacksRef.current.onConversationDeleted) {
            const old = payload.old as Record<string, unknown>
            callbacksRef.current.onConversationDeleted(old.id as string)
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [siteId])

  return {
    channel: channelRef.current,
  }
}
