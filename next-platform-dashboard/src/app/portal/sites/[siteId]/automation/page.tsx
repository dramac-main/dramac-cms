/**
 * Portal Automation Page
 *
 * Displays automation workflows and stats for the client's site.
 * Replicates the agency automation dashboard pattern with portal-scoped links.
 * Permission: canManageAutomation
 */

import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Activity,
  CheckCircle2,
  CircleX,
  History,
  PlayCircle,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

// ============================================================================
// TYPES
// ============================================================================

interface PortalWorkflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
  execution_count: number;
  last_executed_at: string | null;
}

interface PortalAutomationStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPortalWorkflows(siteId: string): Promise<PortalWorkflow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("automation_workflows")
    .select(
      "id, name, description, is_active, trigger_type, created_at, updated_at",
    )
    .eq("site_id", siteId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching portal workflows:", error);
    return [];
  }

  const workflowIds = (data || []).map((w) => w.id);

  const { data: executionData } = await supabase
    .from("workflow_executions")
    .select("workflow_id, created_at")
    .eq("site_id", siteId)
    .in("workflow_id", workflowIds.length > 0 ? workflowIds : ["none"])
    .order("created_at", { ascending: false });

  const executionStats: Record<
    string,
    { count: number; lastExecuted: string | null }
  > = {};
  for (const exec of executionData || []) {
    if (!executionStats[exec.workflow_id]) {
      executionStats[exec.workflow_id] = {
        count: 0,
        lastExecuted: exec.created_at,
      };
    }
    executionStats[exec.workflow_id].count++;
  }

  return (data || []).map(
    (w): PortalWorkflow => ({
      id: w.id,
      name: w.name,
      description: w.description,
      is_active: w.is_active ?? false,
      trigger_type: w.trigger_type ?? "manual",
      created_at: w.created_at ?? new Date().toISOString(),
      updated_at: w.updated_at ?? new Date().toISOString(),
      execution_count: executionStats[w.id]?.count || 0,
      last_executed_at: executionStats[w.id]?.lastExecuted || null,
    }),
  );
}

async function getPortalAutomationStats(
  siteId: string,
): Promise<PortalAutomationStats> {
  const supabase = await createClient();

  const [
    { count: totalWorkflows },
    { count: activeWorkflows },
    { count: totalExecutions },
    { count: successfulExecutions },
  ] = await Promise.all([
    supabase
      .from("automation_workflows")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId),
    supabase
      .from("automation_workflows")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("is_active", true),
    supabase
      .from("workflow_executions")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId),
    supabase
      .from("workflow_executions")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "completed"),
  ]);

  const successRate =
    totalExecutions && totalExecutions > 0
      ? ((successfulExecutions || 0) / totalExecutions) * 100
      : 0;

  return {
    totalWorkflows: totalWorkflows || 0,
    activeWorkflows: activeWorkflows || 0,
    totalExecutions: totalExecutions || 0,
    successRate,
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    yellow:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

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
  );
}

function PortalWorkflowRow({ workflow }: { workflow: PortalWorkflow }) {
  const isActive = workflow.is_active;

  const triggerLabels: Record<string, string> = {
    event: "Event Trigger",
    schedule: "Scheduled",
    webhook: "Webhook",
    manual: "Manual",
    form_submission: "Form Submission",
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{workflow.name}</span>
            {isActive ? (
              <Badge className="bg-green-500">Active</Badge>
            ) : (
              <Badge variant="secondary">Paused</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
            <span>
              {triggerLabels[workflow.trigger_type] || workflow.trigger_type}
            </span>
            <span>•</span>
            <span>
              Updated {new Date(workflow.updated_at).toLocaleDateString()}
            </span>
          </div>
          {workflow.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {workflow.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm text-muted-foreground">
          <div>{workflow.execution_count} executions</div>
          {workflow.last_executed_at && (
            <div>
              Last run{" "}
              {new Date(workflow.last_executed_at).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="p-2 rounded-full text-muted-foreground">
          {isActive ? (
            <PlayCircle className="h-5 w-5 text-green-500" />
          ) : (
            <PauseCircle className="h-5 w-5" />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

async function AutomationContent({ siteId }: { siteId: string }) {
  const [workflows, stats] = await Promise.all([
    getPortalWorkflows(siteId),
    getPortalAutomationStats(siteId),
  ]);

  return (
    <div className="space-y-6">
      {/* Stats */}
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
          icon={stats.successRate >= 90 ? CheckCircle2 : CircleX}
          color={stats.successRate >= 90 ? "green" : "red"}
        />
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automation Workflows</CardTitle>
              <CardDescription>
                View and monitor your automation workflows
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{stats.activeWorkflows} active</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No Workflows Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your agency has not set up any automation workflows for this
                site.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <PortalWorkflowRow key={workflow.id} workflow={workflow} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution History Link */}
      {stats.totalExecutions > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Execution History</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalExecutions} total executions across all
                    workflows
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function PortalAutomationPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "automation",
    "canManageAutomation",
  );

  return (
    <PortalProvider
      value={{
        isPortalView: true,
        portalUser: {
          clientId: user.clientId,
          fullName: user.fullName,
          email: user.email,
          agencyId: user.agencyId,
        },
        permissions: {
          canManageLiveChat: permissions.canManageLiveChat,
          canManageOrders: permissions.canManageOrders,
          canManageProducts: permissions.canManageProducts,
          canManageBookings: permissions.canManageBookings,
          canManageCrm: permissions.canManageCrm,
          canManageAutomation: permissions.canManageAutomation,
          canManageQuotes: permissions.canManageQuotes,
          canManageAgents: permissions.canManageAgents,
          canManageCustomers: permissions.canManageCustomers,
        },
        siteId,
      }}
    >
      <div className="container py-6">
        <Suspense fallback={<LoadingSkeleton />}>
          <AutomationContent siteId={siteId} />
        </Suspense>
      </div>
    </PortalProvider>
  );
}
