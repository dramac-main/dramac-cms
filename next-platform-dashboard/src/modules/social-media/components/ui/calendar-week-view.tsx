'use client'

/**
 * Calendar Week View Component
 * 
 * Phase UI-11B: Week view with time slots for better
 * scheduling visualization
 */

import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CalendarPostCard } from './calendar-post-card'
import type { SocialPost } from '../../types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface CalendarWeekViewProps {
  currentDate: Date
  posts: SocialPost[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onCreatePost: (date: Date, hour?: number) => void
  onEditPost: (post: SocialPost) => void
  onDeletePost: (postId: string) => void
  onDuplicatePost: (post: SocialPost) => void
  onDropPost?: (postId: string, date: Date, hour: number) => void
}

// ============================================================================
// HELPERS
// ============================================================================

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getWeekDates(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

function getPostHour(post: SocialPost): number {
  if (!post.scheduledAt) return 0
  return new Date(post.scheduledAt).getHours()
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CalendarWeekView({
  currentDate,
  posts,
  onPrevWeek,
  onNextWeek,
  onCreatePost,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
  onDropPost,
}: CalendarWeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  
  // Get current hour for time indicator
  const currentHour = new Date().getHours()
  const currentMinutes = new Date().getMinutes()

  // Group posts by day and hour
  const postsByDayHour = useMemo(() => {
    const grouped: Record<string, Record<number, SocialPost[]>> = {}
    
    weekDates.forEach(date => {
      const key = date.toISOString().split('T')[0]
      grouped[key] = {}
      HOURS.forEach(hour => {
        grouped[key][hour] = []
      })
    })

    posts.forEach(post => {
      if (!post.scheduledAt) return
      const postDate = new Date(post.scheduledAt)
      const key = postDate.toISOString().split('T')[0]
      const hour = postDate.getHours()
      
      if (grouped[key] && grouped[key][hour]) {
        grouped[key][hour].push(post)
      }
    })

    return grouped
  }, [weekDates, posts])

  const handleDrop = useCallback((e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault()
    const postId = e.dataTransfer.getData('postId')
    if (postId && onDropPost) {
      onDropPost(postId, date, hour)
    }
  }, [onDropPost])

  // Get the week range string
  const weekRangeStr = useMemo(() => {
    const start = weekDates[0]
    const end = weekDates[6]
    const startMonth = start.toLocaleDateString(DEFAULT_LOCALE, { month: 'short' })
    const endMonth = end.toLocaleDateString(DEFAULT_LOCALE, { month: 'short' })
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  }, [weekDates])

  // Business hours only (6 AM to 11 PM)
  const displayHours = HOURS.filter(h => h >= 6 && h <= 23)

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 px-2">
        <Button variant="ghost" size="icon" onClick={onPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{weekRangeStr}</h3>
        <Button variant="ghost" size="icon" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b">
            <div className="p-2" /> {/* Time column spacer */}
            {weekDates.map((date, i) => (
              <motion.div
                key={i}
                className={cn(
                  'p-2 text-center border-l',
                  isToday(date) && 'bg-primary/5'
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <p className="text-sm text-muted-foreground">{DAYS[i]}</p>
                <p className={cn(
                  'text-lg font-semibold',
                  isToday(date) && 'text-primary'
                )}>
                  {date.getDate()}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Time rows */}
          <div className="relative">
            {displayHours.map(hour => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                {/* Time label */}
                <div className="p-2 text-xs text-muted-foreground text-right pr-3 border-r">
                  {formatHour(hour)}
                </div>

                {/* Day cells */}
                {weekDates.map((date, dayIndex) => {
                  const dateKey = date.toISOString().split('T')[0]
                  const cellPosts = postsByDayHour[dateKey]?.[hour] || []

                  return (
                    <motion.div
                      key={`${dateKey}-${hour}`}
                      className={cn(
                        'relative min-h-[60px] border-l p-1',
                        'hover:bg-accent/30 transition-colors',
                        isToday(date) && 'bg-primary/5',
                        // Highlight current hour
                        isToday(date) && hour === currentHour && 'bg-primary/10'
                      )}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, date, hour)}
                      onClick={() => onCreatePost(date, hour)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (dayIndex + hour * 7) * 0.002 }}
                    >
                      {/* Current time indicator */}
                      {isToday(date) && hour === currentHour && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-primary z-10 pointer-events-none"
                          style={{ top: `${(currentMinutes / 60) * 100}%` }}
                        >
                          <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-primary" />
                        </div>
                      )}

                      {/* Posts */}
                      <AnimatePresence>
                        {cellPosts.map((post, idx) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ marginTop: idx > 0 ? 4 : 0 }}
                          >
                            <CalendarPostCard
                              post={post}
                              compact
                              draggable
                              onEdit={onEditPost}
                              onDelete={onDeletePost}
                              onDuplicate={onDuplicatePost}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Empty cell quick add */}
                      {cellPosts.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
