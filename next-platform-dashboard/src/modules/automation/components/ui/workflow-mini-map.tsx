/**
 * WorkflowMiniMap Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Miniature workflow overview with clickable navigation,
 * current step highlight, and zoom controls.
 */

"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Map,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Zap,
  GitBranch,
  Timer,
  Repeat,
  StopCircle,
} from "lucide-react"
import type { WorkflowStep } from "../../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowMiniMapProps {
  steps: WorkflowStep[]
  selectedStepId?: string
  triggerType?: string
  onStepClick: (stepId: string) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  className?: string
}

// ============================================================================
// STEP TYPE CONFIGURATION
// ============================================================================

const STEP_TYPE_COLORS: Record<string, string> = {
  condition: "bg-amber-500",
  delay: "bg-blue-500",
  loop: "bg-purple-500",
  stop: "bg-red-500",
  transform: "bg-orange-500",
  filter: "bg-orange-500",
  action: "bg-primary",
}

const STEP_TYPE_ICONS: Record<string, React.ElementType> = {
  condition: GitBranch,
  delay: Timer,
  loop: Repeat,
  stop: StopCircle,
  transform: Zap,
  filter: Zap,
  action: Zap,
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkflowMiniMap({
  steps,
  selectedStepId,
  triggerType,
  onStepClick,
  isExpanded = false,
  onToggleExpand,
  className,
}: WorkflowMiniMapProps) {
  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.position - b.position),
    [steps]
  )

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="py-2 px-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Workflow Map</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {steps.length} steps
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onToggleExpand}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={cn(isExpanded ? "h-[300px]" : "h-[180px]")}>
          <div className="p-3">
            {/* Trigger Node */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium truncate block">
                  Trigger
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {triggerType || "Event"}
                </span>
              </div>
            </motion.div>

            {/* Connection Line from Trigger */}
            {sortedSteps.length > 0 && (
              <div className="ml-4 h-4 border-l-2 border-dashed border-muted-foreground/30" />
            )}

            {/* Steps */}
            {sortedSteps.map((step, index) => {
              const isSelected = step.id === selectedStepId
              const color = STEP_TYPE_COLORS[step.step_type] || STEP_TYPE_COLORS.action
              const Icon = STEP_TYPE_ICONS[step.step_type] || STEP_TYPE_ICONS.action

              return (
                <div key={step.id}>
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onStepClick(step.id)}
                    className={cn(
                      "w-full flex items-center gap-2 p-1.5 rounded-md transition-all",
                      "hover:bg-accent text-left",
                      isSelected && "bg-primary/10 ring-1 ring-primary"
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "w-6 h-6 rounded flex items-center justify-center",
                          color,
                          step.is_active ? "opacity-100" : "opacity-40"
                        )}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span
                        className={cn(
                          "absolute -top-1 -right-1 text-[8px] font-bold",
                          "w-3 h-3 rounded-full bg-background border flex items-center justify-center"
                        )}
                      >
                        {step.position}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-xs truncate block",
                          !step.is_active && "text-muted-foreground"
                        )}
                      >
                        {step.name || step.action_type || step.step_type}
                      </span>
                    </div>
                  </motion.button>

                  {/* Connection Line between Steps */}
                  {index < sortedSteps.length - 1 && (
                    <div className="ml-4 h-2 border-l-2 border-dashed border-muted-foreground/30" />
                  )}
                </div>
              )
            })}

            {/* End Node */}
            {sortedSteps.length > 0 && (
              <>
                <div className="ml-4 h-4 border-l-2 border-dashed border-muted-foreground/30" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: sortedSteps.length * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted border-2 border-muted-foreground/50 flex items-center justify-center">
                    <StopCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">End</span>
                </motion.div>
              </>
            )}

            {/* Empty State */}
            {sortedSteps.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">No steps added yet</p>
                <p className="text-[10px] mt-1">Drag actions from the palette</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
