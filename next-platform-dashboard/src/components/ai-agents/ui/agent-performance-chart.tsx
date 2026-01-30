"use client"

/**
 * Agent Performance Chart Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * SVG-based performance visualization for agent analytics
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Download, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  LineChart,
  AreaChart
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// =============================================================================
// TYPES
// =============================================================================

export interface AgentPerformanceData {
  agentId: string
  agentName: string
  executions: number
  successCount: number
  failureCount: number
  avgDuration: number
  successRate: number
  totalTokens: number
  totalCost: number
}

export interface AgentPerformanceChartProps {
  data: AgentPerformanceData[]
  loading?: boolean
  className?: string
  timeRange?: '24h' | '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d') => void
  onExport?: () => void
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TIME_RANGES = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
]

const CHART_COLORS = {
  success: '#22c55e',
  failure: '#ef4444',
  total: '#3b82f6',
}

// =============================================================================
// CHART BAR
// =============================================================================

interface ChartBarProps {
  name: string
  successRate: number
  executions: number
  maxExecutions: number
  index: number
}

function ChartBar({ name, successRate, executions, maxExecutions, index }: ChartBarProps) {
  const barHeight = (executions / maxExecutions) * 100
  const successHeight = (successRate / 100) * barHeight

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="flex flex-col items-center gap-2 flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="h-32 w-full flex items-end justify-center relative">
              {/* Background bar (total executions) */}
              <motion.div
                className="w-8 bg-muted rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.4, ease: "easeOut" }}
              >
                {/* Success portion */}
                <motion.div
                  className="w-full bg-green-500 rounded-t absolute bottom-0"
                  initial={{ height: 0 }}
                  animate={{ height: `${successHeight}%` }}
                  transition={{ delay: index * 0.05 + 0.3, duration: 0.3, ease: "easeOut" }}
                />
              </motion.div>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-full px-1">
              {name.length > 10 ? name.slice(0, 10) + '...' : name}
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{name}</p>
            <p className="text-xs">Executions: {executions}</p>
            <p className="text-xs text-green-500">Success Rate: {successRate.toFixed(1)}%</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================================================
// SUMMARY STATS
// =============================================================================

interface SummaryStatsProps {
  data: AgentPerformanceData[]
}

function SummaryStats({ data }: SummaryStatsProps) {
  const totals = data.reduce(
    (acc, agent) => ({
      executions: acc.executions + agent.executions,
      success: acc.success + agent.successCount,
      failure: acc.failure + agent.failureCount,
      tokens: acc.tokens + agent.totalTokens,
      cost: acc.cost + agent.totalCost,
    }),
    { executions: 0, success: 0, failure: 0, tokens: 0, cost: 0 }
  )

  const avgSuccessRate = totals.executions > 0 
    ? (totals.success / totals.executions) * 100 
    : 0

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="text-xs">Total</span>
        </div>
        <p className="text-lg font-semibold">{totals.executions.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Success</span>
        </div>
        <p className="text-lg font-semibold">{avgSuccessRate.toFixed(1)}%</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Failed</span>
        </div>
        <p className="text-lg font-semibold">{totals.failure.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">Cost</span>
        </div>
        <p className="text-lg font-semibold">${totals.cost.toFixed(2)}</p>
      </div>
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentPerformanceChart({
  data,
  loading = false,
  className,
  timeRange = '7d',
  onTimeRangeChange,
  onExport,
}: AgentPerformanceChartProps) {
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'area'>('bar')

  if (loading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No performance data available</p>
          <p className="text-sm text-muted-foreground/70">Run some agents to see analytics</p>
        </CardContent>
      </Card>
    )
  }

  const maxExecutions = Math.max(...data.map(d => d.executions))

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Agent Performance
            </CardTitle>
            <CardDescription>
              Execution success rates across all agents
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs 
              value={chartType} 
              onValueChange={(v) => setChartType(v as 'bar' | 'line' | 'area')}
              className="hidden sm:block"
            >
              <TabsList className="h-9">
                <TabsTrigger value="bar" className="px-2">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="line" className="px-2">
                  <LineChart className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="area" className="px-2">
                  <AreaChart className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={timeRange} onValueChange={(v) => onTimeRangeChange?.(v as '24h' | '7d' | '30d' | '90d')}>
              <SelectTrigger className="w-28">
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
            {onExport && (
              <Button variant="outline" size="icon" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="flex gap-1 items-end min-h-40">
          {data.map((agent, index) => (
            <ChartBar
              key={agent.agentId}
              name={agent.agentName}
              successRate={agent.successRate}
              executions={agent.executions}
              maxExecutions={maxExecutions}
              index={index}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <span className="text-muted-foreground">Failed</span>
          </div>
        </div>

        {/* Summary Stats */}
        <SummaryStats data={data} />
      </CardContent>
    </Card>
  )
}

export default AgentPerformanceChart
