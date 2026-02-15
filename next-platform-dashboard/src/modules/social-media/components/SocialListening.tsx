'use client'

/**
 * Social Listening Component
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Social listening dashboard for keyword tracking and brand mentions
 */

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Ear,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Archive,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Minus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/locale-config'
import type { ListeningKeyword, BrandMention, KeywordType, MentionStatus } from '@/modules/social-media/types'

const KEYWORD_TYPES: { value: KeywordType; label: string; color: string }[] = [
  { value: 'brand', label: 'Brand', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'product', label: 'Product', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'competitor', label: 'Competitor', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'industry', label: 'Industry', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'hashtag', label: 'Hashtag', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
]

const SENTIMENT_ICONS = {
  positive: { icon: ThumbsUp, color: 'text-green-600 dark:text-green-400' },
  neutral: { icon: Minus, color: 'text-muted-foreground' },
  negative: { icon: ThumbsDown, color: 'text-red-600 dark:text-red-400' },
}

const MENTION_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'archived', label: 'Archived' },
]

interface SocialListeningProps {
  siteId: string
  keywords: ListeningKeyword[]
  mentions: BrandMention[]
  stats: { positive: number; neutral: number; negative: number; total: number; newCount: number }
  onAddKeyword: (keyword: string, type: KeywordType) => Promise<{ keyword: ListeningKeyword | null; error: string | null }>
  onToggleKeyword: (keywordId: string, isActive: boolean) => Promise<{ success: boolean; error: string | null }>
  onDeleteKeyword: (keywordId: string) => Promise<{ success: boolean; error: string | null }>
  onUpdateMentionStatus: (mentionId: string, status: MentionStatus) => Promise<{ success: boolean; error: string | null }>
}

export function SocialListening({
  siteId,
  keywords,
  mentions,
  stats,
  onAddKeyword,
  onToggleKeyword,
  onDeleteKeyword,
  onUpdateMentionStatus,
}: SocialListeningProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newKeywordType, setNewKeywordType] = useState<KeywordType>('brand')
  const [isAdding, setIsAdding] = useState(false)
  const [mentionTab, setMentionTab] = useState('all')

  const handleAddKeyword = useCallback(async () => {
    if (!newKeyword.trim()) return
    setIsAdding(true)
    const result = await onAddKeyword(newKeyword.trim(), newKeywordType)
    setIsAdding(false)
    if (result.error) {
      toast.error('Failed to add keyword', { description: result.error })
    } else {
      toast.success(`Keyword "${newKeyword}" added`)
      setNewKeyword('')
      setAddDialogOpen(false)
    }
  }, [newKeyword, newKeywordType, onAddKeyword])

  const handleToggleKeyword = useCallback(async (keywordId: string, isActive: boolean) => {
    const result = await onToggleKeyword(keywordId, isActive)
    if (result.error) {
      toast.error('Failed to update keyword', { description: result.error })
    }
  }, [onToggleKeyword])

  const handleDeleteKeyword = useCallback(async (keywordId: string) => {
    const result = await onDeleteKeyword(keywordId)
    if (result.error) {
      toast.error('Failed to delete keyword', { description: result.error })
    } else {
      toast.success('Keyword removed')
    }
  }, [onDeleteKeyword])

  const handleUpdateMention = useCallback(async (mentionId: string, status: MentionStatus) => {
    const result = await onUpdateMentionStatus(mentionId, status)
    if (result.error) {
      toast.error('Failed to update mention', { description: result.error })
    }
  }, [onUpdateMentionStatus])

  const filteredMentions = useMemo(() => {
    if (mentionTab === 'all') return mentions
    return mentions.filter(m => m.status === mentionTab)
  }, [mentions, mentionTab])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(dateStr))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Social Listening</h2>
          <p className="text-muted-foreground">Track brand mentions and keywords across platforms</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Add Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Listening Keyword</DialogTitle>
              <DialogDescription>
                Track mentions of a keyword across social platforms.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="keyword-input" className="text-sm font-medium">
                  Keyword
                </label>
                <Input
                  id="keyword-input"
                  placeholder="Enter keyword or phrase..."
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                />
              </div>
              <div>
                <label htmlFor="keyword-type" className="text-sm font-medium">
                  Type
                </label>
                <Select value={newKeywordType} onValueChange={(v) => setNewKeywordType(v as KeywordType)}>
                  <SelectTrigger id="keyword-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KEYWORD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddKeyword} disabled={isAdding || !newKeyword.trim()}>
                {isAdding ? 'Adding...' : 'Add Keyword'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Mentions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Positive</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Neutral</p>
            </div>
            <p className="text-2xl font-bold">{stats.neutral}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-600" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Negative</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Keywords Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Tracked Keywords</CardTitle>
            <CardDescription>
              {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} tracked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {keywords.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Ear className="h-8 w-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">No keywords tracked yet</p>
                <p className="text-xs mt-1">Add your first keyword to start listening</p>
              </div>
            ) : (
              keywords.map(kw => {
                const typeConfig = KEYWORD_TYPES.find(t => t.value === kw.keywordType)
                return (
                  <div
                    key={kw.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{kw.keyword}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeConfig?.color || ''}`}>
                          {typeConfig?.label || kw.keywordType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kw.mentionsCount} mention{kw.mentionsCount !== 1 ? 's' : ''}
                        {kw.lastMentionAt ? ` · Last: ${formatDate(kw.lastMentionAt)}` : ''}
                      </p>
                    </div>
                    <Switch
                      checked={kw.isActive}
                      onCheckedChange={(checked) => handleToggleKeyword(kw.id, checked)}
                      aria-label={`Toggle ${kw.keyword} tracking`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteKeyword(kw.id)}
                      aria-label={`Delete keyword: ${kw.keyword}`}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Mentions Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Brand Mentions</CardTitle>
                <CardDescription>
                  {stats.newCount > 0 ? `${stats.newCount} new mention${stats.newCount !== 1 ? 's' : ''}` : 'No new mentions'}
                </CardDescription>
              </div>
            </div>
            <Tabs value={mentionTab} onValueChange={setMentionTab} aria-label="Mention status filter">
              <TabsList>
                {MENTION_TABS.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filteredMentions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">No mentions found</p>
                <p className="text-xs mt-1">
                  {keywords.length === 0
                    ? 'Configure listening keywords to start tracking mentions'
                    : 'Mentions will appear here as they are discovered'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMentions.map(mention => {
                  const sentimentConfig = mention.sentiment
                    ? SENTIMENT_ICONS[mention.sentiment as keyof typeof SENTIMENT_ICONS]
                    : null
                  const SentimentIcon = sentimentConfig?.icon

                  return (
                    <div
                      key={mention.id}
                      className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {mention.authorName || mention.authorHandle || 'Unknown'}
                          </span>
                          {mention.authorHandle && (
                            <span className="text-xs text-muted-foreground">@{mention.authorHandle}</span>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {mention.platform}
                          </Badge>
                          {SentimentIcon && (
                            <SentimentIcon className={`h-3.5 w-3.5 ${sentimentConfig?.color}`} strokeWidth={1.5} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{mention.content}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(mention.mentionedAt)}</span>
                          {mention.engagement > 0 && <span>{mention.engagement} engagements</span>}
                          {mention.reach > 0 && <span>{mention.reach.toLocaleString()} reach</span>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Mention actions">
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateMention(mention.id, 'reviewed')}>
                            <Eye className="h-4 w-4 mr-2" strokeWidth={1.5} />
                            Mark Reviewed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMention(mention.id, 'engaged')}>
                            <MessageSquare className="h-4 w-4 mr-2" strokeWidth={1.5} />
                            Mark Engaged
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMention(mention.id, 'archived')}>
                            <Archive className="h-4 w-4 mr-2" strokeWidth={1.5} />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMention(mention.id, 'irrelevant')}>
                            <X className="h-4 w-4 mr-2" strokeWidth={1.5} />
                            Mark Irrelevant
                          </DropdownMenuItem>
                          {mention.postUrl && (
                            <DropdownMenuItem asChild>
                              <a href={mention.postUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                View Original
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
