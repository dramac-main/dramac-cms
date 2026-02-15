'use client'

/**
 * AI Assistant Panel
 * 
 * PHASE SM-06: Slide-over panel providing AI content generation
 * features inside the post composer.
 */

import { useState, useCallback } from 'react'
import {
  WandSparkles,
  X,
  Hash,
  MessageSquare,
  Sparkles,
  Clock,
  Languages,
  Image as ImageIcon,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  Lightbulb,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  aiGenerateCaptions,
  aiGenerateHashtags,
  aiImproveContent,
  aiGenerateThread,
  aiSuggestPostingTime,
  aiTranslateContent,
} from '../../actions/ai-actions'
import type { SocialPlatform, AICaption } from '../../types'
import { PLATFORM_CONFIGS } from '../../types'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/locale-config'

// ============================================================================
// TYPES
// ============================================================================

interface AIAssistantPanelProps {
  isOpen: boolean
  onClose: () => void
  currentContent: string
  currentPlatform: SocialPlatform | null
  siteId: string
  accountId?: string
  onUseCaption: (caption: string) => void
  onAddHashtags: (tags: string[]) => void
  onUseThread: (thread: string[]) => void
  onImproveContent: (improved: string) => void
  onSetScheduleTime: (time: string) => void
}

type ActiveSection = 'quick' | 'captions' | 'hashtags' | 'thread' | 'improve' | 'time' | 'translate'

// ============================================================================
// COMPONENT
// ============================================================================

export function AIAssistantPanel({
  isOpen,
  onClose,
  currentContent,
  currentPlatform,
  siteId,
  accountId,
  onUseCaption,
  onAddHashtags,
  onUseThread,
  onImproveContent,
  onSetScheduleTime,
}: AIAssistantPanelProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('quick')

  // Caption state
  const [captionTopic, setCaptionTopic] = useState('')
  const [captionTone, setCaptionTone] = useState<'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational' | 'promotional'>('casual')
  const [captionEmoji, setCaptionEmoji] = useState<'none' | 'low' | 'medium' | 'high'>('medium')
  const [captionResults, setCaptionResults] = useState<AICaption[]>([])
  const [isCaptionLoading, setIsCaptionLoading] = useState(false)
  const [captionError, setCaptionError] = useState<string | null>(null)

  // Hashtag state
  const [hashtagResults, setHashtagResults] = useState<Array<{ tag: string; category: string }>>([])
  const [isHashtagLoading, setIsHashtagLoading] = useState(false)
  const [hashtagError, setHashtagError] = useState<string | null>(null)

  // Thread state
  const [threadResults, setThreadResults] = useState<string[]>([])
  const [isThreadLoading, setIsThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)

  // Improve state
  const [improveInstruction, setImproveInstruction] = useState('')
  const [improvedContent, setImprovedContent] = useState('')
  const [isImproveLoading, setIsImproveLoading] = useState(false)
  const [improveError, setImproveError] = useState<string | null>(null)

  // Time state
  const [suggestedTime, setSuggestedTime] = useState('')
  const [timeReason, setTimeReason] = useState('')
  const [isTimeLoading, setIsTimeLoading] = useState(false)

  // Translate state
  const [targetLanguage, setTargetLanguage] = useState('French')
  const [translatedContent, setTranslatedContent] = useState('')
  const [isTranslateLoading, setIsTranslateLoading] = useState(false)

  const platform = currentPlatform || 'facebook'

  // Generate captions
  const handleGenerateCaptions = useCallback(async () => {
    if (!captionTopic.trim()) return
    setIsCaptionLoading(true)
    setCaptionError(null)
    setCaptionResults([])

    const result = await aiGenerateCaptions({
      topic: captionTopic,
      platform,
      tone: captionTone,
      emojiLevel: captionEmoji,
      includeHashtags: true,
      includeCallToAction: true,
    })

    if (result.error) {
      setCaptionError(result.error)
    } else {
      setCaptionResults(result.captions)
    }
    setIsCaptionLoading(false)
  }, [captionTopic, platform, captionTone, captionEmoji])

  // Generate hashtags
  const handleGenerateHashtags = useCallback(async () => {
    if (!currentContent.trim()) return
    setIsHashtagLoading(true)
    setHashtagError(null)

    const result = await aiGenerateHashtags({
      content: currentContent,
      platform,
      includeNiche: true,
      includeTrending: true,
    })

    if (result.error) {
      setHashtagError(result.error)
    } else {
      setHashtagResults(result.hashtags)
    }
    setIsHashtagLoading(false)
  }, [currentContent, platform])

  // Generate thread
  const handleGenerateThread = useCallback(async () => {
    if (!currentContent.trim()) return
    setIsThreadLoading(true)
    setThreadError(null)

    const result = await aiGenerateThread({ content: currentContent })

    if (result.error) {
      setThreadError(result.error)
    } else {
      setThreadResults(result.thread)
    }
    setIsThreadLoading(false)
  }, [currentContent])

  // Improve content
  const handleImproveContent = useCallback(async () => {
    if (!currentContent.trim() || !improveInstruction.trim()) return
    setIsImproveLoading(true)
    setImproveError(null)

    const result = await aiImproveContent({
      content: currentContent,
      platform,
      instruction: improveInstruction,
    })

    if (result.error) {
      setImproveError(result.error)
    } else {
      setImprovedContent(result.improved)
    }
    setIsImproveLoading(false)
  }, [currentContent, platform, improveInstruction])

  // Suggest time
  const handleSuggestTime = useCallback(async () => {
    setIsTimeLoading(true)

    const result = await aiSuggestPostingTime({
      siteId,
      platform,
      contentType: 'text',
      accountId,
    })

    if (!result.error) {
      setSuggestedTime(result.suggestedTime)
      setTimeReason(result.reason)
    }
    setIsTimeLoading(false)
  }, [siteId, platform, accountId])

  // Translate
  const handleTranslate = useCallback(async () => {
    if (!currentContent.trim()) return
    setIsTranslateLoading(true)

    const result = await aiTranslateContent({
      content: currentContent,
      targetLanguage,
      preserveTone: true,
    })

    if (!result.error) {
      setTranslatedContent(result.translated)
    }
    setIsTranslateLoading(false)
  }, [currentContent, targetLanguage])

  if (!isOpen) return null

  return (
    <motion.div
      className="w-80 border-l bg-background flex flex-col h-full"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Quick Actions */}
          {activeSection === 'quick' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setActiveSection('captions')}
                >
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-xs">Generate Caption</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setActiveSection('hashtags')}
                >
                  <Hash className="h-4 w-4 text-blue-500" />
                  <span className="text-xs">Suggest Hashtags</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setActiveSection('thread')}
                >
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-xs">Create Thread</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setActiveSection('improve')}
                >
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-xs">Improve Content</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setActiveSection('time')}
                >
                  <Clock className="h-4 w-4 text-teal-500" />
                  <span className="text-xs">Best Post Time</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setActiveSection('translate')}
                >
                  <Languages className="h-4 w-4 text-red-500" />
                  <span className="text-xs">Translate</span>
                </Button>
              </div>
            </div>
          )}

          {/* Caption Generator */}
          {activeSection === 'captions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Caption Generator</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('quick')}>
                  ← Back
                </Button>
              </div>

              <Input
                placeholder="What's the topic?"
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
              />

              <Select value={captionTone} onValueChange={(v) => setCaptionTone(v as typeof captionTone)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                </SelectContent>
              </Select>

              <Select value={captionEmoji} onValueChange={(v) => setCaptionEmoji(v as typeof captionEmoji)}>
                <SelectTrigger>
                  <SelectValue placeholder="Emoji level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Emojis</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                onClick={handleGenerateCaptions}
                disabled={!captionTopic.trim() || isCaptionLoading}
              >
                {isCaptionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isCaptionLoading ? 'Generating...' : 'Generate Captions'}
              </Button>

              {captionError && (
                <p className="text-sm text-destructive">{captionError}</p>
              )}

              {isCaptionLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              )}

              {captionResults.map((caption, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{caption.content}</p>
                    {caption.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {caption.hashtags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-xs">{caption.tone}</Badge>
                      <div className="flex-1" />
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const fullContent = caption.hashtags.length > 0
                            ? `${caption.content}\n\n${caption.hashtags.map(t => `#${t}`).join(' ')}`
                            : caption.content
                          onUseCaption(fullContent)
                        }}
                      >
                        Use This
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Hashtag Suggestions */}
          {activeSection === 'hashtags' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Hashtag Suggestions</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('quick')}>
                  ← Back
                </Button>
              </div>

              {!currentContent.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Write some content first, then generate hashtag suggestions.
                </p>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={handleGenerateHashtags}
                    disabled={isHashtagLoading}
                  >
                    {isHashtagLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Hash className="h-4 w-4 mr-2" />
                    )}
                    {isHashtagLoading ? 'Analyzing...' : 'Generate Hashtags'}
                  </Button>

                  {hashtagError && (
                    <p className="text-sm text-destructive">{hashtagError}</p>
                  )}

                  {hashtagResults.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onAddHashtags(hashtagResults.map(h => h.tag))}
                      >
                        Add All Hashtags
                      </Button>

                      {['popular', 'niche', 'trending', 'branded'].map(category => {
                        const categoryTags = hashtagResults.filter(h => h.category === category)
                        if (categoryTags.length === 0) return null
                        return (
                          <div key={category}>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                              {category}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {categoryTags.map(h => (
                                <Badge
                                  key={h.tag}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => onAddHashtags([h.tag])}
                                >
                                  #{h.tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Thread Creator */}
          {activeSection === 'thread' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Thread Creator</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('quick')}>
                  ← Back
                </Button>
              </div>

              {!currentContent.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Write your long-form content first, then break it into a thread.
                </p>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={handleGenerateThread}
                    disabled={isThreadLoading}
                  >
                    {isThreadLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    {isThreadLoading ? 'Creating Thread...' : 'Create Thread'}
                  </Button>

                  {threadError && (
                    <p className="text-sm text-destructive">{threadError}</p>
                  )}

                  {threadResults.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onUseThread(threadResults)}
                      >
                        Use This Thread
                      </Button>

                      <div className="space-y-2">
                        {threadResults.map((tweet, idx) => (
                          <Card key={idx}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="flex-shrink-0 text-xs">
                                  {idx + 1}
                                </Badge>
                                <p className="text-sm whitespace-pre-wrap">{tweet}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-right">
                                {tweet.length}/280
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Content Improver */}
          {activeSection === 'improve' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Improve Content</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('quick')}>
                  ← Back
                </Button>
              </div>

              {!currentContent.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Write some content first, then use AI to improve it.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {['Make it shorter', 'More professional', 'Add urgency', 'Make it funnier', 'More engaging', 'Add CTA'].map(instruction => (
                      <Button
                        key={instruction}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setImproveInstruction(instruction)}
                      >
                        {instruction}
                      </Button>
                    ))}
                  </div>

                  <Input
                    placeholder="Or type custom instruction..."
                    value={improveInstruction}
                    onChange={(e) => setImproveInstruction(e.target.value)}
                  />

                  <Button
                    className="w-full"
                    onClick={handleImproveContent}
                    disabled={!improveInstruction.trim() || isImproveLoading}
                  >
                    {isImproveLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {isImproveLoading ? 'Improving...' : 'Improve'}
                  </Button>

                  {improveError && (
                    <p className="text-sm text-destructive">{improveError}</p>
                  )}

                  {improvedContent && (
                    <Card>
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm whitespace-pre-wrap">{improvedContent}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => onImproveContent(improvedContent)}
                        >
                          Use This Version
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Time Suggester */}
          {activeSection === 'time' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Best Time to Post</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('quick')}>
                  ← Back
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={handleSuggestTime}
                disabled={isTimeLoading}
              >
                {isTimeLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                {isTimeLoading ? 'Analyzing...' : 'Suggest Best Time'}
              </Button>

              {suggestedTime && (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {new Date(suggestedTime).toLocaleString(DEFAULT_LOCALE, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: DEFAULT_TIMEZONE,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{timeReason}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => onSetScheduleTime(suggestedTime)}
                    >
                      Schedule for This Time
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Translate */}
          {activeSection === 'translate' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Translate Content</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('quick')}>
                  ← Back
                </Button>
              </div>

              {!currentContent.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Write some content first, then translate it.
                </p>
              ) : (
                <>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Swahili">Swahili</SelectItem>
                      <SelectItem value="Bemba">Bemba</SelectItem>
                      <SelectItem value="Nyanja">Nyanja</SelectItem>
                      <SelectItem value="Chinese (Simplified)">Chinese</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full"
                    onClick={handleTranslate}
                    disabled={isTranslateLoading}
                  >
                    {isTranslateLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Languages className="h-4 w-4 mr-2" />
                    )}
                    {isTranslateLoading ? 'Translating...' : `Translate to ${targetLanguage}`}
                  </Button>

                  {translatedContent && (
                    <Card>
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm whitespace-pre-wrap">{translatedContent}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => onUseCaption(translatedContent)}
                        >
                          Use Translation
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  )
}
