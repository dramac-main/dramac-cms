'use client'

/**
 * ConversationsPageWrapper — Conversation list with filters, pagination, realtime
 */

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, MessagesSquare, Search } from 'lucide-react'
import { ConversationStatusBadge } from '../shared/ConversationStatusBadge'
import { ChannelBadge } from '../shared/ChannelBadge'
import { PriorityBadge } from '../shared/PriorityBadge'
import { LiveChatEmptyState } from '../shared/LiveChatEmptyState'
import { useConversationsRealtime } from '@/modules/live-chat/hooks/use-conversations-realtime'
import { getConversations } from '@/modules/live-chat/actions/conversation-actions'
import type {
  ConversationListItem,
  ChatAgent,
  ChatDepartment,
  ConversationStatus,
  ConversationChannel,
} from '@/modules/live-chat/types'

interface ConversationsPageWrapperProps {
  initialConversations: ConversationListItem[]
  total: number
  agents: ChatAgent[]
  departments: ChatDepartment[]
  siteId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ConversationsPageWrapper({
  initialConversations,
  total,
  agents,
  departments,
  siteId,
}: ConversationsPageWrapperProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations)
  const [totalCount, setTotalCount] = useState(total)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Realtime updates
  useConversationsRealtime(siteId, {
    onNewConversation: (conv) => {
      // Map ChatConversation to ConversationListItem
      const item: ConversationListItem = {
        id: conv.id,
        visitorName: conv.visitor?.name || 'Visitor',
        visitorEmail: conv.visitor?.email || null,
        visitorAvatar: conv.visitor?.avatarUrl || null,
        channel: conv.channel,
        status: conv.status,
        priority: conv.priority,
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
        lastMessageBy: conv.lastMessageBy,
        unreadCount: conv.unreadAgentCount,
        assignedAgentName: conv.assignedAgent?.displayName || null,
        departmentName: conv.department?.name || null,
        tags: conv.tags,
        createdAt: conv.createdAt,
      }
      setConversations((prev) => [item, ...prev])
      setTotalCount((c) => c + 1)
    },
    onConversationUpdate: (conv) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? {
                ...c,
                status: conv.status,
                priority: conv.priority,
                lastMessageText: conv.lastMessageText ?? c.lastMessageText,
                lastMessageAt: conv.lastMessageAt ?? c.lastMessageAt,
                unreadCount: conv.unreadAgentCount ?? c.unreadCount,
              }
            : c
        )
      )
    },
    onConversationDeleted: (convId) => {
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      setTotalCount((c) => Math.max(0, c - 1))
    },
  })

  const applyFilters = useCallback(
    (newStatus?: string, newChannel?: string) => {
      const s = newStatus ?? statusFilter
      const ch = newChannel ?? channelFilter

      startTransition(async () => {
        const filters: Record<string, string> = {}
        if (s !== 'all') filters.status = s
        if (ch !== 'all') filters.channel = ch

        const result = await getConversations(siteId, filters, 1, pageSize)
        setConversations(result.conversations)
        setTotalCount(result.total)
        setPage(1)
      })
    },
    [statusFilter, channelFilter, siteId]
  )

  const handleStatusChange = (val: string) => {
    setStatusFilter(val)
    applyFilters(val, undefined)
  }

  const handleChannelChange = (val: string) => {
    setChannelFilter(val)
    applyFilters(undefined, val)
  }

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    startTransition(async () => {
      const filters: Record<string, string> = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (channelFilter !== 'all') filters.channel = channelFilter

      const result = await getConversations(siteId, filters, nextPage, pageSize)
      if (result.conversations.length > 0) {
        setConversations((prev) => [...prev, ...result.conversations])
        setPage(nextPage)
      }
    })
  }, [page, siteId, statusFilter, channelFilter])

  const filteredConversations = searchQuery
    ? conversations.filter(
        (c) =>
          c.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.visitorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastMessageText?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conversations</h2>
          <p className="text-muted-foreground">
            {totalCount} total conversations
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>

            {/* Channel filter */}
            <Select value={channelFilter} onValueChange={handleChannelChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="widget">Widget</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <LiveChatEmptyState
              icon={MessagesSquare}
              title="No conversations found"
              description={
                statusFilter !== 'all' || channelFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Conversations will appear here when visitors start chatting'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                  onClick={() =>
                    router.push(
                      `/dashboard/sites/${siteId}/live-chat/conversations/${conv.id}`
                    )
                  }
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-sm">
                      {getInitials(conv.visitorName || 'V')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {conv.visitorName || 'Visitor'}
                      </span>
                      <ChannelBadge channel={conv.channel} />
                      <ConversationStatusBadge status={conv.status} />
                      <PriorityBadge priority={conv.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessageText || 'No messages yet'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {conv.assignedAgentName && (
                        <span className="text-xs text-muted-foreground">
                          Assigned to {conv.assignedAgentName}
                        </span>
                      )}
                      {conv.departmentName && (
                        <span className="text-xs text-muted-foreground">
                          &middot; {conv.departmentName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                    </span>
                    {conv.unreadCount > 0 && (
                      <div className="mt-1 flex justify-end">
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                          {conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load more */}
      {conversations.length < totalCount && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
