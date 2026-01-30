"use client"

/**
 * Execution Log Card Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * Display execution history with status, duration, and actions
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Ban,
  Bot
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// TYPES
// =============================================================================

export type ExecutionStatus = 
  | 'success' 
  | 'failed' 
  | 'running' 
  | 'pending' 
  | 'pending_approval'
  | 'timeout' 
  | 'cancelled'

export interface ExecutionLogData {
  id: string
  agentId: string
  agentName: string
  agentIcon?: string
  status: ExecutionStatus
  triggeredBy: string
  startedAt: string
  completedAt?: string
  durationMs?: number
  tokensUsed: number
  cost: number
  stepsCompleted?: number
  totalSteps?: number
  errorMessage?: string
  context?: Record<string, unknown>
}

export interface ExecutionLogCardProps {
  execution: ExecutionLogData
  variant?: 'compact' | 'detailed'
  className?: string
  onView?: (id: string) => void
  onRetry?: (id: string) => void
  onCancel?: (id: string) => void
  animationDelay?: number
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const statusConfig: Record<ExecutionStatus, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  bgColor: string
}> = {
  success: {
    icon: CheckCircle,
    label: 'Success',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  running: {
    icon: Loader2,
    label: 'Running',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  pending_approval: {
    icon: AlertTriangle,
    label: 'Awaiting Approval',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  timeout: {
    icon: Clock,
    label: 'Timeout',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  cancelled: {
    icon: Ban,
    label: 'Cancelled',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDuration(ms?: number): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${(cost * 100).toFixed(2)}¢`
  return `$${cost.toFixed(4)}`
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// =============================================================================
// STATUS BADGE
// =============================================================================

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "gap-1 font-medium",
        config.bgColor,
        config.color
      )}
    >
      <Icon className={cn(
        "h-3 w-3",
        status === 'running' && "animate-spin"
      )} />
      {config.label}
    </Badge>
  )
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

function CompactCard({ 
  execution, 
  onView, 
  onRetry, 
  onCancel,
  animationDelay = 0 
}: ExecutionLogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay }}
    >
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Agent Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="text-2xl flex-shrink-0">
                {execution.agentIcon || '🤖'}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{execution.agentName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {execution.triggeredBy} • {getRelativeTime(execution.startedAt)}
                </p>
              </div>
            </div>

            {/* Status & Stats */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDuration(execution.durationMs)}</span>
                <span>{execution.tokensUsed.toLocaleString()} tokens</span>
                <span>{formatCost(execution.cost)}</span>
              </div>
              <StatusBadge status={execution.status} />
              
              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(execution.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {execution.status === 'failed' && (
                    <DropdownMenuItem onClick={() => onRetry?.(execution.id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </DropdownMenuItem>
                  )}
                  {execution.status === 'running' && (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onCancel?.(execution.id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Error Message */}
          {execution.errorMessage && (
            <div className="mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
              {execution.errorMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// DETAILED VARIANT
// =============================================================================

function DetailedCard({ 
  execution, 
  onView, 
  onRetry, 
  onCancel,
  animationDelay = 0 
}: ExecutionLogCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-3xl flex-shrink-0">
                  {execution.agentIcon || '🤖'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{execution.agentName}</p>
                    <StatusBadge status={execution.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Triggered by: {execution.triggeredBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onView && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onView(execution.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
                {execution.status === 'failed' && onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRetry(execution.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Stats Row */}
            <div className="px-4 pb-4 grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="font-medium">{formatTime(execution.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(execution.durationMs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tokens</p>
                <p className="font-medium">{execution.tokensUsed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="font-medium">{formatCost(execution.cost)}</p>
              </div>
            </div>

            {/* Error Message */}
            {execution.errorMessage && (
              <div className="mx-4 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-1">Error</p>
                <p className="text-sm text-destructive/90">{execution.errorMessage}</p>
              </div>
            )}

            {/* Collapsible Content */}
            <CollapsibleContent>
              <div className="border-t bg-muted/30 p-4 space-y-4">
                {/* Progress */}
                {execution.stepsCompleted !== undefined && execution.totalSteps !== undefined && (
                  <div>
                    <p className="text-sm font-medium mb-2">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(execution.stepsCompleted / execution.totalSteps) * 100}%` 
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {execution.stepsCompleted}/{execution.totalSteps} steps
                      </span>
                    </div>
                  </div>
                )}

                {/* Context */}
                {execution.context && Object.keys(execution.context).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Context</p>
                    <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-40">
                      {JSON.stringify(execution.context, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Execution ID */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Execution ID: {execution.id}</span>
                  <span>Agent ID: {execution.agentId}</span>
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

export function ExecutionLogCardSkeleton({ variant = 'compact' }: { variant?: 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExecutionLogCard(props: ExecutionLogCardProps) {
  const { variant = 'compact' } = props

  if (variant === 'detailed') {
    return <DetailedCard {...props} />
  }

  return <CompactCard {...props} />
}

export default ExecutionLogCard
