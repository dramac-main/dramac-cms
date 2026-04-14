"use client";

/**
 * Invoice Suggestions
 *
 * Phase INV-11: Optimization suggestions list with action buttons.
 * Shows AI-generated recommendations for improving invoicing performance.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Lightbulb,
  Loader2,
  ArrowRight,
  Clock,
  Percent,
  UserCheck,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestInvoiceOptimizations } from "../actions/ai-actions";
import type { Optimization } from "../types/ai-types";

const TYPE_ICONS: Record<Optimization["type"], typeof Lightbulb> = {
  payment_terms: Clock,
  early_discount: Percent,
  follow_up: UserCheck,
  pricing: DollarSign,
  timing: Calendar,
  general: Sparkles,
};

export function InvoiceSuggestions() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [suggestions, setSuggestions] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);
    suggestInvoiceOptimizations(siteId)
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setSuggestions(result.data || []);
        }
      })
      .catch(() => setError("Failed to generate suggestions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const impactColor = (impact: Optimization["impact"]) => {
    switch (impact) {
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
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Optimization Suggestions
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadSuggestions}
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
        {loading && suggestions.length === 0 && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-foreground">{error}</p>
        )}

        {!loading && !error && suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No suggestions yet. Click Refresh to generate.
          </p>
        )}

        {suggestions.map((suggestion) => {
          const Icon = TYPE_ICONS[suggestion.type] || Lightbulb;
          return (
            <div
              key={suggestion.id}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{suggestion.title}</span>
                </div>
                <Badge variant={impactColor(suggestion.impact)} className="text-xs shrink-0">
                  {suggestion.impact} impact
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {suggestion.description}
              </p>
              {suggestion.actionLabel && (
                <div className="pl-6">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                    {suggestion.actionLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
