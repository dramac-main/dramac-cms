"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  CircleX, 
  Loader2, 
  Clock, 
  MoreVertical,
  Eye,
  RefreshCw,
  StopCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Timer,
  AlertTriangle,
  Hourglass
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import type { WorkflowExecution, Workflow, ExecutionStatus } from "../../types/automation-types"

interface ExecutionLogCardProps {
  execution: WorkflowExecution
  workflow?: Pick<Workflow, 'id' | 'name'>
  variant?: 'compact' | 'detailed'
  onView?: () => void
  onRetry?: () => void
  onCancel?: () => void
  className?: string
}

const statusConfig: Record<ExecutionStatus, {
  icon: typeof CheckCircle2
  label: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  failed: {
    icon: CircleX,
    label: "Failed",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  running: {
    icon: Loader2,
    label: "Running",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  cancelled: {
    icon: StopCircle,
    label: "Cancelled",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted"
  },
  paused: {
    icon: Clock,
    label: "Paused",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  timed_out: {
    icon: Hourglass,
    label: "Timed Out",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20"
  }
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

function formatDuration(startDate: Date | string, endDate?: Date | string | null): string {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  const diffMs = end.getTime() - start.getTime()
  
  if (diffMs < 1000) return `${diffMs}ms`
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return `${mins}m ${secs}s`
}

export function ExecutionLogCard({
  execution,
  workflow,
  variant = 'compact',
  onView,
  onRetry,
  onCancel,
  className
}: ExecutionLogCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const config = statusConfig[execution.status] || statusConfig.pending
  const Icon = config.icon

  // Calculate step progress
  const completedSteps = execution.steps_completed || 0
  const totalSteps = execution.steps_total || 1
  const progressPercent = (completedSteps / totalSteps) * 100

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg border transition-colors",
          "hover:bg-muted/50 cursor-pointer",
          config.borderColor,
          className
        )}
        onClick={onView}
      >
        {/* Status icon */}
        <div className={cn("p-2 rounded-full", config.bgColor)}>
          <Icon className={cn("w-4 h-4", config.color, execution.status === 'running' && "animate-spin")} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {workflow?.name || `Workflow ${execution.workflow_id.slice(-8)}`}
            </span>
            <Badge variant="outline" className={cn("text-xs", config.color, config.bgColor)}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(execution.started_at || execution.created_at)}
            {execution.started_at && (
              <span className="ml-2">
                • {formatDuration(execution.started_at, execution.completed_at)}
              </span>
            )}
          </p>
        </div>

        {/* Progress indicator */}
        {execution.status === 'running' && (
          <div className="w-20">
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-0.5 text-right">
              {completedSteps}/{totalSteps}
            </p>
          </div>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            {onRetry && execution.status === 'failed' && (
              <DropdownMenuItem onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </DropdownMenuItem>
            )}
            {onCancel && execution.status === 'running' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCancel} className="text-red-600">
                  <StopCircle className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    )
  }

  // Detailed variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn("overflow-hidden", config.borderColor, className)}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg mt-0.5", config.bgColor)}>
                  <Icon className={cn("w-5 h-5", config.color, execution.status === 'running' && "animate-spin")} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">
                      {workflow?.name || `Workflow ${execution.workflow_id.slice(-8)}`}
                    </h3>
                    <Badge variant="outline" className={cn(config.color, config.bgColor)}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    ID: {execution.id.slice(-12)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-1" />
                    )}
                    {isExpanded ? "Collapse" : "Expand"}
                  </Button>
                </CollapsibleTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={onView}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details
                      </DropdownMenuItem>
                    )}
                    {onRetry && execution.status === 'failed' && (
                      <DropdownMenuItem onClick={onRetry}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Execution
                      </DropdownMenuItem>
                    )}
                    {onCancel && execution.status === 'running' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCancel} className="text-red-600">
                          <StopCircle className="w-4 h-4 mr-2" />
                          Cancel Execution
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Stats row */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(execution.started_at || execution.created_at)}</span>
              </div>
              {execution.started_at && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  <span>{formatDuration(execution.started_at, execution.completed_at)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>{completedSteps}/{totalSteps} steps</span>
              </div>
            </div>

            {/* Progress bar for running executions */}
            {execution.status === 'running' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* Error message for failed executions */}
            {execution.status === 'failed' && execution.error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm text-red-600/80">{execution.error}</p>
              </div>
            )}

            {/* Expanded content */}
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 pt-4 border-t space-y-4"
              >
                {/* Trigger info */}
                {execution.trigger_type && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Trigger</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="capitalize">
                        {execution.trigger_type.replace(/_/g, " ")}
                      </Badge>
                      {execution.trigger_event_id && (
                        <span>Event: {execution.trigger_event_id.slice(-8)}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Context data preview */}
                {execution.context && Object.keys(execution.context).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Context Data</h4>
                    <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(execution.context, null, 2).slice(0, 500)}
                      {JSON.stringify(execution.context).length > 500 && "\n..."}
                    </pre>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(execution.created_at).toLocaleString()}</p>
                  </div>
                  {execution.started_at && (
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p>{new Date(execution.started_at).toLocaleString()}</p>
                    </div>
                  )}
                  {execution.completed_at && (
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p>{new Date(execution.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 pt-2">
                  {onView && (
                    <Button variant="outline" size="sm" onClick={onView}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Timeline
                    </Button>
                  )}
                  {onRetry && execution.status === 'failed' && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </motion.div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
