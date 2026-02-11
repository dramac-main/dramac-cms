'use client'

/**
 * Live Chat Module — Agent Presence Hook
 *
 * Uses Supabase Realtime Presence to track agent online/offline status
 * across the site in real-time.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { PresenceState, AgentStatus } from '../types'

export function useAgentPresence(
  siteId: string | null,
  agentId: string | null,
  initialStatus: AgentStatus = 'online'
) {
  const [onlineAgents, setOnlineAgents] = useState<PresenceState[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!siteId || !agentId) return

    const supabase = createClient()

    const channel = supabase.channel(`presence:chat:${siteId}`, {
      config: {
        presence: {
          key: agentId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const agents: PresenceState[] = []

        for (const [, presences] of Object.entries(state)) {
          for (const presence of presences as Record<string, unknown>[]) {
            agents.push({
              agentId: presence.agentId as string,
              status: presence.status as AgentStatus,
              currentChats: (presence.currentChats as number) || 0,
              lastSeen: (presence.lastSeen as string) || new Date().toISOString(),
            })
          }
        }

        setOnlineAgents(agents)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            agentId,
            status: initialStatus,
            currentChats: 0,
            lastSeen: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.untrack()
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [siteId, agentId, initialStatus])

  const updateStatus = useCallback(
    async (newStatus: AgentStatus, currentChats?: number) => {
      if (channelRef.current && agentId) {
        await channelRef.current.track({
          agentId,
          status: newStatus,
          currentChats: currentChats ?? 0,
          lastSeen: new Date().toISOString(),
        })
      }
    },
    [agentId]
  )

  return {
    onlineAgents,
    updateStatus,
  }
}
