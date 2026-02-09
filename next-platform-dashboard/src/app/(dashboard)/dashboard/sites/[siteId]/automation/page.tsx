/**
 * Automation Dashboard Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Main dashboard page for the automation module showing workflows list,
 * quick stats, and navigation to other automation features.
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft,
  Zap, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  FileCode,
  Plug,
  BarChart3,
  Library,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  Settings,
  History,
  LucideIcon
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateWorkflowButton } from "@/modules/automation/components/create-workflow-button"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Automation | ${PLATFORM.name}`,
  description: "Automation workflows - Automate repetitive tasks and processes"
}

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
  execution_count: number
  last_executed_at: string | null
}

// Helper to get display status from is_active boolean
function getWorkflowStatus(workflow: { is_active: boolean }): "active" | "paused" {
  return workflow.is_active ? "active" : "paused"
}

interface AutomationStats {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getWorkflows(siteId: string): Promise<Workflow[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("automation_workflows")
    .select(`
      id,
      name,
      description,
      is_active,
      trigger_type,
      created_at,
      updated_at
    `)
    .eq("site_id", siteId)
    .order("updated_at", { ascending: false })
    .limit(10)
  
  if (error) {
    console.error("Error fetching workflows:", error)
    return []
  }

  // Fetch execution counts for each workflow
  const workflowIds = (data || []).map(w => w.id)
  
  // Get execution counts per workflow
  const { data: executionData } = await supabase
    .from("workflow_executions")
    .select("workflow_id, created_at")
    .eq("site_id", siteId)
    .in("workflow_id", workflowIds.length > 0 ? workflowIds : ['none'])
    .order("created_at", { ascending: false })
  
  // Aggregate execution counts and last executed timestamps
  const executionStats: Record<string, { count: number; lastExecuted: string | null }> = {}
  for (const exec of (executionData || [])) {
    if (!executionStats[exec.workflow_id]) {
      executionStats[exec.workflow_id] = { count: 0, lastExecuted: exec.created_at }
    }
    executionStats[exec.workflow_id].count++
  }

  return (data || []).map((w): Workflow => ({
    id: w.id,
    name: w.name,
    description: w.description,
    is_active: w.is_active ?? false,
    trigger_type: w.trigger_type ?? 'manual',
    created_at: w.created_at ?? new Date().toISOString(),
    updated_at: w.updated_at ?? new Date().toISOString(),
    execution_count: executionStats[w.id]?.count || 0,
    last_executed_at: executionStats[w.id]?.lastExecuted || null
  }))
}

async function getAutomationStats(siteId: string): Promise<AutomationStats> {
  const supabase = await createClient()
  
  // Get workflow counts
  const { count: totalWorkflows } = await supabase
    .from("automation_workflows")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)

  const { count: activeWorkflows } = await supabase
    .from("automation_workflows")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("is_active", true)

  // Get execution stats
  const { count: totalExecutions } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)

  const { count: successfulExecutions } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "completed")

  const successRate = totalExecutions && totalExecutions > 0
    ? ((successfulExecutions || 0) / totalExecutions) * 100
    : 0

  return {
    totalWorkflows: totalWorkflows || 0,
    activeWorkflows: activeWorkflows || 0,
    totalExecutions: totalExecutions || 0,
    successRate
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string | number
  icon: LucideIcon
  color: "blue" | "green" | "yellow" | "red"
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowRow({ workflow, siteId }: { workflow: Workflow; siteId: string }) {
  const status = getWorkflowStatus(workflow)
  
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

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/dashboard/sites/${siteId}/automation/workflows/${workflow.id}`}
              className="font-medium hover:underline"
            >
              {workflow.name}
            </Link>
            {statusBadge[status]}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
            <span>{triggerLabels[workflow.trigger_type] || workflow.trigger_type}</span>
            <span>•</span>
            <span>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm text-muted-foreground">
          <div>{workflow.execution_count} executions</div>
          {workflow.last_executed_at && (
            <div>Last run {new Date(workflow.last_executed_at).toLocaleDateString()}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/sites/${siteId}/automation/workflows/${workflow.id}`}>
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
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
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

async function AutomationDashboardContent({ siteId }: { siteId: string }) {
  const [workflows, stats] = await Promise.all([
    getWorkflows(siteId),
    getAutomationStats(siteId)
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workflows"
          value={stats.totalWorkflows}
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Active Workflows"
          value={stats.activeWorkflows}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Total Executions"
          value={stats.totalExecutions}
          icon={CheckCircle2}
          color="yellow"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={stats.successRate >= 90 ? CheckCircle2 : XCircle}
          color={stats.successRate >= 90 ? "green" : "red"}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <CreateWorkflowButton siteId={siteId} />
        <Link href={`/dashboard/sites/${siteId}/automation/executions`}>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Executions
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/automation/templates`}>
          <Button variant="outline">
            <Library className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/automation/analytics`}>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/automation/connections`}>
          <Button variant="outline">
            <Plug className="h-4 w-4 mr-2" />
            Connections
          </Button>
        </Link>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Workflows</CardTitle>
            <CardDescription>
              Manage and monitor your automation workflows
            </CardDescription>
          </div>
          {workflows.length > 0 && (
            <Link href={`/dashboard/sites/${siteId}/automation/workflows`}>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-medium mb-2">No Workflows Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automation workflow to get started.
              </p>
              <div className="flex gap-2 justify-center">
                <CreateWorkflowButton siteId={siteId} />
                <Link href={`/dashboard/sites/${siteId}/automation/templates`}>
                  <Button variant="outline">
                    <FileCode className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <WorkflowRow 
                  key={workflow.id} 
                  workflow={workflow} 
                  siteId={siteId} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

interface AutomationPageProps {
  params: Promise<{ siteId: string }>
}

export default async function AutomationPage({ params }: AutomationPageProps) {
  const { siteId } = await params

  return (
    <div className="flex flex-col h-full">
      {/* Back Navigation */}
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}?tab=automation`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AutomationDashboardContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
