"use client"

/**
 * AI Agents Dashboard Enhanced Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * Enhanced dashboard integrating all new UI components
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Bot, 
  Zap, 
  CircleCheck, 
  CircleX,
  Clock,
  Coins,
  TrendingUp,
  RefreshCw,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Import UI components
import { 
  AgentMetricCard,
  AgentPerformanceChart,
  ExecutionLogCard,
  AgentStatusCard,
  AgentQuickActions,
  AgentFilterBar,
  type AgentPerformanceData,
  type ExecutionLogData,
  type AgentStatusData,
  type AgentFilterState,
  type RecentAgent
} from './ui'

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardStats {
  totalExecutions: number
  successRate: number
  avgDuration: number
  totalTokens: number
  totalCost: number
  activeAgents: number
  failedExecutions: number
  pendingApprovals: number
}

export interface AIAgentsDashboardEnhancedProps {
  siteId: string
  stats?: DashboardStats
  agents?: AgentStatusData[]
  executions?: ExecutionLogData[]
  performanceData?: AgentPerformanceData[]
  recentAgents?: RecentAgent[]
  className?: string
  onCreateAgent?: () => void
  onBrowseMarketplace?: () => void
  onAgentClick?: (agentId: string) => void
  onAgentEdit?: (agentId: string) => void
  onAgentTest?: (agentId: string) => void
  onAgentToggle?: (agentId: string, active: boolean) => void
  onExecutionView?: (executionId: string) => void
  onExecutionRetry?: (executionId: string) => void
  onRefresh?: () => void
  onExport?: () => void
  isLoading?: boolean
}

// =============================================================================
// DEFAULT DATA
// =============================================================================

const DEFAULT_STATS: DashboardStats = {
  totalExecutions: 0,
  successRate: 0,
  avgDuration: 0,
  totalTokens: 0,
  totalCost: 0,
  activeAgents: 0,
  failedExecutions: 0,
  pendingApprovals: 0,
}

const DEFAULT_FILTERS: AgentFilterState = {
  search: '',
  status: [],
  types: [],
  sortBy: 'name',
  sortOrder: 'asc',
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIAgentsDashboardEnhanced({
  siteId,
  stats = DEFAULT_STATS,
  agents = [],
  executions = [],
  performanceData = [],
  recentAgents = [],
  className,
  onCreateAgent,
  onBrowseMarketplace,
  onAgentClick,
  onAgentEdit,
  onAgentTest,
  onAgentToggle,
  onExecutionView,
  onExecutionRetry,
  onRefresh,
  onExport,
  isLoading = false,
}: AIAgentsDashboardEnhancedProps) {
  const [activeTab, setActiveTab] = React.useState('overview')
  const [filters, setFilters] = React.useState<AgentFilterState>(DEFAULT_FILTERS)
  const [timeRange, setTimeRange] = React.useState<'24h' | '7d' | '30d' | '90d'>('7d')

  // Filter agents based on current filters
  const filteredAgents = React.useMemo(() => {
    return agents.filter(agent => {
      // Search filter
      if (filters.search && !agent.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(agent.status)) {
        return false
      }
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(agent.agentType as AgentFilterState['types'][number])) {
        return false
      }
      return true
    }).sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * order
        case 'runs':
          return (a.totalRuns - b.totalRuns) * order
        case 'success_rate':
          return (a.successRate - b.successRate) * order
        case 'created':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order
        default:
          return 0
      }
    })
  }, [agents, filters])

  // Sparkline data for metrics (mock data for visualization)
  const sparklineData = React.useMemo(() => ({
    executions: [12, 15, 18, 14, 22, 28, 25],
    success: [95, 94, 96, 92, 98, 97, 96],
    tokens: [8500, 9200, 7800, 10500, 11200, 9800, 10100],
    cost: [0.42, 0.46, 0.39, 0.52, 0.56, 0.49, 0.51],
  }), [])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Agents
          </h1>
          <p className="text-muted-foreground mt-1">
            Build, deploy, and manage intelligent automation agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AgentMetricCard
          title="Total Executions"
          value={stats.totalExecutions}
          icon={Zap}
          variant="default"
          sparklineData={sparklineData.executions}
          change={{ value: 12.5, trend: 'up', period: 'vs last week' }}
          animationDelay={0}
          loading={isLoading}
        />
        <AgentMetricCard
          title="Success Rate"
          value={stats.successRate.toFixed(1)}
          valueSuffix="%"
          icon={CircleCheck}
          variant="success"
          sparklineData={sparklineData.success}
          change={{ value: 2.3, trend: 'up', period: 'vs last week' }}
          animationDelay={0.05}
          loading={isLoading}
        />
        <AgentMetricCard
          title="Active Agents"
          value={stats.activeAgents}
          icon={Bot}
          variant="info"
          animationDelay={0.1}
          loading={isLoading}
        />
        <AgentMetricCard
          title="Failed"
          value={stats.failedExecutions}
          icon={CircleX}
          variant="error"
          change={stats.failedExecutions > 0 ? { value: 5, trend: 'down', period: 'vs last week' } : undefined}
          animationDelay={0.15}
          loading={isLoading}
        />
        <AgentMetricCard
          title="Tokens Used"
          value={stats.totalTokens >= 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}K` : stats.totalTokens}
          icon={TrendingUp}
          variant="default"
          sparklineData={sparklineData.tokens}
          animationDelay={0.2}
          loading={isLoading}
        />
        <AgentMetricCard
          title="Total Cost"
          value={stats.totalCost.toFixed(2)}
          valuePrefix="$" // USD — AI API costs
          icon={Coins}
          variant="warning"
          sparklineData={sparklineData.cost}
          animationDelay={0.25}
          loading={isLoading}
        />
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">My Agents</TabsTrigger>
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Performance Chart */}
              <AgentPerformanceChart
                data={performanceData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                onExport={onExport}
                loading={isLoading}
              />

              {/* Recent Executions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Executions</CardTitle>
                  <CardDescription>Latest agent activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {executions.length > 0 ? (
                    executions.slice(0, 5).map((execution, index) => (
                      <ExecutionLogCard
                        key={execution.id}
                        execution={execution}
                        variant="compact"
                        onView={onExecutionView}
                        onRetry={onExecutionRetry}
                        animationDelay={index * 0.05}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No executions yet</p>
                      <p className="text-sm">Run an agent to see activity here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="mt-4 space-y-4">
              <AgentFilterBar
                filters={filters}
                onFiltersChange={setFilters}
              />

              {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAgents.map((agent, index) => (
                    <AgentStatusCard
                      key={agent.id}
                      agent={agent}
                      onClick={onAgentClick}
                      onEdit={onAgentEdit}
                      onTest={onAgentTest}
                      onToggleActive={onAgentToggle}
                      animationDelay={index * 0.05}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold">No agents found</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {filters.search || filters.status.length > 0 || filters.types.length > 0
                      ? 'Try adjusting your filters'
                      : 'Create your first agent to get started'}
                  </p>
                  {!filters.search && filters.status.length === 0 && filters.types.length === 0 && onCreateAgent && (
                    <Button className="mt-4" onClick={onCreateAgent}>
                      Create Agent
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Executions Tab */}
            <TabsContent value="executions" className="mt-4 space-y-4">
              {executions.length > 0 ? (
                <div className="space-y-3">
                  {executions.map((execution, index) => (
                    <ExecutionLogCard
                      key={execution.id}
                      execution={execution}
                      variant="detailed"
                      onView={onExecutionView}
                      onRetry={onExecutionRetry}
                      animationDelay={index * 0.03}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold">No executions yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Agent executions will appear here
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-4">
              <AgentPerformanceChart
                data={performanceData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                onExport={onExport}
                loading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <AgentQuickActions
            onCreateAgent={onCreateAgent}
            onBrowseMarketplace={onBrowseMarketplace}
            recentAgents={recentAgents}
            onAgentClick={onAgentClick}
            loading={isLoading}
          />

          {/* Pending Approvals */}
          {stats.pendingApprovals > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{stats.pendingApprovals} Pending Approvals</p>
                    <p className="text-sm text-muted-foreground">Actions awaiting review</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Review Approvals
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAgentsDashboardEnhanced
