"use client"

/**
 * Agent Status Card Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * Display agent status with quick stats and actions
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Pause, 
  Settings, 
  TestTube2,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Zap,
  CircleCheck,
  CircleX,
  Clock,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// TYPES
// =============================================================================

export type AgentStatus = 'active' | 'inactive' | 'error' | 'paused'

export interface AgentStatusData {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  status: AgentStatus
  agentType: string
  domain?: string
  totalRuns: number
  successRate: number
  totalTokens: number
  avgResponseTime?: number
  lastRunAt?: string
  lastError?: string
  createdAt: string
}

export interface AgentStatusCardProps {
  agent: AgentStatusData
  className?: string
  onEdit?: (id: string) => void
  onTest?: (id: string) => void
  onToggleActive?: (id: string, active: boolean) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (id: string) => void
  animationDelay?: number
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const statusConfig: Record<AgentStatus, {
  label: string
  color: string
  bgColor: string
  dotColor: string
}> = {
  active: {
    label: 'Active',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    dotColor: 'bg-green-500',
  },
  inactive: {
    label: 'Inactive',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    dotColor: 'bg-muted-foreground',
  },
  error: {
    label: 'Error',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
  },
  paused: {
    label: 'Paused',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    dotColor: 'bg-yellow-500',
  },
}

// =============================================================================
// HELPERS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function getRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// =============================================================================
// STATUS INDICATOR
// =============================================================================

function StatusIndicator({ status }: { status: AgentStatus }) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        className={cn("h-2 w-2 rounded-full", config.dotColor)}
        animate={status === 'active' ? { 
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        } : {}}
        transition={{ 
          repeat: status === 'active' ? Infinity : 0, 
          duration: 2 
        }}
      />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  )
}

// =============================================================================
// STAT ITEM
// =============================================================================

interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color?: string
  trend?: 'up' | 'down'
}

function StatItem({ icon: Icon, label, value, color, trend }: StatItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5", color || "text-muted-foreground")} />
            <span className="text-sm font-medium">{value}</span>
            {trend && (
              trend === 'up' 
                ? <TrendingUp className="h-3 w-3 text-green-500" />
                : <TrendingDown className="h-3 w-3 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

export function AgentStatusCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentStatusCard({
  agent,
  className,
  onEdit,
  onTest,
  onToggleActive,
  onDuplicate,
  onDelete,
  onClick,
  animationDelay = 0,
}: AgentStatusCardProps) {
  const [isToggling, setIsToggling] = React.useState(false)

  const handleToggle = async (checked: boolean) => {
    if (!onToggleActive) return
    setIsToggling(true)
    try {
      await onToggleActive(agent.id, checked)
    } finally {
      setIsToggling(false)
    }
  }

  const successRateColor = agent.successRate >= 95 
    ? 'text-green-600' 
    : agent.successRate >= 80 
    ? 'text-yellow-600' 
    : 'text-red-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card 
        className={cn(
          "overflow-hidden transition-all hover:shadow-md cursor-pointer",
          agent.status === 'error' && "border-red-200 dark:border-red-800",
          className
        )}
        onClick={() => onClick?.(agent.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              className={cn(
                "text-3xl p-2 rounded-lg",
                statusConfig[agent.status].bgColor
              )}
              whileHover={{ scale: 1.05 }}
            >
              {agent.icon || '🤖'}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{agent.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {agent.agentType}
                    </Badge>
                    {agent.domain && (
                      <Badge variant="outline" className="text-xs">
                        {agent.domain}
                      </Badge>
                    )}
                  </div>
                </div>
                <StatusIndicator status={agent.status} />
              </div>

              {/* Description */}
              {agent.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {agent.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 flex-wrap">
                <StatItem 
                  icon={Zap} 
                  label="Total Runs" 
                  value={formatNumber(agent.totalRuns)} 
                />
                <StatItem 
                  icon={CircleCheck} 
                  label="Success Rate" 
                  value={`${agent.successRate.toFixed(1)}%`}
                  color={successRateColor}
                />
                <StatItem 
                  icon={Clock} 
                  label="Last Run" 
                  value={getRelativeTime(agent.lastRunAt)} 
                />
              </div>

              {/* Error Message */}
              {agent.status === 'error' && agent.lastError && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="truncate">{agent.lastError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Toggle Active */}
              {onToggleActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch
                          checked={agent.status === 'active'}
                          onCheckedChange={handleToggle}
                          disabled={isToggling || agent.status === 'error'}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{agent.status === 'active' ? 'Deactivate' : 'Activate'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                {onTest && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onTest(agent.id)}
                        >
                          <TestTube2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Test Agent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {onEdit && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(agent.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Agent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* More Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(agent.id)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onTest && (
                      <DropdownMenuItem onClick={() => onTest(agent.id)}>
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Test
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(agent.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDelete(agent.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AgentStatusCard
