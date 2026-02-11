'use client'

/**
 * Live Chat Module — Chat Realtime Hook
 *
 * Subscribes to Supabase Realtime for live message updates in a conversation.
 * Handles new messages, message updates, and typing indicators via broadcast.
 */

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { mapRecord } from '../lib/map-db-record'
import type { ChatMessage } from '../types'

interface ChatRealtimeCallbacks {
  onNewMessage: (message: ChatMessage) => void
  onMessageUpdate?: (message: ChatMessage) => void
  onTypingStart?: (senderId: string, senderName: string) => void
  onTypingStop?: (senderId: string) => void
}

export function useChatRealtime(
  conversationId: string | null,
  callbacks: ChatRealtimeCallbacks
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mod_chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = mapRecord<ChatMessage>(payload.new as Record<string, unknown>)
          callbacksRef.current.onNewMessage(message)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mod_chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (callbacksRef.current.onMessageUpdate) {
            const message = mapRecord<ChatMessage>(payload.new as Record<string, unknown>)
            callbacksRef.current.onMessageUpdate(message)
          }
        }
      )
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        if (callbacksRef.current.onTypingStart) {
          callbacksRef.current.onTypingStart(
            payload.payload?.senderId as string,
            payload.payload?.senderName as string
          )
        }
      })
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        if (callbacksRef.current.onTypingStop) {
          callbacksRef.current.onTypingStop(payload.payload?.senderId as string)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [conversationId])

  const sendTypingStart = useCallback(
    (senderId: string, senderName: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: { senderId, senderName },
      })
    },
    []
  )

  const sendTypingStop = useCallback(
    (senderId: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { senderId },
      })
    },
    []
  )

  return {
    sendTypingStart,
    sendTypingStop,
    channel: channelRef.current,
  }
}
