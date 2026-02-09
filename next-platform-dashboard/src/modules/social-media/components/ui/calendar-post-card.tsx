'use client'

/**
 * Calendar Post Card Component
 * 
 * Phase UI-11B: Compact post preview card for calendar view
 * with drag support and quick actions
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Copy, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  GripVertical,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SocialPost } from '../../types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface CalendarPostCardProps {
  post: SocialPost
  compact?: boolean
  draggable?: boolean
  onEdit: (post: SocialPost) => void
  onDelete: (postId: string) => void
  onDuplicate: (post: SocialPost) => void
  onPublishNow?: (postId: string) => void
  onViewPost?: (post: SocialPost) => void
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusConfig(status: string) {
  switch (status) {
    case 'draft':
      return { label: 'Draft', color: 'bg-gray-500', icon: Clock }
    case 'scheduled':
      return { label: 'Scheduled', color: 'bg-blue-500', icon: Clock }
    case 'pending_approval':
      return { label: 'Pending', color: 'bg-yellow-500', icon: AlertCircle }
    case 'published':
      return { label: 'Published', color: 'bg-green-500', icon: CheckCircle }
    case 'failed':
      return { label: 'Failed', color: 'bg-red-500', icon: AlertCircle }
    default:
      return { label: status, color: 'bg-gray-500', icon: Clock }
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString(DEFAULT_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CalendarPostCard({
  post,
  compact = false,
  draggable = true,
  onEdit,
  onDelete,
  onDuplicate,
  onPublishNow,
  onViewPost,
}: CalendarPostCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const statusConfig = getStatusConfig(post.status)
  const StatusIcon = statusConfig.icon

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('postId', post.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }, [post.id])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Get published URL from publishResults if available
  const publishedUrl = post.publishResults 
    ? Object.values(post.publishResults).find(r => r.url)?.url 
    : null

  if (compact) {
    // Compact version for calendar grid
    return (
      <motion.div
        className={cn(
          'group relative px-2 py-1 rounded text-xs cursor-pointer',
          'border border-transparent hover:border-border',
          'transition-colors duration-150',
          'bg-primary/10 border-l-2 border-l-primary',
          isDragging && 'opacity-50'
        )}
        draggable={draggable}
        onDragStart={handleDragStart as unknown as (event: MouseEvent | TouchEvent | PointerEvent) => void}
        onDragEnd={handleDragEnd as unknown as (event: MouseEvent | TouchEvent | PointerEvent) => void}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewPost?.(post)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <span className="truncate flex-1 text-foreground/80">
            {truncateText(post.content, 30)}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {post.scheduledAt && formatTime(post.scheduledAt)}
          </span>
        </div>

        {/* Quick actions on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pr-1 bg-gradient-to-l from-background/90 to-transparent pl-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(post)
                }}
              >
                <Edit className="h-2.5 w-2.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Full version for list view or expanded calendar
  return (
    <motion.div
      className={cn(
        'group relative p-3 rounded-lg border bg-card',
        'hover:shadow-md hover:border-primary/30',
        'transition-all duration-200',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={draggable}
      onDragStart={handleDragStart as unknown as (event: MouseEvent | TouchEvent | PointerEvent) => void}
      onDragEnd={handleDragEnd as unknown as (event: MouseEvent | TouchEvent | PointerEvent) => void}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      {/* Drag handle */}
      {draggable && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <StatusIcon className="h-3 w-3" />
            <span>{statusConfig.label}</span>
            {post.scheduledAt && (
              <>
                <span>•</span>
                <span>{formatTime(post.scheduledAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(post)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(post)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            {post.status === 'scheduled' && onPublishNow && (
              <DropdownMenuItem onClick={() => onPublishNow(post.id)}>
                <Send className="h-4 w-4 mr-2" />
                Publish Now
              </DropdownMenuItem>
            )}
            {publishedUrl && (
              <DropdownMenuItem asChild>
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Post
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(post.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content preview */}
      <p className="text-sm text-foreground/80 line-clamp-3 mb-2">
        {post.content}
      </p>

      {/* Media preview */}
      {post.media && post.media.length > 0 && (
        <div className="flex gap-1 mb-2">
          {post.media.slice(0, 3).map((m, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded bg-muted overflow-hidden"
            >
              {m.type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              {m.type === 'video' && (
                <div className="w-full h-full flex items-center justify-center bg-black/10">
                  <span className="text-[10px] text-muted-foreground">Video</span>
                </div>
              )}
            </div>
          ))}
          {post.media.length > 3 && (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                +{post.media.length - 3}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer with engagement stats (if published) */}
      {post.status === 'published' && (post.totalEngagement > 0 || post.totalImpressions > 0) && (
        <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
          <span>👁️ {post.totalImpressions.toLocaleString()}</span>
          <span>💬 {post.totalEngagement.toLocaleString()}</span>
          <span>🔗 {post.totalClicks.toLocaleString()}</span>
        </div>
      )}
    </motion.div>
  )
}
