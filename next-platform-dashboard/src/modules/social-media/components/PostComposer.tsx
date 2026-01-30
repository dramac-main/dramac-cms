'use client'

/**
 * Post Composer Component
 * 
 * Phase EM-54: Social Media Management Module
 * Comprehensive post composer like Hootsuite/Sprout Social
 */

import { useState, useRef, useCallback } from 'react'
import {
  Image,
  Video,
  Calendar,
  Send,
  X,
  Clock,
  Hash,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { 
  SocialAccount, 
  SocialPlatform, 
  PostMedia 
} from '../types'
import { PLATFORM_CONFIGS } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface PostComposerProps {
  accounts: SocialAccount[]
  onSubmit: (post: {
    content: string
    media: PostMedia[]
    targetAccounts: string[]
    scheduledAt?: string
    timezone?: string
    platformContent?: Partial<Record<SocialPlatform, { content: string }>>
    firstComment?: string
  }) => Promise<void>
  onCancel?: () => void
  initialData?: {
    content: string
    media?: PostMedia[]
    targetAccounts?: string[]
    scheduledAt?: string
  }
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PostComposer({
  accounts,
  onSubmit,
  onCancel,
  initialData,
  className,
}: PostComposerProps) {
  // State
  const [content, setContent] = useState(initialData?.content || '')
  const [media, setMedia] = useState<PostMedia[]>(initialData?.media || [])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    initialData?.targetAccounts || []
  )
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt) : undefined
  )
  const [scheduleTime, setScheduleTime] = useState('12:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('compose')
  const [platformContent, setPlatformContent] = useState<Record<string, string>>({})
  const [firstComment, setFirstComment] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get platform icon
  const getPlatformIcon = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.icon || '📱'
  }

  // Get platform color
  const getPlatformColor = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.color || '#6B7280'
  }

  // Get character count for a platform
  const getCharacterInfo = useCallback((platform: SocialPlatform) => {
    const text = platformContent[platform] || content
    const limit = PLATFORM_CONFIGS[platform]?.characterLimit || 5000
    const count = text.length
    const isOver = count > limit
    const percentage = (count / limit) * 100
    
    return { count, limit, isOver, percentage }
  }, [content, platformContent])

  // Handle account toggle
  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  // Handle media upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) continue

      // Create preview URL
      const url = URL.createObjectURL(file)
      
      const newMedia: PostMedia = {
        id: crypto.randomUUID(),
        type: isImage ? 'image' : 'video',
        url,
        thumbnailUrl: isImage ? url : undefined,
      }
      
      setMedia(prev => [...prev, newMedia])
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove media
  const removeMedia = (mediaId: string) => {
    setMedia(prev => prev.filter(m => m.id !== mediaId))
  }

  // Handle submit
  const handleSubmit = async (publishNow: boolean) => {
    if (!content.trim() || selectedAccounts.length === 0) return

    setIsSubmitting(true)
    try {
      let scheduled: string | undefined
      
      if (!publishNow && scheduledAt) {
        const [hours, minutes] = scheduleTime.split(':').map(Number)
        const scheduleDate = new Date(scheduledAt)
        scheduleDate.setHours(hours, minutes, 0, 0)
        scheduled = scheduleDate.toISOString()
      }

      await onSubmit({
        content,
        media,
        targetAccounts: selectedAccounts,
        scheduledAt: scheduled,
        platformContent: Object.keys(platformContent).length > 0 
          ? Object.fromEntries(
              Object.entries(platformContent)
                .filter(([_, v]) => v)
                .map(([k, v]) => [k, { content: v }])
            ) as Partial<Record<SocialPlatform, { content: string }>>
          : undefined,
        firstComment: firstComment || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get selected platforms
  const selectedPlatforms = selectedAccounts
    .map(id => accounts.find(a => a.id === id)?.platform)
    .filter((p): p is SocialPlatform => !!p)
  const uniquePlatforms = [...new Set(selectedPlatforms)]

  return (
    <Card className={cn('w-full max-w-3xl', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Create Post</span>
          {selectedAccounts.length > 0 && (
            <Badge variant="secondary">
              {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Account Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Post to</Label>
          <div className="flex flex-wrap gap-2">
            {accounts.filter(a => a.status === 'active').map(account => (
              <button
                key={account.id}
                type="button"
                onClick={() => handleAccountToggle(account.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                  selectedAccounts.includes(account.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={account.accountAvatar || undefined} />
                  <AvatarFallback style={{ backgroundColor: getPlatformColor(account.platform) }}>
                    {getPlatformIcon(account.platform)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{account.accountName}</span>
                {selectedAccounts.includes(account.id) && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs for Compose / Platform-specific */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            {uniquePlatforms.length > 1 && (
              <TabsTrigger value="customize">Customize per Platform</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="compose" className="space-y-4 mt-4">
            {/* Main Content */}
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[150px] resize-none"
              />
              
              {/* Character counts */}
              {selectedAccounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uniquePlatforms.map(platform => {
                    const info = getCharacterInfo(platform)
                    return (
                      <div
                        key={platform}
                        className={cn(
                          'flex items-center gap-1 text-xs px-2 py-1 rounded',
                          info.isOver ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                        )}
                      >
                        <span>{getPlatformIcon(platform)}</span>
                        <span>{info.count}/{info.limit}</span>
                        {info.isOver && <AlertCircle className="h-3 w-3" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {media.map(m => (
                  <div key={m.id} className="relative group">
                    {m.type === 'image' ? (
                      <img
                        src={m.url}
                        alt=""
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(m.id)}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* First Comment (for Instagram) */}
            {uniquePlatforms.includes('instagram') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span>📷</span>
                  First Comment (Instagram)
                </Label>
                <Input
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  placeholder="Add hashtags as a first comment..."
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="customize" className="space-y-4 mt-4">
            {uniquePlatforms.map(platform => (
              <div key={platform} className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span>{getPlatformIcon(platform)}</span>
                  {PLATFORM_CONFIGS[platform]?.name}
                </Label>
                <Textarea
                  value={platformContent[platform] || content}
                  onChange={(e) => setPlatformContent(prev => ({
                    ...prev,
                    [platform]: e.target.value
                  }))}
                  placeholder={`Customize for ${PLATFORM_CONFIGS[platform]?.name}...`}
                  className="min-h-[100px] resize-none"
                />
                {(() => {
                  const info = getCharacterInfo(platform)
                  return (
                    <div className={cn(
                      'text-xs',
                      info.isOver ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {info.count}/{info.limit} characters
                    </div>
                  )
                })()}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {/* Media Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4" />
            </Button>

            {/* AI Assist */}
            <Button type="button" variant="ghost" size="sm">
              <Sparkles className="h-4 w-4" />
            </Button>

            {/* Hashtags */}
            <Button type="button" variant="ghost" size="sm">
              <Hash className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}

            {/* Schedule */}
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {scheduledAt ? 'Scheduled' : 'Schedule'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  <CalendarUI
                    mode="single"
                    selected={scheduledAt}
                    onSelect={setScheduledAt}
                    disabled={(date: Date) => date < new Date()}
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  {scheduledAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setScheduledAt(undefined)}
                    >
                      Clear Schedule
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Submit */}
            {scheduledAt ? (
              <Button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !content.trim() || selectedAccounts.length === 0}
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !content.trim() || selectedAccounts.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Publishing...' : 'Publish Now'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PostComposer
