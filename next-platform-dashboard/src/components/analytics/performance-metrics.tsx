"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gauge,
  Zap,
  Clock,
  Image as ImageIcon,
  FileCode,
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { PerformanceMetrics as PerformanceData } from "@/types/site-analytics";

interface PerformanceMetricsProps {
  metrics: PerformanceData | null;
  loading?: boolean;
  className?: string;
}

export function PerformanceMetrics({
  metrics,
  loading = false,
  className,
}: PerformanceMetricsProps) {
  if (loading || !metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
          <CardDescription>Core Web Vitals & Speed Metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Performance
        </CardTitle>
        <CardDescription>Core Web Vitals & Speed Metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <PerformanceScoreGauge score={metrics.performanceScore} />

          {/* Core Web Vitals */}
          <div className="grid grid-cols-3 gap-4">
            <WebVitalCard
              label="LCP"
              value={metrics.lcp}
              unit="s"
              thresholds={{ good: 2.5, needsImprovement: 4.0 }}
              description="Largest Contentful Paint"
            />
            <WebVitalCard
              label="FID"
              value={metrics.fid}
              unit="ms"
              thresholds={{ good: 100, needsImprovement: 300 }}
              description="First Input Delay"
            />
            <WebVitalCard
              label="CLS"
              value={metrics.cls}
              unit=""
              thresholds={{ good: 0.1, needsImprovement: 0.25 }}
              description="Cumulative Layout Shift"
              decimals={3}
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">TTFB</span>
              </div>
              <p className="text-lg font-semibold">{(metrics.ttfb * 1000).toFixed(0)}ms</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Load Time</span>
              </div>
              <p className="text-lg font-semibold">{metrics.loadTime.toFixed(2)}s</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceScoreGaugeProps {
  score: number;
  className?: string;
}

function PerformanceScoreGauge({ score, className }: PerformanceScoreGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 50) return "text-orange-500";
    return "text-rose-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  };

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="relative h-24 w-24">
        {/* Background circle */}
        <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            className="text-muted stroke-current"
            strokeWidth="10"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          <circle
            className={cn("stroke-current transition-all duration-500", getScoreColor(score))}
            strokeWidth="10"
            strokeLinecap="round"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            strokeDasharray={`${score * 2.51} 251`}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold", getScoreColor(score))}>{score}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {score >= 90 ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : score >= 50 ? (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-500" />
          )}
          <span className={cn("font-semibold", getScoreColor(score))}>
            {getScoreLabel(score)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Overall performance score based on Core Web Vitals and other metrics
        </p>
      </div>
    </div>
  );
}

interface WebVitalCardProps {
  label: string;
  value: number;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  description: string;
  decimals?: number;
}

function WebVitalCard({
  label,
  value,
  unit,
  thresholds,
  description,
  decimals = 2,
}: WebVitalCardProps) {
  const getStatus = () => {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.needsImprovement) return "needs-improvement";
    return "poor";
  };

  const status = getStatus();
  const statusColors = {
    good: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    "needs-improvement": "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
    poor: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30",
  };

  const statusLabels = {
    good: "Good",
    "needs-improvement": "Fair",
    poor: "Poor",
  };

  return (
    <div className="p-3 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className={cn("text-xs", statusColors[status])}>
          {statusLabels[status]}
        </Badge>
      </div>
      <p className="text-2xl font-bold">
        {value.toFixed(decimals)}
        <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

interface PerformanceCompactProps {
  score: number;
  className?: string;
}

export function PerformanceCompact({ score, className }: PerformanceCompactProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Gauge className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <Progress value={score} className="h-2" />
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "min-w-[3rem] justify-center",
          score >= 90
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : score >= 50
            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
        )}
      >
        {score}
      </Badge>
    </div>
  );
}

interface WebVitalsCompactProps {
  lcp: number;
  fid: number;
  cls: number;
  className?: string;
}

export function WebVitalsCompact({ lcp, fid, cls, className }: WebVitalsCompactProps) {
  const getColor = (value: number, good: number) =>
    value <= good
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-orange-600 dark:text-orange-400";

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div>
        <span className="text-muted-foreground">LCP: </span>
        <span className={cn("font-medium", getColor(lcp, 2.5))}>{lcp.toFixed(1)}s</span>
      </div>
      <div>
        <span className="text-muted-foreground">FID: </span>
        <span className={cn("font-medium", getColor(fid, 100))}>{fid.toFixed(0)}ms</span>
      </div>
      <div>
        <span className="text-muted-foreground">CLS: </span>
        <span className={cn("font-medium", getColor(cls, 0.1))}>{cls.toFixed(3)}</span>
      </div>
    </div>
  );
}
