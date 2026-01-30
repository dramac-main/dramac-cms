'use client'

/**
 * Calendar Day Cell Component
 * 
 * Phase UI-11B: Enhanced calendar day cell with hover states,
 * post indicators, and drag-drop support
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SocialPost } from '../../types'

// ============================================================================
// TYPES
// ============================================================================

interface CalendarDayCellProps {
  date: Date
  posts: SocialPost[]
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  onSelect: (date: Date) => void
  onCreatePost: (date: Date) => void
  onDropPost?: (postId: string, date: Date) => void
  compact?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CalendarDayCell({
  date,
  posts,
  isCurrentMonth,
  isToday,
  isSelected,
  onSelect,
  onCreatePost,
  onDropPost,
  compact = false,
}: CalendarDayCellProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const postId = e.dataTransfer.getData('postId')
    if (postId && onDropPost) {
      onDropPost(postId, date)
    }
  }, [date, onDropPost])

  // Group posts by status
  const postsByStatus = posts.reduce((acc, post) => {
    const status = post.status
    if (!acc[status]) acc[status] = []
    acc[status].push(post)
    return acc
  }, {} as Record<string, SocialPost[]>)

  const scheduledCount = postsByStatus['scheduled']?.length || 0
  const publishedCount = postsByStatus['published']?.length || 0
  const draftCount = postsByStatus['draft']?.length || 0
  const pendingCount = postsByStatus['pending_approval']?.length || 0

  return (
    <motion.div
      className={cn(
        'relative min-h-[100px] border border-border/50 p-2 transition-colors',
        'hover:border-primary/30 hover:bg-accent/30',
        isCurrentMonth ? 'bg-background' : 'bg-muted/30',
        isToday && 'ring-2 ring-primary/50 ring-inset',
        isSelected && 'bg-primary/10 border-primary',
        isDragOver && 'bg-primary/20 border-primary border-dashed',
        compact && 'min-h-[80px]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onSelect(date)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
            isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs'
          )}
        >
          {date.getDate()}
        </span>

        {/* Quick add button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreatePost(date)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create post</TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post indicators */}
      {posts.length > 0 && (
        <div className="space-y-1">
          {/* Status counts */}
          {!compact && (
            <div className="flex flex-wrap gap-1 text-[10px]">
              {scheduledCount > 0 && (
                <span className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {scheduledCount} scheduled
                </span>
              )}
              {publishedCount > 0 && (
                <span className="px-1 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-300">
                  {publishedCount} published
                </span>
              )}
              {pendingCount > 0 && (
                <span className="px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                  {pendingCount} pending
                </span>
              )}
              {draftCount > 0 && (
                <span className="px-1 py-0.5 rounded bg-gray-500/20 text-gray-600 dark:text-gray-400">
                  {draftCount} draft
                </span>
              )}
            </div>
          )}

          {/* Compact count */}
          {compact && posts.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Empty state with calendar icon */}
      {posts.length === 0 && !isHovered && isCurrentMonth && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-20">
          <Calendar className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
    </motion.div>
  )
}
