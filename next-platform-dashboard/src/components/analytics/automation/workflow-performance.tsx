"use client";

/**
 * Workflow Performance Components
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Components for displaying workflow performance metrics
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Workflow,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type {
  WorkflowMetrics,
  WorkflowPerformance,
  WorkflowsByCategory,
  WorkflowsByTrigger,
} from "@/types/automation-analytics";

// ============================================================================
// WORKFLOW METRICS CARDS
// ============================================================================

interface WorkflowMetricsCardsProps {
  data: WorkflowMetrics;
}

export function WorkflowMetricsCards({ data }: WorkflowMetricsCardsProps) {
  const cards = [
    {
      title: "Total Workflows",
      value: data.totalWorkflows,
      change: data.totalWorkflowsChange,
      icon: Workflow,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Workflows",
      value: data.activeWorkflows,
      change: data.activeWorkflowsChange,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Inactive Workflows",
      value: data.inactiveWorkflows,
      icon: Layers,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Avg Success Rate",
      value: `${data.avgSuccessRate}%`,
      change: data.avgSuccessRateChange,
      icon: CheckCircle2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = (card.change ?? 0) >= 0;

        return (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold">{card.value}</p>
                  {card.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// WORKFLOW PERFORMANCE TABLE
// ============================================================================

interface WorkflowPerformanceTableProps {
  data: WorkflowPerformance[];
  title?: string;
  description?: string;
}

export function WorkflowPerformanceTable({
  data,
  title = "Workflow Performance",
  description = "Performance metrics for each workflow",
}: WorkflowPerformanceTableProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTriggerColor = (trigger: string) => {
    const colors: Record<string, string> = {
      event: "bg-blue-100 text-blue-800",
      schedule: "bg-green-100 text-green-800",
      webhook: "bg-amber-100 text-amber-800",
      manual: "bg-purple-100 text-purple-800",
      form_submission: "bg-pink-100 text-pink-800",
    };
    return colors[trigger] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Workflow</th>
                <th className="pb-3 font-medium text-right">Executions</th>
                <th className="pb-3 font-medium text-right">Success Rate</th>
                <th className="pb-3 font-medium text-right">Avg Duration</th>
                <th className="pb-3 font-medium">Trigger</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.map((workflow) => (
                <tr key={workflow.workflowId} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{workflow.workflowName}</div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.category}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    {formatNumber(workflow.totalExecutions)}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={
                        workflow.successRate >= 90
                          ? "text-green-600"
                          : workflow.successRate >= 75
                          ? "text-amber-600"
                          : "text-red-600"
                      }
                    >
                      {workflow.successRate}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {formatDuration(workflow.avgExecutionTime)}
                  </td>
                  <td className="py-3">
                    <Badge variant="secondary" className={getTriggerColor(workflow.triggerType)}>
                      {workflow.triggerType}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {workflow.isActive ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        Inactive
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// WORKFLOW PERFORMANCE BAR CHART
// ============================================================================

interface WorkflowPerformanceChartProps {
  data: WorkflowPerformance[];
  title?: string;
  description?: string;
}

export function WorkflowPerformanceChart({
  data,
  title = "Top Workflows by Executions",
  description = "Most active workflows",
}: WorkflowPerformanceChartProps) {
  const chartData = data.slice(0, 8).map((w) => ({
    name: w.workflowName.length > 15 ? w.workflowName.slice(0, 15) + "..." : w.workflowName,
    successful: w.successfulExecutions,
    failed: w.failedExecutions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="name" type="category" width={100} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="successful" stackId="a" fill="#10B981" name="Successful" />
            <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// WORKFLOWS BY CATEGORY
// ============================================================================

interface WorkflowsByCategoryChartProps {
  data: WorkflowsByCategory[];
  title?: string;
  description?: string;
}

export function WorkflowsByCategoryChart({
  data,
  title = "Workflows by Category",
  description = "Distribution across categories",
}: WorkflowsByCategoryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              nameKey="category"
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [typeof value === 'number' ? value : 0, "Workflows"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// WORKFLOWS BY TRIGGER
// ============================================================================

interface WorkflowsByTriggerChartProps {
  data: WorkflowsByTrigger[];
  title?: string;
  description?: string;
}

export function WorkflowsByTriggerChart({
  data,
  title = "Workflows by Trigger Type",
  description = "Distribution by trigger",
}: WorkflowsByTriggerChartProps) {
  const chartData = data.map((d) => ({
    name: d.triggerType.charAt(0).toUpperCase() + d.triggerType.slice(1).replace("_", " "),
    value: d.count,
    fill: d.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" name="Workflows" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUCCESS RATE RADIAL CHART
// ============================================================================

interface SuccessRateRadialChartProps {
  data: WorkflowPerformance[];
  title?: string;
  description?: string;
}

export function SuccessRateRadialChart({
  data,
  title = "Success Rates by Workflow",
  description = "Top workflows by success rate",
}: SuccessRateRadialChartProps) {
  const chartData = data
    .slice(0, 6)
    .sort((a, b) => b.successRate - a.successRate)
    .map((w, i) => ({
      name: w.workflowName.length > 12 ? w.workflowName.slice(0, 12) + "..." : w.workflowName,
      successRate: w.successRate,
      fill: ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"][i],
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            data={chartData}
          >
            <RadialBar
              background
              dataKey="successRate"
              label={{ position: "insideStart", fill: "#fff", fontSize: 10 }}
            />
            <Legend
              iconSize={10}
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${(typeof value === 'number' ? value : 0).toFixed(1)}%`, "Success Rate"]}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// WORKFLOW SUMMARY COMPACT
// ============================================================================

interface WorkflowSummaryCompactProps {
  metrics: WorkflowMetrics;
  topWorkflows: WorkflowPerformance[];
}

export function WorkflowSummaryCompact({
  metrics,
  topWorkflows,
}: WorkflowSummaryCompactProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Summary</CardTitle>
        <CardDescription>Key workflow statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Total Workflows</span>
            <span className="font-semibold">{metrics.totalWorkflows}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Active</span>
            <span className="font-semibold text-green-600">{metrics.activeWorkflows}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Avg Success Rate</span>
            <span className="font-semibold">{metrics.avgSuccessRate}%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Most Active</span>
            <span className="font-semibold text-blue-600 text-right truncate max-w-[150px]">
              {metrics.mostActiveWorkflow}
            </span>
          </div>
          {metrics.mostFailingWorkflow && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Most Failing</span>
              <span className="font-semibold text-red-600 text-right truncate max-w-[150px]">
                {metrics.mostFailingWorkflow}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
