'use client'

/**
 * WidgetMessageBubble — Individual message bubble for the chat widget
 *
 * PHASE LC-04: Visitor (right, primary), Agent (left, gray), System (center),
 * AI indicator, timestamps, attachment support
 */

import { DEFAULT_TIMEZONE } from '@/lib/locale-config'

export interface WidgetMessage {
  id: string
  text: string
  senderType: 'visitor' | 'agent' | 'system' | 'ai'
  senderName?: string
  createdAt: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
  isRead?: boolean
}

interface WidgetMessageBubbleProps {
  message: WidgetMessage
  primaryColor: string
  textColor: string
}

export function WidgetMessageBubble({
  message,
  primaryColor,
  textColor,
}: WidgetMessageBubbleProps) {
  const isVisitor = message.senderType === 'visitor'
  const isSystem = message.senderType === 'system'
  const isAi = message.senderType === 'ai'

  // System / info messages
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    )
  }

  const formattedTime = formatTime(message.createdAt)

  return (
    <div
      className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div
        className="max-w-[80%]"
      >
        {/* Agent name */}
        {!isVisitor && message.senderName && (
          <div className="flex items-center gap-1.5 mb-0.5 px-1">
            <span className="text-[11px] font-medium text-gray-600">
              {message.senderName}
            </span>
            {isAi && (
              <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                AI
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`px-3 py-2 text-sm leading-relaxed break-words ${
            isVisitor
              ? 'rounded-2xl rounded-br-md'
              : 'rounded-2xl rounded-bl-md'
          }`}
          style={
            isVisitor
              ? { backgroundColor: primaryColor, color: textColor }
              : { backgroundColor: '#f1f5f9', color: '#1e293b' }
          }
        >
          {/* Attachment */}
          {message.attachmentUrl && (
            <div className="mb-1.5">
              {message.attachmentType?.startsWith('image/') ? (
                <img
                  src={message.attachmentUrl}
                  alt={message.attachmentName || 'Attachment'}
                  className="rounded-lg max-w-full max-h-40 object-cover cursor-pointer"
                  onClick={() => window.open(message.attachmentUrl, '_blank')}
                />
              ) : (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-xs underline ${
                    isVisitor ? 'opacity-90' : 'text-blue-600'
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  {message.attachmentName || 'Attachment'}
                </a>
              )}
            </div>
          )}

          {/* Message text */}
          {message.text && (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>

        {/* Timestamp + status */}
        <div
          className={`flex items-center gap-1 mt-0.5 px-1 ${
            isVisitor ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="text-[10px] text-gray-400">{formattedTime}</span>
          {isVisitor && (
            <span className="text-[10px] text-gray-400">
              {message.isRead ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
                  <path d="M18 7l-8.5 8.5-4-4" />
                  <path d="M22 7l-8.5 8.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: DEFAULT_TIMEZONE,
      })
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: DEFAULT_TIMEZONE,
    })
  } catch {
    return ''
  }
}
