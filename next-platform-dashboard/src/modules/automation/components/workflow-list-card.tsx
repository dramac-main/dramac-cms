/**
 * WorkflowListCard Component
 * 
 * Phase EM-57B: Automation Engine - Client-side workflow card with actions
 * 
 * Provides interactive dropdown menu for workflow actions:
 * - Edit (navigate to workflow builder)
 * - Duplicate (clone workflow)
 * - Activate/Pause (toggle is_active)
 * - Delete (remove workflow)
 */

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Zap,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  Settings,
  Trash2,
  Copy,
  Loader2
} from "lucide-react"
import { activateWorkflow, pauseWorkflow, deleteWorkflow } from "../actions/automation-actions"

// ============================================================================
// TYPES
// ============================================================================

interface Workflow {
  id: string
  name: string
  description: string | null
  is_active: boolean
  trigger_type: string
  created_at: string
  updated_at: string
}

interface WorkflowListCardProps {
  workflow: Workflow
  siteId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkflowListCard({ workflow, siteId }: WorkflowListCardProps) {
  const router = useRouter()
  const [isActivating, setIsActivating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const status = workflow.is_active ? "active" : "paused"
  
  const statusBadge = {
    active: <Badge className="bg-green-500">Active</Badge>,
    paused: <Badge variant="secondary">Paused</Badge>,
  }

  const triggerLabels: Record<string, string> = {
    event: "Event Trigger",
    schedule: "Scheduled",
    webhook: "Webhook",
    manual: "Manual"
  }

  // Handle activate/pause
  const handleToggleActive = async () => {
    setIsActivating(true)
    try {
      const result = workflow.is_active 
        ? await pauseWorkflow(workflow.id)
        : await activateWorkflow(workflow.id)
      
      if (!result.success) {
        throw new Error(result.error || 'Operation failed')
      }
      
      toast.success(workflow.is_active ? 'Workflow paused' : 'Workflow activated')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update workflow'
      toast.error(message)
    } finally {
      setIsActivating(false)
    }
  }

  // Handle duplicate
  const handleDuplicate = async () => {
    toast.info('Duplicate feature coming soon!')
    // TODO: Implement duplicate workflow
  }

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteWorkflow(workflow.id)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete')
      }
      
      toast.success('Workflow deleted')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete workflow'
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link 
                    href={`/dashboard/sites/${siteId}/automation/workflows/${workflow.id}`}
                    className="text-lg font-medium hover:underline"
                  >
                    {workflow.name}
                  </Link>
                  {statusBadge[status]}
                </div>
                {workflow.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {workflow.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{triggerLabels[workflow.trigger_type] || workflow.trigger_type}</span>
                  <span>•</span>
                  <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isActivating || isDeleting}>
                  {(isActivating || isDeleting) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/sites/${siteId}/automation/workflows/${workflow.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleActive} disabled={isActivating}>
                  {workflow.is_active ? (
                    <>
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{workflow.name}&quot;? This action cannot be undone.
              All associated executions and history will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
