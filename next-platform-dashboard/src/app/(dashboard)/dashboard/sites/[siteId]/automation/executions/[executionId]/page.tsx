/**
 * Execution Detail Page
 * 
 * Phase EM-57B: Automation Engine - Execution Detail View
 * 
 * Shows detailed information about a single workflow execution including:
 * - Execution status and metadata
 * - Trigger data
 * - Step-by-step execution logs
 * - Timing and performance metrics
 * - Error details if failed
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
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
  Zap,
  PlayCircle,
  AlertCircle,
  SkipForward,
  FileCode,
  Calendar,
  Timer,
  ChevronRight
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export const metadata: Metadata = {
  title: "Execution Details | Automation | DRAMAC",
  description: "View detailed workflow execution information"
}

// ============================================================================
// TYPES
// ============================================================================

interface ExecutionDetail {
  id: string
  workflow_id: string
  site_id: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'timed_out'
  trigger_type: string
  trigger_data: Record<string, unknown>
  context: {
    trigger: Record<string, unknown>
    steps: Record<string, unknown>
    variables: Record<string, unknown>
  }
  started_at: string | null
  completed_at: string | null
  created_at: string
  steps_completed: number
  steps_total: number
  duration_ms: number | null
  error: string | null
  error_details: Record<string, unknown> | null
  workflow: {
    id: string
    name: string
    description: string | null
  } | null
  step_logs: StepLog[]
}

interface StepLog {
  id: string
  execution_id: string
  step_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  error: string | null
  error_stack: string | null
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  created_at: string
  step: {
    id: string
    step_type: string
    action_type: string | null
    action_config: Record<string, unknown>
    position: number
  } | null
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getExecutionDetail(executionId: string, siteId: string): Promise<ExecutionDetail | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("workflow_executions")
    .select(`
      id,
      workflow_id,
      site_id,
      status,
      trigger_type,
      trigger_data,
      context,
      started_at,
      completed_at,
      created_at,
      steps_completed,
      steps_total,
      duration_ms,
      error,
      error_details,
      workflow:automation_workflows(id, name, description),
      step_logs:step_execution_logs(
        id,
        execution_id,
        step_id,
        status,
        input_data,
        output_data,
        error,
        error_stack,
        started_at,
        completed_at,
        duration_ms,
        created_at,
        step:workflow_steps(id, step_type, action_type, action_config, position)
      )
    `)
    .eq("id", executionId)
    .eq("site_id", siteId)
    .single()
  
  if (error || !data) {
    console.error("Error fetching execution:", error)
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = data as any

  return {
    id: e.id,
    workflow_id: e.workflow_id,
    site_id: e.site_id,
    status: e.status || 'pending',
    trigger_type: e.trigger_type || 'unknown',
    trigger_data: (e.trigger_data as Record<string, unknown>) || {},
    context: (e.context as ExecutionDetail['context']) || { trigger: {}, steps: {}, variables: {} },
    started_at: e.started_at,
    completed_at: e.completed_at,
    created_at: e.created_at || new Date().toISOString(),
    steps_completed: e.steps_completed || 0,
    steps_total: e.steps_total || 0,
    duration_ms: e.duration_ms,
    error: e.error,
    error_details: (e.error_details as Record<string, unknown>) || null,
    workflow: e.workflow as ExecutionDetail['workflow'],
    step_logs: ((e.step_logs || []) as unknown[]).map((log: unknown): StepLog => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      return {
        id: l.id,
        execution_id: l.execution_id,
        step_id: l.step_id,
        status: l.status || 'pending',
        input_data: (l.input_data as Record<string, unknown>) || {},
        output_data: (l.output_data as Record<string, unknown>) || {},
        error: l.error,
        error_stack: l.error_stack,
        started_at: l.started_at,
        completed_at: l.completed_at,
        duration_ms: l.duration_ms,
        created_at: l.created_at || new Date().toISOString(),
        step: l.step ? {
          id: l.step.id,
          step_type: l.step.step_type,
          action_type: l.step.action_type,
          action_config: (l.step.action_config as Record<string, unknown>) || {},
          position: l.step.position
        } : null
      }
    }).sort((a, b) => (a.step?.position || 0) - (b.step?.position || 0))
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

function StatusBadge({ status }: { status: ExecutionDetail['status'] }) {
  const config = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
    running: { label: 'Running', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Loader2 },
    paused: { label: 'Paused', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: Clock },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: XCircle },
    timed_out: { label: 'Timed Out', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
  }
  
  const { label, className, icon: Icon } = config[status]
  
  return (
    <Badge className={className}>
      <Icon className={`h-3 w-3 mr-1 ${status === 'running' ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
  )
}

function StepStatusIcon({ status }: { status: StepLog['status'] }) {
  const config = {
    pending: { icon: Clock, className: 'text-yellow-500' },
    running: { icon: Loader2, className: 'text-blue-500 animate-spin' },
    completed: { icon: CheckCircle2, className: 'text-green-500' },
    failed: { icon: XCircle, className: 'text-red-500' },
    skipped: { icon: SkipForward, className: 'text-gray-500' },
    cancelled: { icon: XCircle, className: 'text-gray-500' },
  }
  
  const { icon: Icon, className } = config[status]
  return <Icon className={`h-5 w-5 ${className}`} />
}

function StepLogItem({ log, index }: { log: StepLog; index: number }) {
  const stepName = log.step?.action_type || log.step?.step_type || 'Unknown Step'
  const hasError = log.status === 'failed' && log.error

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 pt-0.5">
          <StepStatusIcon status={log.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {index + 1}
              </span>
              <span className="text-sm font-medium">
                {stepName}
              </span>
            </div>
            {log.duration_ms !== null && (
              <span className="text-sm text-muted-foreground">
                {log.duration_ms}ms
              </span>
            )}
          </div>
          
          {log.started_at && (
            <div className="text-xs text-muted-foreground mt-1">
              Started: {new Date(log.started_at).toLocaleString()}
            </div>
          )}

          {/* Error Display */}
          {hasError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-2">
                <AlertCircle className="h-4 w-4" />
                Error
              </div>
              <pre className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap">
                {log.error}
              </pre>
              {log.error_stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 dark:text-red-300 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-red-500 dark:text-red-400 mt-2 whitespace-pre-wrap">
                    {log.error_stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Input Data */}
          {Object.keys(log.input_data).length > 0 && (
            <Collapsible className="mt-3">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
                Input Data
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(log.input_data, null, 2)}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Output Data */}
          {Object.keys(log.output_data).length > 0 && (
            <Collapsible className="mt-3">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
                Output Data
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(log.output_data, null, 2)}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
}

async function ExecutionDetailContent({ 
  executionId, 
  siteId 
}: { 
  executionId: string
  siteId: string 
}) {
  const execution = await getExecutionDetail(executionId, siteId)

  if (!execution) {
    notFound()
  }

  const duration = execution.duration_ms !== null
    ? `${(execution.duration_ms / 1000).toFixed(2)}s`
    : execution.started_at && !execution.completed_at
    ? 'In progress...'
    : 'Not started'

  const triggerLabels: Record<string, string> = {
    event: "Event Trigger",
    schedule: "Scheduled",
    webhook: "Webhook",
    manual: "Manual"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                {execution.workflow?.name || 'Unknown Workflow'}
                <StatusBadge status={execution.status} />
              </CardTitle>
              <CardDescription className="mt-2">
                {execution.workflow?.description || 'No description'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Trigger Type</div>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {triggerLabels[execution.trigger_type] || execution.trigger_type}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Duration</div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-medium">{duration}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Steps</div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {execution.steps_completed}/{execution.steps_total}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Started</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {execution.started_at 
                    ? new Date(execution.started_at).toLocaleString()
                    : 'Not started'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Card */}
      {execution.error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Execution Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
              <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                {execution.error}
              </pre>
            </div>
            {execution.error_details && Object.keys(execution.error_details).length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer font-medium">
                  Error Details
                </summary>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded mt-2">
                  <pre className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap">
                    {JSON.stringify(execution.error_details, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trigger Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Trigger Data
          </CardTitle>
          <CardDescription>
            Data that triggered this workflow execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
            <pre>{JSON.stringify(execution.trigger_data, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Step Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Step Execution Logs</CardTitle>
          <CardDescription>
            Detailed logs for each step in the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {execution.step_logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No step logs available
            </div>
          ) : (
            <div className="space-y-3">
              {execution.step_logs.map((log, index) => (
                <StepLogItem key={log.id} log={log} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Variables */}
      {execution.context && Object.keys(execution.context.variables || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Variables</CardTitle>
            <CardDescription>
              Variables available during execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{JSON.stringify(execution.context.variables, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

export default async function ExecutionDetailPage({
  params
}: {
  params: Promise<{ siteId: string; executionId: string }>
}) {
  const { siteId, executionId } = await params

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${siteId}/automation/executions`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Execution Details</h1>
              <p className="text-muted-foreground">
                View detailed information about this workflow execution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ExecutionDetailContent executionId={executionId} siteId={siteId} />
      </Suspense>
    </div>
  )
}
