/**
 * Blog Marketing SEO Score Panel
 *
 * Phase MKT-07: Visual SEO content scoring panel
 * that shows score breakdown and recommendations.
 */
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Target,
} from "lucide-react";
import { calculateContentScore } from "../../lib/blog-seo-scoring";
import type { ContentScore } from "../../types/blog-marketing-types";

interface BlogSeoScorePanelProps {
  title: string;
  slug: string;
  contentHtml: string | null;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  tags: string[];
  categories: { id: string; name: string }[];
  targetKeyword?: string;
  className?: string;
}

export function BlogSeoScorePanel({
  title,
  slug,
  contentHtml,
  excerpt,
  metaTitle,
  metaDescription,
  featuredImageUrl,
  featuredImageAlt,
  tags,
  categories,
  targetKeyword,
  className,
}: BlogSeoScorePanelProps) {
  const score: ContentScore = useMemo(
    () =>
      calculateContentScore({
        title,
        slug,
        contentHtml,
        excerpt,
        metaTitle,
        metaDescription,
        featuredImageUrl,
        featuredImageAlt,
        tags,
        categories,
        targetKeyword,
      }),
    [
      title,
      slug,
      contentHtml,
      excerpt,
      metaTitle,
      metaDescription,
      featuredImageUrl,
      featuredImageAlt,
      tags,
      categories,
      targetKeyword,
    ],
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Marketing SEO Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-4 text-lg font-bold",
              getScoreBorderColor(score.overall),
            )}
          >
            {score.overall}
          </div>
          <div className="flex-1 space-y-2">
            <ScoreBar label="Readability" value={score.readability} />
            <ScoreBar label="SEO" value={score.seoScore} />
            <ScoreBar label="Engagement" value={score.engagementPotential} />
          </div>
        </div>

        {/* Recommendations */}
        {score.recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recommendations ({score.recommendations.length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {score.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs rounded-md p-2 bg-muted/50"
                >
                  {rec.severity === "error" && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  )}
                  {rec.severity === "warning" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                  )}
                  {rec.severity === "info" && (
                    <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <span className="text-muted-foreground">{rec.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {score.recommendations.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t">
            <CheckCircle2 className="h-4 w-4" />
            Great job! Your content is well-optimized.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <Progress
        value={value}
        className={cn("h-1.5 flex-1", getProgressClassName(value))}
      />
      <span
        className={cn(
          "text-xs font-medium w-6 text-right",
          getScoreTextColor(value),
        )}
      >
        {value}
      </span>
    </div>
  );
}

function getScoreBorderColor(score: number): string {
  if (score >= 75) return "border-green-500 text-green-700";
  if (score >= 50) return "border-yellow-500 text-yellow-700";
  return "border-red-500 text-red-700";
}

function getScoreTextColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getProgressClassName(score: number): string {
  if (score >= 75) return "[&>div]:bg-green-500";
  if (score >= 50) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}
