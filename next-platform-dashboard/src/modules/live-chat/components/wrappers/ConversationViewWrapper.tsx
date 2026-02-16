'use client'

/**
 * ConversationViewWrapper — Full agent chat interface
 *
 * Two-panel layout: Chat area (center) + Visitor info (right)
 * Realtime messages, typing indicators, canned responses, file upload
 */

import { useState, useRef, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
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
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  MoreVertical,
  User,
  Mail,
  Phone,
  Globe,
  Monitor,
  Tag,
  Link as LinkIcon,
  Loader2,
  Plus,
  X,
  Star,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { MessageBubble } from '../shared/MessageBubble'
import { MessageInput } from '../shared/MessageInput'
import { TypingIndicator } from '../shared/TypingIndicator'
import { ConversationStatusBadge } from '../shared/ConversationStatusBadge'
import { ChannelBadge } from '../shared/ChannelBadge'
import { PriorityBadge } from '../shared/PriorityBadge'
import { useChatRealtime } from '@/modules/live-chat/hooks/use-chat-realtime'
import {
  assignConversation,
  resolveConversation,
  closeConversation,
  reopenConversation,
  updateConversationPriority,
  markConversationRead,
  transferConversation,
  updateConversationTags,
} from '@/modules/live-chat/actions/conversation-actions'
import {
  sendMessage,
  getMessages,
} from '@/modules/live-chat/actions/message-actions'
import type {
  ChatConversation,
  ChatMessage,
  ChatAgent,
  ChatDepartment,
  CannedResponse,
  ChatVisitor,
  ConversationPriority,
} from '@/modules/live-chat/types'

interface ConversationViewWrapperProps {
  conversation: ChatConversation
  initialMessages: ChatMessage[]
  agents: ChatAgent[]
  departments: ChatDepartment[]
  cannedResponses: CannedResponse[]
  visitor: ChatVisitor | null
  siteId: string
  totalMessages: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ConversationViewWrapper({
  conversation: initialConversation,
  initialMessages,
  agents,
  departments,
  cannedResponses,
  visitor,
  siteId,
  totalMessages,
}: ConversationViewWrapperProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [conversation, setConversation] = useState(initialConversation)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialMessages.length < totalMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [tagInput, setTagInput] = useState('')

  // Typing state managed locally
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Set up notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJ0qFrNHgykg3MVN3msnq1mxEOUVniLjJ4ddySDlBZYa2x+DVfEQ+QmeJu8jf0oJINTxxl7/K4tGIRTY4dom2weXVi0Q3OXiKt8Pp0YlEN0B3lL/H5deHQzs+d5O+xeXXjEI1PXmWwsXm14lCNj96m8LH5taIQjU+e5fCxOfYiUI1PnyXwsfo14lCNT59l8LI6NeJQjU+e5fCxOfYiUI1PnyXwsfo14lCNT59l8LI6NeJQjU=')
      audioRef.current.volume = 0.4
    }
  }, [])

  // Realtime: new messages + typing
  const { sendTypingStart, sendTypingStop } = useChatRealtime(
    conversation.id,
    {
      onNewMessage: (newMsg: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Toast + sound notification for visitor messages
        if (newMsg.senderType === 'visitor') {
          audioRef.current?.play().catch(() => {})
          toast.info(`${newMsg.senderName || 'Visitor'}`, {
            description: (newMsg.content || '').substring(0, 80) + ((newMsg.content || '').length > 80 ? '...' : ''),
            duration: 5000,
          })
        }
      },
      onTypingStart: (senderId: string, senderName: string) => {
        setTypingUsers((prev) =>
          prev.includes(senderId) ? prev : [...prev, senderId]
        )
      },
      onTypingStop: (senderId: string) => {
        setTypingUsers((prev) => prev.filter((id) => id !== senderId))
      },
    }
  )

  // Mark as read on mount
  useEffect(() => {
    markConversationRead(conversation.id, 'agent')
  }, [conversation.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Load older messages
  const loadOlderMessages = useCallback(() => {
    const nextPage = page + 1
    startTransition(async () => {
      const result = await getMessages(conversation.id, nextPage, 50)
      if (result.messages.length > 0) {
        setMessages((prev) => {
          const newMessages = [...result.messages, ...prev]
          if (newMessages.length >= totalMessages) {
            setHasMore(false)
          }
          return newMessages
        })
        setPage(nextPage)
      } else {
        setHasMore(false)
      }
    })
  }, [page, conversation.id, totalMessages])

  // Send message
  const handleSendMessage = useCallback(
    async (content: string, isNote: boolean, mentionedAgentIds?: string[]) => {
      const result = await sendMessage({
        conversationId: conversation.id,
        siteId,
        senderType: 'agent',
        content,
        contentType: isNote ? 'note' : 'text',
        isInternalNote: isNote,
        mentionedAgentIds,
      })
      if (result.error) {
        toast.error(result.error)
      }
      // Realtime will add the message to the list
    },
    [conversation.id, siteId]
  )

  // Assign agent
  const handleAssign = useCallback(
    (agentId: string) => {
      startTransition(async () => {
        const result = await assignConversation(conversation.id, agentId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setConversation((c) => ({
            ...c,
            assignedAgentId: agentId,
          }))
          toast.success('Agent assigned')
        }
      })
    },
    [conversation.id, agents]
  )

  // Resolve
  const handleResolve = useCallback(() => {
    startTransition(async () => {
      const result = await resolveConversation(conversation.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConversation((c) => ({ ...c, status: 'resolved' }))
        toast.success('Conversation resolved')
      }
    })
  }, [conversation.id])

  // Close
  const handleClose = useCallback(() => {
    startTransition(async () => {
      const result = await closeConversation(conversation.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConversation((c) => ({ ...c, status: 'closed' }))
        toast.success('Conversation closed')
      }
    })
  }, [conversation.id])

  // Reopen
  const handleReopen = useCallback(() => {
    startTransition(async () => {
      const result = await reopenConversation(conversation.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConversation((c) => ({ ...c, status: 'active' }))
        toast.success('Conversation reopened')
      }
    })
  }, [conversation.id])

  // Priority
  const handlePriorityChange = useCallback(
    (priority: string) => {
      startTransition(async () => {
        const result = await updateConversationPriority(
          conversation.id,
          priority as ConversationPriority
        )
        if (result.error) {
          toast.error(result.error)
        } else {
          setConversation((c) => ({
            ...c,
            priority: priority as ConversationPriority,
          }))
        }
      })
    },
    [conversation.id]
  )

  // Transfer conversation to another agent
  const handleTransfer = useCallback(
    (targetAgentId: string) => {
      startTransition(async () => {
        const result = await transferConversation(conversation.id, targetAgentId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setConversation((c) => ({
            ...c,
            assignedAgentId: targetAgentId,
          }))
          setShowTransfer(false)
          toast.success('Conversation transferred')
        }
      })
    },
    [conversation.id]
  )

  // Add tag
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim()
    if (!tag) return
    const currentTags = conversation.tags || []
    if (currentTags.includes(tag)) {
      setTagInput('')
      return
    }
    const newTags = [...currentTags, tag]
    startTransition(async () => {
      const result = await updateConversationTags(conversation.id, newTags)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConversation((c) => ({ ...c, tags: newTags }))
        setTagInput('')
      }
    })
  }, [conversation.id, conversation.tags, tagInput])

  // Remove tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const newTags = (conversation.tags || []).filter((t) => t !== tagToRemove)
    startTransition(async () => {
      const result = await updateConversationTags(conversation.id, newTags)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConversation((c) => ({ ...c, tags: newTags }))
      }
    })
  }, [conversation.id, conversation.tags])

  // Global keyboard shortcuts for conversation actions
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // Ctrl+R / Cmd+R → Resolve conversation
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault()
        if (conversation.status === 'active' || conversation.status === 'pending' || conversation.status === 'waiting') {
          handleResolve()
        }
        return
      }
      // Ctrl+Shift+C → Close conversation
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        if (conversation.status !== 'closed') {
          handleClose()
        }
        return
      }
      // Ctrl+Shift+O → Reopen conversation
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        if (conversation.status === 'resolved' || conversation.status === 'closed') {
          handleReopen()
        }
        return
      }
      // Escape → Go back to conversations list
      if (e.key === 'Escape') {
        router.push(`/dashboard/sites/${siteId}/live-chat/conversations`)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [conversation.status, handleResolve, handleClose, handleReopen, router, siteId])

  const hasVisitorTyping = typingUsers.length > 0

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* ─── CENTER: Chat area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r">
        {/* Conversation header */}
        <div className="border-b px-4 py-3 flex items-center justify-between bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                router.push(
                  `/dashboard/sites/${siteId}/live-chat/conversations`
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(visitor?.name || 'V')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {visitor?.name || 'Visitor'}
                </span>
                <ChannelBadge channel={conversation.channel} />
                <ConversationStatusBadge status={conversation.status} />
              </div>
              {visitor?.email && (
                <p className="text-xs text-muted-foreground">
                  {visitor.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority */}
            <Select
              value={conversation.priority}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Assign agent */}
            <Select
              value={conversation.assignedAgentId || 'unassigned'}
              onValueChange={(val) => {
                if (val !== 'unassigned') handleAssign(val)
              }}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Assign agent..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick actions */}
            {(conversation.status === 'active' ||
              conversation.status === 'pending' ||
              conversation.status === 'waiting') && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleResolve}
                disabled={isPending}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Resolve
              </Button>
            )}

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {conversation.assignedAgentId && conversation.status !== 'closed' && (
                  <DropdownMenuItem onClick={() => setShowTransfer(!showTransfer)}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer Conversation
                  </DropdownMenuItem>
                )}
                {conversation.status !== 'closed' && (
                  <DropdownMenuItem onClick={handleClose}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Close Conversation
                  </DropdownMenuItem>
                )}
                {(conversation.status === 'resolved' ||
                  conversation.status === 'closed') && (
                  <DropdownMenuItem onClick={handleReopen}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reopen Conversation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Transfer agent selector */}
          {showTransfer && (
            <div className="border-b px-4 py-2 bg-muted/50 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Transfer to:</span>
              <Select onValueChange={(val) => handleTransfer(val)}>
                <SelectTrigger className="w-[180px] h-7 text-xs">
                  <SelectValue placeholder="Select agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents
                    .filter((a) => a.id !== conversation.assignedAgentId)
                    .map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTransfer(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3" ref={scrollAreaRef}>
          {/* Load older */}
          {hasMore && (
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadOlderMessages}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Load older messages
              </Button>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {hasVisitorTyping && (
            <TypingIndicator name="Visitor" className="mt-2 ml-9" />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <MessageInput
          onSend={handleSendMessage}
          cannedResponses={cannedResponses}
          agents={agents.map((a) => ({ id: a.id, name: a.displayName || 'Agent' }))}
          disabled={
            conversation.status === 'closed' ||
            conversation.status === 'resolved'
          }
          placeholder={
            conversation.status === 'closed' || conversation.status === 'resolved'
              ? 'This conversation is closed'
              : 'Type a message... (/ for canned responses)'
          }
        />
      </div>

      {/* ─── RIGHT: Visitor info panel ─────────────────────────────────── */}
      <div className="w-80 shrink-0 overflow-y-auto bg-muted/20 hidden lg:block">
        <div className="p-4 space-y-4">
          {/* Visitor details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Visitor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(visitor?.name || 'V')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {visitor?.name || 'Visitor'}
                  </p>
                  {visitor?.email && (
                    <p className="text-xs text-muted-foreground">
                      {visitor.email}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {visitor?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {visitor.email}
                  </span>
                </div>
              )}
              {visitor?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {visitor.phone}
                  </span>
                </div>
              )}
              {(visitor?.country || visitor?.city) && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {[visitor.city, visitor.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {visitor?.browser && (
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {visitor.browser}
                    {visitor.os ? ` / ${visitor.os}` : ''}
                  </span>
                </div>
              )}
              {visitor?.currentPageUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate text-xs">
                    {visitor.currentPageUrl}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conversation Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <ConversationStatusBadge status={conversation.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <PriorityBadge priority={conversation.priority} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Channel</span>
                <ChannelBadge channel={conversation.channel} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span>{conversation.messageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-xs">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
              {conversation.assignedAgent?.displayName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent</span>
                  <span>{conversation.assignedAgent.displayName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Satisfaction Rating */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Satisfaction Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversation.rating ? (
                <div className="space-y-3">
                  {/* Star display */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (conversation.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-transparent text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {conversation.rating}/5
                    </span>
                  </div>
                  {/* Rating label */}
                  <Badge
                    variant={
                      (conversation.rating || 0) >= 4
                        ? 'default'
                        : (conversation.rating || 0) >= 3
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="text-xs"
                  >
                    {conversation.rating === 5
                      ? '🤩 Excellent'
                      : conversation.rating === 4
                      ? '😃 Very Good'
                      : conversation.rating === 3
                      ? '😐 Good'
                      : conversation.rating === 2
                      ? '🙁 Fair'
                      : '😠 Poor'}
                  </Badge>
                  {/* Comment */}
                  {conversation.ratingComment && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>Feedback</span>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 italic">
                        &ldquo;{conversation.ratingComment}&rdquo;
                      </p>
                    </div>
                  )}
                  {/* Rated timestamp */}
                  {conversation.ratedAt && (
                    <p className="text-xs text-muted-foreground">
                      Rated {formatDate(conversation.ratedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    {conversation.status === 'resolved' || conversation.status === 'closed'
                      ? 'No rating received'
                      : 'Awaiting rating'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversation.status === 'resolved' || conversation.status === 'closed'
                      ? 'Visitor did not leave feedback'
                      : 'Rating will be requested when chat ends'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {(conversation.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddTag()
                    }
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CRM link */}
          {visitor?.crmContactId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  CRM Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/dashboard/sites/${siteId}/crm-module?contact=${visitor.crmContactId}`
                    )
                  }
                >
                  View in CRM
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Send message</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd></div>
              <div className="flex justify-between"><span>New line</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Shift+Enter</kbd></div>
              <div className="flex justify-between"><span>Canned responses</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">/</kbd></div>
              <div className="flex justify-between"><span>Internal note</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+/</kbd></div>
              <div className="flex justify-between"><span>Mention agent</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">@</kbd></div>
              <div className="flex justify-between"><span>Resolve chat</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+R</kbd></div>
              <div className="flex justify-between"><span>Close chat</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Shift+C</kbd></div>
              <div className="flex justify-between"><span>Reopen chat</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Shift+O</kbd></div>
              <div className="flex justify-between"><span>Back to list</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd></div>
              <div className="flex justify-between"><span>Clear input</span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
