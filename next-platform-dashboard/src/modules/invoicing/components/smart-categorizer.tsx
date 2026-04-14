"use client";

/**
 * Smart Categorizer
 *
 * Phase INV-11: Auto-suggest dropdown for expense category with AI confidence indicator.
 * Used inside expense forms to suggest categories.
 */

import { useState, useCallback } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categorizeExpense } from "../actions/ai-actions";
import type { ExpenseCategorization } from "../types/ai-types";

interface SmartCategorizerProps {
  siteId: string;
  description: string;
  amount: number;
  onSelect: (categoryId: string | null, categoryName: string) => void;
}

export function SmartCategorizer({
  siteId,
  description,
  amount,
  onSelect,
}: SmartCategorizerProps) {
  const [result, setResult] = useState<ExpenseCategorization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const categorize = useCallback(async () => {
    if (!siteId || !description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(null);

    try {
      const response = await categorizeExpense(siteId, description, amount);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
      }
    } catch {
      setError("Categorization failed");
    } finally {
      setLoading(false);
    }
  }, [siteId, description, amount]);

  const handleSelect = (categoryId: string | null, categoryName: string) => {
    setSelected(categoryId);
    onSelect(categoryId, categoryName);
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const confidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.5) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={categorize}
        disabled={loading || !description.trim()}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        AI Suggest Category
      </Button>

      {error && (
        <p className="text-xs text-muted-foreground">{error}</p>
      )}

      {result && (
        <div className="space-y-1.5">
          {/* Primary suggestion */}
          <button
            type="button"
            onClick={() => handleSelect(result.categoryId, result.categoryName)}
            className={`flex items-center justify-between w-full rounded-md border p-2 text-sm hover:bg-muted/50 transition-colors ${
              selected === result.categoryId ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {selected === result.categoryId && (
                <Check className="h-3 w-3 text-primary" />
              )}
              <span className="font-medium">{result.categoryName}</span>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${confidenceColor(result.confidence)}`}
            >
              {confidenceLabel(result.confidence)} ({Math.round(result.confidence * 100)}%)
            </Badge>
          </button>

          {/* Alternatives */}
          {result.alternativeCategories.map((alt) => (
            <button
              key={alt.categoryId || alt.categoryName}
              type="button"
              onClick={() => handleSelect(alt.categoryId, alt.categoryName)}
              className={`flex items-center justify-between w-full rounded-md border p-2 text-sm hover:bg-muted/50 transition-colors ${
                selected === alt.categoryId ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {selected === alt.categoryId && (
                  <Check className="h-3 w-3 text-primary" />
                )}
                <span>{alt.categoryName}</span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${confidenceColor(alt.confidence)}`}
              >
                {confidenceLabel(alt.confidence)} ({Math.round(alt.confidence * 100)}%)
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
