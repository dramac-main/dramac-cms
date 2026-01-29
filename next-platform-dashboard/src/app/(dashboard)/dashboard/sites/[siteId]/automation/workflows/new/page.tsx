/**
 * New Workflow Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Create a new automation workflow from scratch.
 */

import { Metadata } from "next"
import { WorkflowBuilder } from "@/modules/automation/components/workflow-builder"

export const metadata: Metadata = {
  title: "New Workflow | Automation | DRAMAC",
  description: "Create a new automation workflow"
}

interface NewWorkflowPageProps {
  params: Promise<{ siteId: string }>
}

export default async function NewWorkflowPage({ params }: NewWorkflowPageProps) {
  const { siteId } = await params

  return (
    <div className="h-full">
      <WorkflowBuilder siteId={siteId} />
    </div>
  )
}
