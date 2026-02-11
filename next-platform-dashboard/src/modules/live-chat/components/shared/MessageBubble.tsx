'use client'

/**
 * MessageBubble — Chat message display component
 *
 * Handles: visitor (left), agent (right), system (center), notes (amber highlight)
 * Supports: text, image, file, system, note, AI-generated content
 */

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Bot,
  StickyNote,
  Image as ImageIcon,
} from 'lucide-react'
import type {
  ChatMessage,
  MessageSenderType,
  MessageContentType,
  MessageStatus,
} from '@/modules/live-chat/types'

interface MessageBubbleProps {
  message: ChatMessage
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-ZM', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-muted-foreground" />
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive" />
    default:
      return null
  }
}

function FileAttachment({
  fileName,
  fileUrl,
  fileSize,
  contentType,
}: {
  fileName: string | null
  fileUrl: string | null
  fileSize: number | null
  contentType: MessageContentType
}) {
  if (contentType === 'image' && fileUrl) {
    return (
      <div className="mt-1 rounded-lg overflow-hidden max-w-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName || 'Image'}
          className="w-full h-auto max-h-64 object-cover"
        />
      </div>
    )
  }

  if (fileUrl) {
    const sizeStr = fileSize
      ? fileSize < 1024
        ? `${fileSize} B`
        : fileSize < 1048576
          ? `${(fileSize / 1024).toFixed(1)} KB`
          : `${(fileSize / 1048576).toFixed(1)} MB`
      : ''

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center gap-2 p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors max-w-xs"
      >
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {fileName || 'File'}
          </p>
          {sizeStr && (
            <p className="text-xs text-muted-foreground">{sizeStr}</p>
          )}
        </div>
        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
      </a>
    )
  }

  return null
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isSystem =
    message.senderType === 'system' || message.contentType === 'system'
  const isNote = message.contentType === 'note'
  const isAgent =
    message.senderType === 'agent' || message.senderType === 'ai'
  const isVisitor = message.senderType === 'visitor'
  const isAI = message.senderType === 'ai'

  // ─── System messages ────────────────────────────────────────────────────
  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-2', className)}>
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {message.content}
        </p>
      </div>
    )
  }

  // ─── Internal notes ─────────────────────────────────────────────────────
  if (isNote) {
    return (
      <div className={cn('flex justify-end my-1', className)}>
        <div className="max-w-[70%]">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <StickyNote className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
              >
                Internal Note
              </Badge>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                {message.senderName || 'Agent'}
              </span>
            </div>
            <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
              {message.content}
            </p>
            <p className="text-[10px] text-amber-600/60 dark:text-amber-400/60 mt-1 text-right">
              {formatTime(message.createdAt)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Regular messages (visitor or agent) ─────────────────────────────────
  const alignment = isVisitor ? 'justify-start' : 'justify-end'
  const bubbleBg = isVisitor
    ? 'bg-muted'
    : 'bg-primary text-primary-foreground'
  const senderName = message.senderName || (isVisitor ? 'Visitor' : 'Agent')
  const initials = getInitials(senderName)

  return (
    <div className={cn('flex gap-2 my-1', alignment, className)}>
      {/* Avatar on left for visitor */}
      {isVisitor && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="text-xs bg-muted-foreground/10">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[70%]', isAgent && 'flex flex-col items-end')}>
        {/* Sender name + AI badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 mb-0.5',
            isAgent && 'flex-row-reverse'
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            {senderName}
          </span>
          {isAI && (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1 gap-0.5"
            >
              <Bot className="h-2.5 w-2.5" />
              AI
            </Badge>
          )}
        </div>

        {/* Bubble */}
        <div className={cn('rounded-lg px-3 py-2', bubbleBg)}>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          {(message.contentType === 'image' ||
            message.contentType === 'file' ||
            message.contentType === 'audio' ||
            message.contentType === 'video') && (
            <FileAttachment
              fileName={message.fileName}
              fileUrl={message.fileUrl}
              fileSize={message.fileSize}
              contentType={message.contentType}
            />
          )}
        </div>

        {/* Timestamp + status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-0.5',
            isAgent && 'flex-row-reverse'
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {isAgent && <StatusIcon status={message.status} />}
        </div>
      </div>

      {/* Avatar on right for agent */}
      {isAgent && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {isAI ? (
              <Bot className="h-3.5 w-3.5" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
