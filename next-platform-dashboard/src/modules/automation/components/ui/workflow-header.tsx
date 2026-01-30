/**
 * WorkflowHeader Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Enhanced builder header with workflow name editing, status toggle,
 * save/test/run buttons, breadcrumb navigation, and undo/redo controls.
 */

"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Save,
  Play,
  Loader2,
  AlertCircle,
  MoreVertical,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  History,
  Settings,
  Pencil,
  TestTube,
  Zap,
  ChevronRight,
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowHeaderProps {
  siteId: string
  workflowId?: string
  workflowName: string
  isActive: boolean
  isDirty: boolean
  isSaving: boolean
  canUndo?: boolean
  canRedo?: boolean
  lastSaved?: Date | null
  onNameChange: (name: string) => void
  onActiveChange: (active: boolean) => void
  onSave: () => void
  onTest?: () => void
  onRun?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onViewHistory?: () => void
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkflowHeader({
  siteId,
  workflowId,
  workflowName,
  isActive,
  isDirty,
  isSaving,
  canUndo = false,
  canRedo = false,
  lastSaved,
  onNameChange,
  onActiveChange,
  onSave,
  onTest,
  onRun,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onViewHistory,
  className,
}: WorkflowHeaderProps) {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(workflowName)

  const handleNameSubmit = useCallback(() => {
    if (editedName.trim() && editedName !== workflowName) {
      onNameChange(editedName.trim())
    } else {
      setEditedName(workflowName)
    }
    setIsEditingName(false)
  }, [editedName, workflowName, onNameChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNameSubmit()
      } else if (e.key === "Escape") {
        setEditedName(workflowName)
        setIsEditingName(false)
      }
    },
    [handleNameSubmit, workflowName]
  )

  const formatLastSaved = useCallback((date: Date | null | undefined) => {
    if (!date) return null
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }, [])

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Left Section - Navigation & Name */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Back Button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.push(`/dashboard/sites/${siteId}/automation`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Automation</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Breadcrumbs - Custom implementation */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          <Link 
            href={`/dashboard/sites/${siteId}/automation`}
            className="hover:text-foreground transition-colors"
          >
            Automation
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link 
            href={`/dashboard/sites/${siteId}/automation/workflows`}
            className="hover:text-foreground transition-colors"
          >
            Workflows
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[150px]">
            {workflowId ? workflowName : "New Workflow"}
          </span>
        </nav>

        {/* Workflow Name (Editable) */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingName ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="h-8 w-[200px] text-sm font-semibold"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 group"
            >
              <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
              <span className="font-semibold text-sm truncate max-w-[200px]">
                {workflowName}
              </span>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Status Badge */}
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "shrink-0",
              isActive && "bg-green-500/10 text-green-600 hover:bg-green-500/20"
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>

          {/* Dirty Indicator */}
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      {/* Center Section - Undo/Redo & Save Status */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Undo/Redo */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!canUndo}
                  onClick={onUndo}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (⌘Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!canRedo}
                  onClick={onRedo}
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Last Saved */}
        {lastSaved && (
          <span className="text-xs text-muted-foreground">
            Saved {formatLastSaved(lastSaved)}
          </span>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Active Toggle */}
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <span className="text-sm text-muted-foreground">Active</span>
          <Switch
            checked={isActive}
            onCheckedChange={onActiveChange}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {/* Test Button */}
        {onTest && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onTest}>
                  <TestTube className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Test</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Test workflow with sample data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Run Button */}
        {onRun && workflowId && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onRun}>
                  <Play className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Run</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run workflow manually</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Save Button */}
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="min-w-[80px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Workflow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewHistory}>
              <History className="h-4 w-4 mr-2" />
              View History
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/sites/${siteId}/automation/workflows/${workflowId}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
