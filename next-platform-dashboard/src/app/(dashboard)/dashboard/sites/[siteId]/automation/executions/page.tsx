/**
 * Automation Executions Page
 * 
 * Phase EM-57B: Automation Engine - Execution Monitoring
 * 
 * Shows list of all workflow executions with status, duration, and details.
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
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Zap,
  Filter,
  LucideIcon
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const metadata: Metadata = {
  title: "Executions | Automation | DRAMAC",
  description: "View and monitor workflow executions"
}

// ============================================================================
// TYPES
// ============================================================================

interface Execution {
  id: string
  workflow_id: string
  site_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  trigger_type: string
  trigger_data: Record<string, unknown>
  started_at: string | null
  completed_at: string | null
  created_at: string
  steps_completed: number
  steps_total: number
  error: string | null
  workflow: {
    id: string
    name: string
  } | null
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getExecutions(siteId: string, status?: string): Promise<Execution[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from("workflow_executions")
    .select(`
      id,
      workflow_id,
      site_id,
      status,
      trigger_type,
      trigger_data,
      started_at,
      completed_at,
      created_at,
      steps_completed,
      steps_total,
      error,
      workflow:automation_workflows(id, name)
    `)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(100)
  
  if (status && status !== 'all') {
    query = query.eq("status", status)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching executions:", error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((e: any): Execution => ({
    id: e.id,
    workflow_id: e.workflow_id,
    site_id: e.site_id,
    status: e.status || 'pending',
    trigger_type: e.trigger_type || 'unknown',
    trigger_data: (e.trigger_data as Record<string, unknown>) || {},
    started_at: e.started_at,
    completed_at: e.completed_at,
    created_at: e.created_at || new Date().toISOString(),
    steps_completed: e.steps_completed || 0,
    steps_total: e.steps_total || 0,
    error: e.error,
    workflow: e.workflow as { id: string; name: string } | null
  }))
}

async function getExecutionStats(siteId: string) {
  const supabase = await createClient()
  
  const { count: total } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
  
  const { count: completed } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "completed")
  
  const { count: failed } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "failed")
  
  const { count: running } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .in("status", ["pending", "running"])
  
  return {
    total: total || 0,
    completed: completed || 0,
    failed: failed || 0,
    running: running || 0
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
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-10 w-48" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
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
  value: number
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
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: Execution['status'] }) {
  const config = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
    running: { label: 'Running', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Loader2 },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: XCircle },
  }
  
  const { label, className, icon: Icon } = config[status]
  
  return (
    <Badge className={className}>
      <Icon className={`h-3 w-3 mr-1 ${status === 'running' ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
  )
}

function ExecutionRow({ execution, siteId }: { execution: Execution; siteId: string }) {
  const duration = execution.started_at && execution.completed_at
    ? Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)
    : null

  const triggerLabels: Record<string, string> = {
    event: "Event",
    schedule: "Schedule",
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
            <span className="font-medium">
              {execution.workflow?.name || 'Unknown Workflow'}
            </span>
            <StatusBadge status={execution.status} />
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
            <span>{triggerLabels[execution.trigger_type] || execution.trigger_type}</span>
            <span>•</span>
            <span>{new Date(execution.created_at).toLocaleString()}</span>
            {duration !== null && (
              <>
                <span>•</span>
                <span>{duration}s</span>
              </>
            )}
          </div>
          {execution.error && (
            <div className="text-sm text-red-500 mt-1">
              {execution.error}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm text-muted-foreground">
          <div>
            {execution.steps_completed}/{execution.steps_total} steps
          </div>
        </div>
        <Link href={`/dashboard/sites/${siteId}/automation/executions/${execution.id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  )
}

async function ExecutionsContent({ 
  siteId, 
  status 
}: { 
  siteId: string
  status?: string 
}) {
  const [executions, stats] = await Promise.all([
    getExecutions(siteId, status),
    getExecutionStats(siteId)
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon={Zap} color="blue" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="green" />
        <StatCard title="Failed" value={stats.failed} icon={XCircle} color="red" />
        <StatCard title="Running" value={stats.running} icon={Loader2} color="yellow" />
      </div>

      {/* Executions List */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>
            View all workflow executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium mb-2">No Executions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Workflow executions will appear here when workflows are triggered.
              </p>
              <Link href={`/dashboard/sites/${siteId}/automation`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Automation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <ExecutionRow 
                  key={execution.id} 
                  execution={execution} 
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

export default async function ExecutionsPage({
  params,
  searchParams
}: {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { siteId } = await params
  const { status } = await searchParams

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/sites/${siteId}/automation`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Executions</h1>
                <p className="text-muted-foreground">
                  Monitor workflow executions and their status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue={status || 'all'}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ExecutionsContent siteId={siteId} status={status} />
      </Suspense>
    </div>
  )
}
