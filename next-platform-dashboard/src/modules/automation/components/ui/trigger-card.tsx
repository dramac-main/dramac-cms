/**
 * TriggerCard Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Visual trigger display with type icon, configuration summary,
 * edit button, and active/inactive state.
 */

"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Zap,
  Clock,
  Globe,
  MousePointer,
  FileText,
  Edit,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  LucideIcon,
} from "lucide-react"
import type { TriggerConfig, TriggerType } from "../../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface TriggerCardProps {
  triggerType: TriggerType
  triggerConfig?: TriggerConfig
  isConfigured: boolean
  isExpanded?: boolean
  onEdit: () => void
  onToggleExpand?: () => void
  className?: string
}

// ============================================================================
// TRIGGER TYPE CONFIGURATION
// ============================================================================

const TRIGGER_TYPE_CONFIG: Record<
  TriggerType,
  {
    icon: LucideIcon
    color: string
    bgColor: string
    borderColor: string
    label: string
    description: string
  }
> = {
  event: {
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/50",
    label: "Event Trigger",
    description: "Triggered by platform events like contact created, deal won, etc.",
  },
  schedule: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    label: "Schedule Trigger",
    description: "Runs automatically on a schedule (hourly, daily, weekly, etc.)",
  },
  webhook: {
    icon: Globe,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/50",
    label: "Webhook Trigger",
    description: "Triggered by external HTTP requests to a unique endpoint",
  },
  manual: {
    icon: MousePointer,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/50",
    label: "Manual Trigger",
    description: "Run manually from the dashboard or via API",
  },
  form_submission: {
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/50",
    label: "Form Submission",
    description: "Triggered when a form is submitted on your site",
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function getTriggerSummary(type: TriggerType, config?: TriggerConfig): string {
  if (!config) return "Not configured"

  switch (type) {
    case "event":
      if (config.event_type) {
        return `When ${config.event_type.replace(/\./g, " → ").replace(/_/g, " ")}`
      }
      return "Select an event"

    case "schedule":
      if (config.cron) {
        // Simple cron description
        const cron = config.cron
        if (cron === "0 * * * *") return "Every hour"
        if (cron === "0 0 * * *") return "Every day at midnight"
        if (cron === "0 9 * * *") return "Every day at 9 AM"
        if (cron === "0 9 * * 1") return "Every Monday at 9 AM"
        if (cron === "0 0 1 * *") return "First day of each month"
        return `Cron: ${cron}`
      }
      return "Set schedule"

    case "webhook":
      if (config.endpoint_path) {
        return `POST /${config.endpoint_path}`
      }
      return "Configure endpoint"

    case "manual":
      return "Click to run"

    case "form_submission":
      if (config.form_id) {
        return `Form ID: ${config.form_id}`
      }
      return "Select a form"

    default:
      return "Configure trigger"
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TriggerCard({
  triggerType,
  triggerConfig,
  isConfigured,
  isExpanded = false,
  onEdit,
  onToggleExpand,
  className,
}: TriggerCardProps) {
  const config = TRIGGER_TYPE_CONFIG[triggerType] || TRIGGER_TYPE_CONFIG.event
  const Icon = config.icon
  const summary = getTriggerSummary(triggerType, triggerConfig)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all",
          "border-2",
          config.borderColor,
          isExpanded && "shadow-md"
        )}
      >
        {/* Main Row */}
        <div
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer",
            "hover:bg-accent/50 transition-colors"
          )}
          onClick={onToggleExpand}
        >
          {/* Icon */}
          <div className={cn("p-2.5 rounded-lg shrink-0", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{config.label}</span>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {isConfigured ? "Trigger configured" : "Needs configuration"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground truncate">{summary}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {onToggleExpand && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t"
          >
            <div className="p-3 space-y-3">
              <p className="text-xs text-muted-foreground">{config.description}</p>

              {/* Event Type Details */}
              {triggerType === "event" && triggerConfig?.event_type && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Event
                    </Badge>
                    <span className="text-sm font-mono">
                      {triggerConfig.event_type}
                    </span>
                  </div>
                  {triggerConfig.filter && Object.keys(triggerConfig.filter).length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Filter
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {JSON.stringify(triggerConfig.filter)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Details */}
              {triggerType === "schedule" && triggerConfig?.cron && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Cron
                    </Badge>
                    <span className="text-sm font-mono">{triggerConfig.cron}</span>
                  </div>
                  {triggerConfig.timezone && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Timezone
                      </Badge>
                      <span className="text-xs">{triggerConfig.timezone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Webhook Details */}
              {triggerType === "webhook" && triggerConfig?.endpoint_path && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Endpoint
                    </Badge>
                    <span className="text-xs font-mono break-all">
                      /api/automation/webhook/{triggerConfig.endpoint_path}
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onEdit}
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit Trigger
              </Button>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
