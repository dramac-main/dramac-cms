'use client'

/**
 * Enhanced Post Composer Component
 * 
 * Phase UI-11B: Enhanced post composer with platform previews,
 * improved media handling, and better scheduling UX
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Clock,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  WandSparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { 
  SocialAccount, 
  SocialPlatform, 
  PostMedia 
} from '../types'
import { PLATFORM_CONFIGS } from '../types'
import { ComposerPlatformPreview } from './ui/composer-platform-preview'
import { ComposerMediaUploader } from './ui/composer-media-uploader'
import { ComposerSchedulingPanel } from './ui/composer-scheduling-panel'
import { AIAssistantPanel } from './ui/ai-assistant-panel'

// ============================================================================
// TYPES
// ============================================================================

interface PostComposerEnhancedProps {
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

type ComposerStep = 'compose' | 'preview' | 'schedule'

// ============================================================================
// HELPERS
// ============================================================================

function getCharacterLimit(platform: SocialPlatform): number {
  switch (platform) {
    case 'twitter': return 280
    case 'linkedin': return 3000
    case 'facebook': return 63206
    case 'instagram': return 2200
    case 'tiktok': return 2200
    case 'pinterest': return 500
    case 'youtube': return 5000
    default: return 2000
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PostComposerEnhanced({
  accounts,
  onSubmit,
  onCancel,
  initialData,
  className,
}: PostComposerEnhancedProps) {
  // State
  const [content, setContent] = useState(initialData?.content || '')
  const [media, setMedia] = useState<PostMedia[]>(initialData?.media || [])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    initialData?.targetAccounts || []
  )
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt) : undefined
  )
  const [timezone, setTimezone] = useState('America/New_York')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<ComposerStep>('compose')
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)

  // Group accounts by platform
  const accountsByPlatform = useMemo(() => {
    const grouped: Partial<Record<SocialPlatform, SocialAccount[]>> = {}
    accounts.forEach(account => {
      if (!grouped[account.platform]) {
        grouped[account.platform] = []
      }
      grouped[account.platform]!.push(account)
    })
    return grouped
  }, [accounts])

  // Selected accounts data
  const selectedAccountsData = useMemo(() => {
    return accounts.filter(a => selectedAccounts.includes(a.id))
  }, [accounts, selectedAccounts])

  // Unique platforms from selected accounts
  const selectedPlatforms = useMemo(() => {
    return [...new Set(selectedAccountsData.map(a => a.platform))]
  }, [selectedAccountsData])

  // Character count warnings
  const characterWarnings = useMemo(() => {
    const warnings: { platform: SocialPlatform; count: number; limit: number; over: boolean }[] = []
    selectedPlatforms.forEach(platform => {
      const limit = getCharacterLimit(platform)
      if (content.length > limit * 0.9) {
        warnings.push({
          platform,
          count: content.length,
          limit,
          over: content.length > limit,
        })
      }
    })
    return warnings
  }, [content, selectedPlatforms])

  // Toggle account selection
  const toggleAccount = useCallback((accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }, [])

  // Select all accounts for a platform
  const togglePlatformAccounts = useCallback((platform: SocialPlatform) => {
    const platformAccounts = accountsByPlatform[platform] || []
    const allSelected = platformAccounts.every(a => selectedAccounts.includes(a.id))
    
    if (allSelected) {
      setSelectedAccounts(prev => 
        prev.filter(id => !platformAccounts.find(a => a.id === id))
      )
    } else {
      setSelectedAccounts(prev => [
        ...new Set([...prev, ...platformAccounts.map(a => a.id)])
      ])
    }
  }, [accountsByPlatform, selectedAccounts])

  // Media handlers
  const handleMediaUpload = useCallback(async (files: File[]) => {
    // Convert files to base64 and upload to Supabase Storage
    const newMedia: PostMedia[] = []

    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      try {
        const { uploadSocialMedia } = await import('../lib/media-upload-service')
        const result = await uploadSocialMedia({
          siteId: selectedAccountsData[0]?.siteId || '',
          tenantId: selectedAccountsData[0]?.tenantId || '',
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64,
          },
        })

        if (result.media) {
          newMedia.push(result.media)
        } else {
          // Fallback to local preview if upload fails
          newMedia.push({
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: file.type.startsWith('video/') ? 'video' :
                  file.type === 'image/gif' ? 'gif' : 'image',
            url: URL.createObjectURL(file),
          })
        }
      } catch {
        // Fallback to local preview on error
        newMedia.push({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: file.type.startsWith('video/') ? 'video' :
                file.type === 'image/gif' ? 'gif' : 'image',
          url: URL.createObjectURL(file),
        })
      }
    }

    setMedia(prev => [...prev, ...newMedia])
  }, [selectedAccountsData])

  const handleMediaRemove = useCallback((mediaId: string) => {
    setMedia(prev => prev.filter(m => (m.id || m.url) !== mediaId))
  }, [])

  const handleMediaReorder = useCallback((newMedia: PostMedia[]) => {
    setMedia(newMedia)
  }, [])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!content.trim() || selectedAccounts.length === 0) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        content,
        media,
        targetAccounts: selectedAccounts,
        scheduledAt: scheduledAt?.toISOString(),
        timezone,
      })
    } catch (error) {
      console.error('Failed to submit post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [content, media, selectedAccounts, scheduledAt, timezone, onSubmit])

  // Validation
  const canSubmit = content.trim().length > 0 && 
    selectedAccounts.length > 0 && 
    !characterWarnings.some(w => w.over)

  return (
    <TooltipProvider>
      <div className="flex gap-0">
      <Card className={cn('overflow-hidden flex-1', className)}>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Create Post</CardTitle>
              {selectedAccounts.length > 0 && (
                <Badge variant="secondary">
                  {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {(['compose', 'preview', 'schedule'] as ComposerStep[]).map((step, idx) => (
              <div key={step} className="flex items-center">
                <button
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                    currentStep === step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setCurrentStep(step)}
                >
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className="capitalize">{step}</span>
                </button>
                {idx < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {/* STEP 1: Compose */}
            {currentStep === 'compose' && (
              <motion.div
                key="compose"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                {/* Account selection */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Select Accounts</h4>
                  <div className="space-y-3">
                    {Object.entries(accountsByPlatform).map(([platform, platformAccounts]) => {
                      const config = PLATFORM_CONFIGS[platform as SocialPlatform]
                      if (!config || !platformAccounts) return null
                      const allSelected = platformAccounts.every(a => selectedAccounts.includes(a.id))
                      const someSelected = platformAccounts.some(a => selectedAccounts.includes(a.id))

                      return (
                        <div key={platform} className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={allSelected}
                              // @ts-expect-error - indeterminate is valid
                              indeterminate={someSelected && !allSelected}
                              onCheckedChange={() => togglePlatformAccounts(platform as SocialPlatform)}
                            />
                            <span className="text-sm">{config.icon}</span>
                            <span className="text-sm font-medium">{config.name}</span>
                          </label>
                          <div className="ml-6 space-y-1">
                            {platformAccounts.map(account => (
                              <label
                                key={account.id}
                                className="flex items-center gap-2 cursor-pointer py-1"
                              >
                                <Checkbox
                                  checked={selectedAccounts.includes(account.id)}
                                  onCheckedChange={() => toggleAccount(account.id)}
                                />
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={account.accountAvatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {account.accountName?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{account.accountName}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Content input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Content</h4>
                      <Button
                        variant={showAIPanel ? 'secondary' : 'outline'}
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={() => setShowAIPanel(!showAIPanel)}
                      >
                        <WandSparkles className="h-3 w-3" />
                        AI
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {characterWarnings.map(warning => (
                        <Tooltip key={warning.platform}>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={warning.over ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {PLATFORM_CONFIGS[warning.platform]?.name}: {warning.count}/{warning.limit}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {warning.over 
                              ? `${warning.count - warning.limit} characters over limit`
                              : `${warning.limit - warning.count} characters remaining`
                            }
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="min-h-[150px] resize-none"
                  />
                </div>

                {/* Media uploader */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Media</h4>
                  <ComposerMediaUploader
                    media={media}
                    onUpload={handleMediaUpload}
                    onRemove={handleMediaRemove}
                    onReorder={handleMediaReorder}
                    maxFiles={10}
                  />
                </div>

                {/* Continue button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setCurrentStep('preview')}
                    disabled={!content.trim() || selectedAccounts.length === 0}
                  >
                    Continue to Preview
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4"
              >
                <Tabs
                  value={previewPlatform || selectedPlatforms[0] || 'twitter'}
                  onValueChange={(v) => setPreviewPlatform(v as SocialPlatform)}
                >
                  <TabsList className="mb-4">
                    {selectedPlatforms.map(platform => {
                      const config = PLATFORM_CONFIGS[platform]
                      if (!config) return null
                      return (
                        <TabsTrigger key={platform} value={platform}>
                          <span className="mr-2">{config.icon}</span>
                          {config.name}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {selectedPlatforms.map(platform => {
                    const account = selectedAccountsData.find(a => a.platform === platform)
                    if (!account) return null
                    
                    return (
                      <TabsContent key={platform} value={platform}>
                        <ComposerPlatformPreview
                          platform={platform}
                          content={content}
                          media={media}
                          account={account}
                        />
                      </TabsContent>
                    )
                  })}
                </Tabs>

                {/* Navigation buttons */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('compose')}>
                    Back to Edit
                  </Button>
                  <Button onClick={() => setCurrentStep('schedule')}>
                    Continue to Schedule
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Schedule */}
            {currentStep === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                <ComposerSchedulingPanel
                  scheduledAt={scheduledAt}
                  timezone={timezone}
                  onSchedule={setScheduledAt}
                  onTimezoneChange={setTimezone}
                />

                {/* Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-3">Post Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{selectedAccounts.length} accounts selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{content.length} characters</span>
                      </div>
                      {media.length > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{media.length} media file{media.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {characterWarnings.some(w => w.over) && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">
                            Content exceeds limit for some platforms
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('preview')}>
                    Back to Preview
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Now
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit || !scheduledAt || isSubmitting}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      <AnimatePresence>
        {showAIPanel && (
          <AIAssistantPanel
            isOpen={showAIPanel}
            onClose={() => setShowAIPanel(false)}
            currentContent={content}
            currentPlatform={selectedPlatforms[0] || null}
            siteId={selectedAccountsData[0]?.siteId || ''}
            accountId={selectedAccountsData[0]?.id}
            onUseCaption={(caption) => setContent(caption)}
            onAddHashtags={(tags) => setContent(prev => prev + '\n\n' + tags.map(t => `#${t}`).join(' '))}
            onUseThread={(thread) => setContent(thread.join('\n\n---\n\n'))}
            onImproveContent={(improved) => setContent(improved)}
            onSetScheduleTime={(time) => {
              setScheduledAt(new Date(time))
              setCurrentStep('schedule')
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
