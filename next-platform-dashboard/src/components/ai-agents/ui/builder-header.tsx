"use client"

/**
 * Builder Header Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Header with title, actions, and step progress
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  Save,
  Play,
  MoreHorizontal,
  Copy,
  Trash2,
  Archive,
  Download,
  Upload,
  Settings,
  History,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

// =============================================================================
// TYPES
// =============================================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface BuilderHeaderProps {
  agentName: string
  onNameChange: (name: string) => void
  onBack: () => void
  onSave: () => void
  onTest?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onExport?: () => void
  onImport?: () => void
  onViewHistory?: () => void
  saveStatus?: SaveStatus
  isDirty?: boolean
  isNew?: boolean
  lastSaved?: Date
  className?: string
  children?: React.ReactNode // For step progress
}

// =============================================================================
// SAVE STATUS INDICATOR
// =============================================================================

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSaved?: Date
  isDirty?: boolean
}

function SaveStatusIndicator({ status, lastSaved, isDirty }: SaveStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs">Saved</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Save failed</span>
          </div>
        )
      default:
        if (isDirty) {
          return (
            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-xs">Unsaved changes</span>
            </div>
          )
        }
        if (lastSaved) {
          return (
            <span className="text-xs text-muted-foreground">
              Last saved {formatTimeAgo(lastSaved)}
            </span>
          )
        }
        return null
    }
  }

  return (
    <div className="hidden sm:block">
      {getStatusDisplay()}
    </div>
  )
}

// =============================================================================
// EDITABLE TITLE
// =============================================================================

interface EditableTitleProps {
  value: string
  onChange: (value: string) => void
  isNew?: boolean
}

function EditableTitle({ value, onChange, isNew }: EditableTitleProps) {
  const [isEditing, setIsEditing] = React.useState(isNew)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            setIsEditing(false)
          }
        }}
        className="h-8 w-[200px] sm:w-[300px] font-semibold text-lg"
        placeholder="Agent name"
      />
    )
  }

  return (
    <button
      className="font-semibold text-lg hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[300px] text-left"
      onClick={() => setIsEditing(true)}
    >
      {value || "Untitled Agent"}
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuilderHeader({
  agentName,
  onNameChange,
  onBack,
  onSave,
  onTest,
  onDuplicate,
  onDelete,
  onExport,
  onImport,
  onViewHistory,
  saveStatus = 'idle',
  isDirty = false,
  isNew = false,
  lastSaved,
  className,
  children,
}: BuilderHeaderProps) {
  return (
    <motion.header
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b px-4 py-3",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to agents</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-2 min-w-0">
            <EditableTitle
              value={agentName}
              onChange={onNameChange}
              isNew={isNew}
            />
            {isNew && (
              <Badge variant="secondary" className="shrink-0">Draft</Badge>
            )}
          </div>
        </div>

        {/* Center Section - Step Progress (optional) */}
        {children && (
          <div className="hidden lg:flex flex-1 justify-center">
            {children}
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2 shrink-0">
          <SaveStatusIndicator
            status={saveStatus}
            lastSaved={lastSaved}
            isDirty={isDirty}
          />

          {/* Test Button */}
          {onTest && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTest}
                    className="hidden sm:flex"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run a test</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Save Button */}
          <Button
            size="sm"
            onClick={onSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onTest && (
                <DropdownMenuItem onClick={onTest} className="sm:hidden">
                  <Play className="h-4 w-4 mr-2" />
                  Test
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onViewHistory && (
                <DropdownMenuItem onClick={onViewHistory}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
              )}
              {onImport && (
                <DropdownMenuItem onClick={onImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </DropdownMenuItem>
              )}
              {(onDuplicate || onViewHistory || onExport || onImport) && onDelete && (
                <DropdownMenuSeparator />
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Step Progress */}
      {children && (
        <div className="lg:hidden mt-3">
          {children}
        </div>
      )}
    </motion.header>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return date.toLocaleDateString()
}

export default BuilderHeader
