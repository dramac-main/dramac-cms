/**
 * CreateWorkflowDialog Component
 * 
 * Phase EM-57B Enhancement: Initial workflow creation dialog
 * 
 * Captures workflow name and description before navigating to the builder.
 * This provides a smoother UX flow matching user expectations from the testing guide.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Zap } from "lucide-react"
import { toast } from "sonner"
import { createWorkflow } from "../actions/automation-actions"

// ============================================================================
// TYPES
// ============================================================================

interface CreateWorkflowDialogProps {
  siteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateWorkflowDialog({ 
  siteId, 
  open, 
  onOpenChange 
}: CreateWorkflowDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Please enter a workflow name")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create the workflow
      const result = await createWorkflow(siteId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        trigger_type: 'event', // Default, can be changed in builder
        trigger_config: {},
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create workflow')
      }

      toast.success("Workflow created successfully")
      
      // Navigate to the workflow builder
      router.push(`/dashboard/${siteId}/automation/workflows/${result.data.id}`)
      
      // Close dialog and reset form
      onOpenChange(false)
      setFormData({ name: "", description: "" })
      
    } catch (error) {
      console.error("[CreateWorkflowDialog] Error creating workflow:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create workflow")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", description: "" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Create New Workflow</DialogTitle>
            </div>
            <DialogDescription>
              Start building an automation workflow by giving it a name and description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Welcome New Contacts"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                Give your workflow a clear, descriptive name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Send welcome email to new CRM contacts"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Explain what this workflow does (optional)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
