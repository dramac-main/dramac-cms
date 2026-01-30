/**
 * WorkflowStepCard Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Enhanced visual step card with status indicators, action preview,
 * connection points, and hover effects.
 */

"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  GripVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Mail,
  User,
  Database,
  GitBranch,
  Timer,
  Repeat,
  StopCircle,
  Webhook,
  Bot,
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowStepCardProps {
  id: string
  stepType: string
  actionType?: string | null
  name: string
  description?: string | null
  isActive: boolean
  isSelected: boolean
  status?: "idle" | "running" | "success" | "error" | "skipped"
  errorMessage?: string
  position: number
  showConnectionTop?: boolean
  showConnectionBottom?: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleActive: () => void
  onConfigure: () => void
  dragHandleProps?: Record<string, unknown>
  className?: string
}

// ============================================================================
// STEP TYPE CONFIGURATION
// ============================================================================

const STEP_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  condition: { icon: GitBranch, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  delay: { icon: Timer, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  loop: { icon: Repeat, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  stop: { icon: StopCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
  transform: { icon: Database, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  filter: { icon: Database, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  action: { icon: Zap, color: "text-primary", bgColor: "bg-primary/10" },
}

const ACTION_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  crm: { icon: User, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  email: { icon: Mail, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  notification: { icon: Zap, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  webhook: { icon: Webhook, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  data: { icon: Database, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  ai: { icon: Bot, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  flow: { icon: GitBranch, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  integration: { icon: Webhook, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
}

// ============================================================================
// HELPERS
// ============================================================================

function getStepConfig(stepType: string, actionType?: string | null) {
  // First check action type prefix
  if (actionType) {
    const actionPrefix = actionType.split(".")[0]
    if (ACTION_TYPE_CONFIG[actionPrefix]) {
      return ACTION_TYPE_CONFIG[actionPrefix]
    }
  }
  
  // Fall back to step type
  return STEP_TYPE_CONFIG[stepType] || STEP_TYPE_CONFIG.action
}

function getStatusConfig(status?: string) {
  switch (status) {
    case "running":
      return { icon: Clock, color: "text-blue-500", label: "Running", animate: true }
    case "success":
      return { icon: CheckCircle2, color: "text-green-500", label: "Success" }
    case "error":
      return { icon: AlertCircle, color: "text-red-500", label: "Error" }
    case "skipped":
      return { icon: Clock, color: "text-muted-foreground", label: "Skipped" }
    default:
      return null
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const WorkflowStepCard = forwardRef<HTMLDivElement, WorkflowStepCardProps>(
  function WorkflowStepCard(
    {
      stepType,
      actionType,
      name,
      description,
      isActive,
      isSelected,
      status,
      errorMessage,
      position,
      showConnectionTop = true,
      showConnectionBottom = true,
      onSelect,
      onDelete,
      onDuplicate,
      onToggleActive,
      onConfigure,
      dragHandleProps,
      className,
    },
    ref
  ) {
    const config = getStepConfig(stepType, actionType)
    const statusConfig = getStatusConfig(status)
    const Icon = config.icon

    return (
      <div ref={ref} className={cn("relative group", className)}>
        {/* Connection Point - Top */}
        {showConnectionTop && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="w-3 h-3 rounded-full bg-border border-2 border-background group-hover:bg-primary group-hover:scale-110 transition-all" />
          </div>
        )}

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
          onClick={onSelect}
          className={cn(
            "relative cursor-pointer rounded-lg border-2 transition-all",
            "bg-card hover:shadow-md",
            isSelected
              ? "border-primary ring-2 ring-primary/20 shadow-lg"
              : "border-border hover:border-primary/50",
            !isActive && "opacity-60"
          )}
        >
          {/* Step Type Indicator */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
              config.color.replace("text-", "bg-")
            )}
          />

          <div className="p-4 pl-5">
            {/* Header Row */}
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div
                {...dragHandleProps}
                className="cursor-grab hover:text-primary touch-none mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Icon */}
              <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{name}</span>
                  {!isActive && (
                    <Badge variant="secondary" className="text-xs">
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                    </Badge>
                  )}
                  {statusConfig && (
                    <Badge
                      variant={status === "error" ? "destructive" : "secondary"}
                      className={cn("text-xs", statusConfig.color)}
                    >
                      <statusConfig.icon
                        className={cn(
                          "h-3 w-3 mr-1",
                          statusConfig.animate && "animate-spin"
                        )}
                      />
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {description}
                  </p>
                )}
                {errorMessage && status === "error" && (
                  <p className="text-xs text-destructive mt-1 truncate">
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Position Badge */}
              <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
                #{position}
              </Badge>
            </div>

            {/* Quick Actions - Show on Hover */}
            <div
              className={cn(
                "absolute right-2 top-2 flex items-center gap-1",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "bg-background/80 backdrop-blur-sm rounded-md p-1"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onToggleActive}
                    >
                      {isActive ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isActive ? "Pause Step" : "Activate Step"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onConfigure}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Configure</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onDuplicate}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Duplicate</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>

        {/* Connection Point - Bottom */}
        {showConnectionBottom && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
            <div className="w-3 h-3 rounded-full bg-border border-2 border-background group-hover:bg-primary group-hover:scale-110 transition-all" />
          </div>
        )}
      </div>
    )
  }
)
