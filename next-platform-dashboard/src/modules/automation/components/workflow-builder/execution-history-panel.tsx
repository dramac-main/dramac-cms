"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  CircleX,
  Clock,
  Hourglass,
  ExternalLink,
} from "lucide-react";
import { getWorkflowExecutions } from "../../actions/automation-actions";
import type {
  WorkflowExecution,
  ExecutionStatus,
} from "../../types/automation-types";

interface ExecutionHistoryPanelProps {
  workflowId: string;
  siteId: string;
  onClose: () => void;
}

const statusConfig: Record<
  ExecutionStatus,
  { icon: typeof CheckCircle2; label: string; color: string }
> = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-600",
  },
  failed: { icon: CircleX, label: "Failed", color: "text-red-600" },
  running: { icon: Loader2, label: "Running", color: "text-blue-600" },
  pending: { icon: Clock, label: "Pending", color: "text-yellow-600" },
  paused: { icon: Hourglass, label: "Paused", color: "text-orange-600" },
  cancelled: { icon: CircleX, label: "Cancelled", color: "text-gray-500" },
  timed_out: { icon: Clock, label: "Timed Out", color: "text-red-500" },
};

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ExecutionHistoryPanel({
  workflowId,
  siteId,
  onClose,
}: ExecutionHistoryPanelProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchExecutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWorkflowExecutions(workflowId, { limit: 20 });
      if (result.success && result.data) {
        setExecutions(result.data);
        setTotal(result.count || result.data.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  return (
    <div className="w-80 border-l bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div>
          <h3 className="text-sm font-semibold">Execution History</h3>
          <p className="text-xs text-muted-foreground">{total} total runs</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchExecutions}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Execution List */}
      <ScrollArea className="flex-1">
        {isLoading && executions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No executions yet. Run a test to see results here.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {executions.map((exec) => {
              const status = statusConfig[exec.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <div
                  key={exec.id}
                  className="p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon
                        className={`h-4 w-4 shrink-0 ${status.color} ${
                          exec.status === "running" ? "animate-spin" : ""
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              exec.status === "completed"
                                ? "default"
                                : exec.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {status.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(exec.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {exec.steps_completed || 0} steps
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(exec.duration_ms)}
                          </span>
                        </div>
                        {exec.error && (
                          <p className="text-xs text-destructive truncate mt-0.5 max-w-45">
                            {exec.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/dashboard/sites/${siteId}/automation/executions/${exec.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer link */}
      {total > 20 && (
        <div className="p-2 border-t text-center">
          <a
            href={`/dashboard/sites/${siteId}/automation/executions?workflow=${workflowId}`}
            className="text-xs text-primary hover:underline"
          >
            View all {total} executions
          </a>
        </div>
      )}
    </div>
  );
}
