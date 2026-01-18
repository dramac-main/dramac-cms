"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getPagesSeo,
  getSiteForSeo,
  canAccessSiteSeo,
  type PageSeo,
} from "@/lib/seo/seo-service";
import { 
  analyzeSeo, 
  getScoreColor, 
  getScoreLabel,
  type SeoAuditResult 
} from "@/lib/seo/seo-analyzer";

export default function PortalSiteSeoPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageSeo[]>([]);
  const [site, setSite] = useState<{
    id: string;
    name: string;
    subdomain: string;
    domain: string | null;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Verify access
      const hasAccess = await canAccessSiteSeo(siteId);
      if (!hasAccess) {
        toast.error("Access denied");
        return;
      }

      const [pagesData, siteInfo] = await Promise.all([
        getPagesSeo(siteId),
        getSiteForSeo(siteId),
      ]);
      setPages(pagesData);
      setSite(siteInfo);
    } catch (error) {
      console.error("Failed to load SEO data:", error);
      toast.error("Failed to load SEO data");
    }
    setLoading(false);
  };

  // Calculate stats
  const pageAnalyses = pages.map((p) => ({
    page: p,
    analysis: analyzeSeo({
      title: p.seoTitle || p.pageName,
      description: p.seoDescription,
      slug: p.slug,
      ogImage: p.ogImageUrl,
      keywords: p.seoKeywords,
    }),
  }));

  const overallScore = pages.length > 0
    ? Math.round(pageAnalyses.reduce((sum, pa) => sum + pa.analysis.score, 0) / pages.length)
    : 0;

  const totalIssues = pageAnalyses.reduce((sum, pa) => sum + pa.analysis.issues.length, 0);
  const errorCount = pageAnalyses.reduce(
    (sum, pa) => sum + pa.analysis.issues.filter(i => i.type === "error").length,
    0
  );
  const warningCount = pageAnalyses.reduce(
    (sum, pa) => sum + pa.analysis.issues.filter(i => i.type === "warning").length,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal/seo">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            {site?.name || "Site"} SEO
          </h1>
          <p className="text-muted-foreground mt-1">
            {site?.domain || `${site?.subdomain}.dramac.app`}
          </p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="flex-1">
                <p className="font-medium text-lg">{getScoreLabel(overallScore)}</p>
                <Progress value={overallScore} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{pages.length}</p>
              <p className="text-sm text-muted-foreground">Pages</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalIssues}</p>
              <p className="text-sm text-muted-foreground">Total Issues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Summary */}
      {totalIssues > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues Summary</CardTitle>
            <CardDescription>
              Overview of SEO issues across all pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Info className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalIssues - errorCount - warningCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Info</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>Page SEO Scores</CardTitle>
          <CardDescription>
            Individual page analysis (view only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pageAnalyses.map(({ page, analysis }) => (
              <div
                key={page.pageId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {analysis.score >= 80 ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : analysis.score >= 50 ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{page.pageName}</p>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.issues.length} issue{analysis.issues.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {pages.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No published pages found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Common Issues */}
      {totalIssues > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Issues</CardTitle>
            <CardDescription>
              Frequently occurring SEO issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getCommonIssues(pageAnalyses).map((issue, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  {issue.type === "error" ? (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  ) : issue.type === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{issue.message}</p>
                    <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                    <Badge variant="outline" className="mt-2">
                      {issue.count} page{issue.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Improve Your SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your agency team can help optimize your site&apos;s SEO settings.
            Contact them to discuss:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Custom page titles and descriptions
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Social sharing images
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Search engine verification
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Analytics integration
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to get common issues
function getCommonIssues(pageAnalyses: { page: PageSeo; analysis: SeoAuditResult }[]) {
  const issueMap = new Map<string, {
    type: "error" | "warning" | "info";
    message: string;
    suggestion: string;
    count: number;
  }>();

  for (const { analysis } of pageAnalyses) {
    for (const issue of analysis.issues) {
      const key = issue.message;
      if (issueMap.has(key)) {
        issueMap.get(key)!.count++;
      } else {
        issueMap.set(key, {
          type: issue.type,
          message: issue.message,
          suggestion: issue.suggestion,
          count: 1,
        });
      }
    }
  }

  return Array.from(issueMap.values())
    .sort((a, b) => {
      // Sort by type first (errors, warnings, info), then by count
      const typeOrder = { error: 0, warning: 1, info: 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return b.count - a.count;
    })
    .slice(0, 5); // Top 5 issues
}
