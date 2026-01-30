"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Zap,
  RefreshCw,
  Download,
  X,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

// UI Components
import { 
  ExecutionsMetricCard,
  SuccessRateMetricCard,
  AvgDurationMetricCard,
  ActiveWorkflowsMetricCard
} from "./ui/analytics-metric-card"
import { ExecutionFilterBar, type ExecutionFilters } from "./ui/execution-filter-bar"
import { ExecutionLogCard } from "./ui/execution-log-card"
import { ExecutionTimeline } from "./ui/execution-timeline"
import { WorkflowPerformanceChart } from "./ui/workflow-performance-chart"

import type { 
  WorkflowExecution, 
  StepExecutionLog, 
  Workflow 
} from "../types/automation-types"

interface AnalyticsDashboardEnhancedProps {
  workspaceId: string
  // Data props - can be passed in or fetched internally
  executions?: WorkflowExecution[]
  workflows?: Workflow[]
  analytics?: {
    totalExecutions: number
    successRate: number
    avgDuration: number
    activeWorkflows: number
    executionsTrend?: number[]
    successRateTrend?: number[]
  }
  // Callbacks
  onFetchExecutions?: (filters: ExecutionFilters) => Promise<WorkflowExecution[]>
  onFetchExecutionDetails?: (executionId: string) => Promise<{ execution: WorkflowExecution; stepLogs: StepExecutionLog[] }>
  onRetryExecution?: (executionId: string) => Promise<void>
  onCancelExecution?: (executionId: string) => Promise<void>
  onExportData?: (format: 'csv' | 'json') => Promise<void>
  // Config
  initialFilters?: ExecutionFilters
  showMetrics?: boolean
  showPerformance?: boolean
  showTimeline?: boolean
  refreshInterval?: number // in ms, 0 to disable
  className?: string
}

type TimeRange = '7d' | '30d' | '90d'
type ChartType = 'bar' | 'line' | 'area'

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart skeleton */}
      <Skeleton className="h-[300px] w-full rounded-lg" />
      {/* List skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function AnalyticsDashboardEnhanced({
  workspaceId: _workspaceId,
  executions: initialExecutions = [],
  workflows: initialWorkflows = [],
  analytics: initialAnalytics,
  onFetchExecutions,
  onFetchExecutionDetails,
  onRetryExecution,
  onCancelExecution,
  onExportData,
  initialFilters = {},
  showMetrics = true,
  showPerformance = true,
  showTimeline = true,
  refreshInterval = 0,
  className
}: AnalyticsDashboardEnhancedProps) {
  // State
  const [isLoading, setIsLoading] = React.useState(false)
  const [executions, setExecutions] = React.useState<WorkflowExecution[]>(initialExecutions)
  const [filters, setFilters] = React.useState<ExecutionFilters>(initialFilters)
  const [timeRange, setTimeRange] = React.useState<TimeRange>('7d')
  const [chartType, setChartType] = React.useState<ChartType>('bar')
  const [selectedExecution, setSelectedExecution] = React.useState<{
    execution: WorkflowExecution
    stepLogs: StepExecutionLog[]
  } | null>(null)
  const [isDetailLoading, setIsDetailLoading] = React.useState(false)

  // Derived state
  const filteredExecutions = React.useMemo(() => {
    let result = [...executions]

    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(e => 
        e.id.toLowerCase().includes(search) ||
        e.workflow_id.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter(e => filters.status!.includes(e.status))
    }

    // Apply workflow filter
    if (filters.workflowId) {
      result = result.filter(e => e.workflow_id === filters.workflowId)
    }

    // Apply date range filter
    if (filters.dateRange) {
      result = result.filter(e => {
        const date = new Date(e.started_at || e.created_at)
        return date >= filters.dateRange!.from && date <= filters.dateRange!.to
      })
    }

    // Apply sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        let comparison = 0
        switch (filters.sortBy) {
          case 'started_at':
            comparison = new Date(a.started_at || a.created_at).getTime() - new Date(b.started_at || b.created_at).getTime()
            break
          case 'duration':
            const aDuration = a.completed_at && a.started_at 
              ? new Date(a.completed_at).getTime() - new Date(a.started_at).getTime()
              : 0
            const bDuration = b.completed_at && b.started_at
              ? new Date(b.completed_at).getTime() - new Date(b.started_at).getTime()
              : 0
            comparison = aDuration - bDuration
            break
          case 'status':
            comparison = a.status.localeCompare(b.status)
            break
        }
        return filters.sortOrder === 'asc' ? comparison : -comparison
      })
    } else {
      // Default sort by most recent
      result.sort((a, b) => 
        new Date(b.started_at || b.created_at).getTime() - new Date(a.started_at || a.created_at).getTime()
      )
    }

    return result
  }, [executions, filters])

  // Calculate workflow performance data
  const workflowPerformance = React.useMemo(() => {
    const workflowMap = new Map<string, {
      id: string
      name: string
      executions: number
      successCount: number
      totalDuration: number
    }>()

    executions.forEach(execution => {
      const existing = workflowMap.get(execution.workflow_id)
      const workflow = initialWorkflows.find(w => w.id === execution.workflow_id)
      const duration = execution.completed_at && execution.started_at
        ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
        : 0

      if (existing) {
        existing.executions++
        if (execution.status === 'completed') existing.successCount++
        existing.totalDuration += duration
      } else {
        workflowMap.set(execution.workflow_id, {
          id: execution.workflow_id,
          name: workflow?.name || `Workflow ${execution.workflow_id.slice(-8)}`,
          executions: 1,
          successCount: execution.status === 'completed' ? 1 : 0,
          totalDuration: duration
        })
      }
    })

    return Array.from(workflowMap.values())
      .map(w => ({
        id: w.id,
        name: w.name,
        executions: w.executions,
        successRate: Math.round((w.successCount / w.executions) * 100),
        avgDuration: Math.round(w.totalDuration / w.executions)
      }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 8) // Top 8 workflows
  }, [executions, initialWorkflows])

  // Analytics calculations
  const calculatedAnalytics = React.useMemo(() => {
    if (initialAnalytics) return initialAnalytics

    const total = executions.length
    const successful = executions.filter(e => e.status === 'completed').length
    const durations = executions
      .filter(e => e.completed_at && e.started_at)
      .map(e => new Date(e.completed_at!).getTime() - new Date(e.started_at!).getTime())
    const avgDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    return {
      totalExecutions: total,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      avgDuration,
      activeWorkflows: new Set(executions.map(e => e.workflow_id)).size
    }
  }, [executions, initialAnalytics])

  // Fetch executions when filters change
  const fetchExecutions = React.useCallback(async () => {
    if (!onFetchExecutions) return
    
    setIsLoading(true)
    try {
      const data = await onFetchExecutions(filters)
      setExecutions(data)
    } catch (error) {
      console.error('Failed to fetch executions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters, onFetchExecutions])

  // Handle viewing execution details
  const handleViewExecution = React.useCallback(async (execution: WorkflowExecution) => {
    if (!onFetchExecutionDetails) {
      setSelectedExecution({ execution, stepLogs: [] })
      return
    }

    setIsDetailLoading(true)
    try {
      const details = await onFetchExecutionDetails(execution.id)
      setSelectedExecution(details)
    } catch (error) {
      console.error('Failed to fetch execution details:', error)
      setSelectedExecution({ execution, stepLogs: [] })
    } finally {
      setIsDetailLoading(false)
    }
  }, [onFetchExecutionDetails])

  // Handle retry
  const handleRetry = React.useCallback(async (executionId: string) => {
    if (!onRetryExecution) return
    try {
      await onRetryExecution(executionId)
      fetchExecutions()
    } catch (error) {
      console.error('Failed to retry execution:', error)
    }
  }, [onRetryExecution, fetchExecutions])

  // Handle cancel
  const handleCancel = React.useCallback(async (executionId: string) => {
    if (!onCancelExecution) return
    try {
      await onCancelExecution(executionId)
      fetchExecutions()
    } catch (error) {
      console.error('Failed to cancel execution:', error)
    }
  }, [onCancelExecution, fetchExecutions])

  // Handle export
  const handleExport = React.useCallback(async () => {
    if (!onExportData) {
      // Default CSV export
      const csv = [
        ['ID', 'Workflow', 'Status', 'Started', 'Duration'].join(','),
        ...filteredExecutions.map(e => [
          e.id,
          e.workflow_id,
          e.status,
          e.started_at,
          e.completed_at && e.started_at 
            ? new Date(e.completed_at).getTime() - new Date(e.started_at).getTime()
            : ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `automation-executions-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    await onExportData('csv')
  }, [onExportData, filteredExecutions])

  // Auto-refresh
  React.useEffect(() => {
    if (refreshInterval <= 0) return
    const interval = setInterval(fetchExecutions, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, fetchExecutions])

  // Format duration for display
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}m ${secs}s`
  }

  if (isLoading && executions.length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Monitor workflow executions and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExecutions}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      {showMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <ExecutionsMetricCard
            value={calculatedAnalytics.totalExecutions}
            sparklineData={calculatedAnalytics.executionsTrend}
            icon={<Activity className="w-4 h-4" />}
          />
          <SuccessRateMetricCard
            value={calculatedAnalytics.successRate}
            sparklineData={calculatedAnalytics.successRateTrend}
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <AvgDurationMetricCard
            value={formatDuration(calculatedAnalytics.avgDuration)}
            icon={<Clock className="w-4 h-4" />}
          />
          <ActiveWorkflowsMetricCard
            value={calculatedAnalytics.activeWorkflows}
            icon={<Zap className="w-4 h-4" />}
          />
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Executions List */}
        <div className={cn(
          "lg:col-span-2 space-y-4",
          selectedExecution && "lg:col-span-1"
        )}>
          {/* Filters */}
          <ExecutionFilterBar
            onFilterChange={setFilters}
            workflows={initialWorkflows.map(w => ({ id: w.id, name: w.name }))}
            initialFilters={filters}
          />

          {/* Tabs for list/chart view */}
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">Executions</TabsTrigger>
              {showPerformance && <TabsTrigger value="performance">Performance</TabsTrigger>}
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  <AnimatePresence mode="popLayout">
                    {filteredExecutions.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No executions found
                      </motion.div>
                    ) : (
                      filteredExecutions.map((execution) => (
                        <ExecutionLogCard
                          key={execution.id}
                          execution={execution}
                          workflow={initialWorkflows.find(w => w.id === execution.workflow_id)}
                          variant="compact"
                          onView={() => handleViewExecution(execution)}
                          onRetry={() => handleRetry(execution.id)}
                          onCancel={() => handleCancel(execution.id)}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>

            {showPerformance && (
              <TabsContent value="performance" className="mt-4">
                <WorkflowPerformanceChart
                  workflows={workflowPerformance}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  chartType={chartType}
                  onChartTypeChange={setChartType}
                  onExport={handleExport}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Panel - Detail View or Performance Chart */}
        <AnimatePresence mode="wait">
          {selectedExecution ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedExecution(null)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <CardTitle className="text-base">Execution Details</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedExecution(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isDetailLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : showTimeline ? (
                    <ExecutionTimeline
                      execution={selectedExecution.execution}
                      stepLogs={selectedExecution.stepLogs}
                      showDuration
                    />
                  ) : (
                    <ExecutionLogCard
                      execution={selectedExecution.execution}
                      workflow={initialWorkflows.find(w => w.id === selectedExecution.execution.workflow_id)}
                      variant="detailed"
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : showPerformance && (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WorkflowPerformanceChart
                workflows={workflowPerformance}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                chartType={chartType}
                onChartTypeChange={setChartType}
                onExport={handleExport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
