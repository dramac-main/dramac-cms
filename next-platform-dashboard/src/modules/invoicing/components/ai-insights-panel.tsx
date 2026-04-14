"use client";

/**
 * AI Insights Panel
 *
 * Phase INV-11: Dashboard widget showing top AI-generated financial insights
 * with dismiss and action buttons.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getAiInsights } from "../actions/ai-actions";
import type { AiInsight } from "../types/ai-types";

export function AiInsightsPanel() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);
    getAiInsights(siteId)
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setInsights(result.data || []);
        }
      })
      .catch(() => setError("Failed to load insights"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id));

  const typeIcon = (type: AiInsight["type"]) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case "info":
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const severityColor = (severity: AiInsight["severity"]) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadInsights}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && visibleInsights.length === 0 && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-foreground">{error}</p>
        )}

        {!loading && !error && visibleInsights.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No insights available. Generate some by clicking Refresh.
          </p>
        )}

        {visibleInsights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <div className="mt-0.5">{typeIcon(insight.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{insight.title}</span>
                <Badge variant={severityColor(insight.severity)} className="text-xs">
                  {insight.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {insight.description}
              </p>
              {insight.actionLabel && insight.actionHref && (
                <Link href={insight.actionHref}>
                  <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs">
                    {insight.actionLabel}
                  </Button>
                </Link>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() =>
                setDismissed((prev) => new Set([...prev, insight.id]))
              }
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
