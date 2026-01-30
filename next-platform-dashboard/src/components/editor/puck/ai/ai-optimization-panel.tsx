/**
 * AI Optimization Panel
 * 
 * Dashboard panel for content optimization analysis and suggestions.
 * Part of PHASE-ED-05C: AI Editor - Content Optimization
 */

"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Data as PuckData } from "@puckeditor/core";
import {
  Sparkles,
  Search,
  TrendingUp,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wand2,
  Target,
  Zap,
  Type,
  Image as ImageIcon,
  Link2,
  Loader2,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface OptimizationSuggestion {
  id: string;
  type: "seo" | "conversion" | "readability" | "accessibility" | "engagement" | "mobile";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  componentId?: string;
  componentType?: string;
  field?: string;
  currentValue?: string;
  suggestedValue?: string;
  autoFixable: boolean;
}

interface OptimizationResult {
  score: number;
  suggestions: OptimizationSuggestion[];
  summary: {
    seo: number;
    conversion: number;
    readability: number;
    accessibility: number;
  };
}

interface AccessibilityIssue {
  id: string;
  wcagCriteria: string;
  wcagLevel: "A" | "AA" | "AAA";
  severity: "critical" | "serious" | "moderate" | "minor";
  title: string;
  description: string;
  impact: string;
  howToFix: string;
  autoFixable: boolean;
}

interface SEOIssue {
  id: string;
  category: "meta" | "content" | "structure" | "keywords" | "links" | "images";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
  fix: string;
  autoFixable: boolean;
  currentValue?: string;
  suggestedValue?: string;
}

interface AIOptimizationPanelProps {
  puckData: PuckData;
  pageTitle?: string;
  pageDescription?: string;
  onApplyFix?: (suggestion: OptimizationSuggestion) => void;
  onUpdateMeta?: (meta: { title?: string; description?: string }) => void;
  className?: string;
}

// ============================================
// Score Components
// ============================================

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-green-500/10";
    if (s >= 60) return "bg-yellow-500/10";
    if (s >= 40) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold",
          getScoreBg(score),
          getScoreColor(score)
        )}
      >
        {score}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function CategoryScore({
  icon,
  label,
  score,
  issues,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  issues: number;
}) {
  const getProgressColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-yellow-500";
    if (s >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {issues > 0 && (
            <Badge variant="outline" className="text-xs">
              {issues} issues
            </Badge>
          )}
          <span className="font-medium">{score}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all", getProgressColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// Issue Item Component
// ============================================

function IssueItem({
  issue,
  onApplyFix,
}: {
  issue: OptimizationSuggestion | SEOIssue | AccessibilityIssue;
  onApplyFix?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "serious":
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "moderate":
      case "info":
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "serious":
      case "warning":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>;
      case "moderate":
      case "info":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Info</Badge>;
      default:
        return <Badge variant="secondary">Minor</Badge>;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
          {getSeverityIcon(issue.severity)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{issue.title}</span>
              {getSeverityBadge(issue.severity)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {issue.description}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-10 pr-3 pb-3 space-y-3">
          <p className="text-sm text-muted-foreground">{issue.description}</p>
          
          {"impact" in issue && issue.impact && (
            <div className="text-sm">
              <span className="font-medium">Impact: </span>
              <span className="text-muted-foreground">{issue.impact}</span>
            </div>
          )}
          
          {"howToFix" in issue && issue.howToFix && (
            <div className="text-sm">
              <span className="font-medium">How to fix: </span>
              <span className="text-muted-foreground">{issue.howToFix}</span>
            </div>
          )}

          {"fix" in issue && issue.fix && (
            <div className="text-sm">
              <span className="font-medium">Recommended fix: </span>
              <span className="text-muted-foreground">{issue.fix}</span>
            </div>
          )}

          {"currentValue" in issue && issue.currentValue && (
            <div className="text-sm p-2 bg-muted/50 rounded">
              <span className="font-medium">Current: </span>
              <code className="text-xs">{issue.currentValue}</code>
            </div>
          )}

          {"suggestedValue" in issue && issue.suggestedValue && (
            <div className="text-sm p-2 bg-green-500/10 rounded">
              <span className="font-medium">Suggested: </span>
              <code className="text-xs">{issue.suggestedValue}</code>
            </div>
          )}

          {issue.autoFixable && onApplyFix && (
            <Button size="sm" variant="outline" onClick={onApplyFix}>
              <Wand2 className="w-3 h-3 mr-1" />
              Auto-fix
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// Main Panel Component
// ============================================

export function AIOptimizationPanel({
  puckData,
  pageTitle,
  pageDescription,
  onApplyFix,
  onUpdateMeta,
  className,
}: AIOptimizationPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [seoResult, setSeoResult] = useState<{
    score: number;
    grade: string;
    issues: SEOIssue[];
  } | null>(null);
  const [accessibilityResult, setAccessibilityResult] = useState<{
    score: number;
    issues: AccessibilityIssue[];
    passedChecks: string[];
  } | null>(null);
  const [targetKeywords, setTargetKeywords] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/editor/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puckData,
          pageTitle,
          pageDescription,
          targetKeywords: targetKeywords.split(",").map(k => k.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      
      if (data.optimization) {
        setOptimizationResult(data.optimization);
      }
      if (data.seo) {
        setSeoResult(data.seo);
      }
      if (data.accessibility) {
        setAccessibilityResult(data.accessibility);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [puckData, pageTitle, pageDescription, targetKeywords]);

  // Auto-analyze on mount
  useEffect(() => {
    if (puckData.content && puckData.content.length > 0) {
      runAnalysis();
    }
  }, []);

  const overallScore = optimizationResult?.score ?? 0;
  const totalIssues = (optimizationResult?.suggestions.length ?? 0) +
    (seoResult?.issues.length ?? 0) +
    (accessibilityResult?.issues.length ?? 0);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-primary" />
            Content Optimization
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-1.5">{isAnalyzing ? "Analyzing..." : "Refresh"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Overall Score */}
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="text-center">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4",
                overallScore >= 80 ? "border-green-500 text-green-500" :
                overallScore >= 60 ? "border-yellow-500 text-yellow-500" :
                overallScore >= 40 ? "border-orange-500 text-orange-500" :
                "border-red-500 text-red-500"
              )}
            >
              {overallScore}
            </div>
            <p className="text-sm font-medium mt-2">Overall Score</p>
            {totalIssues > 0 && (
              <p className="text-xs text-muted-foreground">{totalIssues} issues found</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ScoreCircle score={optimizationResult?.summary.seo ?? 0} label="SEO" />
            <ScoreCircle score={optimizationResult?.summary.conversion ?? 0} label="Conversion" />
            <ScoreCircle score={optimizationResult?.summary.readability ?? 0} label="Readability" />
            <ScoreCircle score={optimizationResult?.summary.accessibility ?? 0} label="A11y" />
          </div>
        </div>

        {/* Target Keywords Input */}
        <div className="space-y-2">
          <Label htmlFor="keywords" className="text-xs">Target Keywords (comma-separated)</Label>
          <div className="flex gap-2">
            <Input
              id="keywords"
              value={targetKeywords}
              onChange={(e) => setTargetKeywords(e.target.value)}
              placeholder="e.g., web design, marketing, business"
              className="h-8 text-sm"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Target className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set keywords to analyze SEO targeting</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
            <TabsTrigger value="a11y" className="text-xs">A11y</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                <CategoryScore
                  icon={<Search className="w-4 h-4" />}
                  label="SEO"
                  score={optimizationResult?.summary.seo ?? 0}
                  issues={seoResult?.issues.length ?? 0}
                />
                <CategoryScore
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Conversion"
                  score={optimizationResult?.summary.conversion ?? 0}
                  issues={optimizationResult?.suggestions.filter(s => s.type === "conversion").length ?? 0}
                />
                <CategoryScore
                  icon={<Type className="w-4 h-4" />}
                  label="Readability"
                  score={optimizationResult?.summary.readability ?? 0}
                  issues={optimizationResult?.suggestions.filter(s => s.type === "readability").length ?? 0}
                />
                <CategoryScore
                  icon={<Eye className="w-4 h-4" />}
                  label="Accessibility"
                  score={optimizationResult?.summary.accessibility ?? 0}
                  issues={accessibilityResult?.issues.length ?? 0}
                />

                {/* Critical Issues */}
                {(optimizationResult?.suggestions.filter(s => s.severity === "critical").length ?? 0) > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Critical Issues
                    </h4>
                    <div className="space-y-1">
                      {optimizationResult?.suggestions
                        .filter(s => s.severity === "critical")
                        .slice(0, 3)
                        .map((issue) => (
                          <IssueItem
                            key={issue.id}
                            issue={issue}
                            onApplyFix={issue.autoFixable && onApplyFix ? () => onApplyFix(issue) : undefined}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Passed Checks */}
                {accessibilityResult?.passedChecks && accessibilityResult.passedChecks.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Passed Checks
                    </h4>
                    <ul className="space-y-1">
                      {accessibilityResult.passedChecks.map((check, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {seoResult?.issues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No SEO issues found!</p>
                  </div>
                ) : (
                  seoResult?.issues.map((issue) => (
                    <IssueItem
                      key={issue.id}
                      issue={issue}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="a11y" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {accessibilityResult?.issues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No accessibility issues found!</p>
                  </div>
                ) : (
                  accessibilityResult?.issues.map((issue) => (
                    <IssueItem
                      key={issue.id}
                      issue={issue}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {optimizationResult?.suggestions
                  .filter(s => ["readability", "conversion", "engagement"].includes(s.type))
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>Content looks great!</p>
                  </div>
                ) : (
                  optimizationResult?.suggestions
                    .filter(s => ["readability", "conversion", "engagement"].includes(s.type))
                    .map((suggestion) => (
                      <IssueItem
                        key={suggestion.id}
                        issue={suggestion}
                        onApplyFix={suggestion.autoFixable && onApplyFix ? () => onApplyFix(suggestion) : undefined}
                      />
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AIOptimizationPanel;
