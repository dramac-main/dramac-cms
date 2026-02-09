/**
 * Workflow Editor Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Visual workflow builder for creating and editing automation workflows.
 */

import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkflowBuilder } from "@/modules/automation/components/workflow-builder"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Edit Workflow | Automation | ${PLATFORM.name}`,
  description: "Edit your automation workflow"
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getWorkflow(workflowId: string, siteId: string) {
  const supabase = await createClient()
  
  // Fetch workflow
  const { data: workflow, error: workflowError } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("id", workflowId)
    .eq("site_id", siteId)
    .single()

  if (workflowError || !workflow) {
    return null
  }

  // Fetch steps
  const { data: steps } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("position", { ascending: true })

  return {
    ...workflow,
    steps: steps || []
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-80 border-r p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-full" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      {/* Canvas */}
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full" />
      </div>
      {/* Right Panel */}
      <div className="w-80 border-l p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

async function WorkflowEditorContent({ 
  workflowId, 
  siteId 
}: { 
  workflowId: string
  siteId: string 
}) {
  const workflow = await getWorkflow(workflowId, siteId)

  if (!workflow) {
    notFound()
  }

  // WorkflowBuilder loads data itself via useWorkflowBuilder hook
  // Just need to pass workflowId and siteId
  return (
    <WorkflowBuilder 
      siteId={siteId} 
      workflowId={workflowId}
    />
  )
}

// ============================================================================
// PAGE
// ============================================================================

interface WorkflowEditorPageProps {
  params: Promise<{ siteId: string; workflowId: string }>
}

export default async function WorkflowEditorPage({ params }: WorkflowEditorPageProps) {
  const { siteId, workflowId } = await params

  return (
    <div className="h-full">
      <Suspense fallback={<LoadingSkeleton />}>
        <WorkflowEditorContent workflowId={workflowId} siteId={siteId} />
      </Suspense>
    </div>
  )
}
