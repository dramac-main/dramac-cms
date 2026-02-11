/**
 * System Health Component
 * 
 * PHASE-DS-04A: Admin Dashboard - Platform Overview
 * 
 * Displays system health metrics including uptime, response times, and service status.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  Server,
  Database,
  Wifi,
  Shield,
  Clock,
  Activity,
  HardDrive,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CircleX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSystemHealth } from "@/lib/actions/admin-analytics";
import type { SystemHealthMetrics, ServiceStatus } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Types
// ============================================================================

interface SystemHealthProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: SystemHealthMetrics["status"] }) {
  const config = {
    healthy: { label: "Healthy", icon: CheckCircle2, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    degraded: { label: "Degraded", icon: AlertCircle, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    critical: { label: "Critical", icon: CircleX, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ServiceStatusItem({ service }: { service: ServiceStatus }) {
  const statusConfig = {
    operational: { icon: CheckCircle2, color: "text-green-500" },
    degraded: { icon: AlertCircle, color: "text-yellow-500" },
    outage: { icon: CircleX, color: "text-red-500" },
  };

  const { icon: Icon, color } = statusConfig[service.status];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm font-medium">{service.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {service.latency !== undefined && (
          <span className="text-xs text-muted-foreground">{service.latency}ms</span>
        )}
        <Badge
          variant="secondary"
          className={cn(
            "text-xs",
            service.status === "operational" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            service.status === "degraded" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            service.status === "outage" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {service.status}
        </Badge>
      </div>
    </div>
  );
}

function MetricGauge({
  label,
  value,
  max,
  unit,
  icon: Icon,
  status = "normal",
}: {
  label: string;
  value: number;
  max?: number;
  unit: string;
  icon: LucideIcon;
  status?: "normal" | "warning" | "danger";
}) {
  const percentage = max ? (value / max) * 100 : value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={cn(
          "text-sm font-bold",
          status === "warning" && "text-yellow-600",
          status === "danger" && "text-red-600"
        )}>
          {value.toLocaleString()}{unit}
        </span>
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className={cn(
          "h-2",
          status === "warning" && "[&>div]:bg-yellow-500",
          status === "danger" && "[&>div]:bg-red-500"
        )}
      />
      {max && (
        <p className="text-xs text-muted-foreground">
          of {max.toLocaleString()}{unit}
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SystemHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SystemHealth({
  className,
  autoRefresh = false,
  refreshInterval = 30000,
}: SystemHealthProps) {
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getSystemHealth();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch system health:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(() => fetchHealth(true), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (loading || !health) {
    return <SystemHealthSkeleton />;
  }

  const storagePercent = (health.storageUsed / health.storageLimit) * 100;
  const apiPercent = (health.apiCalls.thisMonth / health.apiCalls.limit) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">System Health</h3>
          <StatusBadge status={health.status} />
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{health.uptime.toFixed(2)}%</p>
              </div>
              <Shield className={cn(
                "h-8 w-8",
                health.uptime >= 99.9 ? "text-green-500" : "text-yellow-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{health.responseTime.avg}ms</p>
              </div>
              <Clock className={cn(
                "h-8 w-8",
                health.responseTime.avg < 100 ? "text-green-500" : "text-yellow-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{health.errorRate.toFixed(2)}%</p>
              </div>
              <AlertCircle className={cn(
                "h-8 w-8",
                health.errorRate < 1 ? "text-green-500" : "text-red-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{health.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Service Status
            </CardTitle>
            <CardDescription>Real-time status of platform services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {health.services.map((service) => (
                <ServiceStatusItem key={service.name} service={service} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Response time percentiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricGauge
              label="Average Response"
              value={health.responseTime.avg}
              max={500}
              unit="ms"
              icon={Clock}
              status={health.responseTime.avg > 200 ? "warning" : "normal"}
            />
            <MetricGauge
              label="P95 Response"
              value={health.responseTime.p95}
              max={1000}
              unit="ms"
              icon={Clock}
              status={health.responseTime.p95 > 500 ? "warning" : "normal"}
            />
            <MetricGauge
              label="P99 Response"
              value={health.responseTime.p99}
              max={2000}
              unit="ms"
              icon={Clock}
              status={health.responseTime.p99 > 1000 ? "danger" : "normal"}
            />
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Requests/min</span>
                <span className="font-bold">{health.requestsPerMinute.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used</span>
                <span className="font-medium">{formatBytes(health.storageUsed)}</span>
              </div>
              <Progress
                value={storagePercent}
                className={cn(
                  "h-3",
                  storagePercent > 80 && "[&>div]:bg-yellow-500",
                  storagePercent > 90 && "[&>div]:bg-red-500"
                )}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{storagePercent.toFixed(1)}% used</span>
                <span>{formatBytes(health.storageLimit)} total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              API Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-medium">{health.apiCalls.thisMonth.toLocaleString()}</span>
              </div>
              <Progress
                value={apiPercent}
                className={cn(
                  "h-3",
                  apiPercent > 80 && "[&>div]:bg-yellow-500",
                  apiPercent > 90 && "[&>div]:bg-red-500"
                )}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{apiPercent.toFixed(1)}% of limit</span>
                <span>{health.apiCalls.limit.toLocaleString()} limit</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today</span>
                <span className="font-medium">{health.apiCalls.today.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className={cn(
                "h-6 w-6",
                health.databaseStatus === "connected" && "text-green-500",
                health.databaseStatus === "slow" && "text-yellow-500",
                health.databaseStatus === "error" && "text-red-500"
              )} />
              <div>
                <p className="font-medium">Database Connection</p>
                <p className="text-sm text-muted-foreground">PostgreSQL via Supabase</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                health.databaseStatus === "connected" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                health.databaseStatus === "slow" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                health.databaseStatus === "error" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {health.databaseStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Compact Version for Dashboard
// ============================================================================

export function SystemHealthCompact({ className }: { className?: string }) {
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSystemHealth();
        setHealth(data);
      } catch (error) {
        console.error("Failed to fetch system health:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading || !health) {
    return <Skeleton className="h-32" />;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <StatusBadge status={health.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium">{health.uptime.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Response Time</span>
            <span className="font-medium">{health.responseTime.avg}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Error Rate</span>
            <span className="font-medium">{health.errorRate.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export with both names for compatibility
export { SystemHealth as SystemHealthComponent };

export default SystemHealth;
