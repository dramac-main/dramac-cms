"use client";

import { CheckCircle, AlertTriangle, XCircle, Info, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  analyzeSeo, 
  getScoreColor, 
  getScoreLabel, 
  getIssueColor,
  type SeoAuditResult,
  type SeoIssue 
} from "@/lib/seo/seo-analyzer";

interface SeoScoreProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function SeoScore({ 
  score, 
  label, 
  size = "md",
  showLabel = true 
}: SeoScoreProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`font-bold ${sizeClasses[size]} ${getScoreColor(score)}`}>
        {score}
      </div>
      {showLabel && (
        <div>
          <p className="font-medium">{label || "SEO Score"}</p>
          <p className="text-sm text-muted-foreground">
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}

interface SeoScoreCardProps {
  score: number;
  issues?: number;
  passed?: number;
  title?: string;
}

export function SeoScoreCard({ 
  score, 
  issues = 0, 
  passed = 0,
  title = "SEO Score"
}: SeoScoreCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <SeoScore score={score} label={title} />
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Badge variant={issues > 0 ? "destructive" : "secondary"}>
                {issues} issue{issues !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {passed} check{passed !== 1 ? "s" : ""} passed
            </p>
          </div>
        </div>
        <Progress 
          value={score} 
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}

interface SeoIssueListProps {
  issues: SeoIssue[];
  showSuggestions?: boolean;
}

export function SeoIssueList({ issues, showSuggestions = true }: SeoIssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
        <p className="text-muted-foreground">No issues found!</p>
      </div>
    );
  }

  const getIcon = (type: SeoIssue["type"]) => {
    switch (type) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600 shrink-0" />;
    }
  };

  // Sort by severity: errors first, then warnings, then info
  const sortedIssues = [...issues].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="space-y-3">
      {sortedIssues.map((issue, i) => (
        <div 
          key={i} 
          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
        >
          {getIcon(issue.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">{issue.message}</p>
              <Badge variant="outline" className="text-xs">
                {issue.field}
              </Badge>
            </div>
            {showSuggestions && (
              <p className="text-sm text-muted-foreground mt-1">
                {issue.suggestion}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SeoPassedListProps {
  passed: string[];
}

export function SeoPassedList({ passed }: SeoPassedListProps) {
  if (passed.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {passed.map((item, i) => (
        <Badge key={i} variant="outline" className="text-green-600 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {item}
        </Badge>
      ))}
    </div>
  );
}

interface SeoAnalysisProps {
  analysis: SeoAuditResult;
  showPassed?: boolean;
}

export function SeoAnalysis({ analysis, showPassed = true }: SeoAnalysisProps) {
  return (
    <div className="space-y-6">
      <SeoScoreCard 
        score={analysis.score}
        issues={analysis.issues.length}
        passed={analysis.passed.length}
      />

      {analysis.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issues to Fix</CardTitle>
            <CardDescription>
              Address these issues to improve your SEO score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeoIssueList issues={analysis.issues} />
          </CardContent>
        </Card>
      )}

      {showPassed && analysis.passed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Passed Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeoPassedList passed={analysis.passed} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Quick analysis component that runs analysis on the fly
interface QuickSeoAnalysisProps {
  title: string;
  description?: string | null;
  slug: string;
  ogImage?: string | null;
  keywords?: string[];
  showPassed?: boolean;
}

export function QuickSeoAnalysis({ 
  title, 
  description, 
  slug, 
  ogImage, 
  keywords,
  showPassed = true 
}: QuickSeoAnalysisProps) {
  const analysis = analyzeSeo({
    title,
    description,
    slug,
    ogImage,
    keywords,
  });

  return <SeoAnalysis analysis={analysis} showPassed={showPassed} />;
}
