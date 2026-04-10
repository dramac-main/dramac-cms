"use client";

import { useState, useEffect, use } from "react";
import {
  Search,
  Loader2,
  CircleCheck,
  AlertTriangle,
  CircleX,
  Info,
  TrendingUp,
} from "lucide-react";
import { DOMAINS } from "@/lib/constants/domains";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  type SeoAuditResult,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            SEO Overview
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Site Not Found</h3>
            <p className="text-muted-foreground">
              Unable to load SEO data for this site.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall score
  const pageAudits = pages.map((p) =>
    analyzeSeo({
      title: p.seoTitle || p.pageName,
      description: p.seoDescription,
      slug: p.slug,
      ogImage: p.ogImageUrl,
      keywords: p.seoKeywords,
    }),
  );

  const avgScore =
    pageAudits.length > 0
      ? Math.round(
          pageAudits.reduce((sum, a) => sum + a.score, 0) / pageAudits.length,
        )
      : 0;

  const totalIssues = pageAudits.reduce((sum, a) => sum + a.issues.length, 0);
  const siteUrl = site.domain
    ? `https://${site.domain}`
    : `https://${site.subdomain}.${DOMAINS.SITES_BASE}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          SEO Overview
        </h1>
        <p className="text-muted-foreground mt-1">{site.name}</p>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  SEO Score
                </p>
                <p className={`text-3xl font-bold mt-1 ${getScoreColor(avgScore)}`}>
                  {avgScore}/100
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getScoreLabel(avgScore)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Pages Analyzed
            </p>
            <p className="text-3xl font-bold mt-1">{pages.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Issues Found
            </p>
            <p className="text-3xl font-bold mt-1 text-orange-600">
              {totalIssues}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Page-by-Page SEO */}
      <Card>
        <CardHeader>
          <CardTitle>Page SEO Analysis</CardTitle>
          <CardDescription>
            SEO health for each page on your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length > 0 ? (
            <div className="space-y-4">
              {pages.map((page, i) => {
                const audit = pageAudits[i];
                return (
                  <div
                    key={page.pageId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{page.pageName}</p>
                        <p className="text-sm text-muted-foreground">
                          /{page.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            audit.score >= 80
                              ? "bg-green-100 text-green-800"
                              : audit.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {audit.score}/100
                        </Badge>
                      </div>
                    </div>
                    <Progress value={audit.score} className="h-2" />
                    {audit.issues.length > 0 && (
                      <div className="space-y-1">
                        {audit.issues.map((issue, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 text-sm"
                          >
                            {issue.type === "error" ? (
                              <CircleX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            ) : issue.type === "warning" ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            )}
                            <span className="text-muted-foreground">
                              {issue.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {audit.issues.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CircleCheck className="h-4 w-4" />
                        No issues found
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No pages to analyze
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
