'use client'

/**
 * LiveChatOverviewWrapper — Dashboard entry point with stats, recent chats, agents
 */

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessagesSquare,
  Clock,
  Users,
  Timer,
  MessageCircle,
  CheckCircle,
  XCircle,
  Star,
  ArrowRight,
} from 'lucide-react'
import { ConversationStatusBadge } from '../shared/ConversationStatusBadge'
import { ChannelBadge } from '../shared/ChannelBadge'
import { AgentStatusDot } from '../shared/AgentStatusDot'
import { LiveChatEmptyState } from '../shared/LiveChatEmptyState'
import type {
  ChatOverviewStats,
  ConversationListItem,
  ChatAgent,
} from '@/modules/live-chat/types'

interface LiveChatOverviewWrapperProps {
  stats: ChatOverviewStats
  recentConversations: ConversationListItem[]
  agents: ChatAgent[]
  siteId: string
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
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

export function LiveChatOverviewWrapper({
  stats,
  recentConversations,
  agents,
  siteId,
}: LiveChatOverviewWrapperProps) {
  const router = useRouter()

  const goToConversations = useCallback(
    () => router.push(`/dashboard/sites/${siteId}/live-chat/conversations`),
    [router, siteId]
  )
  const goToConversation = useCallback(
    (id: string) =>
      router.push(
        `/dashboard/sites/${siteId}/live-chat/conversations/${id}`
      ),
    [router, siteId]
  )
  const goToAgents = useCallback(
    () => router.push(`/dashboard/sites/${siteId}/live-chat/agents`),
    [router, siteId]
  )
  const goToSettings = useCallback(
    () => router.push(`/dashboard/sites/${siteId}/live-chat/settings`),
    [router, siteId]
  )

  const onlineAgents = agents.filter((a) => a.status === 'online')

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Chat Overview</h2>
          <p className="text-muted-foreground">
            Monitor conversations, agents, and performance in real time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToSettings}>
            Settings
          </Button>
          <Button size="sm" onClick={goToConversations}>
            View All Conversations
          </Button>
        </div>
      </div>

      {/* Stats row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineAgents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.avgResponseTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayResolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Missed Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayMissed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.satisfactionScore > 0
                ? `${stats.satisfactionScore.toFixed(1)}%`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent conversations + Agent status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent active conversations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Active Conversations</CardTitle>
            <Button variant="ghost" size="sm" onClick={goToConversations}>
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <LiveChatEmptyState
                icon={MessagesSquare}
                title="No active conversations"
                description="Conversations will appear here when visitors start chatting"
              />
            ) : (
              <div className="space-y-3">
                {recentConversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    onClick={() => goToConversation(conv.id)}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(conv.visitorName || 'V')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {conv.visitorName || 'Visitor'}
                        </span>
                        <ChannelBadge channel={conv.channel} />
                        <ConversationStatusBadge status={conv.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessageText || 'No messages yet'}
                      </p>
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
            )}
          </CardContent>
        </Card>

        {/* Agent status grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Agent Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={goToAgents}>
              Manage <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <LiveChatEmptyState
                icon={Users}
                title="No agents configured"
                description="Add agents to start handling conversations"
                action={{ label: 'Add Agents', onClick: goToAgents }}
              />
            ) : (
              <div className="space-y-3">
                {agents
                  .sort((a, b) => {
                    const order = { online: 0, away: 1, busy: 2, offline: 3 }
                    return order[a.status] - order[b.status]
                  })
                  .map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-2 rounded-lg"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(agent.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <AgentStatusDot status={agent.status} size="sm" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {agent.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {agent.role} &middot; {agent.currentChatCount}/{agent.maxConcurrentChats} chats
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
