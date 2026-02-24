'use client'

/**
 * Enhanced Content Calendar Component
 * 
 * Phase UI-11B: Enhanced calendar with modern UI,
 * drag-and-drop support, and improved visualization
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { 
  SocialAccount, 
  SocialPost,
  SocialPlatform,
} from '../types'
import { PLATFORM_CONFIGS } from '../types'
import { CalendarDayCell } from './ui/calendar-day-cell'
import { CalendarPostCard } from './ui/calendar-post-card'
import { CalendarWeekView } from './ui/calendar-week-view'

// ============================================================================
// TYPES
// ============================================================================

interface ContentCalendarEnhancedProps {
  posts: SocialPost[]
  accounts: SocialAccount[]
  onCreatePost: (date?: Date, hour?: number) => void
  onEditPost: (post: SocialPost) => void
  onDeletePost: (postId: string) => void
  onDuplicatePost: (post: SocialPost) => void
  onReschedulePost?: (postId: string, newDate: Date) => void
  onApprovePost?: (postId: string) => void
  onRejectPost?: (postId: string) => void
  onPublishNow?: (postId: string) => void
  className?: string
}

type ViewMode = 'month' | 'week' | 'list'

// ============================================================================
// HELPERS
// ============================================================================

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  
  // Add days from previous month
  const startDayOfWeek = firstDay.getDay()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }
  
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }
  
  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length // 6 rows x 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function getPostsForDate(posts: SocialPost[], date: Date): SocialPost[] {
  return posts.filter(post => {
    if (!post.scheduledAt) return false
    return isSameDay(new Date(post.scheduledAt), date)
  })
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContentCalendarEnhanced({
  posts,
  accounts,
  onCreatePost,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
  onReschedulePost,
  onApprovePost,
  onRejectPost,
  onPublishNow,
  className,
}: ContentCalendarEnhancedProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  
  // Filters
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // For platform filtering, look up the account's platform
      if (selectedPlatforms.length > 0) {
        const account = accounts.find(a => a.id === post.accountId)
        if (!account || !selectedPlatforms.includes(account.platform)) {
          return false
        }
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(post.status)) {
        return false
      }
      return true
    })
  }, [posts, accounts, selectedPlatforms, selectedStatuses])

  // Calendar days for current month
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate])

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }, [currentDate])

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }, [currentDate])

  const goToPrevWeek = useCallback(() => {
    setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
  }, [currentDate])

  const goToNextWeek = useCallback(() => {
    setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
  }, [currentDate])

  const goToToday = useCallback(() => {
    setCurrentDate(today)
    setSelectedDate(today)
  }, [today])

  // Handle post drop (reschedule)
  const handleDropPost = useCallback((postId: string, newDate: Date, hour?: number) => {
    if (onReschedulePost) {
      const targetDate = new Date(newDate)
      if (hour !== undefined) {
        targetDate.setHours(hour, 0, 0, 0)
      }
      onReschedulePost(postId, targetDate)
    }
  }, [onReschedulePost])

  // Platform filter toggle
  const togglePlatformFilter = useCallback((platform: SocialPlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }, [])

  // Status filter toggle
  const toggleStatusFilter = useCallback((status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }, [])

  // Get unique platforms from accounts
  const availablePlatforms = useMemo(() => {
    return [...new Set(accounts.map(a => a.platform))]
  }, [accounts])

  const statuses = ['draft', 'scheduled', 'pending_approval', 'published', 'failed']

  return (
    <TooltipProvider>
      <Card className={cn('overflow-hidden', className)}>
        {/* Header */}
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={viewMode === 'week' ? goToPrevWeek : goToPrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="hidden sm:inline-flex"
                >
                  Today
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <CardTitle className="text-lg">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center rounded-lg border p-1">
                <Button
                  variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('month')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('week')}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {(selectedPlatforms.length > 0 || selectedStatuses.length > 0) && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                        {selectedPlatforms.length + selectedStatuses.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    {/* Platform filters */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Platforms</h4>
                      <div className="space-y-2">
                        {availablePlatforms.map(platform => {
                          const config = PLATFORM_CONFIGS[platform]
                          if (!config) return null
                          return (
                            <label
                              key={platform}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedPlatforms.includes(platform)}
                                onCheckedChange={() => togglePlatformFilter(platform)}
                              />
                              <span className="text-sm">{config.icon}</span>
                              <span className="text-sm">{config.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Status filters */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Status</h4>
                      <div className="space-y-2">
                        {statuses.map(status => (
                          <label
                            key={status}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedStatuses.includes(status)}
                              onCheckedChange={() => toggleStatusFilter(status)}
                            />
                            <span className="text-sm capitalize">
                              {status.replace('_', ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Clear filters */}
                    {(selectedPlatforms.length > 0 || selectedStatuses.length > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedPlatforms([])
                          setSelectedStatuses([])
                        }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Create post */}
              <Button size="sm" onClick={() => onCreatePost()}>
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">New Post</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {/* Month View */}
            {viewMode === 'month' && (
              <motion.div
                key="month"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b">
                  {DAYS.map(day => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((date, idx) => (
                    <CalendarDayCell
                      key={idx}
                      date={date}
                      posts={getPostsForDate(filteredPosts, date)}
                      isCurrentMonth={date.getMonth() === currentDate.getMonth()}
                      isToday={isSameDay(date, today)}
                      isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
                      onSelect={setSelectedDate}
                      onCreatePost={onCreatePost}
                      onDropPost={onReschedulePost ? handleDropPost : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
              <motion.div
                key="week"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-[600px]"
              >
                <CalendarWeekView
                  currentDate={currentDate}
                  posts={filteredPosts}
                  onPrevWeek={goToPrevWeek}
                  onNextWeek={goToNextWeek}
                  onCreatePost={onCreatePost}
                  onEditPost={onEditPost}
                  onDeletePost={onDeletePost}
                  onDuplicatePost={onDuplicatePost}
                  onDropPost={onReschedulePost ? handleDropPost : undefined}
                />
              </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-3 max-h-[600px] overflow-y-auto"
              >
                {filteredPosts
                  .sort((a, b) => {
                    if (!a.scheduledAt || !b.scheduledAt) return 0
                    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                  })
                  .map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <CalendarPostCard
                        post={post}
                        draggable={false}
                        onEdit={onEditPost}
                        onDelete={onDeletePost}
                        onDuplicate={onDuplicatePost}
                        onPublishNow={onPublishNow}
                      />
                    </motion.div>
                  ))}

                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No posts scheduled</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => onCreatePost()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first post
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
