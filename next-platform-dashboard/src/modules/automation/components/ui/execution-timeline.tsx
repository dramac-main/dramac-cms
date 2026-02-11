"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle2, 
  CircleX, 
  Loader2, 
  Clock, 
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Play,
  Timer,
  StopCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { WorkflowExecution, StepExecutionLog, StepStatus } from "../../types/automation-types"

interface ExecutionTimelineProps {
  execution: WorkflowExecution
  stepLogs: StepExecutionLog[]
  onStepClick?: (stepId: string) => void
  onRetryStep?: (stepId: string) => void
  showDuration?: boolean
  className?: string
}

const statusConfig: Record<StepStatus, {
  icon: typeof CheckCircle2
  color: string
  bg: string
  animate?: boolean
}> = {
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500" },
  failed: { icon: CircleX, color: "text-red-600", bg: "bg-red-500" },
  running: { icon: Loader2, color: "text-muted-foreground", bg: "bg-blue-500", animate: true },
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500" },
  skipped: { icon: ChevronRight, color: "text-muted-foreground", bg: "bg-muted" },
  cancelled: { icon: StopCircle, color: "text-muted-foreground", bg: "bg-muted" },
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "-"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

function TimelineNode({ 
  log, 
  index,
  isLast, 
  showDuration, 
  onStepClick, 
  onRetryStep 
}: { 
  log: StepExecutionLog
  index: number
  isLast: boolean
  showDuration?: boolean
  onStepClick?: (stepId: string) => void
  onRetryStep?: (stepId: string) => void
}) {
  const [isOpen, setIsOpen] = React.useState(log.status === "failed")
  const config = statusConfig[log.status] || statusConfig.pending
  const Icon = config.icon

  // Use duration_ms from type, or calculate from timestamps
  const duration = log.duration_ms ?? (
    log.started_at && log.completed_at
      ? new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()
      : null
  )

  return (
    <div className="relative">
      {/* Connection line */}
      {!isLast && (
        <div 
          className={cn(
            "absolute left-[15px] top-[36px] w-0.5 h-[calc(100%-20px)]",
            log.status === "completed" ? "bg-green-500/50" :
            log.status === "failed" ? "bg-red-500/50" :
            log.status === "running" ? "bg-blue-500/50" :
            "bg-border"
          )}
        />
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
            "hover:bg-muted/50",
            log.status === "failed" && "bg-red-500/5"
          )}
          onClick={() => onStepClick?.(log.step_id)}
        >
          {/* Status indicator */}
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              config.bg + "/20"
            )}
          >
            <Icon 
              className={cn(
                "w-4 h-4",
                config.color,
                config.animate && "animate-spin"
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  Step {index + 1}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({log.step_id.slice(-8)})
                </span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                {showDuration && duration && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {formatDuration(duration)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Started: {formatTime(log.started_at)}</p>
                        <p>Completed: {formatTime(log.completed_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {log.status === "failed" && onRetryStep && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetryStep(log.step_id)
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status */}
            <p className="text-xs text-muted-foreground capitalize">
              {log.status.replace(/_/g, " ")}
              {log.attempt_number > 1 && ` (attempt ${log.attempt_number})`}
            </p>

            {/* Expandable details */}
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 space-y-2"
              >
                {/* Input preview */}
                {log.input_data && Object.keys(log.input_data).length > 0 && (
                  <div className="rounded bg-muted p-2">
                    <p className="text-xs font-medium mb-1">Input</p>
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(log.input_data, null, 2).slice(0, 200)}
                      {JSON.stringify(log.input_data).length > 200 && "..."}
                    </pre>
                  </div>
                )}

                {/* Output preview */}
                {log.output_data && Object.keys(log.output_data).length > 0 && (
                  <div className="rounded bg-muted p-2">
                    <p className="text-xs font-medium mb-1">Output</p>
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(log.output_data, null, 2).slice(0, 200)}
                      {JSON.stringify(log.output_data).length > 200 && "..."}
                    </pre>
                  </div>
                )}

                {/* Error message */}
                {log.error && (
                  <div className="rounded bg-red-500/10 border border-red-500/20 p-2">
                    <div className="flex items-center gap-1.5 text-red-600 mb-1">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs font-medium">Error</span>
                    </div>
                    <p className="text-xs text-red-600/80">{log.error}</p>
                    {log.error_stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600/60 cursor-pointer">Stack trace</summary>
                        <pre className="text-xs text-red-600/60 mt-1 overflow-x-auto">
                          {log.error_stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Notes */}
                {log.notes && (
                  <p className="text-xs text-muted-foreground italic">{log.notes}</p>
                )}
              </motion.div>
            </CollapsibleContent>
          </div>
        </motion.div>
      </Collapsible>
    </div>
  )
}

export function ExecutionTimeline({
  execution,
  stepLogs,
  onStepClick,
  onRetryStep,
  showDuration = true,
  className
}: ExecutionTimelineProps) {
  // Sort by created_at or keep original order
  const sortedLogs = React.useMemo(() => 
    [...stepLogs].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    [stepLogs]
  )

  // Calculate total duration
  const totalDuration = execution.duration_ms ?? (
    execution.started_at && execution.completed_at
      ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
      : null
  )

  return (
    <div className={cn("space-y-2", className)}>
      {/* Execution header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Execution #{execution.id.slice(-8)}
          </span>
        </div>
        {totalDuration && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Total: {formatDuration(totalDuration)}
          </span>
        )}
      </div>

      {/* Timeline */}
      <AnimatePresence mode="popLayout">
        {sortedLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-sm text-muted-foreground"
          >
            No steps executed yet
          </motion.div>
        ) : (
          <div className="space-y-1">
            {sortedLogs.map((log, index) => (
              <TimelineNode
                key={log.id}
                log={log}
                index={index}
                isLast={index === sortedLogs.length - 1}
                showDuration={showDuration}
                onStepClick={onStepClick}
                onRetryStep={onRetryStep}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
