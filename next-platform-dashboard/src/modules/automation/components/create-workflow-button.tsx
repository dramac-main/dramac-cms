/**
 * CreateWorkflowButton Component
 * 
 * Phase EM-57B Enhancement: Client-side button with dialog
 * 
 * A client component that wraps the Create Workflow button and dialog.
 * This allows server components to trigger the workflow creation dialog.
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateWorkflowDialog } from "./create-workflow-dialog"

interface CreateWorkflowButtonProps {
  siteId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function CreateWorkflowButton({ 
  siteId, 
  variant = "default",
  size = "default",
  className 
}: CreateWorkflowButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button 
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        {variant === "default" ? "New Workflow" : "Create Workflow"}
      </Button>
      
      <CreateWorkflowDialog 
        siteId={siteId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
