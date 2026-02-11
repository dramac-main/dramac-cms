'use client'

/**
 * Content Calendar Component
 * 
 * Phase EM-54: Social Media Management Module
 * Visual content calendar like Hootsuite/Sprout Social
 */

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Edit,
  Trash,
  Copy,
  CircleCheck,
  CircleX,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { 
  SocialAccount, 
  SocialPost,
  SocialPlatform,
} from '../types'
import { PLATFORM_CONFIGS } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface ContentCalendarProps {
  posts: SocialPost[]
  accounts: SocialAccount[]
  onCreatePost: (date?: Date) => void
  onEditPost: (post: SocialPost) => void
  onDeletePost: (postId: string) => void
  onDuplicatePost: (post: SocialPost) => void
  onApprovePost?: (postId: string) => void
  onRejectPost?: (postId: string) => void
  onPublishNow?: (postId: string) => void
  className?: string
}

type ViewMode = 'month' | 'week' | 'day' | 'list'

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
  
  // Add days from next month
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString()
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContentCalendar({
  posts,
  accounts,
  onCreatePost,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
  onApprovePost,
  onRejectPost,
  onPublishNow,
  className,
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Get platform helpers
  const getPlatformIcon = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.icon || 'App'
  }

  const getPlatformColor = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.color || '#6B7280'
  }

  // Navigation
  const navigateMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const navigateWeek = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getTime() + delta * 7 * 24 * 60 * 60 * 1000))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Platform filter
      if (selectedPlatforms.length > 0) {
        const account = accounts.find(a => a.id === post.accountId)
        if (!account || !selectedPlatforms.includes(account.platform)) {
          return false
        }
      }
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(post.status)) {
        return false
      }
      return true
    })
  }, [posts, accounts, selectedPlatforms, selectedStatuses])

  // Get posts for a specific day
  const getPostsForDay = useCallback((date: Date) => {
    return filteredPosts.filter(post => {
      const postDate = post.scheduledAt ? new Date(post.scheduledAt) : null
      return postDate && isSameDay(postDate, date)
    })
  }, [filteredPosts])

  // Calendar days
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate])

  // Status badge
  const getStatusBadge = (status: SocialPost['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>
      case 'pending_approval':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-600">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'published':
        return <Badge variant="default" className="bg-green-600">Published</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Post card
  const PostCard = ({ post, compact = false }: { post: SocialPost; compact?: boolean }) => {
    const account = accounts.find(a => a.id === post.accountId)
    
    return (
      <div
        className={cn(
          'rounded-md p-2 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all',
          'border border-border bg-card',
          compact ? 'text-xs' : 'text-sm'
        )}
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: account ? getPlatformColor(account.platform) : '#6B7280',
        }}
        onClick={() => onEditPost(post)}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {account && (
              <span className="flex-shrink-0">
                {getPlatformIcon(account.platform)}
              </span>
            )}
            <span className="font-medium truncate">
              {post.scheduledAt && new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditPost(post)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicatePost(post)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {post.status === 'pending_approval' && onApprovePost && (
                <DropdownMenuItem onClick={() => onApprovePost(post.id)}>
                  <CircleCheck className="h-4 w-4 mr-2 text-green-600" />
                  Approve
                </DropdownMenuItem>
              )}
              {post.status === 'pending_approval' && onRejectPost && (
                <DropdownMenuItem onClick={() => onRejectPost(post.id)}>
                  <CircleX className="h-4 w-4 mr-2 text-red-600" />
                  Reject
                </DropdownMenuItem>
              )}
              {['draft', 'scheduled', 'approved'].includes(post.status) && onPublishNow && (
                <DropdownMenuItem onClick={() => onPublishNow(post.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeletePost(post.id)}
                className="text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {!compact && (
          <>
            <p className="text-muted-foreground line-clamp-2 mt-1">
              {post.content}
            </p>
            <div className="mt-1">
              {getStatusBadge(post.status)}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(selectedPlatforms.length > 0 || selectedStatuses.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedPlatforms.length + selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Platforms</h4>
                  <div className="space-y-2">
                    {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
                      <label key={platform} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedPlatforms.includes(platform as SocialPlatform)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlatforms([...selectedPlatforms, platform as SocialPlatform])
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                            }
                          }}
                        />
                        <span>{config.icon}</span>
                        <span>{config.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Status</h4>
                  <div className="space-y-2">
                    {['draft', 'scheduled', 'pending_approval', 'published'].map((status) => (
                      <label key={status} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStatuses([...selectedStatuses, status])
                            } else {
                              setSelectedStatuses(selectedStatuses.filter(s => s !== status))
                            }
                          }}
                        />
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
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
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={() => onCreatePost()}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Month View */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                const isToday = isSameDay(date, new Date())
                const dayPosts = getPostsForDay(date)
                
                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[120px] p-2 border-b border-r relative',
                      !isCurrentMonth && 'bg-muted/30',
                      isToday && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          !isCurrentMonth && 'text-muted-foreground',
                          isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                        )}
                      >
                        {date.getDate()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => onCreatePost(date)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <PostCard key={post.id} post={post} compact />
                      ))}
                      {dayPosts.length > 3 && (
                        <button className="text-xs text-muted-foreground hover:text-foreground">
                          +{dayPosts.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No posts found</p>
                <Button variant="link" onClick={() => onCreatePost()}>
                  Create your first post
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts
                  .sort((a, b) => {
                    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
                    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
                    return dateA - dateB
                  })
                  .map(post => (
                    <PostCard key={post.id} post={post} />
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContentCalendar
