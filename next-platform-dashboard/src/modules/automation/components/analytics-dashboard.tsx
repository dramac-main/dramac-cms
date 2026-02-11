/**
 * AnalyticsDashboard Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Dashboard for monitoring workflow execution statistics, success rates,
 * performance metrics, and identifying issues.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"
import { 
  Activity, 
  CheckCircle2, 
  CircleX, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  BarChart3,
  LucideIcon
} from "lucide-react"
import { getAutomationAnalytics } from "../actions/automation-actions"

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsDashboardProps {
  siteId: string
}

interface AnalyticsData {
  overview: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    successRate: number
    averageExecutionTime: number
    totalWorkflows: number
    activeWorkflows: number
    executionTrend: number // Percentage change vs previous period
  }
  executionsByDay: Array<{
    date: string
    total: number
    successful: number
    failed: number
  }>
  topWorkflows: Array<{
    id: string
    name: string
    executions: number
    successRate: number
  }>
  recentFailures: Array<{
    id: string
    workflowName: string
    errorMessage: string
    timestamp: string
  }>
  executionsByHour: Array<{
    hour: number
    executions: number
  }>
  categoryDistribution: Array<{
    category: string
    count: number
  }>
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  muted: "#6b7280"
}

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

const TIME_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" }
]

// ============================================================================
// HELPERS
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  title, 
  value, 
  trend, 
  icon: Icon, 
  color = "primary",
  description
}: {
  title: string
  value: string | number
  trend?: number
  icon: LucideIcon
  color?: "primary" | "success" | "error" | "warning"
  description?: string
}) {
  const colorClasses = {
    primary: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    success: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
    error: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
    warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{trend.toFixed(1)}%</span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">{trend.toFixed(1)}%</span>
              </>
            ) : (
              <span>No change</span>
            )}
            <span className="ml-1">vs previous period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ExecutionsChart({ data }: { data: AnalyticsData["executionsByDay"] }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Executions Over Time</CardTitle>
        <CardDescription>Daily workflow executions breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradientFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.error} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.error} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="successful"
                name="Successful"
                stroke={CHART_COLORS.success}
                fill="url(#gradientSuccess)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="failed"
                name="Failed"
                stroke={CHART_COLORS.error}
                fill="url(#gradientFailed)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function TopWorkflowsTable({ workflows }: { workflows: AnalyticsData["topWorkflows"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Workflows</CardTitle>
        <CardDescription>Most executed workflows by volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflows.slice(0, 5).map((workflow, index) => (
            <div 
              key={workflow.id} 
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground w-6">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium truncate max-w-[200px]">
                    {workflow.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatNumber(workflow.executions)} executions
                  </div>
                </div>
              </div>
              <Badge 
                variant={workflow.successRate >= 90 ? "default" : workflow.successRate >= 70 ? "secondary" : "destructive"}
              >
                {workflow.successRate.toFixed(0)}%
              </Badge>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No workflow data available yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentFailuresTable({ failures }: { failures: AnalyticsData["recentFailures"] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Failures</CardTitle>
          <CardDescription>Last failed workflow executions</CardDescription>
        </div>
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {failures.slice(0, 5).map((failure) => (
            <div 
              key={failure.id} 
              className="border-l-2 border-destructive pl-3"
            >
              <div className="font-medium text-sm">{failure.workflowName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {failure.errorMessage}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(failure.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
          {failures.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No recent failures! 🎉</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function HourlyDistributionChart({ data }: { data: AnalyticsData["executionsByHour"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Distribution</CardTitle>
        <CardDescription>When your workflows run most</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
              />
              <Bar 
                dataKey="executions" 
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryDistributionChart({ data }: { data: AnalyticsData["categoryDistribution"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Distribution</CardTitle>
        <CardDescription>Types of actions being used</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PIE_COLORS[index % PIE_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AnalyticsDashboard({ siteId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)

  const fetchAnalytics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      const result = await getAutomationAnalytics(siteId, timeRange)
      if (result.success && result.data) {
        setData(result.data as AnalyticsData)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [siteId, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  // Generate demo data if no data available yet
  const analyticsData: AnalyticsData = data || {
    overview: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      totalWorkflows: 0,
      activeWorkflows: 0,
      executionTrend: 0
    },
    executionsByDay: [],
    topWorkflows: [],
    recentFailures: [],
    executionsByHour: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      executions: 0
    })),
    categoryDistribution: []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Automation Analytics
          </h2>
          <p className="text-muted-foreground">
            Monitor your workflow performance and identify issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Executions"
          value={formatNumber(analyticsData.overview.totalExecutions)}
          trend={analyticsData.overview.executionTrend}
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="Success Rate"
          value={`${analyticsData.overview.successRate.toFixed(1)}%`}
          icon={CheckCircle2}
          color="success"
          description={`${formatNumber(analyticsData.overview.successfulExecutions)} successful`}
        />
        <StatCard
          title="Failed Executions"
          value={formatNumber(analyticsData.overview.failedExecutions)}
          icon={CircleX}
          color="error"
        />
        <StatCard
          title="Avg. Execution Time"
          value={formatDuration(analyticsData.overview.averageExecutionTime)}
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{analyticsData.overview.totalWorkflows}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{analyticsData.overview.activeWorkflows}</p>
              </div>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Success vs Failed</p>
                <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="bg-green-500 h-full transition-all"
                    style={{ 
                      width: `${analyticsData.overview.successRate}%` 
                    }}
                  />
                  <div 
                    className="bg-red-500 h-full transition-all"
                    style={{ 
                      width: `${100 - analyticsData.overview.successRate}%` 
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 bg-green-500 rounded-full" />
                  <span>{analyticsData.overview.successRate.toFixed(0)}% success</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 bg-red-500 rounded-full" />
                  <span>{(100 - analyticsData.overview.successRate).toFixed(0)}% failed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ExecutionsChart data={analyticsData.executionsByDay} />
            <TopWorkflowsTable workflows={analyticsData.topWorkflows} />
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopWorkflowsTable workflows={analyticsData.topWorkflows} />
            <RecentFailuresTable failures={analyticsData.recentFailures} />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HourlyDistributionChart data={analyticsData.executionsByHour} />
            <CategoryDistributionChart data={analyticsData.categoryDistribution} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {analyticsData.overview.totalExecutions === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start running your workflows to see analytics here.
            </p>
            <Button>
              Create Your First Workflow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
