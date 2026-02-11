'use client'

/**
 * Social Inbox Component
 * 
 * Phase EM-54: Social Media Management Module
 * Unified inbox like Hootsuite/Sprout Social
 */

import { useState, useMemo } from 'react'
import {
  MessageCircle,
  Heart,
  AtSign,
  Send,
  Archive,
  Trash2,
  Flag,
  User,
  CheckCheck,
  Star,
  Tag,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Reply,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { 
  SocialAccount, 
  SocialPlatform,
  InboxItem,
  SavedReply,
} from '../types'
import { PLATFORM_CONFIGS } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface SocialInboxProps {
  items: InboxItem[]
  accounts: SocialAccount[]
  savedReplies: SavedReply[]
  onReply: (itemId: string, message: string) => Promise<void>
  onMarkAsRead: (itemIds: string[]) => Promise<void>
  onArchive: (itemIds: string[]) => Promise<void>
  onAssign: (itemId: string, userId: string) => Promise<void>
  onFlag: (itemId: string, flagged: boolean) => Promise<void>
  onMarkAsSpam: (itemId: string) => Promise<void>
  onRefresh: () => void
  isLoading?: boolean
}

// Sentiment dot color helper
function getSentimentDot(sentiment: string | null | undefined) {
  switch (sentiment) {
    case 'positive':
      return <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" title="Positive sentiment" />
    case 'negative':
      return <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" title="Negative sentiment" />
    case 'neutral':
      return <div className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" title="Neutral sentiment" />
    default:
      return null
  }
}

// Format follower count
function formatFollowerCount(count: number | null | undefined): string | null {
  if (!count || count < 1000) return null
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SocialInbox({
  items,
  accounts,
  savedReplies,
  onReply,
  onMarkAsRead,
  onArchive,
  onAssign,
  onFlag,
  onMarkAsSpam,
  onRefresh,
  isLoading = false,
}: SocialInboxProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'messages' | 'mentions'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Derive the account for the selected item
  const selectedAccount = selectedItem ? accounts.find(a => a.id === selectedItem.accountId) : null

  // Platform helpers
  const getPlatformIcon = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.icon || 'App'
  }

  const getPlatformColor = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.color || '#6B7280'
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type filter
      if (activeTab !== 'all') {
        if (activeTab === 'comments' && item.type !== 'comment') return false
        if (activeTab === 'messages' && item.type !== 'message') return false
        if (activeTab === 'mentions' && item.type !== 'mention') return false
      }
      // Platform filter
      if (selectedPlatform !== 'all') {
        const account = accounts.find(a => a.id === item.accountId)
        if (!account || account.platform !== selectedPlatform) return false
      }
      // Status filter
      if (selectedStatus === 'unread' && item.isRead) return false
      if (selectedStatus === 'flagged' && !item.isFlagged) return false
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesContent = (item.content || '').toLowerCase().includes(query)
        const matchesAuthor = (item.authorName || '').toLowerCase().includes(query)
        if (!matchesContent && !matchesAuthor) return false
      }
      return true
    })
  }, [items, activeTab, selectedPlatform, selectedStatus, searchQuery, accounts])

  // Get type icon
  const getTypeIcon = (type: InboxItem['type']) => {
    switch (type) {
      case 'comment': return <MessageCircle className="h-4 w-4" />
      case 'message': return <Send className="h-4 w-4" />
      case 'mention': return <AtSign className="h-4 w-4" />
      case 'review': return <Star className="h-4 w-4" />
      case 'reaction': return <Heart className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  // Handle reply
  const handleReply = async () => {
    if (!selectedItem || !replyText.trim()) return
    setIsReplying(true)
    try {
      await onReply(selectedItem.id, replyText)
      setReplyText('')
    } finally {
      setIsReplying(false)
    }
  }

  // Handle bulk actions
  const handleBulkMarkAsRead = () => {
    onMarkAsRead(selectedItems)
    setSelectedItems([])
  }

  const handleBulkArchive = () => {
    onArchive(selectedItems)
    setSelectedItems([])
  }

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Counts
  const unreadCount = items.filter(i => !i.isRead).length
  const commentsCount = items.filter(i => i.type === 'comment').length
  const messagesCount = items.filter(i => i.type === 'message').length
  const mentionsCount = items.filter(i => i.type === 'mention').length

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
      {/* Left Panel - Item List */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Inbox</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
                {isLoading ? 'Syncing...' : 'Sync'}
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inbox..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
                  <SelectItem key={platform} value={platform}>
                    {config.icon} {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b px-2">
            <TabsTrigger value="all" className="flex-1">
              All {unreadCount > 0 && <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex-1">
              <MessageCircle className="h-3 w-3 mr-1" />
              {commentsCount}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1">
              <Send className="h-3 w-3 mr-1" />
              {messagesCount}
            </TabsTrigger>
            <TabsTrigger value="mentions" className="flex-1">
              <AtSign className="h-3 w-3 mr-1" />
              {mentionsCount}
            </TabsTrigger>
          </TabsList>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="p-2 border-b bg-muted/50 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} selected
              </span>
              <Button variant="ghost" size="sm" onClick={handleBulkMarkAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark read
              </Button>
              <Button variant="ghost" size="sm" onClick={handleBulkArchive}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            </div>
          )}

          {/* Item List */}
          <ScrollArea className="flex-1">
            <TabsContent value={activeTab} className="m-0">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No items found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredItems.map(item => {
                    const account = accounts.find(a => a.id === item.accountId)
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3',
                          !item.isRead && 'bg-primary/5',
                          selectedItem?.id === item.id && 'bg-muted'
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={item.authorAvatar || undefined} />
                          <AvatarFallback>{(item.authorName || '?')[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {item.authorName || 'Unknown'}
                            </span>
                            {(item as any).authorVerified && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] flex-shrink-0">✓</Badge>
                            )}
                            {formatFollowerCount((item as any).authorFollowers) && (
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                {formatFollowerCount((item as any).authorFollowers)}
                              </span>
                            )}
                            {getSentimentDot((item as any).sentiment)}
                            {item.isFlagged && (
                              <Flag className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                            )}
                            {!item.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {account && (
                              <span className="text-xs">
                                {getPlatformIcon(account.platform)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {getTypeIcon(item.type)}
                            </span>
                            {(item as any).priority === 'urgent' && (
                              <Badge variant="destructive" className="h-4 px-1 text-[10px]">Urgent</Badge>
                            )}
                            {(item as any).priority === 'high' && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-orange-100 text-orange-700">High</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.receivedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Right Panel - Item Detail */}
      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedItem.authorAvatar || undefined} />
                  <AvatarFallback>{(selectedItem.authorName || '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedItem.authorName || 'Unknown'}</p>
                    {(selectedItem as any).authorVerified && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">✓ Verified</Badge>
                    )}
                    {formatFollowerCount((selectedItem as any).authorFollowers) && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {formatFollowerCount((selectedItem as any).authorFollowers)} followers
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{selectedItem.authorHandle || selectedItem.authorName || 'unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFlag(selectedItem.id, !selectedItem.isFlagged)}
                >
                  <Flag className={cn('h-4 w-4', selectedItem.isFlagged && 'text-yellow-600 fill-yellow-600')} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onMarkAsRead([selectedItem.id])}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive([selectedItem.id])}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onMarkAsSpam(selectedItem.id)}
                      className="text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Mark as spam
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Original Post Context */}
                {selectedItem.postContent && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Original post:</p>
                    <p className="text-sm">{selectedItem.postContent}</p>
                  </div>
                )}
                
                {/* Item Content */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(selectedItem.type)}
                      <span className="text-xs text-muted-foreground capitalize">
                        {selectedItem.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedItem.receivedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedItem.content}</p>
                    
                    {/* Media */}
                    {selectedItem.mediaUrl && (
                      <div className="mt-3">
                        <img 
                          src={selectedItem.mediaUrl} 
                          alt="" 
                          className="max-w-sm rounded-lg"
                        />
                      </div>
                    )}

                    {/* Sentiment */}
                    {selectedItem.sentiment && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'mt-3',
                          selectedItem.sentiment === 'positive' && 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300',
                          selectedItem.sentiment === 'negative' && 'bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300'
                        )}
                      >
                        {selectedItem.sentiment}
                      </Badge>
                    )}

                    {/* Tags */}
                    {selectedItem.tags && selectedItem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {selectedItem.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply History */}
                {selectedItem.replies && selectedItem.replies.length > 0 && (
                  <div className="border-l-2 pl-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Replies</p>
                    {selectedItem.replies.map((reply, i) => (
                      <div key={i} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.repliedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Reply Box */}
            {['comment', 'message', 'mention'].includes(selectedItem.type) && (
              <div className="p-4 border-t space-y-3">
                {/* Saved Replies */}
                {savedReplies.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Saved Replies
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {savedReplies.map(reply => (
                        <DropdownMenuItem
                          key={reply.id}
                          onClick={() => setReplyText(reply.content)}
                        >
                          <div className="truncate">
                            <p className="font-medium text-sm">{reply.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {reply.content}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleReply} disabled={isReplying || !replyText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {isReplying ? 'Sending...' : `Reply${selectedAccount ? ` on ${selectedAccount.platform.charAt(0).toUpperCase() + selectedAccount.platform.slice(1)}` : ''}`}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Select a message</p>
              <p className="text-muted-foreground">
                Choose an item from the list to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SocialInbox
