"use client";

/**
 * CRM Pipeline Metrics Component
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Displays pipeline overview, funnel visualization, and stage metrics
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import type {
  PipelineOverview,
  PipelineStageMetrics,
  PipelineFunnelData,
} from "@/types/crm-analytics";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  const s = DEFAULT_CURRENCY_SYMBOL;
  if (value >= 1000000) {
    return `${s}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${s}${(value / 1000).toFixed(0)}K`;
  }
  return `${s}${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// ============================================================================
// PIPELINE OVERVIEW CARD
// ============================================================================

interface PipelineOverviewCardProps {
  data: PipelineOverview;
  className?: string;
}

export function PipelineOverviewCard({ data, className }: PipelineOverviewCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {data.pipelineName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Deals</p>
            <p className="text-2xl font-bold">{data.totalDeals}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(data.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{data.winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. Cycle</p>
            <p className="text-2xl font-bold">{data.avgSalesCycle}d</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PIPELINE STAGE LIST
// ============================================================================

interface PipelineStageListProps {
  stages: PipelineStageMetrics[];
  className?: string;
}

export function PipelineStageList({ stages, className }: PipelineStageListProps) {
  const maxValue = Math.max(...stages.map(s => s.dealValue));

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Pipeline Stages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.stageId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium">{stage.stageName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stage.dealCount} deals
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(stage.dealValue)}
                  </span>
                  {index < stages.length - 1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs">
                            {stage.conversionRate}%
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Conversion to next stage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <Progress
                value={(stage.dealValue / maxValue) * 100}
                className="h-2"
                style={{
                  // @ts-expect-error CSS custom property
                  "--progress-color": stage.color,
                }}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Avg. time: {stage.avgTimeInStage} days</span>
                <span>Avg. deal: {formatCurrency(stage.dealValue / Math.max(stage.dealCount, 1))}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PIPELINE FUNNEL
// ============================================================================

interface PipelineFunnelProps {
  stages: PipelineStageMetrics[];
  className?: string;
}

export function PipelineFunnel({ stages, className }: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.dealCount));

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Sales Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const widthPercent = Math.max((stage.dealCount / maxCount) * 100, 20);
            
            return (
              <TooltipProvider key={stage.stageId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="relative h-10 flex items-center justify-center rounded cursor-pointer transition-all hover:opacity-80"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: stage.color,
                        marginLeft: `${(100 - widthPercent) / 2}%`,
                      }}
                    >
                      <span className="text-xs font-medium text-white truncate px-2">
                        {stage.stageName}: {stage.dealCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="space-y-1">
                      <p className="font-medium">{stage.stageName}</p>
                      <p className="text-xs">{stage.dealCount} deals</p>
                      <p className="text-xs">{formatCurrency(stage.dealValue)}</p>
                      {index < stages.length - 1 && (
                        <p className="text-xs">{stage.conversionRate}% conversion</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PIPELINE METRICS GRID
// ============================================================================

interface PipelineMetricsGridProps {
  data: PipelineOverview;
  className?: string;
}

export function PipelineMetricsGrid({ data, className }: PipelineMetricsGridProps) {
  const metrics = [
    {
      label: "Total Deals",
      value: data.totalDeals.toString(),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(data.totalValue),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Win Rate",
      value: `${data.winRate}%`,
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Avg. Deal Size",
      value: formatCurrency(data.avgDealSize),
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Sales Cycle",
      value: `${data.avgSalesCycle} days`,
      icon: Clock,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", metric.bgColor)}>
              <metric.icon className={cn("h-4 w-4", metric.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-bold">{metric.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// COMPACT PIPELINE SUMMARY
// ============================================================================

interface PipelineSummaryCompactProps {
  data: PipelineOverview;
  className?: string;
}

export function PipelineSummaryCompact({ data, className }: PipelineSummaryCompactProps) {
  return (
    <div className={cn("flex items-center gap-6 text-sm", className)}>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{data.totalDeals}</span>
        <span className="text-muted-foreground">deals</span>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{formatCurrency(data.totalValue)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{data.winRate}%</span>
        <span className="text-muted-foreground">win rate</span>
      </div>
    </div>
  );
}
