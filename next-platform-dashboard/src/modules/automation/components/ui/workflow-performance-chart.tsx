"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon,
  Download,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

interface WorkflowPerformanceData {
  id: string
  name: string
  executions: number
  successRate: number
  avgDuration: number // in ms
  color?: string
}

interface WorkflowPerformanceChartProps {
  workflows: WorkflowPerformanceData[]
  timeRange: '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void
  chartType?: 'bar' | 'line' | 'area'
  onChartTypeChange?: (type: 'bar' | 'line' | 'area') => void
  onExport?: () => void
  loading?: boolean
  className?: string
}

const defaultColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}

function BarChartSVG({ 
  data, 
  width, 
  height 
}: { 
  data: WorkflowPerformanceData[]
  width: number
  height: number
}) {
  const maxExecutions = Math.max(...data.map(d => d.executions), 1)
  const barWidth = Math.min(60, (width - 40) / data.length - 8)
  const chartHeight = height - 40

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Y-axis labels */}
      <text x="0" y="10" className="text-[10px] fill-muted-foreground">{maxExecutions}</text>
      <text x="0" y={chartHeight / 2} className="text-[10px] fill-muted-foreground">{Math.round(maxExecutions / 2)}</text>
      <text x="0" y={chartHeight - 5} className="text-[10px] fill-muted-foreground">0</text>

      {/* Grid lines */}
      <line x1="30" y1="10" x2={width} y2="10" stroke="currentColor" strokeOpacity="0.1" />
      <line x1="30" y1={chartHeight / 2} x2={width} y2={chartHeight / 2} stroke="currentColor" strokeOpacity="0.1" />
      <line x1="30" y1={chartHeight} x2={width} y2={chartHeight} stroke="currentColor" strokeOpacity="0.2" />

      {/* Bars */}
      {data.map((item, index) => {
        const x = 40 + index * ((width - 50) / data.length)
        const barHeight = (item.executions / maxExecutions) * (chartHeight - 10)
        const y = chartHeight - barHeight
        const color = item.color || defaultColors[index % defaultColors.length]

        return (
          <g key={item.id}>
            {/* Success rate background bar */}
            <motion.rect
              initial={{ height: 0, y: chartHeight }}
              animate={{ height: barHeight, y }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              x={x}
              width={barWidth}
              rx="4"
              fill={color}
              fillOpacity="0.2"
            />
            {/* Success rate filled portion */}
            <motion.rect
              initial={{ height: 0, y: chartHeight }}
              animate={{ 
                height: barHeight * (item.successRate / 100), 
                y: y + barHeight * (1 - item.successRate / 100)
              }}
              transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
              x={x}
              width={barWidth}
              rx="4"
              fill={color}
            />
            {/* Label */}
            <text
              x={x + barWidth / 2}
              y={chartHeight + 15}
              textAnchor="middle"
              className="text-[9px] fill-muted-foreground"
            >
              {item.name.slice(0, 8)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ChartLegend({ data }: { data: WorkflowPerformanceData[] }) {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {data.map((item, index) => {
        const color = item.color || defaultColors[index % defaultColors.length]
        return (
          <TooltipProvider key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {item.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs">Executions: {item.executions}</p>
                  <p className="text-xs">Success Rate: {item.successRate}%</p>
                  <p className="text-xs">Avg Duration: {formatDuration(item.avgDuration)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

export function WorkflowPerformanceChart({
  workflows,
  timeRange,
  onTimeRangeChange,
  chartType = 'bar',
  onChartTypeChange,
  onExport,
  loading = false,
  className
}: WorkflowPerformanceChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 400, height: 200 })

  // Update dimensions on resize
  React.useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.min(250, Math.max(180, entry.contentRect.width * 0.4))
        })
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (loading) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[200px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-medium">
              Workflow Performance
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Chart type toggle */}
              {onChartTypeChange && (
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => onChartTypeChange('bar')}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={chartType === 'line' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 rounded-none border-x"
                    onClick={() => onChartTypeChange('line')}
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={chartType === 'area' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => onChartTypeChange('area')}
                  >
                    <AreaChartIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Time range selector */}
              {onTimeRangeChange && (
                <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as typeof timeRange)}>
                  <SelectTrigger className="w-[110px] h-8">
                    <Calendar className="w-3.5 h-3.5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Export button */}
              {onExport && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onExport}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export as image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="w-full">
            {workflows.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No workflow data available
              </div>
            ) : (
              <>
                <BarChartSVG 
                  data={workflows} 
                  width={dimensions.width} 
                  height={dimensions.height} 
                />
                <ChartLegend data={workflows} />
              </>
            )}
          </div>

          {/* Summary stats */}
          {workflows.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.executions, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Executions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatDuration(Math.round(workflows.reduce((sum, w) => sum + w.avgDuration, 0) / workflows.length))}
                </p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
