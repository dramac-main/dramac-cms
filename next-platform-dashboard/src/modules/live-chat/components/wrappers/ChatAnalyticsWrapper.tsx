'use client'

/**
 * Chat Analytics Dashboard Wrapper
 *
 * PHASE LC-07: Full analytics dashboard with charts, stats, and export.
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Download,
  Loader2,
  MessagesSquare,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Bot,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

import {
  getAnalyticsOverview,
  getConversationsByDay,
  getResponseTimeByDay,
  getAgentPerformance,
  getChannelBreakdown,
  getSatisfactionDistribution,
  getSatisfactionTrend,
  getBusiestHours,
  exportAnalyticsCsv,
} from '../../actions/analytics-actions'
import type { AgentPerformanceData } from '../../types'

interface ChatAnalyticsWrapperProps {
  siteId: string
}

type DateRange = '7d' | '14d' | '30d' | '90d'

function getDateRange(range: DateRange): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  switch (range) {
    case '7d':
      from.setDate(from.getDate() - 7)
      break
    case '14d':
      from.setDate(from.getDate() - 14)
      break
    case '30d':
      from.setDate(from.getDate() - 30)
      break
    case '90d':
      from.setDate(from.getDate() - 90)
      break
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const SATISFACTION_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

export function ChatAnalyticsWrapper({ siteId }: ChatAnalyticsWrapperProps) {
  const [range, setRange] = useState<DateRange>('30d')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Data states
  const [overview, setOverview] = useState<{
    totalConversations: number
    totalMessages: number
    resolvedConversations: number
    missedConversations: number
    avgResponseTime: number
    avgSatisfaction: number
    totalRatings: number
    aiAutoResponses: number
    aiResolved: number
  } | null>(null)

  const [conversationsByDay, setConversationsByDay] = useState<
    Array<{ date: string; total: number; resolved: number; missed: number }>
  >([])
  const [responseTimeByDay, setResponseTimeByDay] = useState<
    Array<{ date: string; avgFirstResponse: number; avgResolution: number }>
  >([])
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceData[]>([])
  const [channelBreakdown, setChannelBreakdown] = useState<
    Array<{ channel: string; count: number; percentage: number }>
  >([])
  const [satisfactionDist, setSatisfactionDist] = useState<
    Array<{ rating: number; count: number }>
  >([])
  const [satisfactionTrend, setSatisfactionTrend] = useState<
    Array<{ date: string; avgRating: number; count: number }>
  >([])
  const [busiestHours, setBusiestHours] = useState<
    Array<{ hour: number; count: number }>
  >([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const { from, to } = getDateRange(range)

    const [overviewRes, convRes, respRes, agentRes, channelRes, satRes, satTrendRes, hoursRes] =
      await Promise.all([
        getAnalyticsOverview(siteId, from, to),
        getConversationsByDay(siteId, from, to),
        getResponseTimeByDay(siteId, from, to),
        getAgentPerformance(siteId, from, to),
        getChannelBreakdown(siteId, from, to),
        getSatisfactionDistribution(siteId, from, to),
        getSatisfactionTrend(siteId, from, to),
        getBusiestHours(siteId, from, to),
      ])

    if (overviewRes.data) setOverview(overviewRes.data)
    setConversationsByDay(convRes.data)
    setResponseTimeByDay(respRes.data)
    setAgentPerformance(agentRes.data)
    setChannelBreakdown(channelRes.data)
    setSatisfactionDist(satRes.data)
    setSatisfactionTrend(satTrendRes.data)
    setBusiestHours(hoursRes.data)
    setLoading(false)
  }, [siteId, range])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleExport() {
    setExporting(true)
    const { from, to } = getDateRange(range)
    const result = await exportAnalyticsCsv(siteId, from, to)
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-analytics-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const resolutionRate =
    overview && overview.totalConversations > 0
      ? Math.round((overview.resolvedConversations / overview.totalConversations) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Chat performance analytics and reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={range}
            onValueChange={(v) => setRange(v as DateRange)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.totalMessages || 0} messages total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(overview?.avgResponseTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">First response average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overview?.resolvedConversations || 0} resolved, {overview?.missedConversations || 0}{' '}
              missed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.avgSatisfaction?.toFixed(1) || '—'}{' '}
              <span className="text-sm text-muted-foreground font-normal">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.totalRatings || 0} ratings received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Stats */}
      {(overview?.aiAutoResponses || 0) > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6 pb-4">
            <div>
              <p className="text-2xl font-bold">{overview?.aiAutoResponses || 0}</p>
              <p className="text-xs text-muted-foreground">Auto-responses sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{overview?.aiResolved || 0}</p>
              <p className="text-xs text-muted-foreground">Resolved by AI</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {overview && overview.aiAutoResponses > 0
                  ? Math.round((overview.aiResolved / overview.aiAutoResponses) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">AI resolution rate</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversations Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversations Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversationsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={conversationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis fontSize={11} />
                  <Tooltip
                    labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="missed"
                    name="Missed"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                No conversation data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Response Time Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {responseTimeByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={responseTimeByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    fontSize={11}
                    tickFormatter={(v) => formatDuration(v)}
                  />
                  <Tooltip
                    labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                    formatter={(v: unknown) => [formatDuration(Number(v))]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avgFirstResponse"
                    name="First Response"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgResolution"
                    name="Resolution"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                No response time data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Channel Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {channelBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={channelBreakdown}
                    dataKey="count"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {channelBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                No channel data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Satisfaction Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {satisfactionDist.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={satisfactionDist}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="rating"
                    fontSize={11}
                    tickFormatter={(r) => `${r}★`}
                  />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: unknown) => [Number(v), 'Ratings']} />
                  <Bar dataKey="count" name="Ratings">
                    {satisfactionDist.map((_, i) => (
                      <Cell key={i} fill={SATISFACTION_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                No ratings yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction Trend Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Satisfaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {satisfactionTrend.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={satisfactionTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    fontSize={10}
                    tickFormatter={(d) => {
                      const date = new Date(d)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis fontSize={11} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip
                    labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                    formatter={(v: unknown, name: string | undefined) => {
                      if (name === 'avgRating') return [Number(v), 'Avg Rating']
                      return [Number(v), 'Ratings Count']
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    name="Avg Rating"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#eab308' }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Ratings Count"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                No rating trend data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Busiest Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Busiest Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {busiestHours.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={busiestHours}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hour"
                    fontSize={10}
                    tickFormatter={(h) => `${h}:00`}
                    interval={2}
                  />
                  <YAxis fontSize={11} />
                  <Tooltip
                    labelFormatter={(h) => `${h}:00 - ${(Number(h)) + 1}:00`}
                    formatter={(v: unknown) => [Number(v), 'Conversations']}
                  />
                  <Bar dataKey="count" name="Conversations" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                No hour data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Agent</th>
                    <th className="pb-2 font-medium text-center">Chats</th>
                    <th className="pb-2 font-medium text-center">Resolved</th>
                    <th className="pb-2 font-medium text-center">Res. Rate</th>
                    <th className="pb-2 font-medium text-center">Avg Response</th>
                    <th className="pb-2 font-medium text-center">Rating</th>
                    <th className="pb-2 font-medium text-center">Load</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map((agent) => (
                    <tr key={agent.agentId} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {agent.agentName
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{agent.agentName}</span>
                        </div>
                      </td>
                      <td className="text-center">{agent.totalChats}</td>
                      <td className="text-center">{agent.resolvedChats}</td>
                      <td className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {agent.totalChats > 0
                            ? Math.round((agent.resolvedChats / agent.totalChats) * 100)
                            : 0}
                          %
                        </Badge>
                      </td>
                      <td className="text-center">
                        {formatDuration(agent.avgResponseTime)}
                      </td>
                      <td className="text-center">
                        {agent.totalRatings > 0 ? (
                          <span className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {agent.avgRating.toFixed(1)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-center">
                        <Badge
                          variant={
                            agent.currentLoad >= agent.maxLoad ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {agent.currentLoad}/{agent.maxLoad}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No agent performance data yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
