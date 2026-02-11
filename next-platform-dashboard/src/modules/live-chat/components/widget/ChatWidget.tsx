'use client'

/**
 * ChatWidget — The customer-facing embeddable chat widget
 *
 * PHASE LC-04: Full widget with launcher, pre-chat, chat, rating, and offline states
 * This component renders inside an iframe on customer sites.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { WidgetLauncher } from './WidgetLauncher'
import { WidgetPreChatForm } from './WidgetPreChatForm'
import { WidgetChat } from './WidgetChat'
import { WidgetRating } from './WidgetRating'
import { WidgetOfflineForm } from './WidgetOfflineForm'
import type { ChatMessage, BusinessHoursConfig } from '@/modules/live-chat/types'
import type { WidgetMessage } from './WidgetMessageBubble'

// Widget settings received from API (public subset)
export interface WidgetPublicSettings {
  primaryColor: string
  textColor: string
  position: 'bottom-right' | 'bottom-left'
  launcherIcon: string
  launcherSize: number
  borderRadius: number
  zIndex: number
  companyName: string | null
  welcomeMessage: string
  awayMessage: string
  offlineMessage: string
  logoUrl: string | null
  preChatEnabled: boolean
  preChatNameRequired: boolean
  preChatEmailRequired: boolean
  preChatPhoneEnabled: boolean
  preChatPhoneRequired: boolean
  preChatMessageRequired: boolean
  preChatDepartmentSelector: boolean
  businessHoursEnabled: boolean
  businessHours: BusinessHoursConfig
  timezone: string
  autoOpenDelaySeconds: number
  showAgentAvatar: boolean
  showAgentName: boolean
  showTypingIndicator: boolean
  enableFileUploads: boolean
  enableEmoji: boolean
  enableSoundNotifications: boolean
  enableSatisfactionRating: boolean
  language: string
}

export interface WidgetDepartment {
  id: string
  name: string
}

type WidgetState = 'loading' | 'launcher' | 'pre-chat' | 'chat' | 'rating' | 'offline'

interface ChatWidgetProps {
  siteId: string
}

function isWithinBusinessHours(
  businessHours: BusinessHoursConfig,
  timezone: string
): boolean {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase()
    const hour = parts.find((p) => p.type === 'hour')?.value || '0'
    const minute = parts.find((p) => p.type === 'minute')?.value || '0'
    const currentMinutes = parseInt(hour) * 60 + parseInt(minute)

    if (!weekday) return true

    const dayConfig = businessHours[weekday as keyof BusinessHoursConfig]
    if (!dayConfig || !dayConfig.enabled) return false

    const [startH, startM] = dayConfig.start.split(':').map(Number)
    const [endH, endM] = dayConfig.end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } catch {
    return true // Default to open if timezone calculation fails
  }
}

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}`
  : ''

export function ChatWidget({ siteId }: ChatWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('loading')
  const [settings, setSettings] = useState<WidgetPublicSettings | null>(null)
  const [departments, setDepartments] = useState<WidgetDepartment[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/modules/live-chat/widget?siteId=${siteId}`)
        if (!res.ok) {
          setWidgetState('loading')
          return
        }
        const data = await res.json()
        setSettings(data.settings)
        setDepartments(data.departments || [])

        // Restore session from localStorage
        const savedConversation = localStorage.getItem(`dramac_chat_conv_${siteId}`)
        const savedVisitor = localStorage.getItem(`dramac_chat_visitor_${siteId}`)
        if (savedConversation && savedVisitor) {
          setConversationId(savedConversation)
          setVisitorId(savedVisitor)
          setWidgetState('chat')
        } else {
          setWidgetState('launcher')
        }
      } catch (err) {
        console.error('[DRAMAC Chat] Failed to load settings:', err)
        setWidgetState('loading')
      }
    }
    loadSettings()
  }, [siteId])

  // Set up audio for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJ0qFrNHgykg3MVN3msnq1mxEOUVniLjJ4ddySDlBZYa2x+DVfEQ+QmeJu8jf0oJINTxxl7/K4tGIRTY4dom2weXVi0Q3OXiKt8Pp0YlEN0B3lL/H5deHQzs+d5O+xeXXjEI1PXmWwsXm14lCNj96m8LH5taIQjU+e5fCxOfYiUI1PnyXwsfo14lCNT59l8LI6NeJQjU=')
      audioRef.current.volume = 0.3
    }
  }, [])

  // Poll for new messages when in chat state
  useEffect(() => {
    if (widgetState !== 'chat' || !conversationId || !visitorId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    async function fetchMessages() {
      try {
        const res = await fetch(
          `${API_BASE}/api/modules/live-chat/messages?conversationId=${conversationId}&visitorId=${visitorId}`
        )
        if (!res.ok) return
        const data = await res.json()
        const newMessages: ChatMessage[] = data.messages || []

        setMessages((prev) => {
          if (newMessages.length === prev.length) return prev

          // Check for new agent messages
          const prevIds = new Set(prev.map((m) => m.id))
          const newAgentMsgs = newMessages.filter(
            (m) => !prevIds.has(m.id) && m.senderType !== 'visitor'
          )

          if (newAgentMsgs.length > 0) {
            // Play notification sound
            if (settings?.enableSoundNotifications && audioRef.current) {
              audioRef.current.play().catch(() => {})
            }
            setUnreadCount((c) => c + newAgentMsgs.length)
            // Notify parent window about unread messages
            try {
              window.parent.postMessage(
                { type: 'dramac-chat-unread', count: unreadCount + newAgentMsgs.length },
                '*'
              )
            } catch {}
          }

          return newMessages
        })
      } catch {
        // Silently fail polling
      }
    }

    // Initial fetch
    fetchMessages()

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(fetchMessages, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [widgetState, conversationId, visitorId, settings?.enableSoundNotifications, unreadCount])

  // Handle launcher click
  const handleOpen = useCallback(() => {
    if (!settings) return

    // Check business hours
    if (settings.businessHoursEnabled) {
      const isOpen = isWithinBusinessHours(settings.businessHours, settings.timezone)
      if (!isOpen) {
        setWidgetState('offline')
        return
      }
    }

    // If we have an existing conversation, go straight to chat
    if (conversationId && visitorId) {
      setWidgetState('chat')
      setUnreadCount(0)
      return
    }

    // Otherwise show pre-chat form (or skip if disabled)
    if (settings.preChatEnabled) {
      setWidgetState('pre-chat')
    } else {
      // Create conversation with minimal data
      handleStartChat({})
    }
  }, [settings, conversationId, visitorId])

  // Handle pre-chat form submission
  const handleStartChat = useCallback(
    async (visitorData: {
      name?: string
      email?: string
      phone?: string
      departmentId?: string
      message?: string
    }) => {
      if (!settings) return

      try {
        const res = await fetch(`${API_BASE}/api/modules/live-chat/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            visitorData: {
              name: visitorData.name || 'Visitor',
              email: visitorData.email,
              phone: visitorData.phone,
              browser: navigator.userAgent,
              currentPageUrl: document.referrer || window.location.href,
              currentPageTitle: document.title,
            },
            departmentId: visitorData.departmentId,
            initialMessage: visitorData.message,
          }),
        })

        if (!res.ok) throw new Error('Failed to start chat')
        const data = await res.json()

        setConversationId(data.conversationId)
        setVisitorId(data.visitorId)
        setWidgetState('chat')

        // Save session
        localStorage.setItem(`dramac_chat_conv_${siteId}`, data.conversationId)
        localStorage.setItem(`dramac_chat_visitor_${siteId}`, data.visitorId)
      } catch (err) {
        console.error('[DRAMAC Chat] Failed to start chat:', err)
      }
    },
    [siteId, settings]
  )

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !visitorId) return

      try {
        const res = await fetch(`${API_BASE}/api/modules/live-chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            visitorId,
            content,
            contentType: 'text',
          }),
        })

        if (!res.ok) throw new Error('Failed to send message')
        const data = await res.json()

        // Optimistically add message
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      } catch (err) {
        console.error('[DRAMAC Chat] Failed to send message:', err)
      }
    },
    [conversationId, visitorId]
  )

  // Handle rating submission
  const handleRating = useCallback(
    async (rating: number, comment?: string) => {
      if (!conversationId || !visitorId) return

      try {
        await fetch(`${API_BASE}/api/modules/live-chat/rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, visitorId, rating, comment: comment || '' }),
        })
      } catch {
        // Silent fail — rating is optional
      }
    },
    [conversationId, visitorId]
  )

  // Handle closing widget
  const handleClose = useCallback(() => {
    setWidgetState('launcher')
    try {
      window.parent.postMessage({ type: 'dramac-chat-close' }, '*')
    } catch {}
  }, [])

  // Handle minimize
  const handleMinimize = useCallback(() => {
    setWidgetState('launcher')
  }, [])

  // Handle end chat — show rating if enabled
  const handleEndChat = useCallback(() => {
    if (settings?.enableSatisfactionRating) {
      setWidgetState('rating')
    } else {
      setWidgetState('launcher')
    }
  }, [settings?.enableSatisfactionRating])

  // Handle offline form submission
  const handleOfflineSubmit = useCallback(
    async (data: { name: string; email: string; message: string }) => {
      await handleStartChat({
        name: data.name,
        email: data.email,
        message: data.message,
      })
      setWidgetState('launcher')
    },
    [handleStartChat]
  )

  // Check if conversation was resolved — show rating
  useEffect(() => {
    if (widgetState !== 'chat' || !conversationId || !visitorId) return

    async function checkStatus() {
      try {
        const res = await fetch(
          `${API_BASE}/api/modules/live-chat/conversations?conversationId=${conversationId}&visitorId=${visitorId}`
        )
        if (!res.ok) return
        const data = await res.json()

        if (
          data.conversation &&
          (data.conversation.status === 'resolved' || data.conversation.status === 'closed') &&
          !data.conversation.rating &&
          settings?.enableSatisfactionRating
        ) {
          setWidgetState('rating')
        }
      } catch {}
    }

    const interval = setInterval(checkStatus, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [widgetState, conversationId, visitorId, settings?.enableSatisfactionRating])

  if (!settings || widgetState === 'loading') {
    return null // Loading — hide everything
  }

  // Map ChatMessage[] → WidgetMessage[] for the chat component
  const widgetMessages: WidgetMessage[] = messages.map((m) => ({
    id: m.id,
    text: m.content || '',
    senderType: m.senderType as WidgetMessage['senderType'],
    senderName: m.senderName || undefined,
    createdAt: m.createdAt,
    attachmentUrl: m.fileUrl || undefined,
    attachmentType: m.fileMimeType || undefined,
    attachmentName: m.fileName || undefined,
    isRead: m.status === 'read',
  }))

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '--widget-primary': settings.primaryColor,
        '--widget-text': settings.textColor,
      } as React.CSSProperties}
    >
      {widgetState === 'launcher' && (
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
          {/* In iframe mode, the launcher is outside the iframe */}
          {/* This fallback is for when the widget is opened directly */}
          <button
            type="button"
            onClick={handleOpen}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: settings.primaryColor }}
          >
            Start Chat
          </button>
        </div>
      )}

      {widgetState === 'pre-chat' && (
        <WidgetPreChatForm
          settings={settings}
          departments={departments}
          onSubmit={handleStartChat}
          onClose={handleClose}
        />
      )}

      {widgetState === 'chat' && (
        <WidgetChat
          settings={settings}
          messages={widgetMessages}
          isLoading={messages.length === 0 && widgetState === 'chat'}
          typingAgent={isAgentTyping ? 'Agent' : null}
          onSendMessage={handleSendMessage}
          onEndChat={handleEndChat}
          onClose={handleClose}
        />
      )}

      {widgetState === 'rating' && (
        <WidgetRating
          settings={settings}
          onSubmit={handleRating}
          onClose={handleClose}
        />
      )}

      {widgetState === 'offline' && (
        <WidgetOfflineForm
          settings={settings}
          onSubmit={handleOfflineSubmit}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
